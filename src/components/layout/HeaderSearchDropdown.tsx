'use client';

import React, { useMemo } from 'react';
import { ProductItem } from '@/data/categoryProductsData';
import { ShopCategory } from '@/data/defaultShopSettings';
import { getUserBehaviorData } from '@/services/recommendationService';

interface HeaderSearchDropdownProps {
  isOpen: boolean;
  query: string;
  onClose: () => void;
  onSelectKeyword: (keyword: string) => void;
  onSelectCategory: (categoryName: string) => void;
  onSelectProduct: (productId: string) => void;
  catalogProducts: ProductItem[];
  shopCategories: ShopCategory[];
}

export const HeaderSearchDropdown: React.FC<HeaderSearchDropdownProps> = ({
  isOpen,
  query,
  onClose,
  onSelectKeyword,
  onSelectCategory,
  onSelectProduct,
  catalogProducts,
  shopCategories,
}) => {
  if (!isOpen) return null;

  const trimmedQuery = query.trim().toLowerCase();

  // 1. Build dictionary of all available keywords from every word of all product titles
  const { allKeywords, categoryKeywords } = useMemo(() => {
    const kwMap = new Map<string, { keyword: string; product: ProductItem; count: number }>();
    const stopwords = new Set(['and', 'for', 'with', 'the', 'pro', 'set', 'each', 'all', 'new', 'pcs', 'pack', 'size']);

    catalogProducts.forEach((p) => {
      if (p.isActive === false) return;
      const titleWords = (p.title || '').split(/[\s,–—\-\/()+]+/);
      titleWords.forEach((word) => {
        const clean = word.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
        if (clean.length >= 3) {
          const lower = clean.toLowerCase();
          if (!stopwords.has(lower) && isNaN(Number(lower))) {
            const existing = kwMap.get(lower);
            if (existing) {
              existing.count += 1;
            } else {
              kwMap.set(lower, {
                keyword: clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase(),
                product: p,
                count: 1,
              });
            }
          }
        }
      });
    });

    const activeCats = shopCategories.filter((c) => c.isActive !== false);

    return {
      allKeywords: Array.from(kwMap.values()).sort((a, b) => b.count - a.count),
      categoryKeywords: activeCats,
    };
  }, [catalogProducts, shopCategories]);

  // 2. Compute search suggestions based on current query or initial state
  const { recentSearches, matchingKeywords, matchingCategories, matchingProducts } = useMemo(() => {
    const behavior = getUserBehaviorData();
    const recents = (behavior.searches || []).slice(0, 3);

    if (!trimmedQuery) {
      // "When start": Show popular keywords and categories
      return {
        recentSearches: recents,
        matchingKeywords: allKeywords.slice(0, 5),
        matchingCategories: categoryKeywords.slice(0, 4),
        matchingProducts: catalogProducts.filter((p) => p.isActive !== false).slice(0, 3),
      };
    }

    // Matching Keywords (words from product titles)
    const keywords = allKeywords
      .filter((k) => k.keyword.toLowerCase().includes(trimmedQuery))
      .slice(0, 4);

    // Matching Categories
    const categories = categoryKeywords
      .filter((c) => c.name.toLowerCase().includes(trimmedQuery))
      .slice(0, 3);

    // Matching Products (by title, category, or specifications)
    const products = catalogProducts
      .filter((p) => {
        if (p.isActive === false) return false;
        const titleMatch = (p.title || '').toLowerCase().includes(trimmedQuery);
        const catMatch = (p.category || '').toLowerCase().includes(trimmedQuery);
        return titleMatch || catMatch;
      })
      .slice(0, 5);

    return {
      recentSearches: [],
      matchingKeywords: keywords,
      matchingCategories: categories,
      matchingProducts: products,
    };
  }, [trimmedQuery, allKeywords, categoryKeywords, catalogProducts]);

  const hasAnyResults =
    recentSearches.length > 0 ||
    matchingKeywords.length > 0 ||
    matchingCategories.length > 0 ||
    matchingProducts.length > 0;

  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr) return text;
    const parts = text.split(new RegExp(`(${queryStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === queryStr.toLowerCase() ? (
            <span key={i} style={{ color: '#2563eb', fontWeight: '700' }}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      className="header-live-search-dropdown shadow-lg animate__animated animate__fadeIn"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
        zIndex: 99999,
        maxHeight: '440px',
        overflowY: 'auto',
        padding: '10px 6px',
        textAlign: 'left',
      }}
      onMouseDown={(e) => {
        // Prevent search input from losing focus immediately on click
        e.preventDefault();
      }}
    >
      {!hasAnyResults && (
        <div
          onClick={() => onSelectKeyword(query)}
          className="search-drop-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1',
            margin: '4px',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              borderRadius: '8px',
              backgroundColor: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
              Search for &ldquo;{query}&rdquo;
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              No quick suggestions • Click to see full search results
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb' }}>
            View Results &rarr;
          </span>
        </div>
      )}

      {/* 1. Recent Searches (When starting or matching) */}
      {!trimmedQuery && recentSearches.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '4px 14px' }}>
            Recent Searches
          </div>
          {recentSearches.map((term, idx) => (
            <div
              key={`recent-${idx}`}
              onClick={() => onSelectKeyword(term)}
              className="search-drop-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                  {term}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Search history query
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Available Keywords (Each Word from Product Titles with Product Image) */}
      {matchingKeywords.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '4px 14px' }}>
            {!trimmedQuery ? 'Popular Keywords' : 'Keywords'}
          </div>
          {matchingKeywords.map((item, idx) => {
            const prodImg = item.product.image || (item.product as any).img || '/assets/imgs/theme/placeholder.svg';
            const prodCategory = item.product.category || (item.product as any).categoryName || 'Safety Supplies';
            return (
              <div
                key={`kw-${idx}`}
                onClick={() => onSelectKeyword(item.keyword)}
                className="search-drop-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={prodImg}
                    alt={item.keyword}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                    {highlightMatch(item.keyword, trimmedQuery)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Keyword in {prodCategory}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: '500',
                  }}
                >
                  Search
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Available Categories */}
      {matchingCategories.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '4px 14px' }}>
            Categories
          </div>
          {matchingCategories.map((cat, idx) => {
            const catImg = cat.image && !cat.image.includes('undefined') && cat.image !== '#' ? cat.image : '/assets/imgs/theme/placeholder.svg';
            return (
              <div
                key={`cat-${cat.id || idx}`}
                onClick={() => onSelectCategory(cat.name)}
                className="search-drop-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#eef2ff',
                    border: '1px solid #e0e7ff',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {catImg ? (
                    <img
                      src={catImg}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                    {highlightMatch(cat.name, trimmedQuery)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Safety Category
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#4f46e5',
                    backgroundColor: '#eef2ff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: '600',
                  }}
                >
                  Category
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Matching Products with Thumbnail, Title, and Price */}
      {matchingProducts.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', padding: '4px 14px' }}>
            Products
          </div>
          {matchingProducts.map((prod, idx) => {
            const prodImg = prod.image || (prod as any).img || (prod.images && prod.images[0]) || '/assets/imgs/shop/pr1.jpg';
            return (
              <div
                key={`prod-${prod.id || idx}`}
                onClick={() => onSelectProduct(prod.id)}
                className="search-drop-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={prodImg}
                    alt={prod.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: '600',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {highlightMatch(prod.title, trimmedQuery)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{prod.category || 'Safety Supplies'}</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{prod.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
