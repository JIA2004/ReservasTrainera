import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // исключить /admin/login del middleware
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Verificar sesión - formato de cookie должна tener firma (value.signature)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('admin_session');

    // Verificar formato básico (debe tener al menos un punto para la firma)
    if (!session?.value || !session.value.includes('.')) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
