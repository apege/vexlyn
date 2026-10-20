import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { invalidateCache } from '@/lib/cache';

// GET: Verifikasi validitas token review 1x pakai
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token ulasan tidak ditemukan.' },
        { status: 400 }
      );
    }

    const rows = await query(
      `
      SELECT 
        id, 
        order_code, 
        roblox_username, 
        product_name, 
        robux_amount, 
        price_idr, 
        is_reviewed, 
        reviewed_at
      FROM public.orders
      WHERE review_token = $1
      LIMIT 1
      `,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Link ulasan tidak valid atau tidak ditemukan di sistem.' },
        { status: 404 }
      );
    }

    const order = rows[0];

    if (order.is_reviewed) {
      return NextResponse.json({
        success: false,
        is_reviewed: true,
        message: 'Link ulasan ini sudah pernah digunakan. Demi menjaga keaslian testimoni dan mencegah spam, setiap link hanya berlaku satu kali pakai.',
        order: {
          order_code: order.order_code,
          roblox_username: order.roblox_username,
          product_name: order.product_name,
          robux_amount: order.robux_amount,
          reviewed_at: order.reviewed_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      is_reviewed: false,
      order: {
        order_code: order.order_code,
        roblox_username: order.roblox_username,
        product_name: order.product_name,
        robux_amount: order.robux_amount,
        price_idr: order.price_idr,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal memverifikasi token ulasan', error: error?.message },
      { status: 500 }
    );
  }
}

// POST: Submit ulasan pembeli (hanya bisa 1x pakai per token)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, rating = 5, comment } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token ulasan wajib disertakan.' },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: 'Mohon tuliskan ulasan pengalaman Anda (minimal 3 karakter).' },
        { status: 400 }
      );
    }

    const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const safeComment = comment.trim().slice(0, 500);

    // 1. Ambil order dan verifikasi status is_reviewed
    const orders = await query(
      `
      SELECT 
        id, 
        order_code, 
        roblox_username, 
        product_name, 
        robux_amount, 
        is_reviewed
      FROM public.orders
      WHERE review_token = $1
      LIMIT 1
      `,
      [token]
    );

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Token ulasan tidak valid atau pesanan tidak ditemukan.' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // 2. Proteksi Anti-Spam: Cek apakah sudah pernah diulas
    if (order.is_reviewed) {
      return NextResponse.json(
        {
          success: false,
          is_reviewed: true,
          message: 'Link ulasan ini sudah pernah digunakan. Link ini hanya berlaku satu kali pakai untuk mencegah spam.',
        },
        { status: 400 }
      );
    }

    // 3. Simpan testimoni resmi ke database
    const pkgName = order.product_name || `+${Number(order.robux_amount).toLocaleString('id-ID')} Robux`;

    await query(
      `
      INSERT INTO public.testimonials (
        order_code, roblox_username, package_name, rating, comment, is_verified, is_visible
      ) VALUES ($1, $2, $3, $4, $5, true, true)
      `,
      [order.order_code, order.roblox_username, pkgName, safeRating, safeComment]
    );

    // 4. Hanguskan token: tandai order sebagai sudah diulas (is_reviewed = true)
    await query(
      `
      UPDATE public.orders
      SET is_reviewed = true, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $1
      `,
      [order.id]
    );

    // 5. Invalidate cache testimoni publik agar langsung muncul di web
    invalidateCache('testimonials:public');

    return NextResponse.json({
      success: true,
      message: 'Terima kasih banyak! Ulasan Anda telah berhasil disimpan dan dipublikasikan.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim ulasan', error: error?.message },
      { status: 500 }
    );
  }
}
