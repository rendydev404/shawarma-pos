import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof window === 'undefined') {
    // Safe fallback during build-time server rendering to avoid crashing
    if (!url || !url.startsWith('http')) {
      return createBrowserClient('https://uqjahxvyqpxfvkeutwpm.supabase.co', 'placeholder');
    }
  }

  return createBrowserClient(url, anonKey);
}

