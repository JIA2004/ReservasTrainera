import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { signCookie } from '@/lib/cookie-utils';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // set invalid signed cookie to expire immediately
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });
  
  return response;
}
