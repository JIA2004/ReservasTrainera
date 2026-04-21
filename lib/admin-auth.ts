import { cookies } from 'next/headers';

/**
 * Verifica si el request viene de un admin autenticado
 * Retorna true si la sesión es válida, false si no lo es
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    
    console.log('verifyAdminSession - cookie:', session?.value ? 'exists' : 'missing');
    console.log('verifyAdminSession - ENV:', process.env.ADMIN_PASSWORD ? 'exists' : 'missing');
    
    if (!session?.value) {
      console.log('verifyAdminSession - no cookie');
      return false;
    }
    
    const match = session.value === process.env.ADMIN_PASSWORD;
    console.log('verifyAdminSession - match:', match);
    
    return match;
  } catch (e) {
    console.log('verifyAdminSession - error:', e);
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