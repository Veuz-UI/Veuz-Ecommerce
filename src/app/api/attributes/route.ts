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

  // Base colors: System defaults (Strictly Black, White, Blue, Red, Green)
  const defaultMap = new Map<string, SystemColor>();
  SYSTEM_COLORS.forEach((col) => {
    defaultMap.set(col.name.toLowerCase().trim(), col);
  });

  // Merge any stored custom colors
  if (Array.isArray(stored.colors)) {
    stored.colors.forEach((col) => {
      if (col && col.name) {
        const key = col.name.toLowerCase().trim();
        if (!defaultMap.has(key)) {
          defaultMap.set(key, col);
        }
      }
    });
  }

  // Base sizes: Presets
  const sizesSet = new Set<string>(PRESET_SIZES);
  if (Array.isArray(stored.sizes)) {
    stored.sizes.forEach((s) => {
      if (s && typeof s === 'string' && s.trim()) {
        sizesSet.add(s.trim());
      }
    });
  }

  // Also include any colors/sizes existing in products-store.json so user never loses their data
  try {
    if (fs.existsSync(PRODUCTS_STORE_PATH)) {
      const pContent = fs.readFileSync(PRODUCTS_STORE_PATH, 'utf-8');
      const products: ProductItem[] = JSON.parse(pContent);
      if (Array.isArray(products)) {
        products.forEach((p) => {
          if (Array.isArray(p.sizes)) {
            p.sizes.forEach((sz) => {
              if (sz && typeof sz === 'string' && sz.trim()) sizesSet.add(sz.trim());
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Error scanning products store for attributes:', err);
  }

  return {
    colors: Array.from(defaultMap.values()),
    sizes: Array.from(sizesSet),
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
      // Do not allow deleting system default 5 colors
      const isSystemDefault = SYSTEM_COLORS.some((c) => c.name.toLowerCase() === name.toLowerCase());
      if (isSystemDefault) {
        return NextResponse.json({ success: false, message: 'Default system colors cannot be deleted.' }, { status: 400 });
      }

      current.colors = current.colors.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
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
