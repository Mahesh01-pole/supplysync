import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  const path = request.nextUrl.pathname;
  
  // Public paths
  if (path === '/login' || path === '/register' || path === '/') {
    if (token && userRole && path !== '/') {
      // Redirect logged-in users away from auth pages
      if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      if (userRole === 'SUPPLIER') return NextResponse.redirect(new URL('/supplier/dashboard', request.url));
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Not authenticated
  if (!token || !userRole) {
    if (path.startsWith('/admin') || path.startsWith('/supplier') || path.startsWith('/dashboard') || path.startsWith('/orders') || path.startsWith('/track')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Role-based protection
  if (path.startsWith('/admin') && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (path.startsWith('/supplier') && userRole !== 'SUPPLIER' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if ((path.startsWith('/dashboard') || path.startsWith('/orders') || path === '/orders/new') && userRole !== 'BUYER' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
