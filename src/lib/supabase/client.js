import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Safe fallback to prevent build crash when env vars are missing
  const safeUrl = url && url.startsWith('http') ? url : 'https://placeholder.supabase.co';
  const safeKey = anonKey || 'placeholder';

  return createBrowserClient(safeUrl, safeKey);
}

