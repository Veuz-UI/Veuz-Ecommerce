import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SYSTEM_COLORS, PRESET_SIZES, SystemColor, ProductItem } from '@/data/categoryProductsData';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'attributes-store.json');
const PRODUCTS_STORE_PATH = path.join(process.cwd(), 'src', 'data', 'products-store.json');

export interface AttributesStoreData {
  colors: SystemColor[];
  sizes: string[];
}

function readStoredAttributes(): AttributesStoreData {
  let stored: { colors?: SystemColor[]; sizes?: string[] } = {};

  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      stored = JSON.parse(content) || {};
    }
  } catch (error) {
    console.error('Error reading attributes store:', error);
  }

  // Use stored attributes as source of truth; fallback to defaults if not yet initialized
  const colorsList: SystemColor[] =
    Array.isArray(stored.colors) && stored.colors.length > 0 ? stored.colors : [...SYSTEM_COLORS];

  const sizesList: string[] =
    Array.isArray(stored.sizes) && stored.sizes.length > 0 ? stored.sizes : [...PRESET_SIZES];

  return {
    colors: colorsList,
    sizes: sizesList,
  };
}

function writeStoredAttributes(data: AttributesStoreData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing attributes store:', error);
    return false;
  }
}

export async function GET() {
  try {
    const data = readStoredAttributes();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = readStoredAttributes();
    const action = body.action;

    if (action === 'add_color') {
      const { name, hex } = body;
      if (!name || !hex) {
        return NextResponse.json({ success: false, message: 'Color name and hex code are required' }, { status: 400 });
      }

      const trimmedName = name.trim();
      const trimmedHex = hex.trim();

      const existingIndex = current.colors.findIndex(
        (c) => c.name.toLowerCase().trim() === trimmedName.toLowerCase()
      );

      const isWhite = trimmedHex.toLowerCase() === '#ffffff' || trimmedHex.toLowerCase() === '#fff';
      const newColor: SystemColor = {
        name: trimmedName,
        hex: trimmedHex,
        border: isWhite ? '#cbd5e1' : undefined,
      };

      if (existingIndex >= 0) {
        current.colors[existingIndex] = newColor;
      } else {
        current.colors.push(newColor);
      }

      writeStoredAttributes(current);
      return NextResponse.json({ success: true, data: current });
    }

    if (action === 'add_size') {
      const { size } = body;
      if (!size || typeof size !== 'string' || !size.trim()) {
        return NextResponse.json({ success: false, message: 'Size value is required' }, { status: 400 });
      }

      const trimmedSize = size.trim();
      if (!current.sizes.some((s) => s.toLowerCase() === trimmedSize.toLowerCase())) {
        current.sizes.push(trimmedSize);
        writeStoredAttributes(current);
      }

      return NextResponse.json({ success: true, data: current });
    }

    if (action === 'delete_color') {
      const { name } = body;
      if (!name) {
        return NextResponse.json({ success: false, message: 'Color name is required' }, { status: 400 });
      }

      current.colors = current.colors.filter((c) => c.name.toLowerCase().trim() !== name.toLowerCase().trim());
      writeStoredAttributes(current);
      return NextResponse.json({ success: true, data: current });
    }

    if (action === 'delete_size') {
      const { size } = body;
      current.sizes = current.sizes.filter((s) => s.toLowerCase() !== size.toLowerCase());
      writeStoredAttributes(current);
      return NextResponse.json({ success: true, data: current });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
