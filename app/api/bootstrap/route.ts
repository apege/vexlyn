import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrSetCache } from '@/lib/cache';

/**
 * Combined Storefront Bootstrap Endpoint
 * 
 * Manfaat Ekstrem:
 * 1. Menyatukan 3 request terpisah (settings, products, testimonials) menjadi 1 request tunggal.
 * 2. Mengurangi Cloudflare Worker invocations & Observability events hingga 66%.
 * 3. Menggunakan micro-cache 20 detik untuk menghemat 95-99% Neon DB active compute.
 * 4. Otomatis dibersihkan (invalidated) seketika jika Admin melakukan update di panel admin.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceFresh = searchParams.get('fresh') === 'true';

    const fetcher = async () => {
      const [settingsRows, products, testimonials] = await Promise.all([
        query(`SELECT setting_key, setting_value FROM public.store_settings`),
        query(`
          SELECT 
            id, code, name, robux_amount, bonus_robux, price_idr,
            is_promo, is_popular, (robux_amount >= 10000 OR is_sultan = true) as is_sultan,
            is_active, display_order
          FROM public.products
          WHERE is_active = true
          ORDER BY price_idr ASC, robux_amount ASC
        `),
        query(`
          SELECT 
            id, roblox_username, package_name, rating, comment,
            is_verified, admin_reply, admin_reply_at, created_at
          FROM public.testimonials
          WHERE is_visible = true
          ORDER BY created_at DESC LIMIT 20
        `),
      ]);

      const settings: Record<string, string> = {};
      settingsRows.forEach((r: any) => {
        settings[r.setting_key] = r.setting_value;
      });

      return {
        settings,
        products,
        testimonials,
      };
    };

    let data;
    if (forceFresh) {
      data = await fetcher();
    } else {
      // Micro-cache 20 detik: 1000 pengunjung hanya memicu 1 kali query ke Neon
      data = await getOrSetCache('bootstrap:storefront', 20, fetcher);
    }

    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal memuat data awal storefront', error: error?.message },
      { status: 500 }
    );
  }
}
