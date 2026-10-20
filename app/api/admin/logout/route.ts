import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieHeader = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `Max-Age=0`,
    `SameSite=Lax`,
    `HttpOnly`,
    isProd ? `Secure` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const res = NextResponse.json({
    success: true,
    message: 'Anda telah berhasil keluar dari Panel Admin.',
  });

  res.headers.set('Set-Cookie', cookieHeader);
  return res;
}

export async function GET() {
  return POST();
}
