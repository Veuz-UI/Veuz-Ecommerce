import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_BANNER_SETTINGS, BannerSettingsData, countWords } from '@/data/defaultBannerSettings';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'banner-settings-store.json');

function readStoredBanners(): BannerSettingsData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.mainBanners) && Array.isArray(parsed.promoBanners)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading banner settings store:', error);
  }
  return DEFAULT_BANNER_SETTINGS;
}

function writeStoredBanners(data: BannerSettingsData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing banner settings store:', error);
    return false;
  }
}

export async function GET() {
  const data = readStoredBanners();
  const sortedMain = (data.mainBanners || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((b, idx) => ({ ...b, order: idx + 1 }));
  const sortedPromo = (data.promoBanners || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((b, idx) => ({ ...b, order: idx + 1 }));
  return NextResponse.json({ success: true, data: { mainBanners: sortedMain, promoBanners: sortedPromo } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.mainBanners) || !Array.isArray(body.promoBanners)) {
      return NextResponse.json({ success: false, message: 'Invalid banner payload structure' }, { status: 400 });
    }

    // Constraint: Maximum 12 banners for each category
    if (body.mainBanners.length > 12) {
      return NextResponse.json(
        { success: false, message: 'Maximum 12 Main Banners allowed.' },
        { status: 400 }
      );
    }

    if (body.promoBanners.length > 12) {
      return NextResponse.json(
        { success: false, message: 'Maximum 12 Promotion Banners allowed.' },
        { status: 400 }
      );
    }

    // Validate Main Banners (Image is only mandatory field; text is optional)
    for (let i = 0; i < body.mainBanners.length; i++) {
      const b = body.mainBanners[i];
      if (!b.image || !b.image.trim()) {
        return NextResponse.json(
          { success: false, message: `Main Banner #${i + 1}: Banner image is mandatory.` },
          { status: 400 }
        );
      }
      if (b.title && countWords(b.title) > 50) {
        return NextResponse.json(
          { success: false, message: `Main Banner #${i + 1}: Heading exceeds 50 words limit (${countWords(b.title)}/50 words).` },
          { status: 400 }
        );
      }
      if (b.desc && countWords(b.desc) > 50) {
        return NextResponse.json(
          { success: false, message: `Main Banner #${i + 1}: Description exceeds 50 words limit (${countWords(b.desc)}/50 words).` },
          { status: 400 }
        );
      }
    }

    // Validate Promotion Banners (Image is only mandatory field; text is optional)
    for (let i = 0; i < body.promoBanners.length; i++) {
      const b = body.promoBanners[i];
      if (!b.image || !b.image.trim()) {
        return NextResponse.json(
          { success: false, message: `Promotion Banner #${i + 1}: Banner image is mandatory.` },
          { status: 400 }
        );
      }
      if (b.title && countWords(b.title) > 50) {
        return NextResponse.json(
          { success: false, message: `Promotion Banner #${i + 1}: Heading exceeds 50 words limit (${countWords(b.title)}/50 words).` },
          { status: 400 }
        );
      }
      if (b.desc && countWords(b.desc) > 50) {
        return NextResponse.json(
          { success: false, message: `Promotion Banner #${i + 1}: Description exceeds 50 words limit (${countWords(b.desc)}/50 words).` },
          { status: 400 }
        );
      }
    }

    const normalizedMain = (body.mainBanners || [])
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((b: any, idx: number) => ({ ...b, order: idx + 1 }));

    const normalizedPromo = (body.promoBanners || [])
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((b: any, idx: number) => ({ ...b, order: idx + 1 }));

    const saved = writeStoredBanners({
      mainBanners: normalizedMain,
      promoBanners: normalizedPromo,
    });

    if (!saved) {
      return NextResponse.json({ success: false, message: 'Failed to write banner settings to disk' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        mainBanners: normalizedMain,
        promoBanners: normalizedPromo,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error saving banner settings' },
      { status: 500 }
    );
  }
}
