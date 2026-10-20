import { NextResponse } from 'next/server';
import {
  createAdminSessionToken,
  getAdminCredentials,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const creds = getAdminCredentials();

    // Verifikasi username dan password
    const isUserValid = String(username).trim() === creds.username.trim();
    const isPassValid = String(password).trim() === creds.password.trim();

    if (!isUserValid || !isPassValid) {
      return NextResponse.json(
        { success: false, message: 'Username atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Buat token session HMAC
    const token = await createAdminSessionToken(creds.username);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieHeader = [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
      `Path=/`,
      `Max-Age=${SESSION_DURATION_SECONDS}`,
      `SameSite=Lax`,
      `HttpOnly`,
      isProd ? `Secure` : '',
    ]
      .filter(Boolean)
      .join('; ');

    const res = NextResponse.json({
      success: true,
      message: 'Login berhasil! Selamat datang di Panel Admin Vexlyn.',
      user: { username: creds.username },
    });

    res.headers.set('Set-Cookie', cookieHeader);
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat proses login.', error: error?.message },
      { status: 500 }
    );
  }
}
