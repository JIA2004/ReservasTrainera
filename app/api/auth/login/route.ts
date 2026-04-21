import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signCookie } from '@/lib/cookie-utils';

// Simple in-memory rate limiting (resets on server restart)
// For production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  
  // Rate limiting: 5 attempts per minute
  if (!checkRateLimit(clientIp, 5, 60000)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo en un minuto.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    
    // Generar token firmado para evitar tampering
    const sessionToken = crypto.randomUUID();
    const signedToken = signCookie(sessionToken, process.env.ADMIN_SESSION_SECRET!);
    
    response.cookies.set('admin_session', signedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
