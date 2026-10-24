'use client';

import { DEFAULT_PROMOTION_AREA, PromotionAreaData, PromotionCardItem } from '@/data/defaultPromotionArea';

const STORAGE_KEY = 'veuz_promotion_area_cache';
export const PROMOTION_AREA_EVENT = 'veuz:promotions-updated';

function sanitizePromotions(items: any[]): PromotionCardItem[] {
  if (!Array.isArray(items)) return [];
  const mapped = items.map((p, idx) => ({
    id: p?.id || `promo-card-${idx + 1}`,
    image: (typeof p?.image === 'string' && !p.image.includes('promo-card-')) ? p.image.trim() : '',
    title: typeof p?.title === 'string' ? p.title.trim() : '',
    link: typeof p?.link === 'string' && p.link.trim() ? p.link.trim() : '/products',
  }));
  while (mapped.length < 4) {
    mapped.push({
      id: `promo-card-${mapped.length + 1}`,
      image: '',
      title: '',
      link: '/products',
    });
  }
  return mapped.slice(0, 4);
}

// Returns synchronous baseline for SSR and initial hydration pass (guaranteeing 0 mismatch)
export function getCachedPromotionArea(): PromotionAreaData {
  return DEFAULT_PROMOTION_AREA;
}

// Client-only cache reader for useEffect
export function getClientCachedPromotionArea(): PromotionAreaData | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.promotions)) {
          const sanitized = sanitizePromotions(parsed.promotions);
          // If all are blank in local cache, fallback to DEFAULT_PROMOTION_AREA
          const hasAny = sanitized.some((p) => Boolean(p.image));
          if (hasAny) {
            return { promotions: sanitized };
          }
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }
  return null;
}

export async function fetchPromotionArea(): Promise<PromotionAreaData> {
  // 1. Try local cache first for instant render
  let cached: PromotionAreaData | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.promotions)) {
          const sanitized = sanitizePromotions(parsed.promotions);
          if (sanitized.some((p) => Boolean(p.image))) {
            cached = { promotions: sanitized };
          }
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }

  // 2. Fetch fresh from API
  try {
    const res = await fetch('/api/promotions', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.promotions)) {
        const sanitized = sanitizePromotions(json.data.promotions);
        const result = { promotions: sanitized };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
        }
        return result;
      }
    }
  } catch (error) {
    console.warn('Could not fetch promotion area from API, using cached/default:', error);
  }

  return cached || DEFAULT_PROMOTION_AREA;
}

export async function savePromotionArea(data: PromotionAreaData): Promise<{ success: boolean; message?: string }> {
  if (!data || !Array.isArray(data.promotions)) {
    return { success: false, message: 'Invalid promotion card payload.' };
  }

  const sanitized = sanitizePromotions(data.promotions);
  const payload: PromotionAreaData = { promotions: sanitized };

  // Update local cache immediately
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(PROMOTION_AREA_EVENT, { detail: payload }));
    } catch (e) {
      console.error('Error writing promotion area cache:', e);
    }
  }

  // Persist to API
  try {
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to save promotion area.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Save promotion area API error:', error);
    return { success: false, message: error.message || 'Network error saving promotion area.' };
  }
}

// Record Customer Click on Promotion Area Card (Strictly CUSTOMER role, excludes Admin, SuperAdmin, and Guests)
export async function recordPromotionClick(promoId: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;

    // 1. Without login user don't count
    const savedUserStr = localStorage.getItem('veuz_user');
    if (!savedUserStr) return;

    let user: any = null;
    try {
      user = JSON.parse(savedUserStr);
    } catch (e) {
      return;
    }

    // 2. Only count logged-in customers (role === 'CUSTOMER'). Exclude admin & superadmin.
    if (!user || user.role !== 'CUSTOMER' || !user.id) {
      return;
    }

    const customerId = user.id;

    fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'record_click',
        promoId,
        customerId,
        userRole: 'CUSTOMER',
      }),
    }).catch(() => {});
  } catch (e) {
    // Silent
  }
}

// Fetch Daily Customer Click Count for Dashboard Stat Card
export async function fetchPromotionDailyClicks(): Promise<{ todayClicks: number; activeBanners: number }> {
  try {
    const res = await fetch('/api/promotions?type=stats', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return {
          todayClicks: typeof json.todayClicks === 'number' ? json.todayClicks : 0,
          activeBanners: typeof json.activeBanners === 'number' ? json.activeBanners : 3,
        };
      }
    }
  } catch (e) {
    // Silent
  }
  return { todayClicks: 0, activeBanners: 3 };
}
