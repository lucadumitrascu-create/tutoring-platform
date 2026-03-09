import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get('code');

  // Handle PKCE code exchange on root URL (Supabase always redirects here)
  if (path === '/' && code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      // Check if this is a password recovery session
      // The AMR (Authentication Methods Reference) contains 'recovery' for password resets
      const isRecovery = data.session.user?.recovery_sent_at != null &&
        (Date.now() - new Date(data.session.user.recovery_sent_at).getTime()) < 600000; // within 10 min

      const url = request.nextUrl.clone();
      url.search = ''; // remove code param
      if (isRecovery) {
        url.pathname = '/auth/update-password';
      } else {
        // Email confirmation — redirect to confirm page
        url.pathname = '/auth/confirm';
      }
      return NextResponse.redirect(url);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect logged-in users away from auth pages
  // EXCEPT update-password and confirm pages (they need to be logged in)
  if (path.startsWith('/auth/')) {
    if (user && path !== '/auth/update-password' && path !== '/auth/confirm') {
      const url = request.nextUrl.clone();
      url.pathname = '/request-access';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Request-access page — only for logged-in users
  if (path.startsWith('/request-access')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protected student routes
  if (path.startsWith('/dashboard') || path.startsWith('/groups') || path.startsWith('/profile') || path.startsWith('/homework')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  // Protected admin routes (auth only — role check is in admin layout)
  if (path.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/groups/:path*',
    '/profile/:path*',
    '/homework/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/request-access',
  ],
};
