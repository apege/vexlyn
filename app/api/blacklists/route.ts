import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';

export async function GET() {
  try {
    const list = await query(`
      SELECT id, roblox_username, reason, added_by, created_at
      FROM public.blacklists
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data blacklist', error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roblox_username, reason = 'Pelanggaran ketentuan toko', added_by = 'Admin' } = body;

    if (!roblox_username) {
      return NextResponse.json(
        { success: false, message: 'Username Roblox diperlukan' },
        { status: 400 }
      );
    }

    const result = await query(
      `
      INSERT INTO public.blacklists (roblox_username, reason, added_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (roblox_username) DO UPDATE SET reason = EXCLUDED.reason
      RETURNING id, roblox_username, reason
      `,
      [roblox_username.trim(), reason.trim(), added_by]
    );

    invalidateCache('blacklists:set');

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan ke daftar blacklist', error: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username');

    if (!id && !username) {
      return NextResponse.json(
        { success: false, message: 'ID atau Username Roblox diperlukan' },
        { status: 400 }
      );
    }

    if (id) {
      await query(`DELETE FROM public.blacklists WHERE id = $1`, [id]);
    } else {
      await query(`DELETE FROM public.blacklists WHERE LOWER(roblox_username) = LOWER($1)`, [username]);
    }

    invalidateCache('blacklists:set');

    return NextResponse.json({ success: true, message: 'Berhasil menghapus dari blacklist' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus blacklist', error: error?.message },
      { status: 500 }
    );
  }
}
