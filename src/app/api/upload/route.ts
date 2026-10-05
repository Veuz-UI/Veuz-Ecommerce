import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Maximum allowed upload size (5MB)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Allowed MIME types and mapping to safe file extensions
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

/**
 * Validates the binary header (Magic Bytes) of the buffer
 * Prevents disguised executables or malicious scripts.
 */
function verifyMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: Starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF: Starts with GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WEBP: Starts with RIFF (52 49 46 46) and bytes 8..11 are WEBP (57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // SVG: Text-based XML check (contains <svg and no script tags)
  const headStr = buffer.slice(0, 512).toString('utf-8').toLowerCase();
  if (headStr.includes('<svg') || (headStr.includes('<?xml') && headStr.includes('<svg'))) {
    const fullStr = buffer.toString('utf-8').toLowerCase();
    if (!fullStr.includes('<script') && !fullStr.includes('javascript:')) {
      return 'image/svg+xml';
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // 1. Verify file exists
    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, message: 'Please select a valid file to upload.' },
        { status: 400 }
      );
    }

    // 2. Strict size check
    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, message: 'Uploaded file is empty.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size exceeds the 5MB maximum limit. Please select a smaller file.',
        },
        { status: 413 }
      );
    }

    // 3. Check declared MIME type
    const declaredMime = file.type ? file.type.toLowerCase() : '';
    if (!MIME_TO_EXT[declaredMime]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file format. Only JPG, PNG, WebP, and GIF images are allowed.',
        },
        { status: 400 }
      );
    }

    // 4. Binary inspection (Magic Bytes)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const verifiedMime = verifyMagicBytes(buffer);

    if (!verifiedMime || !MIME_TO_EXT[verifiedMime]) {
      return NextResponse.json(
        {
          success: false,
          message: 'Security verification failed: File content does not match a valid image.',
        },
        { status: 400 }
      );
    }

    // 5. Ensure safe storage path and prevent path traversal
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate non-guessable, cryptographically secure random filename
    const safeExtension = MIME_TO_EXT[verifiedMime];
    const randomHash = crypto.randomBytes(16).toString('hex');
    const safeFileName = `img_${Date.now()}_${randomHash}${safeExtension}`;
    const destinationPath = path.resolve(uploadsDir, safeFileName);

    // Double check path traversal safety
    if (!destinationPath.startsWith(path.resolve(uploadsDir))) {
      return NextResponse.json(
        { success: false, message: 'Invalid file destination path.' },
        { status: 400 }
      );
    }

    // Write securely to disk
    fs.writeFileSync(destinationPath, buffer);

    const publicUrl = `/uploads/${safeFileName}`;
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully.',
      url: publicUrl,
    });
  } catch (error: any) {
    // Log technical error securely on the server only, never leak system details to client
    console.error('Secure File Upload Error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Upload processing failed. Please try again with a valid image.' },
      { status: 500 }
    );
  }
}
