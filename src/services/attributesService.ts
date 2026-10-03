import { SystemColor, SYSTEM_COLORS, PRESET_SIZES } from '@/data/categoryProductsData';

export const ATTRIBUTES_EVENT = 'veuz:attributes-updated';

export interface AttributesData {
  colors: SystemColor[];
  sizes: string[];
}

export async function fetchAttributes(): Promise<AttributesData> {
  try {
    const res = await fetch('/api/attributes', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.error('Error fetching attributes:', err);
  }

  return {
    colors: SYSTEM_COLORS,
    sizes: PRESET_SIZES,
  };
}

export async function addCustomColor(name: string, hex: string): Promise<{ success: boolean; data?: AttributesData; message?: string }> {
  try {
    const res = await fetch('/api/attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_color', name, hex }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ATTRIBUTES_EVENT, { detail: json.data }));
      }
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message || 'Failed to add color' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

export async function addCustomSize(size: string): Promise<{ success: boolean; data?: AttributesData; message?: string }> {
  try {
    const res = await fetch('/api/attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_size', size }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ATTRIBUTES_EVENT, { detail: json.data }));
      }
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message || 'Failed to add size' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

export async function deleteCustomColor(name: string): Promise<{ success: boolean; data?: AttributesData; message?: string }> {
  try {
    const res = await fetch('/api/attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_color', name }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ATTRIBUTES_EVENT, { detail: json.data }));
      }
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message || 'Failed to delete color' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

export async function deleteCustomSize(size: string): Promise<{ success: boolean; data?: AttributesData; message?: string }> {
  try {
    const res = await fetch('/api/attributes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_size', size }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(ATTRIBUTES_EVENT, { detail: json.data }));
      }
      return { success: true, data: json.data };
    }
    return { success: false, message: json.message || 'Failed to delete size' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}
