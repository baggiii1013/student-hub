import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, auth callbacks, static files, home page, search routes, and students API
  if (pathname.startsWith('/api/auth') || 
      pathname.startsWith('/api/students') ||
      pathname.startsWith('/_next') || 
      pathname === '/' || 
      pathname.startsWith('/search')) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });

    // If user is accessing protected routes (only profile pages now)
    if (pathname.startsWith('/profile')) {
      if (!token) {
        // No token, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if OAuth user needs to complete setup
      if (token.user && token.user.isOAuthUser && !token.user.passwordSetupComplete) {
        // Redirect to registration completion
        const registerUrl = new URL('/register', request.url);
        registerUrl.searchParams.set('step', '2');
        registerUrl.searchParams.set('email', token.user.email);
        return NextResponse.redirect(registerUrl);
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
          const registerUrl = new URL('/register', request.url);
          registerUrl.searchParams.set('step', '2');
          registerUrl.searchParams.set('email', token.user.email);
          return NextResponse.redirect(registerUrl);
        }
        
        // User is fully authenticated, redirect to home or callback URL
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/';
        return NextResponse.redirect(new URL(callbackUrl, request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    
    // On middleware errors, allow access but log the issue
    // This prevents users from being blocked due to temporary issues
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
