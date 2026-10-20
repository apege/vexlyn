import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrSetCache, invalidateStorefrontCache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);

    if (all) {
      // Admin dashboard view: query langsung tanpa cache publik
      const testimonials = await query(`
        SELECT id, order_code, roblox_username, package_name, rating, comment, is_verified, is_visible, admin_reply, admin_reply_at, created_at
        FROM public.testimonials
        ORDER BY created_at DESC LIMIT ${limit}
      `);
      return NextResponse.json({ success: true, data: testimonials });
    }

    // Public visitor view: micro-cache 20 detik agar Neon & Cloudflare sangat hemat
    const testimonials = await getOrSetCache(`testimonials:public:${limit}`, 20, async () => {
      return await query(`
        SELECT id, roblox_username, package_name, rating, comment, is_verified, admin_reply, admin_reply_at, created_at
        FROM public.testimonials
        WHERE is_visible = true
        ORDER BY created_at DESC LIMIT ${limit}
      `);
    });

    return NextResponse.json(
      { success: true, data: testimonials },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil ulasan', error: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_code, roblox_username, package_name, rating = 5, comment } = body;

    if (!roblox_username || !package_name || !comment) {
      return NextResponse.json(
        { success: false, message: 'Harap lengkapi username Roblox, paket yang dibeli, dan ulasan Anda.' },
        { status: 400 }
      );
    }

    // Batasi panjang karakter untuk mencegah payload raksasa
    const safeComment = String(comment).slice(0, 500);
    const safeUsername = String(roblox_username).slice(0, 50);
    const safePackage = String(package_name).slice(0, 50);
    const ratingNum = Math.max(1, Math.min(5, Number(rating) || 5));

    const result = await query(
      `
      INSERT INTO public.testimonials (
        order_code, roblox_username, package_name, rating, comment, is_verified, is_visible
      ) VALUES ($1, $2, $3, $4, $5, true, true)
      RETURNING id, roblox_username, package_name, rating, comment
      `,
      [order_code ? String(order_code).slice(0, 30) : null, safeUsername.trim(), safePackage.trim(), ratingNum, safeComment.trim()]
    );

    invalidateStorefrontCache();

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim ulasan', error: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_visible, is_verified, admin_reply } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID ulasan diperlukan' }, { status: 400 });
    }

    let result;
    if (admin_reply !== undefined) {
      const safeReply = admin_reply ? String(admin_reply).slice(0, 500) : null;
      result = await query(
        `
        UPDATE public.testimonials
        SET 
          admin_reply = $1,
          admin_reply_at = CASE WHEN $1 IS NULL THEN NULL ELSE NOW() END
        WHERE id = $2
        RETURNING id, is_visible, is_verified, admin_reply, admin_reply_at
        `,
        [safeReply, id]
      );
    } else {
      result = await query(
        `
        UPDATE public.testimonials
        SET 
          is_visible = COALESCE($1, is_visible),
          is_verified = COALESCE($2, is_verified)
        WHERE id = $3
        RETURNING id, is_visible, is_verified, admin_reply, admin_reply_at
        `,
        [is_visible, is_verified, id]
      );
    }

    invalidateStorefrontCache();

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengubah status ulasan', error: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID ulasan diperlukan' }, { status: 400 });
    }

    await query(`DELETE FROM public.testimonials WHERE id = $1`, [id]);
    invalidateStorefrontCache();

    return NextResponse.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menghapus ulasan', error: error?.message },
      { status: 500 }
    );
  }
}
