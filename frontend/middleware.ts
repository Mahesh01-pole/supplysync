import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/admin',
  '/supplier',
  '/dashboard',
  '/orders',
  '/track',
];

// Routes only guests should see (redirect to dashboard if already logged in)
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Not logged in → trying to access protected page → send to login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → trying to visit login/register → send to their dashboard
  if (isAuthRoute && token) {
    const role = request.cookies.get('auth_role')?.value ?? 'buyer';
    const dest =
      role === 'admin'
        ? '/admin/dashboard'
        : role === 'supplier'
        ? '/supplier/dashboard'
        : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
};
