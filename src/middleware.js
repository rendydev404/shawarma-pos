import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Safe fallback to prevent build/runtime crash when env vars are missing
  const safeUrl = url && url.startsWith('http') ? url : 'https://uqjahxvyqpxfvkeutwpm.supabase.co';
  const safeKey = anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamFoeHZ5cXB4ZnZrZXV0d3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MjA0MzQsImV4cCI6MjA5NjA5NjQzNH0.V7wqxpSxvk2aDS0mGYM5uzO1L9ZNWzQsunMusWOaZIE';

  const supabase = createServerClient(
    safeUrl,
    safeKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session safely
  let user = null;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    }
  } catch (err) {
    console.error('Middleware session refresh failed:', err.message);
  }

  // Redirect unauthenticated users to login
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/');
  const isPublicPath = isLoginPage || isAuthCallback;

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Get user profile role for routing decisions safely
  let profile = null;
  if (user) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      profile = data;
    } catch (err) {
      console.error('Middleware profile fetch failed:', err.message);
    }
  }

  // Redirect authenticated users away from login to their respective home page
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = profile?.role === 'super_admin' ? '/admin/overview' : '/pos';
    return NextResponse.redirect(url);
  }

  // Redirect root to respective home page
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = profile?.role === 'super_admin' ? '/admin/overview' : '/pos';
    return NextResponse.redirect(url);
  }

  // Role-based route protection for admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    if (!profile || profile.role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/pos';
      return NextResponse.redirect(url);
    }
  }

  // Prevent Super Admin from accessing cashier/outlet operational pages (which require outlet context)
  const isOperationalPage = ['/pos', '/menu', '/orders', '/reports'].some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  );
  if (user && isOperationalPage && profile?.role === 'super_admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/overview';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
