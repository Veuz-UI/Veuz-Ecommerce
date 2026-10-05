'use client';

import { DEFAULT_PARTNERS_DATA, PartnersData, PartnerItem } from '@/data/defaultPartners';

const STORAGE_KEY = 'veuz_partners_cache';
export const PARTNERS_EVENT = 'veuz:partners-updated';

export async function fetchPartners(): Promise<PartnersData> {
  // 1. Try local cache first for instant render
  let cached: PartnersData | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.partners)) {
          cached = parsed;
        }
      }
    } catch (e) {
      // Ignore cache read error
    }
  }

  // 2. Fetch fresh from API
  try {
    const res = await fetch('/api/partners', { cache: 'no-store' });
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
    console.warn('Could not fetch partners from API, using cached/default:', error);
  }

  return cached || DEFAULT_PARTNERS_DATA;
}

export async function savePartners(data: PartnersData): Promise<{ success: boolean; message?: string }> {
  // Update local cache immediately for zero latency
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(PARTNERS_EVENT, { detail: data }));
  }

  try {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to save partners' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error saving partners' };
  }
}
