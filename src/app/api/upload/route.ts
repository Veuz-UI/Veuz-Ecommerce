import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = `banner_${Date.now()}_${cleanName}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${safeName}`;
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, message: error.message || 'File upload failed' }, { status: 500 });
  }
}
