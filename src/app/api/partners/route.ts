import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { DEFAULT_PARTNERS_DATA, PartnersData } from '@/data/defaultPartners';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'partners-store.json');

function readStoredPartners(): PartnersData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.partners)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading partners store:', error);
  }
  return DEFAULT_PARTNERS_DATA;
}

function writeStoredPartners(data: PartnersData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing partners store:', error);
    return false;
  }
}

export async function GET() {
  const data = readStoredPartners();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.partners)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload structure: partners array required.' },
        { status: 400 }
      );
    }

    const payload: PartnersData = {
      title: typeof body.title === 'string' ? body.title : 'Our Official Brand & Safety Partners',
      subtitle: typeof body.subtitle === 'string' ? body.subtitle : 'Partnered with globally certified industrial safety, PPE, and equipment manufacturers.',
      buttonText: typeof body.buttonText === 'string' ? body.buttonText : 'View All Partners',
      buttonLink: typeof body.buttonLink === 'string' ? body.buttonLink : '/products',
      partners: body.partners,
    };

    const saved = writeStoredPartners(payload);
    if (!saved) {
      return NextResponse.json({ success: false, message: 'Failed to write data to store.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Partners updated successfully.',
      data: payload,
    });
  } catch (error: any) {
    console.error('Error saving partners:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
