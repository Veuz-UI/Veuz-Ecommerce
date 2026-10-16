import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'carts-store.json');

interface UserStoreData {
  cart?: any[];
  wishlist?: number[];
  updatedAt?: string;
}

interface AllUsersStore {
  [userId: string]: UserStoreData;
}

function readAllStores(): AllUsersStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading carts-store.json:', error);
  }
  return {};
}

function writeAllStores(data: AllUsersStore): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing carts-store.json:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const allStores = readAllStores();
    const userStore = allStores[String(userId)] || { cart: [], wishlist: [] };

    return NextResponse.json({
      success: true,
      cart: Array.isArray(userStore.cart) ? userStore.cart : [],
      wishlist: Array.isArray(userStore.wishlist) ? userStore.wishlist : [],
    });
  } catch (error: any) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, cart, wishlist } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    const allStores = readAllStores();
    const existing = allStores[String(userId)] || {};

    allStores[String(userId)] = {
      cart: cart !== undefined ? (Array.isArray(cart) ? cart : []) : (existing.cart || []),
      wishlist: wishlist !== undefined ? (Array.isArray(wishlist) ? wishlist : []) : (existing.wishlist || []),
      updatedAt: new Date().toISOString(),
    };

    const saved = writeAllStores(allStores);

    return NextResponse.json({
      success: saved,
      cart: allStores[String(userId)].cart,
      wishlist: allStores[String(userId)].wishlist,
    });
  } catch (error: any) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
