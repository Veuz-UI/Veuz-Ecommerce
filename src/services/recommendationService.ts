'use client';

import { ProductItem } from '@/data/categoryProductsData';

export const USER_BEHAVIOR_EVENT = 'veuz:user-behavior-updated';

const SEARCH_HISTORY_KEY = 'veuz_user_search_history';
const SEARCH_FREQUENCIES_KEY = 'veuz_search_keyword_frequencies';
const CLICK_HISTORY_KEY = 'veuz_user_clicked_history';
const CART_ADD_HISTORY_KEY = 'veuz_user_cart_add_history';

export interface UserClickRecord {
  id: string | number;
  category?: string;
  title?: string;
  timestamp: number;
}

export interface UserCartAddRecord {
  id: string | number;
  category?: string;
  title?: string;
  timestamp: number;
}

/**
 * Record a search query into user behavior history
 */
export function recordUserSearch(query: string): void {
  if (typeof window === 'undefined' || !query) return;
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return;

  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Remove duplicates and add new search to top (keep last 25)
    list = [clean, ...list.filter((q) => q.toLowerCase() !== clean)].slice(0, 25);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list));

    // Update keyword frequency counters for user-based trending keywords
    try {
      const freqRaw = localStorage.getItem(SEARCH_FREQUENCIES_KEY);
      const freqMap: Record<string, number> = freqRaw ? JSON.parse(freqRaw) : {};
      const words = clean.split(/[\s,–—\-\/()+]+/);
      words.forEach((w) => {
        const cleanW = w.trim().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
        if (cleanW.length >= 2) {
          freqMap[cleanW] = (freqMap[cleanW] || 0) + 1;
        }
      });
      freqMap[clean] = (freqMap[clean] || 0) + 1;
      localStorage.setItem(SEARCH_FREQUENCIES_KEY, JSON.stringify(freqMap));
    } catch (e) {}

    window.dispatchEvent(new CustomEvent(USER_BEHAVIOR_EVENT, { detail: { type: 'search', query: clean } }));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Record a product click / view into user behavior history
 */
export function recordUserProductClick(product: { id: string | number; category?: string; title?: string }): void {
  if (typeof window === 'undefined' || !product || !product.id) return;

  try {
    const raw = localStorage.getItem(CLICK_HISTORY_KEY);
    let list: UserClickRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const normId = String(product.id);
    const newRecord: UserClickRecord = {
      id: normId,
      category: product.category,
      title: product.title,
      timestamp: Date.now(),
    };

    // Filter out previous click of same product to put recent one at top (keep last 35)
    list = [newRecord, ...list.filter((item) => String(item.id) !== normId)].slice(0, 35);
    localStorage.setItem(CLICK_HISTORY_KEY, JSON.stringify(list));

    window.dispatchEvent(new CustomEvent(USER_BEHAVIOR_EVENT, { detail: { type: 'click', product: newRecord } }));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Record an add-to-cart action into user behavior history
 */
export function recordUserCartAddition(product: { id: string | number; category?: string; title?: string }): void {
  if (typeof window === 'undefined' || !product || !product.id) return;

  try {
    const raw = localStorage.getItem(CART_ADD_HISTORY_KEY);
    let list: UserCartAddRecord[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const normId = String(product.id);
    const newRecord: UserCartAddRecord = {
      id: normId,
      category: product.category,
      title: product.title,
      timestamp: Date.now(),
    };

    list = [newRecord, ...list.filter((item) => String(item.id) !== normId)].slice(0, 25);
    localStorage.setItem(CART_ADD_HISTORY_KEY, JSON.stringify(list));

    window.dispatchEvent(new CustomEvent(USER_BEHAVIOR_EVENT, { detail: { type: 'cart_add', product: newRecord } }));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Read current user behavior history from localStorage
 */
export function getUserBehaviorData(): {
  searches: string[];
  clicks: UserClickRecord[];
  cartAdds: UserCartAddRecord[];
} {
  if (typeof window === 'undefined') {
    return { searches: [], clicks: [], cartAdds: [] };
  }

  let searches: string[] = [];
  let clicks: UserClickRecord[] = [];
  let cartAdds: UserCartAddRecord[] = [];

  try {
    const rawSearches = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (rawSearches) searches = JSON.parse(rawSearches);
  } catch (e) {}

  try {
    const rawClicks = localStorage.getItem(CLICK_HISTORY_KEY);
    if (rawClicks) clicks = JSON.parse(rawClicks);
  } catch (e) {}

  try {
    const rawCartAdds = localStorage.getItem(CART_ADD_HISTORY_KEY);
    if (rawCartAdds) cartAdds = JSON.parse(rawCartAdds);
  } catch (e) {}

  return { searches, clicks, cartAdds };
}

/**
 * Intelligent recommendation algorithm based on user search, clicks, wishlist, and cart actions
 */
export function computeRecommendedProducts(
  catalogProducts: ProductItem[],
  userContext: {
    cart?: any[];
    wishlist?: (number | string)[];
  },
  options?: {
    useClientBehavior?: boolean;
  }
): ProductItem[] {
  if (!catalogProducts || catalogProducts.length === 0) return [];

  const activeProducts = catalogProducts.filter((p) => p.isActive !== false && !p.isDraft);
  if (activeProducts.length === 0) return [];

  // Strictly avoid reading client-only storage (localStorage/window) during SSR and initial hydration pass
  const { searches, clicks, cartAdds } = options?.useClientBehavior
    ? getUserBehaviorData()
    : { searches: [], clicks: [], cartAdds: [] };
  const cartItems = options?.useClientBehavior ? (userContext.cart || []) : [];
  const wishlistIds = new Set(
    (options?.useClientBehavior ? (userContext.wishlist || []) : []).map((id) => String(id))
  );

  // Extract cart product IDs, categories, and titles
  const cartProductIds = new Set<string>();
  const cartCategories = new Set<string>();
  const cartKeywords = new Set<string>();

  cartItems.forEach((item) => {
    const prod = item.product || item;
    if (prod && prod.id) {
      cartProductIds.add(String(prod.id));
      const cat = (prod.category || '').toLowerCase().trim();
      if (cat) cartCategories.add(cat);
      const titleWords = (prod.name || prod.title || '').toLowerCase().split(/\s+/);
      titleWords.forEach((w: string) => {
        if (w.length > 3) cartKeywords.add(w);
      });
    }
  });

  // Extract wishlist product categories
  const wishlistCategories = new Set<string>();
  activeProducts.forEach((p) => {
    if (wishlistIds.has(String(p.id))) {
      const cat = (p.category || '').toLowerCase().trim();
      if (cat) wishlistCategories.add(cat);
    }
  });

  // Extract clicked product IDs and categories
  const clickedProductIds = new Set<string>();
  const clickedCategories = new Set<string>();
  clicks.forEach((c) => {
    if (c.id) clickedProductIds.add(String(c.id));
    if (c.category) clickedCategories.add(c.category.toLowerCase().trim());
  });

  // Cart add categories
  cartAdds.forEach((ca) => {
    if (ca.category) cartCategories.add(ca.category.toLowerCase().trim());
  });

  // Pre-process search tokens
  const searchTokens: string[] = [];
  searches.forEach((s) => {
    const words = s.toLowerCase().split(/\s+/);
    words.forEach((w) => {
      const trimmed = w.replace(/[^a-z0-9]/gi, '');
      if (trimmed.length >= 2) searchTokens.push(trimmed);
    });
  });

  const hasAnyUserActivity =
    cartProductIds.size > 0 ||
    wishlistIds.size > 0 ||
    searchTokens.length > 0 ||
    clickedProductIds.size > 0;

  // Score each active product
  const scoredProducts = activeProducts.map((p) => {
    let score = 0;
    const pId = String(p.id);
    const pCat = (p.category || (p as any).categoryName || '').toLowerCase().trim();
    const pTitle = (p.title || '').toLowerCase();
    const pDesc = (p.desc || '').toLowerCase();

    // 1. Cart Behavior (Strong purchase intent & category affinity)
    if (cartProductIds.has(pId)) {
      score += 25; // User showed direct buying intent
    }
    if (pCat && cartCategories.has(pCat)) {
      score += 18; // Cross-sell: products in same category as items in cart
    }
    cartKeywords.forEach((kw) => {
      if (pTitle.includes(kw)) score += 6;
    });

    // 2. Wishlist Behavior (Strong interest & preference)
    if (wishlistIds.has(pId)) {
      score += 22; // User explicitly saved this item
    }
    if (pCat && wishlistCategories.has(pCat)) {
      score += 15; // Category affinity from wishlist
    }

    // 3. User Search Queries (Intent discovery)
    searchTokens.forEach((token, idx) => {
      const recencyWeight = Math.max(1, 4 - Math.floor(idx / 5)); // More recent searches carry higher weight
      if (pCat.includes(token) || token.includes(pCat)) {
        score += 12 * recencyWeight;
      }
      if (pTitle.includes(token)) {
        score += 10 * recencyWeight;
      }
      if (pDesc.includes(token)) {
        score += 5 * recencyWeight;
      }
    });

    // 4. Browsing & Click Behavior (Direct interest)
    if (clickedProductIds.has(pId)) {
      score += 16; // User inspected this product
    }
    if (pCat && clickedCategories.has(pCat)) {
      score += 11; // Category affinity from browsing
    }

    // 5. Global Engagement & Popularity Signals
    const clicksCount = p.clicks || 0;
    const viewsCount = p.views || 0;
    score += Math.min(clicksCount * 0.5, 10);
    score += Math.min(viewsCount * 0.2, 6);

    // Rating & Review weight
    const ratingNum = parseFloat(String(p.rating || '4.5').replace('/5', '')) || 4.5;
    score += ratingNum * 2;

    // Special offers & new arrivals slight bonus
    if (p.isSpecialOffer || p.discount) score += 4;
    if (p.isNewArrival) score += 3;

    return { product: p, score };
  });

  // Sort by recommendation score descending
  scoredProducts.sort((a, b) => b.score - a.score);

  // If user has no activity yet, diversify across top categories
  if (!hasAnyUserActivity) {
    const categoryBuckets = new Map<string, ProductItem[]>();
    activeProducts.forEach((p) => {
      const cat = p.category || 'General';
      if (!categoryBuckets.has(cat)) categoryBuckets.set(cat, []);
      categoryBuckets.get(cat)!.push(p);
    });

    const diverseResult: ProductItem[] = [];
    const catKeys = Array.from(categoryBuckets.keys());
    let maxLen = 0;
    catKeys.forEach((k) => {
      maxLen = Math.max(maxLen, categoryBuckets.get(k)!.length);
    });

    for (let round = 0; round < maxLen; round++) {
      for (const cat of catKeys) {
        const bucket = categoryBuckets.get(cat)!;
        if (round < bucket.length) {
          diverseResult.push(bucket[round]);
          if (diverseResult.length >= 16) break;
        }
      }
      if (diverseResult.length >= 16) break;
    }

    return diverseResult.slice(0, 14);
  }

  // Interleave to avoid having 8 identical category items back-to-back while maintaining top ranks
  const topCandidates = scoredProducts.slice(0, 24);
  const result: ProductItem[] = [];
  const seenIds = new Set<string>();
  const recentCategories: string[] = [];

  for (const item of topCandidates) {
    const id = String(item.product.id);
    const cat = item.product.category || '';
    if (seenIds.has(id)) continue;

    // Check if the last 2 items are already the same category
    if (recentCategories.length >= 2 && recentCategories[recentCategories.length - 1] === cat && recentCategories[recentCategories.length - 2] === cat) {
      // Find the next product from a different category to interleave
      const alternate = topCandidates.find(
        (cand) => !seenIds.has(String(cand.product.id)) && cand.product.category !== cat
      );
      if (alternate) {
        seenIds.add(String(alternate.product.id));
        result.push(alternate.product);
        recentCategories.push(alternate.product.category || '');
      }
    }

    if (!seenIds.has(id)) {
      seenIds.add(id);
      result.push(item.product);
      recentCategories.push(cat);
    }

    if (result.length >= 14) break;
  }

  return result;
}

export interface TrendingKeywordItem {
  tag: string;
  count: number;
  query: string;
}

/**
 * Returns dynamic trending keywords based on user most searched keys (strictly maximum 18 items)
 */
export function getTrendingKeywords(catalogProducts: ProductItem[] = [], max = 18): TrendingKeywordItem[] {
  let freqMap: Record<string, number> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(SEARCH_FREQUENCIES_KEY);
      if (raw) freqMap = JSON.parse(raw);
    } catch (e) {}
  }

  // Realistic baseline safety industry trending terms
  const baselineKeywords: Record<string, { count: number; query: string }> = {
    'helmets': { count: 184, query: 'helmet' },
    'gloves': { count: 142, query: 'gloves' },
    'safety-shoes': { count: 118, query: 'shoes' },
    'goggles': { count: 96, query: 'goggles' },
    'respirator': { count: 85, query: 'respirator' },
    'earplugs': { count: 74, query: 'earplugs' },
    'harness': { count: 68, query: 'harness' },
    'vests': { count: 62, query: 'vest' },
    'boots': { count: 57, query: 'boots' },
    '3m': { count: 52, query: '3m' },
    'face-shield': { count: 48, query: 'face shield' },
    'coverall': { count: 44, query: 'coverall' },
    'protective-eyewear': { count: 39, query: 'eyewear' },
    'welding': { count: 35, query: 'welding' },
    'fire-safety': { count: 31, query: 'fire' },
    'hard-hat': { count: 28, query: 'hard hat' },
    'chemical': { count: 25, query: 'chemical' },
    'masks': { count: 22, query: 'mask' },
  };

  const resultMap = new Map<string, { tag: string; count: number; query: string }>();

  // Initialize with baseline
  Object.entries(baselineKeywords).forEach(([tag, item]) => {
    resultMap.set(tag, { tag, count: item.count, query: item.query });
  });

  // Boost and inject real user search frequencies
  Object.entries(freqMap).forEach(([word, userCount]) => {
    const cleanWord = word.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (cleanWord.length >= 2) {
      const existing = resultMap.get(cleanWord);
      if (existing) {
        existing.count += userCount * 15;
      } else {
        resultMap.set(cleanWord, {
          tag: cleanWord,
          count: 24 + userCount * 12,
          query: word,
        });
      }
    }
  });

  // Also include catalog categories as trending tags
  catalogProducts.forEach((p) => {
    const cat = (p.category || '').toLowerCase().trim();
    if (cat) {
      const tag = cat.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (tag && !resultMap.has(tag)) {
        resultMap.set(tag, {
          tag,
          count: 18 + Math.min(p.clicks || 0, 45),
          query: cat,
        });
      }
    }
  });

  // Sort by count descending and strictly cap at maximum 18
  return Array.from(resultMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, max);
}

export interface TrySearchingItem {
  id: string;
  title: string;
  subtitle: string;
  query: string;
}

/**
 * Returns recommended search topics (strictly maximum 6 items)
 * Adapts based on trending user search keys and catalog products
 */
export function getTrySearchingSuggestions(catalogProducts: ProductItem[] = [], max = 6): TrySearchingItem[] {
  const trending = getTrendingKeywords(catalogProducts, 10);

  const defaultIdeas: TrySearchingItem[] = [
    {
      id: 'helmets',
      title: 'Safety Helmets & Hard Hats',
      subtitle: 'Certified workplace head and high-impact protection',
      query: 'helmet',
    },
    {
      id: 'gloves',
      title: 'Cut & Chemical Resistant Gloves',
      subtitle: 'Heavy-duty tactile grip and hand defense gear',
      query: 'gloves',
    },
    {
      id: 'footwear',
      title: 'Steel Toe Safety Boots',
      subtitle: 'Puncture-resistant and anti-slip industrial footwear',
      query: 'boots',
    },
    {
      id: 'respiratory',
      title: 'N95 Respirators & Dust Masks',
      subtitle: 'Particle filtration and respiratory safety systems',
      query: 'respirator',
    },
    {
      id: 'eyewear',
      title: 'Anti-Fog Protective Goggles',
      subtitle: 'UV shielded and impact-grade eye safety glasses',
      query: 'goggles',
    },
    {
      id: 'fall-protection',
      title: 'Full Body Harnesses & Lanyards',
      subtitle: 'Height fall arrest systems and safety lanyards',
      query: 'harness',
    },
  ];

  // If user has high trending search terms, customize the first cards dynamically
  if (trending.length > 0) {
    const topTrend = trending[0];
    if (topTrend && !defaultIdeas.some((item) => item.query.toLowerCase() === topTrend.query.toLowerCase())) {
      defaultIdeas[0] = {
        id: `trend-${topTrend.tag}`,
        title: topTrend.query.charAt(0).toUpperCase() + topTrend.query.slice(1),
        subtitle: `Trending popular search with ${topTrend.count}+ views`,
        query: topTrend.query,
      };
    }
  }

  return defaultIdeas.slice(0, max);
}
