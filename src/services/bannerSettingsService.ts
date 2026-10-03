'use client';

import { DEFAULT_BANNER_SETTINGS, BannerSettingsData, MainBannerItem, PromoBannerItem } from '@/data/defaultBannerSettings';

const STORAGE_KEY = 'veuz_banners_cache';
export const BANNER_SETTINGS_EVENT = 'veuz:banners-updated';

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

export async function saveBannerSettings(data: BannerSettingsData): Promise<{ success: boolean; message?: string }> {
  // Enforce 12 banner limits on client
  if (data.mainBanners.length > 12) {
    return { success: false, message: 'Maximum 12 Main Banners allowed' };
  }
  if (data.promoBanners.length > 12) {
    return { success: false, message: 'Maximum 12 Promotion Banners allowed' };
  }

  // Update local cache immediately for zero latency
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(BANNER_SETTINGS_EVENT, { detail: data }));
  }

  try {
    const res = await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
