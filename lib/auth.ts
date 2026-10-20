/**
 * Vexlyn Admin Authentication & Session Management
 * 
 * Menggunakan Web Crypto API (HMAC-SHA256) standar yang 100% kompatibel
 * dengan Cloudflare Workers, Vercel Edge, dan Node.js runtime tanpa dependensi eksternal.
 */

const SESSION_COOKIE_NAME = 'vexlyn_admin_token';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 hari

function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || 'vexlyn_super_secret_admin_session_key_2026';
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin_vexlyn',
    password: process.env.ADMIN_PASSWORD || '@Vexlyn2026',
  };
}

// Helper untuk import crypto key
async function getCryptoKey(secret: string) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

// Buat HMAC signature
async function signMessage(message: string, secret: string): Promise<string> {
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate token sesi admin: base64(payload).signature
export async function createAdminSessionToken(username: string): Promise<string> {
  const payload = JSON.stringify({
    u: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  });

  const b64Payload = Buffer.from(payload).toString('base64url');
  const signature = await signMessage(b64Payload, getSecretKey());
  return `${b64Payload}.${signature}`;
}

// Verifikasi token sesi admin
export async function verifyAdminSessionToken(token: string): Promise<{ valid: boolean; username?: string }> {
  if (!token || !token.includes('.')) {
    return { valid: false };
  }

  const [b64Payload, signature] = token.split('.');
  if (!b64Payload || !signature) {
    return { valid: false };
  }

  const expectedSignature = await signMessage(b64Payload, getSecretKey());
  if (expectedSignature !== signature) {
    return { valid: false };
  }

  try {
    const payloadStr = Buffer.from(b64Payload, 'base64url').toString('utf-8');
    const data = JSON.parse(payloadStr);

    // Cek kadaluarsa
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, username: data.u };
  } catch {
    return { valid: false };
  }
}

// Parse cookie string dari header HTTP
export function parseCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Cek autentikasi dari Request
export async function isRequestAdminAuthenticated(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return false;
  const result = await verifyAdminSessionToken(token);
  return result.valid;
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };
