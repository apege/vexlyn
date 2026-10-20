import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const list = await query(`
      SELECT id, roblox_username, roblox_user_id, server_region, status, activated_at, expires_at, notes
      FROM public.id_activations
      ORDER BY activated_at DESC
      LIMIT 100
    `);

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil riwayat aktivasi ID', error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roblox_username, roblox_user_id, server_region = 'Asia', notes } = body;

    if (!roblox_username) {
      return NextResponse.json(
        { success: false, message: 'Username Roblox diperlukan untuk aktivasi ID' },
        { status: 400 }
      );
    }

    const result = await query(
      `
      INSERT INTO public.id_activations (
        roblox_username, roblox_user_id, server_region, status, activated_at, notes
      ) VALUES ($1, $2, $3, 'active', NOW(), $4)
      RETURNING *
      `,
      [roblox_username.trim(), roblox_user_id || null, server_region, notes || null]
    );

    return NextResponse.json({
      success: true,
      message: `ID Roblox ${roblox_username} berhasil diaktivasi pada server ${server_region}`,
      data: result[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengaktivasi ID Roblox', error: error?.message },
      { status: 500 }
    );
  }
}
