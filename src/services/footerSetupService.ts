'use client';

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

const STORAGE_KEY = 'veuz_footer_setup_cache';
export const FOOTER_SETUP_EVENT = 'veuz:footer-setup-updated';

export const DEFAULT_FOOTER_SETUP: FooterSetupData = {
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
      {
        id: 'col-navigation',
        title: 'Navigation',
        type: 'navigation',
        isVisible: true,
      },
      {
        id: 'col-categories',
        title: 'Popular Categories',
        type: 'categories',
        isVisible: true,
      },
      {
        id: 'col-common',
        title: 'Company',
        type: 'common',
        isVisible: true,
      },
      {
        id: 'col-support',
        title: 'Support & Services',
        type: 'support',
        isVisible: true,
      },
    ],
  },
};

export function getCachedFooterSetup(): FooterSetupData {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.appDownload && parsed.paymentMethods && parsed.socialLinks) {
          return {
            ...parsed,
            features: parsed.features || DEFAULT_FOOTER_SETUP.features,
            linkColumns: parsed.linkColumns || DEFAULT_FOOTER_SETUP.linkColumns,
          };
        }
      }
    } catch (e) {
      // Ignore cache parsing error
    }
  }
  return DEFAULT_FOOTER_SETUP;
}

export async function fetchFooterSetup(): Promise<FooterSetupData> {
  const cached = getCachedFooterSetup();

  try {
    const res = await fetch('/api/footer-setup', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          } catch (e) {}
        }
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Could not fetch footer setup from API, using cached/default:', error);
  }

  return cached;
}

export async function saveFooterSetup(data: FooterSetupData): Promise<{ success: boolean; message?: string }> {
  try {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    const res = await fetch('/api/footer-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (json.success) {
      const saved = json.data || data;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        } catch (e) {}
        window.dispatchEvent(new CustomEvent(FOOTER_SETUP_EVENT, { detail: saved }));
      }
      return { success: true, message: json.message || 'Footer setup successfully saved!' };
    }

    return { success: false, message: json.message || 'Failed to save footer setup.' };
  } catch (error: any) {
    console.error('Save footer setup error:', error);
    // Broadcast locally anyway so UI updates immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FOOTER_SETUP_EVENT, { detail: data }));
    }
    return { success: true, message: 'Footer setup saved locally.' };
  }
}
