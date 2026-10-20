import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, order_code } = body;

    if (!order_id && !order_code) {
      return NextResponse.json(
        { success: false, message: 'ID atau kode order diperlukan.' },
        { status: 400 }
      );
    }

    // 1. Cari pesanan
    const rows = await query(
      `
      SELECT 
        id, 
        order_code, 
        roblox_username, 
        customer_phone, 
        product_name, 
        robux_amount, 
        price_idr, 
        status, 
        review_token, 
        is_reviewed, 
        reviewed_at
      FROM public.orders
      WHERE ${order_id ? 'id = $1' : 'order_code = $1'}
      LIMIT 1
      `,
      [order_id || order_code]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const order = rows[0];

    // 2. Jika sudah pernah diulas, kembalikan status sudah diulas
    if (order.is_reviewed) {
      return NextResponse.json({
        success: true,
        is_reviewed: true,
        review_token: order.review_token,
        order: {
          id: order.id,
          order_code: order.order_code,
          roblox_username: order.roblox_username,
          customer_phone: order.customer_phone,
          product_name: order.product_name,
          robux_amount: order.robux_amount,
        },
        message: 'Pesanan ini sudah selesai diulas oleh pembeli.',
      });
    }

    // 3. Jika sudah ada token, gunakan yang ada
    let token = order.review_token;

    // 4. Jika belum ada token, generate token acak 16 byte hex unik
    if (!token) {
      token = 'rev_' + crypto.randomBytes(12).toString('hex');
      await query(
        `
        UPDATE public.orders
        SET review_token = $1, updated_at = NOW()
        WHERE id = $2
        `,
        [token, order.id]
      );
    }

    return NextResponse.json({
      success: true,
      is_reviewed: false,
      review_token: token,
      order: {
        id: order.id,
        order_code: order.order_code,
        roblox_username: order.roblox_username,
        customer_phone: order.customer_phone,
        product_name: order.product_name,
        robux_amount: order.robux_amount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal memproses token ulasan', error: error?.message },
      { status: 500 }
    );
  }
}
