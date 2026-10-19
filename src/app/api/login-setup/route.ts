import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface LoginSlideItem {
  id: string;
  image: string;
  caption: string;
  isActive?: boolean;
}

export interface LoginSetupPayload {
  autoSlideInterval: number;
  slides: LoginSlideItem[];
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'login-setup-store.json');

const DEFAULT_SETUP: LoginSetupPayload = {
  autoSlideInterval: 5000,
  slides: [
    {
      id: 'slide-1',
      image: '/assets/imgs/banner/urban-login-hero.jpg',
      caption: 'Veuz is an online fashion store that provides a variety of clothes, shoes, bags, and accessories for men and women.',
      isActive: true,
    },
    {
      id: 'slide-2',
      image: '/assets/imgs/banner/urban-login-slide-2.jpg',
      caption: 'Discover contemporary urban streetwear, timeless trench coats, and modern minimalist styles crafted for daily elegance.',
      isActive: true,
    },
    {
      id: 'slide-3',
      image: '/assets/imgs/banner/urban-login-slide-3.jpg',
      caption: 'Curated collections with premium materials, lightweight all-day comfort, and tailored designs for modern life.',
      isActive: true,
    },
    {
      id: 'slide-4',
      image: '/assets/imgs/banner/urban-login-slide-4.jpg',
      caption: 'Elevate your workwear and weekend wardrobe with versatile apparel, sleek footwear, and functional accessories.',
      isActive: true,
    },
  ],
};

function readSetup(): LoginSetupPayload {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
        return {
          autoSlideInterval: Number(parsed.autoSlideInterval) || 5000,
          slides: parsed.slides.slice(0, 4), // Enforce maximum 4 slides
        };
      }
    }
  } catch (error) {
    console.error('Error reading login setup store:', error);
  }
  return DEFAULT_SETUP;
}

function writeSetup(data: LoginSetupPayload): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing login setup store:', error);
    return false;
  }
}

export async function GET() {
  const data = readSetup();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.slides)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload structure: slides array is required' },
        { status: 400 }
      );
    }

    if (body.slides.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least 1 slide is required' },
        { status: 400 }
      );
    }

    // Constraint: Maximum 4 slides only
    if (body.slides.length > 4) {
      return NextResponse.json(
        { success: false, message: 'Maximum 4 slides allowed only' },
        { status: 400 }
      );
    }

    // Validate each slide
    const sanitizedSlides: LoginSlideItem[] = [];
    for (let i = 0; i < body.slides.length; i++) {
      const s = body.slides[i];
      if (!s.image || typeof s.image !== 'string' || !s.image.trim()) {
        return NextResponse.json(
          { success: false, message: `Slide #${i + 1} must have a valid image` },
          { status: 400 }
        );
      }

      const caption = typeof s.caption === 'string' ? s.caption.trim() : '';

      sanitizedSlides.push({
        id: s.id || `slide-${Date.now()}-${i}`,
        image: s.image.trim(),
        caption: caption.slice(0, 200), // Enforce max length to prevent exceeding 3 lines
        isActive: s.isActive !== false,
      });
    }

    const payload: LoginSetupPayload = {
      autoSlideInterval: Math.max(2000, Math.min(15000, Number(body.autoSlideInterval) || 5000)),
      slides: sanitizedSlides,
    };

    const written = writeSetup(payload);
    if (!written) {
      return NextResponse.json(
        { success: false, message: 'Failed to write settings file' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error: any) {
    console.error('Error in login-setup POST handler:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error saving login setup' },
      { status: 500 }
    );
  }
}
