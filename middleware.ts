import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // исключить /admin/login del middleware
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Verificar sesión - solo necesita existir la cookie
  console.log('Middleware - pathname:', pathname);
  console.log('Middleware - cookie:', request.cookies.get('admin_session')?.value ? 'exists' : 'missing');
  
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session');

    if (!session?.value) {
      console.log('Middleware - no session cookie, redirecting to login');
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log('Middleware - session found, allowing access');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
