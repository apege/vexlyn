import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrSetCache, invalidateStorefrontCache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Query semua produk untuk admin panel (aktif maupun nonaktif) - selalu fresh
      const allProducts = await query(`
        SELECT 
          id, 
          code, 
          name, 
          robux_amount, 
          bonus_robux, 
          price_idr, 
          is_promo, 
          is_popular, 
          (robux_amount >= 10000 OR is_sultan = true) as is_sultan, 
          is_active,
          display_order
        FROM public.products
        ORDER BY price_idr ASC, robux_amount ASC
      `);
      return NextResponse.json({ success: true, data: allProducts });
    }

    // Micro-cache 20 detik di server memory untuk pengunjung storefront
    const products = await getOrSetCache('products:active', 20, async () => {
      return await query(`
        SELECT 
          id, 
          code, 
          name, 
          robux_amount, 
          bonus_robux, 
          price_idr, 
          is_promo, 
          is_popular, 
          (robux_amount >= 10000 OR is_sultan = true) as is_sultan, 
          is_active,
          display_order
        FROM public.products
        WHERE is_active = true
        ORDER BY price_idr ASC, robux_amount ASC
      `);
    });

    return NextResponse.json(
      { success: true, data: products },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data produk', error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, robux_amount, bonus_robux = 0, price_idr, is_promo = false, is_popular = false, display_order = 0 } = body;

    if (!code || !name || !robux_amount || !price_idr) {
      return NextResponse.json(
        { success: false, message: 'Harap lengkapi kode, nama paket, jumlah robux, dan harga.' },
        { status: 400 }
      );
    }

    const isSultan = Number(robux_amount) >= 10000;

    const result = await query(
      `
      INSERT INTO public.products (
        code, name, robux_amount, bonus_robux, price_idr, is_promo, is_popular, is_sultan, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, code, name, robux_amount, price_idr
      `,
      [code, name, robux_amount, bonus_robux, price_idr, is_promo, is_popular, isSultan, display_order]
    );

    // Invalidate cache produk & storefront seketika
    invalidateStorefrontCache();

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan produk', error: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, robux_amount, bonus_robux, price_idr, is_promo, is_popular, is_active, display_order } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID produk diperlukan' }, { status: 400 });
    }

    const isSultan = Number(robux_amount) >= 10000;

    const result = await query(
      `
      UPDATE public.products
      SET 
        name = COALESCE($1, name),
        robux_amount = COALESCE($2, robux_amount),
        bonus_robux = COALESCE($3, bonus_robux),
        price_idr = COALESCE($4, price_idr),
        is_promo = COALESCE($5, is_promo),
        is_popular = COALESCE($6, is_popular),
        is_sultan = $7,
        is_active = COALESCE($8, is_active),
        display_order = COALESCE($9, display_order),
        updated_at = NOW()
      WHERE id = $10
      RETURNING id, code, name, robux_amount, price_idr
      `,
      [name, robux_amount, bonus_robux, price_idr, is_promo, is_popular, isSultan, is_active, display_order, id]
    );

    // Invalidate seluruh cache storefront & produk seketika
    invalidateStorefrontCache();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui produk', error: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID produk diperlukan' }, { status: 400 });
    }

    await query(`DELETE FROM public.products WHERE id = $1`, [id]);
    invalidateStorefrontCache();

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus produk', error: error?.message },
      { status: 500 }
    );
  }
}
