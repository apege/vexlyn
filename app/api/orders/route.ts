import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrSetCache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    // Batasi limit maksimal 200 per page untuk keperluan dashboard admin
    const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 100), 200);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        o.id,
        o.order_code,
        o.roblox_username,
        o.roblox_user_id,
        o.product_name,
        o.robux_amount,
        o.price_idr,
        o.payment_method,
        o.payment_proof_url,
        o.status,
        o.customer_phone,
        o.admin_notes,
        o.review_token,
        o.is_reviewed,
        o.reviewed_at,
        o.created_at
      FROM public.orders o
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (o.order_code ILIKE $${params.length} OR o.roblox_username ILIKE $${params.length} OR o.customer_phone ILIKE $${params.length})`;
    }

    params.push(limit);
    sql += ` ORDER BY o.created_at DESC LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const orders = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: orders,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data pesanan', error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roblox_username,
      roblox_user_id,
      roblox_avatar_url,
      product_id,
      product_name,
      robux_amount,
      price_idr,
      payment_method = 'QRIS',
      payment_proof_url,
      customer_phone,
      customer_email,
    } = body;

    if (!roblox_username || !robux_amount || !price_idr || !customer_phone) {
      return NextResponse.json(
        { success: false, message: 'Harap lengkapi username Roblox, paket robux, harga, dan nomor WhatsApp.' },
        { status: 400 }
      );
    }

    // PENCEGAHAN OVER-TRANSFER:
    // Cek jika payment_proof_url berupa base64 raksasa (> 100KB), cegah agar tidak membengkakkan database
    let safeProofUrl = payment_proof_url;
    if (safeProofUrl && safeProofUrl.length > 5000) {
      // Jika base64 lebih dari 5KB, jangan simpan base64 raw di postgres
      return NextResponse.json(
        {
          success: false,
          message: 'Bukti pembayaran terlalu besar. Gunakan URL link atau kirim bukti via WhatsApp resmi Vexlyn.',
        },
        { status: 400 }
      );
    }

    // 1. Cek blacklist dengan in-memory cache (TTL 60 detik)
    const blacklistedUsers = await getOrSetCache('blacklists:set', 60, async () => {
      const rows = await query(`SELECT LOWER(roblox_username) as username, reason FROM public.blacklists`);
      return new Map(rows.map((r: any) => [r.username, r.reason]));
    });

    const cleanUsername = String(roblox_username).trim().toLowerCase();
    if (blacklistedUsers.has(cleanUsername)) {
      return NextResponse.json(
        {
          success: false,
          is_blacklisted: true,
          message: `Username "${roblox_username}" telah diblacklist. Alasan: ${blacklistedUsers.get(cleanUsername)}`,
        },
        { status: 403 }
      );
    }

    // 2. Generate unique order_code: VEX-XXXXX (atau gunakan order_code dari client jika dikirimkan)
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderCode = body.order_code || `VEX-${randomSuffix}`;

    const result = await query(
      `
      INSERT INTO public.orders (
        order_code,
        roblox_username,
        roblox_user_id,
        roblox_avatar_url,
        product_id,
        product_name,
        robux_amount,
        price_idr,
        payment_method,
        payment_proof_url,
        status,
        customer_phone,
        customer_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, order_code, status, price_idr, robux_amount
      `,
      [
        orderCode,
        String(roblox_username).trim().slice(0, 50),
        roblox_user_id ? String(roblox_user_id).slice(0, 30) : null,
        roblox_avatar_url ? String(roblox_avatar_url).slice(0, 255) : null,
        product_id || null,
        String(product_name).slice(0, 50),
        Number(robux_amount),
        Number(price_idr),
        payment_method === 'WHATSAPP' ? 'WHATSAPP' : 'QRIS',
        safeProofUrl || null,
        'menunggu_pembayaran',
        String(customer_phone).trim().slice(0, 20),
        customer_email ? String(customer_email).slice(0, 100) : null,
      ]
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal membuat pesanan', error: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { order_code, id, status, payment_proof_url, admin_notes } = body;

    if (!order_code && !id) {
      return NextResponse.json(
        { success: false, message: 'Order code atau ID diperlukan untuk update pesanan' },
        { status: 400 }
      );
    }

    const result = await query(
      `
      UPDATE public.orders
      SET 
        status = COALESCE($1, status),
        payment_proof_url = COALESCE($2, payment_proof_url),
        admin_notes = COALESCE($3, admin_notes),
        review_token = CASE
          WHEN $1 = 'selesai' AND review_token IS NULL THEN 'rev_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)
          ELSE review_token
        END,
        updated_at = NOW()
      WHERE ${id ? 'id = $4' : 'order_code = $4'}
      RETURNING id, order_code, status, review_token, is_reviewed
      `,
      [status, payment_proof_url, admin_notes, id || order_code]
    );

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status pesanan', error: error?.message },
      { status: 500 }
    );
  }
}
