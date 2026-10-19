'use client';

export interface LoginSlideItem {
  id: string;
  image: string;
  caption: string;
  isActive?: boolean;
}

export interface LoginSetupData {
  autoSlideInterval: number;
  slides: LoginSlideItem[];
}

const STORAGE_KEY = 'veuz_login_setup_cache';
export const LOGIN_SETUP_EVENT = 'veuz:login-setup-updated';

export const DEFAULT_LOGIN_SETUP: LoginSetupData = {
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

export function getCachedLoginSetup(): LoginSetupData {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          return {
            autoSlideInterval: Number(parsed.autoSlideInterval) || 5000,
            slides: parsed.slides.slice(0, 4),
          };
        }
      }
    } catch (e) {
      // Ignore cache error
    }
  }
  return DEFAULT_LOGIN_SETUP;
}

export async function fetchLoginSetup(): Promise<LoginSetupData> {
  const cached = getCachedLoginSetup();

  try {
    const res = await fetch('/api/login-setup', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const fullData: LoginSetupData = {
          autoSlideInterval: Number(json.data.autoSlideInterval) || 5000,
          slides: Array.isArray(json.data.slides) ? json.data.slides.slice(0, 4) : cached.slides,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
        }
        return fullData;
      }
    }
  } catch (error) {
    console.warn('Could not fetch login setup from API, using cached/default:', error);
  }

  return cached;
}

export async function saveLoginSetup(data: LoginSetupData): Promise<{ success: boolean; message?: string }> {
  if (data.slides.length > 4) {
    return { success: false, message: 'Maximum 4 slides allowed only' };
  }

  if (data.slides.length === 0) {
    return { success: false, message: 'At least 1 slide is required' };
  }

  // Update local cache immediately
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(LOGIN_SETUP_EVENT, { detail: data }));
  }

  try {
    const res = await fetch('/api/login-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to save login setup' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error saving login setup' };
  }
}
