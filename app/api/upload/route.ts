import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'proofs';

    if (!file) {
      return NextResponse.json({ success: false, message: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mime = file.type || 'image/webp';
    const dataUrl = `data:${mime};base64,${base64}`;

    // Coba simpan ke filesystem lokal jika environment mendukung (Node.js/lokal/VPS)
    try {
      const safeFolder = ['proofs', 'qris', 'logo'].includes(folder) ? folder : 'proofs';
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileName = `${safeFolder}-${timestamp}-${randomSuffix}.webp`;
      const filePath = path.join(uploadDir, fileName);

      await fs.promises.writeFile(filePath, buffer);
      const publicUrl = `/uploads/${safeFolder}/${fileName}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
        sizeBytes: buffer.length,
      });
    } catch (fsError) {
      // Jika filesystem read-only (misal Cloudflare Workers / Serverless Edge), fallback ke Data URL
      console.warn('[Upload Info]: Filesystem read-only pada environment serverless, menggunakan Data URL fallback.');
      return NextResponse.json({
        success: true,
        url: dataUrl,
        fileName: file.name || 'image.webp',
        sizeBytes: buffer.length,
      });
    }
  } catch (error: any) {
    console.error('[Upload Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengunggah file', error: error?.message },
      { status: 500 }
    );
  }
}
