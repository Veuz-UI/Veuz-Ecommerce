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
      if (parsed && Array.isArray(parsed.promotions) && parsed.promotions.length > 0) {
        const promos = [...parsed.promotions];
        while (promos.length < 4) {
          promos.push({ id: `promo-card-${promos.length + 1}`, image: '', title: '', link: '/products' });
        }
        return {
          ...parsed,
          promotions: promos.slice(0, 4),
        };
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const data = readStoredPromotions();

  const today = new Date().toISOString().slice(0, 10);
  const todayClicks = (data.dailyClicks && typeof data.dailyClicks[today] === 'number')
    ? data.dailyClicks[today]
    : 0;

  const activeBanners = Array.isArray(data.promotions)
    ? data.promotions.filter((p) => p.image && !p.image.includes('promo-card-')).length
    : 0;

  if (type === 'stats') {
    return NextResponse.json({
      success: true,
      today,
      todayClicks,
      activeBanners,
      dailyClicks: data.dailyClicks || {},
    });
  }

  return NextResponse.json({ success: true, data, todayClicks, activeBanners });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Record logged-in customer click on promotion area (Daily tracking)
    if (body && body.action === 'record_click') {
      const { promoId, customerId, userRole } = body;

      // Only count logged-in customers (role === 'CUSTOMER'). Exclude admin, superadmin, and guests.
      if (userRole !== 'CUSTOMER' || !customerId) {
        return NextResponse.json({ success: true, ignored: true });
      }

      const data = readStoredPromotions();
      if (!data.dailyClicks) data.dailyClicks = {};
      if (!data.clickHistory) data.clickHistory = [];

      const today = new Date().toISOString().slice(0, 10);
      data.dailyClicks[today] = (data.dailyClicks[today] || 0) + 1;

      data.clickHistory.push({
        date: today,
        customerId,
        promoId: promoId || 'promo-card',
        timestamp: Date.now(),
      });

      // Keep recent 1000 events
      if (data.clickHistory.length > 1000) {
        data.clickHistory = data.clickHistory.slice(-1000);
      }

      writeStoredPromotions(data);
      return NextResponse.json({
        success: true,
        today,
        todayClicks: data.dailyClicks[today],
      });
    }

    // 2. Normal Admin Promotion Card Save
    if (!body || !Array.isArray(body.promotions) || (body.promotions.length !== 4 && body.promotions.length !== 3)) {
      return NextResponse.json(
        { success: false, message: 'Invalid promotion payload. 4 promotions are required.' },
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

    const existing = readStoredPromotions();
    const toSave: PromotionAreaData = {
      promotions: body.promotions,
      dailyClicks: existing.dailyClicks || {},
      clickHistory: existing.clickHistory || [],
    };

    const saved = writeStoredPromotions(toSave);
    if (!saved) {
      return NextResponse.json(
        { success: false, message: 'Failed to write promotion area store.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: toSave });
  } catch (error: any) {
    console.error('Error in POST /api/promotions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
