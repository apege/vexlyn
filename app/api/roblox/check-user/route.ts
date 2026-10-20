import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrSetCache } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUsername = body?.username ? String(body.username).trim() : '';

    if (!rawUsername) {
      return NextResponse.json(
        { success: false, message: 'Harap masukkan username Roblox terlebih dahulu.' },
        { status: 400 }
      );
    }

    // 1. Cek apakah username diblacklist di database Vexlyn
    try {
      const blacklistCheck = await query(
        `SELECT reason FROM public.blacklists WHERE LOWER(roblox_username) = LOWER($1) LIMIT 1`,
        [rawUsername]
      );

      if (blacklistCheck.length > 0) {
        return NextResponse.json(
          {
            success: false,
            is_blacklisted: true,
            message: `Akun Roblox "${rawUsername}" diblacklist dari Vexlyn. Alasan: ${blacklistCheck[0].reason}`,
          },
          { status: 403 }
        );
      }
    } catch (dbErr) {
      // Jika DB belum connect/error, lanjutkan pengecekan Roblox
      console.warn('[Vexlyn DB Blacklist Check Warning]:', dbErr);
    }

    // 2. Gunakan cache in-memory untuk query Roblox API (TTL 300s = 5 menit)
    // Menghindari rate limit dari Roblox saat traffic banyak
    const cacheKey = `roblox:user:${rawUsername.toLowerCase()}`;
    const userData = await getOrSetCache(cacheKey, 300, async () => {
      // Hit official Roblox User Search Endpoint
      const robloxRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          usernames: [rawUsername],
          excludeBannedUsers: false,
        }),
        cache: 'no-store',
      });

      if (!robloxRes.ok) {
        throw new Error(`Roblox API HTTP error! status: ${robloxRes.status}`);
      }

      const robloxJson = await robloxRes.json();
      const user = robloxJson.data?.[0];

      if (!user) {
        return null;
      }

      // Ambil Circular Headshot Avatar dari Roblox Thumbnails API
      let avatarUrl = '';
      try {
        const thumbRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`,
          { cache: 'no-store' }
        );
        if (thumbRes.ok) {
          const thumbJson = await thumbRes.json();
          avatarUrl = thumbJson.data?.[0]?.imageUrl || '';
        }
      } catch (thumbErr) {
        console.warn('[Roblox Thumbnail fetch error]:', thumbErr);
      }

      return {
        id: user.id,
        name: user.name,
        displayName: user.displayName || user.name,
        hasVerifiedBadge: !!user.hasVerifiedBadge,
        avatarUrl: avatarUrl || `https://tr.rbxcdn.com/avatar-headshot/${user.id}/150/150/AvatarHeadshot/Png/isCircular`,
      };
    });

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          message: `Username Roblox "${rawUsername}" tidak ditemukan. Pastikan ejaan huruf besar/kecil benar.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error: any) {
    console.error('[Roblox Check User Error]:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghubungi server Roblox. Silakan coba beberapa saat lagi.',
        error: error?.message,
      },
      { status: 500 }
    );
  }
}
