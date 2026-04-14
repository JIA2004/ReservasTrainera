import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Verificar que las variables de entorno estén configuradas
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  
  if (!sessionSecret) {
    // En desarrollo, permitir acceso si no hay secret configurado
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ authenticated: false, warning: 'No ADMIN_SESSION_SECRET configured' }, { status: 200 });
    }
    return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (session && session.value === sessionSecret) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}