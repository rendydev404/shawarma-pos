import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  let key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  const isValidUrl = (str) => {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  if (!isValidUrl(url)) {
    url = 'https://placeholder.supabase.co';
  }
  if (!key || key === 'placeholder' || key === 'undefined') {
    key = 'placeholder';
  }

  if (url === 'https://placeholder.supabase.co' || key === 'placeholder') {
    console.warn('Warning: Using fallback Supabase placeholder client credentials in browser client!');
  }

  return createBrowserClient(url, key);
}

