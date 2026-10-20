import { neon } from '@neondatabase/serverless';

let cachedSql: any = null;

// Helper koneksi database Neon Serverless PostgreSQL (dengan connection memoization)
export function getDb() {
  if (cachedSql) return cachedSql;
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn(
      '[Vexlyn DB Warning] DATABASE_URL environment variable belum diatur di .env.local! ' +
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
    throw new Error('DATABASE_URL belum dikonfigurasi di file .env.local');
  }

  try {
    const result = await sql.query(queryString, params);
    return result as T[];
  } catch (error) {
    console.error('[Vexlyn DB Error]:', error);
    throw error;
  }
}
