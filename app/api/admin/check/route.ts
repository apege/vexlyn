import { NextResponse } from 'next/server';
import { isRequestAdminAuthenticated, parseCookie, verifyAdminSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);

    if (!token) {
      return NextResponse.json({ success: true, authenticated: false });
    }

    const verification = await verifyAdminSessionToken(token);
    return NextResponse.json({
      success: true,
      authenticated: verification.valid,
      username: verification.username,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false, error: error?.message });
  }
}
