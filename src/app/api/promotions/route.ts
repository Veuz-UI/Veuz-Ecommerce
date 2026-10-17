import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_PROMOTION_AREA, PromotionAreaData } from '@/data/defaultPromotionArea';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'promotion-area-store.json');

function readStoredPromotions(): PromotionAreaData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.promotions) && parsed.promotions.length === 3) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading promotion area store:', error);
  }
  return DEFAULT_PROMOTION_AREA;
}

function writeStoredPromotions(data: PromotionAreaData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing promotion area store:', error);
    return false;
  }
}

export async function GET() {
  const data = readStoredPromotions();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.promotions) || body.promotions.length !== 3) {
      return NextResponse.json(
        { success: false, message: 'Invalid promotion payload. Exactly 3 promotions are required.' },
        { status: 400 }
      );
    }

    // Sanitize and ensure at least one promotion card has an image
    const hasAtLeastOne = body.promotions.some(
      (p: any) => typeof p?.image === 'string' && p.image.trim().length > 0 && !p.image.includes('promo-card-')
    );

    if (!hasAtLeastOne) {
      return NextResponse.json(
        { success: false, message: 'Please upload at least one promotion card image.' },
        { status: 400 }
      );
    }

    const saved = writeStoredPromotions(body);
    if (!saved) {
      return NextResponse.json(
        { success: false, message: 'Failed to write promotion area store.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    console.error('Error in POST /api/promotions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
