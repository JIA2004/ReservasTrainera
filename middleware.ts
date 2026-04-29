import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip for login page
  if (pathname === '/admin/login' || pathname === '/admin/login/') {
    return NextResponse.next();
  }

  // Verificar sesión
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session');
    
    if (!session?.value) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
