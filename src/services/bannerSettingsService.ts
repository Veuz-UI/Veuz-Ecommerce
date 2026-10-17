'use client';

import { DEFAULT_BANNER_SETTINGS, BannerSettingsData, MainBannerItem, PromoBannerItem } from '@/data/defaultBannerSettings';

const STORAGE_KEY = 'veuz_banners_cache';
export const BANNER_SETTINGS_EVENT = 'veuz:banners-updated';

// Returns synchronous baseline for SSR and initial hydration pass (guaranteeing 0 mismatch)
export function getCachedBannerSettings(): BannerSettingsData {
  return DEFAULT_BANNER_SETTINGS;
}

// Client-only cache reader for useEffect
export function getClientCachedBannerSettings(): BannerSettingsData | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.mainBanners) && Array.isArray(parsed.promoBanners)) {
          return parsed;
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }
  return null;
}

export async function fetchBannerSettings(): Promise<BannerSettingsData> {
  // 1. Try local cache first for instant render
  let cached: BannerSettingsData | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.mainBanners) && Array.isArray(parsed.promoBanners)) {
          cached = parsed;
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }

  // 2. Fetch fresh from API
  try {
    const res = await fetch('/api/banners', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Could not fetch banner settings from API, using cached/default:', error);
  }

  return cached || DEFAULT_BANNER_SETTINGS;
}

export function normalizeBannerList<T extends { id: string; order: number }>(list: T[]): T[] {
  return [...list]
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
}

export function swapBannerOrder<T extends { id: string; order: number }>(
  list: T[],
  targetId: string,
  newOrder: number
): T[] {
  const currentList = normalizeBannerList(list);
  const targetIndex = currentList.findIndex((item) => item.id === targetId);
  if (targetIndex === -1) {
    return currentList;
  }

  const currentItem = currentList[targetIndex];
  const oldOrder = currentItem.order;
  const targetOrder = Math.max(1, Math.min(newOrder, currentList.length));

  if (oldOrder === targetOrder) {
    return currentList;
  }

  // Find item currently at targetOrder
  const otherIndex = currentList.findIndex(
    (item) => item.id !== targetId && item.order === targetOrder
  );

  if (otherIndex !== -1) {
    // Direct clean swap: conflicting item takes oldOrder, target gets targetOrder
    currentList[otherIndex] = { ...currentList[otherIndex], order: oldOrder };
    currentList[targetIndex] = { ...currentList[targetIndex], order: targetOrder };
  } else {
    currentList[targetIndex] = { ...currentList[targetIndex], order: targetOrder };
  }

  return normalizeBannerList(currentList);
}

export async function saveBannerSettings(data: BannerSettingsData): Promise<{ success: boolean; message?: string }> {
  // Normalize & sort so orders are always 1, 2, 3, ... N with zero duplicates
  const normalizedData: BannerSettingsData = {
    mainBanners: normalizeBannerList(data.mainBanners || []),
    promoBanners: normalizeBannerList(data.promoBanners || []),
  };

  // Enforce 12 banner limits on client
  if (normalizedData.mainBanners.length > 12) {
    return { success: false, message: 'Maximum 12 Main Banners allowed' };
  }
  if (normalizedData.promoBanners.length > 12) {
    return { success: false, message: 'Maximum 12 Promotion Banners allowed' };
  }

  // Update local cache immediately for zero latency
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
    window.dispatchEvent(new CustomEvent(BANNER_SETTINGS_EVENT, { detail: normalizedData }));
  }

  try {
    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to save banners' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error saving banners' };
  }
}
