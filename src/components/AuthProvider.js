'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export function AuthProvider({ children, initialUser, initialProfile }) {
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Fetch profile
          const { data: prof } = await supabase
            .from('profiles')
            .select('*, outlets(name, code)')
            .eq('id', session.user.id)
            .single();
          setProfile(prof);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          window.location.href = '/login';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
