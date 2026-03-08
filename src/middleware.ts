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

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirect logged-in users away from auth pages
  if (path.startsWith('/auth/')) {
    if (user) {
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
  if (path.startsWith('/dashboard') || path.startsWith('/groups') || path.startsWith('/profile')) {
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
    '/dashboard/:path*',
    '/groups/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/request-access',
  ],
};
