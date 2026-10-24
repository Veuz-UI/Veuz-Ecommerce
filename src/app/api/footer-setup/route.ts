import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface FooterAppDownloadItem {
  id: string;
  name: string;
  subText?: string;
  url: string;
  isVisible: boolean;
}

export interface FooterPaymentMethodItem {
  id: string;
  name: string;
  code: string;
  isVisible: boolean;
  linkUrl?: string;
}

export interface FooterFeatureItem {
  id: string;
  title: string;
  subtitle: string;
  icon: 'pickup' | 'shipping' | 'payment' | 'help' | string;
  isVisible: boolean;
}

export interface FooterSocialLinkItem {
  id: string;
  name: string;
  platform: string;
  url: string;
  isVisible: boolean;
}

export interface FooterLinkItem {
  id: string;
  name: string;
  url: string;
  isVisible: boolean;
}

export interface FooterLinkColumn {
  id: string;
  title: string;
  type: 'navigation' | 'categories' | 'common' | 'support' | 'custom';
  isVisible: boolean;
  links?: FooterLinkItem[];
}

export interface FooterSetupData {
  features?: {
    isVisible: boolean;
    items: FooterFeatureItem[];
  };
  linkColumns?: {
    isVisible: boolean;
    columns: FooterLinkColumn[];
  };
  appDownload: {
    sectionTitle: string;
    isVisible: boolean;
    apps: FooterAppDownloadItem[];
  };
  paymentMethods: {
    sectionTitle: string;
    isVisible: boolean;
    methods: FooterPaymentMethodItem[];
  };
  socialLinks: {
    sectionTitle: string;
    isVisible: boolean;
    links: FooterSocialLinkItem[];
  };
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'footer-setup-store.json');

const DEFAULT_SETUP: FooterSetupData = {
  features: {
    isVisible: true,
    items: [
      {
        id: 'pickup',
        title: 'Free in-store pick up',
        subtitle: '24/7 Amazing services',
        icon: 'pickup',
        isVisible: true,
      },
      {
        id: 'shipping',
        title: 'Free Shipping',
        subtitle: '24/7 Amazing services',
        icon: 'shipping',
        isVisible: true,
      },
      {
        id: 'payment',
        title: 'Flexible Payment',
        subtitle: '24/7 Amazing services',
        icon: 'payment',
        isVisible: true,
      },
      {
        id: 'help',
        title: 'Convenient help',
        subtitle: '24/7 Amazing services',
        icon: 'help',
        isVisible: true,
      },
    ],
  },
  appDownload: {
    sectionTitle: 'Download Our App',
    isVisible: true,
    apps: [
      {
        id: 'app-store',
        name: 'App Store',
        subText: 'Download on the',
        url: 'https://www.apple.com/app-store/',
        isVisible: true,
      },
      {
        id: 'google-play',
        name: 'Google Play',
        subText: 'GET IT ON',
        url: 'https://play.google.com/store',
        isVisible: true,
      },
    ],
  },
  paymentMethods: {
    sectionTitle: 'Payment Method',
    isVisible: true,
    methods: [
      { id: 'tabby', name: 'Tabby', code: 'tabby', isVisible: true, linkUrl: '#' },
      { id: 'tamara', name: 'Tamara', code: 'tamara', isVisible: true, linkUrl: '#' },
      { id: 'visa', name: 'VISA', code: 'visa', isVisible: true, linkUrl: '#' },
      { id: 'mastercard', name: 'Mastercard', code: 'mc', isVisible: true, linkUrl: '#' },
      { id: 'apple-pay', name: 'Apple Pay', code: 'apple-pay', isVisible: true, linkUrl: '#' },
      { id: 'google-pay', name: 'Google Pay', code: 'g-pay', isVisible: true, linkUrl: '#' },
      { id: 'amex', name: 'AMEX', code: 'amex', isVisible: true, linkUrl: '#' },
    ],
  },
  socialLinks: {
    sectionTitle: 'Stay Connected',
    isVisible: true,
    links: [
      { id: 'facebook', name: 'Facebook', platform: 'facebook', url: 'https://facebook.com', isVisible: true },
      { id: 'x', name: 'X (Twitter)', platform: 'x', url: 'https://x.com', isVisible: true },
      { id: 'instagram', name: 'Instagram', platform: 'instagram', url: 'https://instagram.com', isVisible: true },
      { id: 'linkedin', name: 'LinkedIn', platform: 'linkedin', url: 'https://linkedin.com', isVisible: true },
      { id: 'tiktok', name: 'TikTok', platform: 'tiktok', url: 'https://tiktok.com', isVisible: true },
    ],
  },
  linkColumns: {
    isVisible: true,
    columns: [
      { id: 'col-navigation', title: 'Navigation', type: 'navigation', isVisible: true },
      { id: 'col-categories', title: 'Popular Categories', type: 'categories', isVisible: true },
      { id: 'col-common', title: 'Company', type: 'common', isVisible: true },
      { id: 'col-support', title: 'Support & Services', type: 'support', isVisible: true },
    ],
  },
};

function readSetup(): FooterSetupData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.appDownload && parsed.paymentMethods && parsed.socialLinks) {
        return {
          ...parsed,
          features: parsed.features || DEFAULT_SETUP.features,
          linkColumns: parsed.linkColumns || DEFAULT_SETUP.linkColumns,
        };
      }
    }
  } catch (error) {
    console.error('Error reading footer setup file:', error);
  }
  return DEFAULT_SETUP;
}

function writeSetup(data: FooterSetupData): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing footer setup file:', error);
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

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid payload structure.' },
        { status: 400 }
      );
    }

    const current = readSetup();

    const updatedData: FooterSetupData = {
      features: body.features && typeof body.features === 'object' ? {
        isVisible: typeof body.features.isVisible === 'boolean' ? body.features.isVisible : (current.features?.isVisible ?? true),
        items: Array.isArray(body.features.items) ? body.features.items.map((item: any) => ({
          id: String(item.id || ''),
          title: String(item.title || ''),
          subtitle: String(item.subtitle || ''),
          icon: String(item.icon || 'help'),
          isVisible: item.isVisible !== false,
        })) : (current.features?.items || DEFAULT_SETUP.features!.items),
      } : (current.features || DEFAULT_SETUP.features),
      linkColumns: body.linkColumns && typeof body.linkColumns === 'object' ? {
        isVisible: typeof body.linkColumns.isVisible === 'boolean' ? body.linkColumns.isVisible : (current.linkColumns?.isVisible ?? true),
        columns: Array.isArray(body.linkColumns.columns) ? body.linkColumns.columns.map((col: any) => ({
          id: String(col.id || ''),
          title: String(col.title || ''),
          type: col.type || 'navigation',
          isVisible: col.isVisible !== false,
          links: Array.isArray(col.links) ? col.links : undefined,
        })) : (current.linkColumns?.columns || DEFAULT_SETUP.linkColumns!.columns),
      } : (current.linkColumns || DEFAULT_SETUP.linkColumns),
      appDownload: {
        sectionTitle: typeof body.appDownload?.sectionTitle === 'string' ? body.appDownload.sectionTitle : current.appDownload.sectionTitle,
        isVisible: typeof body.appDownload?.isVisible === 'boolean' ? body.appDownload.isVisible : current.appDownload.isVisible,
        apps: Array.isArray(body.appDownload?.apps) ? body.appDownload.apps : current.appDownload.apps,
      },
      paymentMethods: {
        sectionTitle: typeof body.paymentMethods?.sectionTitle === 'string' ? body.paymentMethods.sectionTitle : current.paymentMethods.sectionTitle,
        isVisible: typeof body.paymentMethods?.isVisible === 'boolean' ? body.paymentMethods.isVisible : current.paymentMethods.isVisible,
        methods: Array.isArray(body.paymentMethods?.methods) ? body.paymentMethods.methods : current.paymentMethods.methods,
      },
      socialLinks: {
        sectionTitle: typeof body.socialLinks?.sectionTitle === 'string' ? body.socialLinks.sectionTitle : current.socialLinks.sectionTitle,
        isVisible: typeof body.socialLinks?.isVisible === 'boolean' ? body.socialLinks.isVisible : current.socialLinks.isVisible,
        links: Array.isArray(body.socialLinks?.links) ? body.socialLinks.links : current.socialLinks.links,
      },
    };

    const written = writeSetup(updatedData);

    if (!written) {
      return NextResponse.json(
        { success: false, message: 'Failed to write footer setup data to file.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Footer setup successfully saved.',
      data: updatedData,
    });
  } catch (err: any) {
    console.error('API /api/footer-setup error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

