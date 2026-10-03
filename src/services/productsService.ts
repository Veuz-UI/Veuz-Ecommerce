'use client';

import { ProductItem } from '@/data/categoryProductsData';

const STORAGE_KEY = 'veuz_products_cache';
export const PRODUCTS_EVENT = 'veuz:products-updated';

export async function fetchProducts(filter?: string): Promise<ProductItem[]> {
  // 1. Try local cache first for instant render
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!filter) return parsed;
          if (filter === 'new-arrival') {
            return parsed.filter((p: ProductItem) => p.isNewArrival !== false && p.isActive !== false);
          }
          if (filter === 'most-searched') {
            return [...parsed]
              .filter((p: ProductItem) => p.isActive !== false)
              .sort((a: ProductItem, b: ProductItem) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0)));
          }
          if (filter === 'special-offers') {
            return parsed.filter((p: ProductItem) => (p.isSpecialOffer === true || Boolean(p.discount)) && p.isActive !== false);
          }
          return parsed;
        }
      }
    } catch (e) {
      // Ignore cache error
    }
  }

  // 2. Fresh fetch from API
  try {
    const url = filter ? `/api/products?filter=${encodeURIComponent(filter)}` : '/api/products';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (!filter && typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Could not fetch products from API:', error);
  }

  return [];
}

export async function createProduct(product: Partial<ProductItem>): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', product }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to create product' };
    }

    // Refresh full list in cache
    const freshRes = await fetch('/api/products', { cache: 'no-store' });
    if (freshRes.ok) {
      const freshJson = await freshRes.json();
      if (freshJson.success && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshJson.data));
        window.dispatchEvent(new CustomEvent(PRODUCTS_EVENT, { detail: freshJson.data }));
      }
    }

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error creating product' };
  }
}

export async function updateProduct(product: Partial<ProductItem>): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', product }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to update product' };
    }

    // Refresh full list in cache
    const freshRes = await fetch('/api/products', { cache: 'no-store' });
    if (freshRes.ok) {
      const freshJson = await freshRes.json();
      if (freshJson.success && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshJson.data));
        window.dispatchEvent(new CustomEvent(PRODUCTS_EVENT, { detail: freshJson.data }));
      }
    }

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error updating product' };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to delete product' };
    }

    // Refresh full list in cache
    const freshRes = await fetch('/api/products', { cache: 'no-store' });
    if (freshRes.ok) {
      const freshJson = await freshRes.json();
      if (freshJson.success && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshJson.data));
        window.dispatchEvent(new CustomEvent(PRODUCTS_EVENT, { detail: freshJson.data }));
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error deleting product' };
  }
}

export async function toggleProductStatus(id: string): Promise<{ success: boolean; data?: ProductItem; message?: string }> {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_status', id }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.message || 'Failed to toggle product status' };
    }

    // Refresh full list in cache
    const freshRes = await fetch('/api/products', { cache: 'no-store' });
    if (freshRes.ok) {
      const freshJson = await freshRes.json();
      if (freshJson.success && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshJson.data));
        window.dispatchEvent(new CustomEvent(PRODUCTS_EVENT, { detail: freshJson.data }));
      }
    }

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error toggling status' };
  }
}

export async function recordProductClick(id: string): Promise<void> {
  try {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click', id }),
    }).catch(() => {});
  } catch (e) {
    // Silent
  }
}
