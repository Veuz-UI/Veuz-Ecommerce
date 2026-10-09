import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_SHOP_SETTINGS, ShopSettingsData } from '@/data/defaultShopSettings';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'shop-settings-store.json');

function readStoredSettings(): ShopSettingsData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.mainMenu)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading shop settings store:', error);
  }
  return DEFAULT_SHOP_SETTINGS;
}

function writeStoredSettings(data: ShopSettingsData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing shop settings store:', error);
    return false;
  }
}

export async function GET() {
  const data = readStoredSettings();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.categories) || !Array.isArray(body.mainMenu)) {
      return NextResponse.json({ success: false, message: 'Invalid payload structure' }, { status: 400 });
    }

    // Constraint: Maximum 6 main menu items allowed
    if (body.mainMenu.length > 6) {
      return NextResponse.json(
        { success: false, message: 'Maximum 6 main menu items allowed' },
        { status: 400 }
      );
    }

    const allowedBadges = new Set(['NEW', 'OFFER', 'LIMITED SALE']);
    const invalidMenuTitleOrBadge = body.mainMenu.find((menu: ShopSettingsData['mainMenu'][number]) => {
      const existingMenu = readStoredSettings().mainMenu.find((storedMenu) => storedMenu.id === menu.id);
      const title = menu.name?.trim() || '';
      const wordCount = title ? title.split(/\s+/).length : 0;
      const titleChanged = !existingMenu || existingMenu.name !== menu.name;
      const badgeChanged = !existingMenu || existingMenu.badge !== menu.badge;
      return (titleChanged && (wordCount < 2 || wordCount > 3 || title.length < 10 || title.length > 15)) ||
        (badgeChanged && Boolean(menu.badge && !allowedBadges.has(menu.badge)));
    });

    if (invalidMenuTitleOrBadge) {
      return NextResponse.json(
        { success: false, message: 'Menu titles must be 2–3 words and 10–15 characters. Only NEW, OFFER, or LIMITED SALE badges are allowed.' },
        { status: 400 }
      );
    }

    const invalidMenu = body.mainMenu.find((menu: ShopSettingsData['mainMenu'][number]) => {
      const columns = menu.columns || [];
      if (columns.length > 3 || columns.some((column) => !Array.isArray(column.items) || column.items.length > 5)) {
        return true;
      }

      const categoryIds = columns.map((column) => column.categoryId).filter(Boolean);
      return new Set(categoryIds).size !== categoryIds.length;
    });

    if (invalidMenu) {
      return NextResponse.json(
        { success: false, message: 'Each mega menu supports up to 3 different categories and 5 products per category.' },
        { status: 400 }
      );
    }

    const saved = writeStoredSettings({
      categories: body.categories,
      mainMenu: body.mainMenu,
    });

    if (!saved) {
      return NextResponse.json({ success: false, message: 'Failed to write settings to disk' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
