import { cookies } from 'next/headers';
import { verifySignedCookie } from '@/lib/cookie-utils';

/**
 * Verifica si el request viene de un admin autenticado
 * Retorna true si la sesión es válida, false si no lo es
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    
    if (!session?.value) {
      return false;
    }
    
    // Verificar firma de la cookie (previene tampering)
    const verified = verifySignedCookie(session.value, process.env.ADMIN_SESSION_SECRET!);
    return verified !== null;
  } catch {
    return false;
  }
}

/**
 * Verifica y retorna response 401 si no está autenticado
 * Uso: if (!await requireAdmin()) return requireAdmin()
 */
export async function requireAdmin(): Promise<boolean> {
  const isAuth = await verifyAdminSession();
  return isAuth;
}

/**
 * Función helper para usar en APIs
 * Usage:
 *   const auth = await verifyAdminSession();
 *   if (!auth) return NextResponse.json({error: 'No autorizado'}, {status: 401});
 */
import { NextResponse } from 'next/server';

export async function checkAdminAuth(): Promise<NextResponse | null> {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}