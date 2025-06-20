import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, auth callbacks, and static files
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // If user is accessing protected routes
  if (pathname.startsWith('/profile') || pathname.startsWith('/student') || pathname === '/') {
    if (!token) {
      // No token, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if OAuth user needs to complete setup
    if (token.user && token.user.isOAuthUser && !token.user.passwordSetupComplete) {
      // Redirect to registration completion
      return NextResponse.redirect(new URL(`/register?step=2&email=${encodeURIComponent(token.user.email)}`, request.url));
    }
  }

  // Allow access to auth pages when not authenticated
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token && token.user) {
      // Check if user has completed setup
      if (token.user.isOAuthUser && !token.user.passwordSetupComplete) {
        // Allow access to register page for setup completion
        if (pathname.startsWith('/register')) {
          return NextResponse.next();
        }
        // Redirect to register from login if setup incomplete
        return NextResponse.redirect(new URL(`/register?step=2&email=${encodeURIComponent(token.user.email)}`, request.url));
      }
      // User is fully authenticated, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
