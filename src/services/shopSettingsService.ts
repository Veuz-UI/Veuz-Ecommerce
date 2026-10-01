'use client';

import { DEFAULT_SHOP_SETTINGS, ShopSettingsData } from '@/data/defaultShopSettings';

const STORAGE_KEY = 'veuz_shop_settings_cache';
export const SHOP_SETTINGS_EVENT = 'veuz:shop-settings-updated';

export async function fetchShopSettings(): Promise<ShopSettingsData> {
  // 1. Try local cache first for instant render
  let cached: ShopSettingsData | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.mainMenu)) {
          cached = parsed;
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }

  // 2. Fetch fresh from API
  try {
    const res = await fetch('/api/shop-settings', { cache: 'no-store' });
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
    console.warn('Could not fetch shop settings from API, using cached/default:', error);
  }

  return cached || DEFAULT_SHOP_SETTINGS;
}

export async function saveShopSettings(data: ShopSettingsData): Promise<{ success: boolean; message?: string }> {
  // Enforce 6 main menu limit on client
  if (data.mainMenu.length > 6) {
    return { success: false, message: 'Maximum 6 main menu items allowed' };
  }

  // Update local cache immediately for zero latency
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(SHOP_SETTINGS_EVENT, { detail: data }));
  }

  try {
    const res = await fetch('/api/shop-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to save settings' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error saving settings' };
  }
}
