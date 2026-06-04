import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
    console.warn('Warning: Using fallback Supabase placeholder client credentials in middleware!');
  }

  const supabase = createServerClient(
    url,
    key,
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

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/');
  const isPublicPath = isLoginPage || isAuthCallback;

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Get user profile role for routing decisions
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    profile = data;
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
