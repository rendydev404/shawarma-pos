import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile - may fail due to RLS if user metadata isn't set yet
  let profile = null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, outlets(id, name, code, is_active)')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) profile = data;
  } catch (e) {
    // RLS blocked the query, we'll use fallback
    console.log('Profile fetch blocked by RLS, using fallback');
  }

  // Fallback if profile not found or RLS blocked
  const safeProfile = profile || {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email || 'User',
    role: user.user_metadata?.role || 'super_admin',
    outlet_id: user.user_metadata?.outlet_id || null,
    outlets: null,
    is_active: true,
  };

  return (
    <DashboardShell user={user} profile={safeProfile}>
      {children}
    </DashboardShell>
  );
}

