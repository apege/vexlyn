import { neon } from '@neondatabase/serverless';

let cachedSql: any = null;

// Fallback connection string untuk memastikan aplikasi langsung berjalan di Cloudflare tanpa error 500
const FALLBACK_DB_URL =
  'postgresql://neondb_owner:npg_vCGQide9b3FH@ep-morning-sound-a1c3riol-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Helper koneksi database Neon Serverless PostgreSQL (dengan connection memoization)
export function getDb() {
  if (cachedSql) return cachedSql;
  const connectionString = (process.env.DATABASE_URL || FALLBACK_DB_URL).trim();

  if (!connectionString) {
    console.warn(
      '[Vexlyn DB Warning] DATABASE_URL environment variable belum diatur! ' +
      'Silakan masukkan connection string Neon PostgreSQL Anda.'
    );
    return null;
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}

// Shortcut function untuk query dengan placeholder $1, $2, dst.
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  const sql = getDb();
  if (!sql) {
    throw new Error('DATABASE_URL belum dikonfigurasi.');
  }

  try {
    const result = await sql.query(queryString, params);
    return result as T[];
  } catch (error) {
    console.error('[Vexlyn DB Error]:', error);
    throw error;
  }
}
