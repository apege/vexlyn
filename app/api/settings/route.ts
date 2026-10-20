import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrSetCache, invalidateStorefrontCache } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceFresh = searchParams.get('fresh') === 'true';

    const fetcher = async () => {
      const rows = await query(`
        SELECT setting_key, setting_value
        FROM public.store_settings
      `);

      const obj: Record<string, string> = {};
      rows.forEach((r: any) => {
        obj[r.setting_key] = r.setting_value;
      });
      return obj;
    };

    const obj = forceFresh
      ? await fetcher()
      : await getOrSetCache('store_settings', 20, fetcher);

    return NextResponse.json(
      { success: true, settings: obj },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=20',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil pengaturan toko', error: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Format pengaturan tidak valid' },
        { status: 400 }
      );
    }

    const updates = Object.entries(settings);
    for (const [key, val] of updates) {
      await query(
        `
        INSERT INTO public.store_settings (setting_key, setting_value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
        `,
        [key, String(val)]
      );
    }

    // Invalidate seluruh cache storefront & settings seketika agar perubahan realtime
    invalidateStorefrontCache();

    return NextResponse.json(
      { success: true, message: 'Pengaturan berhasil disimpan' },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Surrogate-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan pengaturan toko', error: error?.message },
      { status: 500 }
    );
  }
}
