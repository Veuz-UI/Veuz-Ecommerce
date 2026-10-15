import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_SHOP_SETTINGS, DEFAULT_DELIVERY_OPTIONS, ShopSettingsData } from '@/data/defaultShopSettings';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'shop-settings-store.json');

function readStoredSettings(): ShopSettingsData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.mainMenu)) {
        return {
          ...DEFAULT_SHOP_SETTINGS,
          ...parsed,
          deliveryOptions: Array.isArray(parsed.deliveryOptions) && parsed.deliveryOptions.length > 0
            ? parsed.deliveryOptions
            : DEFAULT_DELIVERY_OPTIONS,
        };
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

    const allowedBadges = new Set(['NEW', 'OFFER SALES', 'LIMITED SALES', 'OFFER', 'LIMITED SALE', 'HOT', 'TRENDING']);
    const invalidMenuTitleOrBadge = body.mainMenu.find((menu: ShopSettingsData['mainMenu'][number]) => {
      const existingMenu = readStoredSettings().mainMenu.find((storedMenu) => storedMenu.id === menu.id);
      const title = menu.name?.trim() || '';
      const titleChanged = !existingMenu || existingMenu.name !== menu.name;
      const cleanBadge = menu.badge ? menu.badge.toUpperCase().trim() : '';
      const badgeChanged = !existingMenu || (existingMenu.badge ? existingMenu.badge.toUpperCase().trim() : '') !== cleanBadge;
      return (titleChanged && (!title || title.length > 25)) ||
        (badgeChanged && Boolean(cleanBadge && !allowedBadges.has(cleanBadge)));
    });

    if (invalidMenuTitleOrBadge) {
      return NextResponse.json(
        { success: false, message: 'Menu title is required and cannot exceed 25 characters. Badges allowed: NEW, OFFER SALES, LIMITED SALES.' },
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

    const currentStored = readStoredSettings();
    const deliveryOptionsToSave = Array.isArray(body.deliveryOptions)
      ? body.deliveryOptions
      : (currentStored.deliveryOptions || DEFAULT_DELIVERY_OPTIONS);

    const sanitizedMainMenu = body.mainMenu.map((m: any) => {
      let b = m.badge ? String(m.badge).toUpperCase().trim() : undefined;
      if (b === 'OFFER') b = 'OFFER SALES';
      if (b === 'LIMITED SALE' || b === 'LIMTED SALE' || b === 'LIMITED') b = 'LIMITED SALES';
      return {
        ...m,
        badge: b,
      };
    });

    const saved = writeStoredSettings({
      categories: body.categories,
      mainMenu: sanitizedMainMenu,
      deliveryOptions: deliveryOptionsToSave,
    });

    if (!saved) {
      return NextResponse.json({ success: false, message: 'Failed to write settings to disk' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: body.categories,
        mainMenu: body.mainMenu,
        deliveryOptions: deliveryOptionsToSave,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
