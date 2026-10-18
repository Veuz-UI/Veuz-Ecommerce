'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchShopSettings, getCachedShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { DEFAULT_SHOP_SETTINGS, ShopCategory } from '@/data/defaultShopSettings';
import { fetchProducts, getCachedProducts, recordProductClick, PRODUCTS_EVENT } from '@/services/productsService';
import { ProductItem, SYSTEM_COLORS, PRESET_SIZES, SystemColor } from '@/data/categoryProductsData';
import { fetchAttributes, ATTRIBUTES_EVENT } from '@/services/attributesService';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { ProductCardImageSlider } from '@/components/common/ProductCardImageSlider';
import { getDeliveryBadgeProps } from '@/utils/deliveryBadge';
import { ProductCardSkeleton, CatalogSkeleton } from '@/components/ui/skeletons';

export type CatalogPageMode = 'category' | 'products' | 'offers' | 'limited-offers' | 'most-searched';
type CollectionFilter = 'all' | 'new-arrival' | 'most-searched' | 'special-offers' | 'limited-offers';
type SortOption = 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'discount';

interface ProductsCatalogViewProps {
  pageMode?: CatalogPageMode;
}

// Category matching helper: matches by ID, exact name, normalized slug, singular/plural, or ShopCategory mapping
export function matchesCategory(
  productCategory: string | undefined,
  productCategoryId: string | undefined,
  selectedCategoryOrId: string,
  allCategories?: ShopCategory[]
): boolean {
  if (!selectedCategoryOrId || selectedCategoryOrId === 'all') return true;

  const cleanSel = selectedCategoryOrId.toLowerCase().trim();
  const cleanCat = (productCategory || '').toLowerCase().trim();
  const cleanCatId = (productCategoryId || '').toLowerCase().trim();

  // 1. Direct ID match (e.g. "cat-1" === "cat-1")
  if (cleanCatId && cleanCatId === cleanSel) return true;

  // 2. Exact name match (e.g. "helmet" === "helmet")
  if (cleanCat && cleanCat === cleanSel) return true;

  // 3. Normalized slug comparison (stripping spaces, dashes, underscores)
  const slugSel = cleanSel.replace(/[\s_-]+/g, '');
  const slugCat = cleanCat.replace(/[\s_-]+/g, '');
  if (slugCat && slugSel) {
    if (slugCat === slugSel) return true;
    if (slugCat.includes(slugSel) || slugSel.includes(slugCat)) return true;
  }

  // 4. Singular / Plural word comparison (e.g. "helmets" vs "helmet")
  const singularSel = cleanSel.replace(/s\b/g, '');
  const singularCat = cleanCat.replace(/s\b/g, '');
  if (singularCat && singularSel && (singularCat.includes(singularSel) || singularSel.includes(singularCat))) {
    return true;
  }

  // 5. Lookup in allCategories: If selected matches a known category by ID or name, check product against that category
  if (allCategories && allCategories.length > 0) {
    const matchedCategory = allCategories.find((c) => {
      const cId = c.id.toLowerCase().trim();
      const cName = c.name.toLowerCase().trim();
      const cSlug = cName.replace(/[\s_-]+/g, '');
      return (
        cId === cleanSel ||
        cName === cleanSel ||
        cSlug === slugSel ||
        cName.includes(cleanSel) ||
        cleanSel.includes(cName)
      );
    });

    if (matchedCategory) {
      if (cleanCatId && cleanCatId === matchedCategory.id.toLowerCase().trim()) return true;
      const cName = matchedCategory.name.toLowerCase().trim();
      const cSlug = cName.replace(/[\s_-]+/g, '');
      if (cleanCat === cName || slugCat === cSlug || cleanCat.includes(cName) || cName.includes(cleanCat)) {
        return true;
      }
    }
  }

  return false;
}

const PRODUCT_CARD_COLORS: Record<string, { hex: string; border?: string }> = {
  black: { hex: '#0f172a' },
  white: { hex: '#ffffff', border: '#cbd5e1' },
  blue: { hex: '#2563eb' },
  navy: { hex: '#1e3a8a' },
  red: { hex: '#dc2626' },
  green: { hex: '#16a34a' },
  yellow: { hex: '#facc15' },
  orange: { hex: '#ea580c' },
  gray: { hex: '#64748b' },
  grey: { hex: '#64748b' },
  darkgray: { hex: '#334155' },
  darkgrey: { hex: '#334155' },
  lightgray: { hex: '#e2e8f0', border: '#cbd5e1' },
  lightgrey: { hex: '#e2e8f0', border: '#cbd5e1' },
  beige: { hex: '#e7d8c9' },
  cream: { hex: '#fef3c7', border: '#fde68a' },
  tan: { hex: '#d2b48c' },
  brown: { hex: '#78350f' },
  khaki: { hex: '#c3b091' },
  silver: { hex: '#94a3b8' },
  pink: { hex: '#ec4899' },
  purple: { hex: '#9333ea' },
  teal: { hex: '#0d9488' },
};

function getProductColorInfo(colorName: string): { hex: string; border?: string } {
  if (!colorName) return { hex: '#64748b' };
  const clean = colorName.toLowerCase().replace(/[\s-_]/g, '');
  if (PRODUCT_CARD_COLORS[clean]) return PRODUCT_CARD_COLORS[clean];
  for (const [key, val] of Object.entries(PRODUCT_CARD_COLORS)) {
    if (clean.includes(key)) return val;
  }
  if (colorName.startsWith('#')) {
    return { hex: colorName, border: colorName.toLowerCase() === '#ffffff' ? '#cbd5e1' : undefined };
  }
  return { hex: '#64748b' };
}

interface CatalogProductCardItemProps {
  prod: ProductItem;
  isSidebarOpen: boolean;
  pageMode: CatalogPageMode;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onProductClick: (id: string) => void;
  onAddToCart: (prod: ProductItem, e: React.MouseEvent, selectedColor?: string) => void;
  index?: number;
}

function CatalogProductCardItem({
  prod,
  isSidebarOpen,
  pageMode,
  isWishlisted,
  onToggleWishlist,
  onProductClick,
  onAddToCart,
  index = 0,
}: CatalogProductCardItemProps) {
  const initialColor = Array.isArray(prod.colors) && prod.colors.length > 0 ? prod.colors[0] : '';
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);

  useEffect(() => {
    if (Array.isArray(prod.colors) && prod.colors.length > 0) {
      if (!selectedColor || !prod.colors.some((c: string) => c.toLowerCase() === selectedColor.toLowerCase())) {
        setSelectedColor(prod.colors[0]);
      }
    }
  }, [prod.colors]);

  const hasActiveOffer = prod.isSpecialOffer === true || Boolean(prod.discount) || Boolean(prod.offerEndDate);
  const displayDiscount = prod.discount
    ? (prod.discount.includes('OFF') ? prod.discount : `${prod.discount} OFF`)
    : prod.oldPrice && prod.price
    ? (prod.discount || (prod.offerPercent ? `${prod.offerPercent}% OFF` : ''))
    : '';
  const limitedOfferDaysLeft = prod.offerEndDate
    ? Math.max(0, Math.ceil((new Date(`${prod.offerEndDate}T23:59:59`).getTime() - Date.now()) / 86400000))
    : null;
  const currentPrice = prod.price || (prod.currentPrice ? `${prod.currentPrice} SR` : '');
  const isNewArrivalProduct = !hasActiveOffer && prod.isNewArrival !== false;

  let cardBadge = 'New Arrival';
  if (hasActiveOffer) {
    cardBadge = displayDiscount || 'Special Offer';
  } else if (pageMode === 'products' || prod.isNewArrival !== false) {
    cardBadge = 'New Arrival';
  } else if (prod.badge && prod.badge !== 'Special Offer') {
    cardBadge = prod.badge;
  }

  const baseLink = prod.link && prod.link.includes('?id=') ? prod.link : `/product-details?id=${prod.id}`;
  const productDetailLink = selectedColor
    ? `${baseLink}${baseLink.includes('?') ? '&' : '?'}color=${encodeURIComponent(selectedColor)}`
    : baseLink;

  return (
    <div
      className={`${isSidebarOpen ? 'col-12 col-sm-6 col-md-6 col-lg-4 col-xl-4 d-flex' : 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3 d-flex'} product-card-animate-wrap`}
      style={{
        animationDelay: `${(index % 12) * 0.08}s`,
        transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div className="product-cart-wrap uniform-product-card w-100 d-flex flex-column">
        {/* Image Wrap with Top-Left Badge & Top-Right Circular Eye Button */}
        <div className="product-img-action-wrap position-relative">
          <span className={`ref-card-badge ${hasActiveOffer ? 'ref-card-badge-offer' : isNewArrivalProduct ? 'ref-card-badge-new' : ''}`}>
            {cardBadge}
          </span>

          <Link
            href={productDetailLink}
            className="ref-card-top-view"
            aria-label="View Product Details"
            title="View Product Details"
            onClick={() => onProductClick(prod.id)}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" fill="#334155" />
            </svg>
          </Link>

          <ProductCardImageSlider
            productId={prod.id}
            title={prod.title}
            link={productDetailLink}
            image={prod.image}
            images={prod.images}
            colorImages={prod.colorImages}
            selectedColor={selectedColor}
            onProductClick={onProductClick}
          />
        </div>

        {/* Product Content Wrap */}
        <div className="product-content-wrap d-flex flex-column flex-grow-1 justify-content-between">
          <div>
            {/* Delivery Option & Gender Badges on Top */}
            <div className="d-flex align-items-center gap-1.5 mb-2 flex-wrap">
              {(() => {
                const deliveryProps = getDeliveryBadgeProps(prod.deliveryOptionName);
                return (
                  <span className={deliveryProps.className}>
                    <i className={deliveryProps.icon}></i>
                    {deliveryProps.label}
                  </span>
                );
              })()}
              {prod.gender && (
                <span className="product-gender-badge">
                  {prod.gender}
                </span>
              )}
            </div>

            <h2 className="new-prod-title">
              <Link
                href={productDetailLink}
                onClick={() => onProductClick(prod.id)}
              >
                {prod.title}
              </Link>
            </h2>

            <div className="product-rate d-flex align-items-center mb-2" style={{ gap: '5px' }}>
              <span style={{ color: '#f59e0b', fontSize: '14px', lineHeight: 1 }}>★</span>
              <span className="rating-score fw-bold" style={{ fontSize: '13px', color: '#0f172a' }}>
                {prod.rating ? String(prod.rating).replace('/5', '') : '0.0'}
              </span>
              <span className="rating-reviews" style={{ fontSize: '12.5px', color: '#64748b' }}>
                ({prod.reviews ? String(prod.reviews).replace(/[^0-9]/g, '') || '0' : '0'} reviews)
              </span>
            </div>

            <div className="new-prod-price-box mb-2">
              <div className="d-flex align-items-center" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <span className="new-prod-current-price">
                  {currentPrice}
                </span>
                {hasActiveOffer && prod.oldPrice && (
                  <span className="new-prod-old-price">
                    {prod.oldPrice}
                  </span>
                )}
                {hasActiveOffer && !prod.offerEndDate && (
                  <span className="badge" style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', padding: '4px 7px' }}>OFFER</span>
                )}
                {limitedOfferDaysLeft !== null && (
                  <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontSize: '11px', padding: '4px 7px' }}>
                    {limitedOfferDaysLeft === 0 ? 'Ends Today' : `${limitedOfferDaysLeft} ${limitedOfferDaysLeft === 1 ? 'Day' : 'Days'} Left`}
                  </span>
                )}
                {isNewArrivalProduct && (
                  <span className="badge" style={{ backgroundColor: '#16a34a', color: '#ffffff', fontSize: '11px', padding: '4px 7px' }}>NEW</span>
                )}
              </div>
              <div className="new-prod-vat-label">Inclusive of VAT</div>

              {/* Color Swatches below Price */}
              <div className="new-prod-colors-wrap d-flex align-items-center gap-2" style={{ minHeight: '26px' }}>
                {Array.isArray(prod.colors) && prod.colors.length > 0 ? (
                  prod.colors.map((colorName: string, cIdx: number) => {
                    const colorInfo = getProductColorInfo(colorName);
                    const isSelected = selectedColor
                      ? selectedColor.toLowerCase() === colorName.toLowerCase()
                      : cIdx === 0;

                    return (
                      <button
                        key={`${prod.id}-color-${colorName}-${cIdx}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedColor(colorName);
                        }}
                        title={`Color: ${colorName}`}
                        aria-label={`Select color ${colorName}`}
                        style={{
                          width: '18px',
                          height: '18px',
                          padding: 0,
                          borderRadius: '4px',
                          backgroundColor: colorInfo.hex,
                          border: colorInfo.border ? `1px solid ${colorInfo.border}` : '1px solid rgba(0, 0, 0, 0.15)',
                          boxShadow: isSelected
                            ? '0 0 0 1.5px #ffffff, 0 0 0 2.5px #0f172a'
                            : 'none',
                          display: 'inline-block',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        }}
                      />
                    );
                  })
                ) : (
                  <span style={{ display: 'inline-block', height: '18px', visibility: 'hidden' }}>&nbsp;</span>
                )}
              </div>
            </div>
          </div>

          <div className="product-card-bottom d-flex align-items-center gap-2 mt-auto">
            <button
              type="button"
              className="btn-add-cart-wide"
              onClick={(e) => onAddToCart(prod, e, selectedColor)}
              title="Add to Cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Add to Cart
            </button>
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              className={`btn-wishlist-square ${isWishlisted ? 'active' : ''}`}
              onClick={() => onToggleWishlist(prod.id)}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {isWishlisted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsCatalogContent({ pageMode = 'category' }: ProductsCatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { addToCart, toggleWishlist: storeToggleWishlist, isInWishlist } = useStore();

  const urlCategoryParam = searchParams.get('category') || searchParams.get('selected') || 'all';
  const urlFilterParam = (searchParams.get('filter') || 'all') as CollectionFilter;
  const urlSearchQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState<ShopCategory[]>(() => {
    const cats = getCachedShopSettings().categories || [];
    const active = cats.filter((c) => c.isActive !== false);
    return active.length > 0 ? active : DEFAULT_SHOP_SETTINGS.categories;
  });
  const forceSkeleton = searchParams.get('skeleton') === 'true';
  const [products, setProducts] = useState<ProductItem[]>(() => getCachedProducts());
  const [isLoading, setIsLoading] = useState(forceSkeleton);

  // Filters state
  const [activeCollection, setActiveCollection] = useState<CollectionFilter>(urlFilterParam);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    urlCategoryParam !== 'all' ? [urlCategoryParam] : []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [attributesColors, setAttributesColors] = useState<SystemColor[]>(SYSTEM_COLORS);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(1000);
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Accordion state for filter cards
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    category: true,
    browse: true,
    size: true,
    color: true,
    price: true,
    standard: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // UI state
  const [wishlist, setWishlist] = useState<{ [key: string]: boolean }>({});
  const [isClearClicked, setIsClearClicked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const isInteractingRef = useRef(false);
  const isNormalizingRef = useRef(false);

  // Update collection filter if query param changes
  useEffect(() => {
    if (urlFilterParam) {
      setActiveCollection(urlFilterParam);
    }
  }, [urlFilterParam]);

  useEffect(() => {
    if (urlCategoryParam && urlCategoryParam !== 'all') {
      setSelectedCategories([urlCategoryParam]);
    } else {
      setSelectedCategories([]);
    }
  }, [urlCategoryParam]);

  // Load shop categories & products with real-time listeners
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [shopData, prods, attrs] = await Promise.all([
          fetchShopSettings(),
          fetchProducts(),
          fetchAttributes(),
        ]);

        if (isMounted) {
          if (attrs && Array.isArray(attrs.colors)) {
            setAttributesColors(attrs.colors);
          }
          if (shopData && Array.isArray(shopData.categories)) {
            const activeCats = shopData.categories.filter((c) => c.isActive !== false);
            setCategories(activeCats.length > 0 ? activeCats : DEFAULT_SHOP_SETTINGS.categories);
          }
          if (prods && Array.isArray(prods) && prods.length > 0) {
            setProducts(prods);
            // Calculate max price limit
            const prices = prods.map((p) => Number(p.currentPrice || p.originalPrice || parseFloat(p.price?.replace(/[^\d.]/g, '') || '0')));
            const highest = Math.max(...prices, 500);
            const roundedMax = Math.ceil(highest / 50) * 50;
            setMaxPriceLimit(roundedMax);
            setPriceRange([0, roundedMax]);
          }
        }
      } catch (err) {
        console.warn('Error loading products or categories:', err);
      }
    };

    loadData();

    // Listen to real-time sync events
    const handleCategoryUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail.categories)) {
        const activeCats = customEvt.detail.categories.filter((c: ShopCategory) => c.isActive !== false);
        setCategories(activeCats.length > 0 ? activeCats : DEFAULT_SHOP_SETTINGS.categories);
      } else {
        loadData();
      }
    };

    const handleProductsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setProducts(customEvt.detail);
      } else {
        loadData();
      }
    };

    const handleAttributesUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail.colors)) {
        setAttributesColors(customEvt.detail.colors);
      }
    };

    window.addEventListener(SHOP_SETTINGS_EVENT, handleCategoryUpdate);
    window.addEventListener(PRODUCTS_EVENT, handleProductsUpdate);
    window.addEventListener(ATTRIBUTES_EVENT, handleAttributesUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener(SHOP_SETTINGS_EVENT, handleCategoryUpdate);
      window.removeEventListener(PRODUCTS_EVENT, handleProductsUpdate);
      window.removeEventListener(ATTRIBUTES_EVENT, handleAttributesUpdate);
    };
  }, []);

  // Unified Category List: merges ShopSettings categories with any unique categories found in products
  const displayCategories = useMemo(() => {
    const list: ShopCategory[] = [...categories.filter((c) => c.isActive !== false)];
    const existingNames = new Set(list.map((c) => c.name.toLowerCase().trim()));

    // Also include any distinct product categories not already in shop settings
    products.forEach((p) => {
      if (p.category && !existingNames.has(p.category.toLowerCase().trim())) {
        existingNames.add(p.category.toLowerCase().trim());
        list.push({
          id: p.categoryId || `cat-dyn-${list.length + 1}`,
          name: p.category,
          link: `/products?category=${encodeURIComponent(p.category)}`,
          isActive: true,
        });
      }
    });

    return list;
  }, [categories, products]);

  // ========================================================
  // BASE PRODUCTS SCOPING BASED ON PAGE MODE
  // ========================================================
  const baseScopedProducts = useMemo(() => {
    const active = products.filter((p) => p.isActive !== false);

    if (pageMode === 'offers') {
      return active.filter((p) => !p.offerEndDate && (
        p.isSpecialOffer === true || Boolean(p.discount) || (p.offerPercent && p.offerPercent > 0) || p.badgeClass === 'sale'
      ));
    }

    if (pageMode === 'limited-offers') {
      const today = new Date().toISOString().slice(0, 10);
      return active.filter((p) => p.isSpecialOffer === true && Boolean(p.offerEndDate) && p.offerEndDate! >= today);
    }

    if (pageMode === 'most-searched') {
      const searched = active.filter(
        (p) =>
          (p.clicks || 0) + (p.views || 0) > 0 ||
          p.badgeClass === 'hot' ||
          p.badge === 'Top Searched' ||
          p.badge === 'Best Seller'
      );
      const list = searched.length > 0 ? searched : active;
      return [...list].sort(
        (a, b) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0))
      );
    }

    if (pageMode === 'products') {
      // Focus on New Arrival Products (Strictly NO offers/deals)
      return active.filter(
        (p) =>
          (p.isNewArrival !== false ||
          p.badgeClass === 'new' ||
          p.badge === 'New Arrival' ||
          p.badge === 'In Stock') &&
          !p.discount &&
          !p.offerPercent &&
          !p.isSpecialOffer &&
          (!p.oldPrice || p.oldPrice === p.price)
      );
    }

    // Default: 'category' page shows all products
    return active;
  }, [products, pageMode]);

  // Combined Category Items for Slider
  const categorySliderItems = useMemo(() => {
    const allItem = {
      id: 'all',
      name: 'All Categories',
      isAll: true,
      image: '',
      count: baseScopedProducts.length,
    };

    const catItems = displayCategories.map((cat, idx) => ({
      id: cat.id || `cat-${idx}`,
      name: cat.name,
      isAll: false,
      image: cat.image || '/assets/imgs/theme/icons/category-1.svg',
      count: baseScopedProducts.filter(
        (p) =>
          matchesCategory(p.category, p.categoryId, cat.name, displayCategories) ||
          (cat.id && matchesCategory(p.category, p.categoryId, cat.id, displayCategories))
      ).length,
    }));

    return [allItem, ...catItems];
  }, [displayCategories, baseScopedProducts]);

  // Repeated 3 sets for infinite continuous forward loop (never scrolls backward in reverse)
  const repeatedCategorySliderItems = useMemo(() => {
    if (categorySliderItems.length <= 1) return categorySliderItems.map((item, idx) => ({ ...item, uniqueKey: `s1-${item.id}-${idx}` }));
    return [
      ...categorySliderItems.map((item, idx) => ({ ...item, uniqueKey: `s1-${item.id}-${idx}` })),
      ...categorySliderItems.map((item, idx) => ({ ...item, uniqueKey: `s2-${item.id}-${idx}` })),
      ...categorySliderItems.map((item, idx) => ({ ...item, uniqueKey: `s3-${item.id}-${idx}` })),
    ];
  }, [categorySliderItems]);

  const isButtonNavigatingRef = useRef(false);

  // Scroll Slider via Left / Right Arrow Buttons (Smooth continuous forward loop - NEVER reverses)
  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const card = container.querySelector('.category-pill-card') as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 12 : 217;
    const step = cardWidth * 2; // Smoothly slide 2 cards at a time
    const setWidth = container.scrollWidth / 3;

    if (setWidth <= 0) return;

    isButtonNavigatingRef.current = true;

    if (direction === 'right') {
      // If reaching beyond set 2, seamlessly wrap to set 1 without visual interruption
      if (container.scrollLeft >= setWidth * 2 - step) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft -= setWidth;
        void container.offsetWidth;
      }
      container.style.scrollBehavior = 'smooth';
      container.scrollBy({ left: step, behavior: 'smooth' });
    } else {
      // If near start of set 1, seamlessly jump to set 2 before scrolling backward
      if (container.scrollLeft < step) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft += setWidth;
        void container.offsetWidth;
      }
      container.style.scrollBehavior = 'smooth';
      container.scrollBy({ left: -step, behavior: 'smooth' });
    }

    setTimeout(() => {
      isButtonNavigatingRef.current = false;
    }, 450);
  };

  // Smoothly center the active category pill into view if selected on load
  useEffect(() => {
    if (selectedCategories.length === 1 && sliderRef.current) {
      const activePill = sliderRef.current.querySelector('.active-cat-pill') as HTMLElement | null;
      if (activePill) {
        activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedCategories]);

  // Global mouseup listener for slider drag cleanup
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        if (sliderRef.current) {
          sliderRef.current.style.scrollBehavior = 'smooth';
          sliderRef.current.style.cursor = 'grab';
        }
        setTimeout(() => {
          dragDistanceRef.current = 0;
          isInteractingRef.current = false;
        }, 1500);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Draggable top slider handlers (Smooth dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current || e.button !== 0) return;
    isInteractingRef.current = true;
    isMouseDownRef.current = true;
    dragDistanceRef.current = 0;
    startXRef.current = e.pageX;
    scrollStartRef.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.scrollBehavior = 'auto';
    sliderRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !sliderRef.current) return;
    const distance = e.pageX - startXRef.current;
    dragDistanceRef.current = Math.abs(distance);
    sliderRef.current.scrollLeft = scrollStartRef.current - distance;
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      if (sliderRef.current) {
        sliderRef.current.style.scrollBehavior = 'smooth';
        sliderRef.current.style.cursor = 'grab';
      }
      setTimeout(() => {
        dragDistanceRef.current = 0;
        isInteractingRef.current = false;
      }, 1500);
    }
  };

  // Touch handlers for mobile / tablet swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    isInteractingRef.current = true;
    isMouseDownRef.current = true;
    dragDistanceRef.current = 0;
    startXRef.current = e.touches[0].pageX;
    scrollStartRef.current = sliderRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDownRef.current || !sliderRef.current) return;
    const distance = e.touches[0].pageX - startXRef.current;
    dragDistanceRef.current = Math.abs(distance);
  };

  const handleTouchEnd = () => {
    isMouseDownRef.current = false;
    setTimeout(() => {
      dragDistanceRef.current = 0;
      isInteractingRef.current = false;
    }, 2000);
  };

  // Category Selection from Slider
  const handleCategorySelectFromSlider = (catName: string, catId?: string) => {
    if (dragDistanceRef.current > 10) {
      return;
    }
    if (catName === 'all') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories((prev) => {
        const isCurrent = prev.some((sel) =>
          matchesCategory(catName, catId, sel, displayCategories)
        );
        return isCurrent ? [] : [catName];
      });
    }
  };

  // Category toggle for sidebar (support multi-select or single-click toggle)
  const handleToggleCategory = (catName: string, catId?: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((sel) =>
        matchesCategory(catName, catId, sel, displayCategories)
      );
      if (exists) {
        return prev.filter(
          (sel) => !matchesCategory(catName, catId, sel, displayCategories)
        );
      } else {
        return [...prev, catName];
      }
    });
  };

  // Size toggle for sidebar
  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Color toggle for sidebar
  const handleToggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  // Reset all filters ("Clear all")
  const handleClearAllFilters = () => {
    setIsClearClicked(true);
    setTimeout(() => {
      setIsClearClicked(false);
    }, 400);

    setActiveCollection('all');
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, maxPriceLimit]);
    setSelectedStandard('all');
    setSortBy('newest');
  };

  // Toggle Wishlist
  const toggleWishlist = (productId: string) => {
    if (!user) {
      showToast('warning', 'Please sign in to save items to your wishlist.');
      router.push('/login?redirect=/wishlist');
      return;
    }
    const numId = Number(productId.replace(/[^\d]/g, '')) || 1;
    const isW = isInWishlist(numId);
    storeToggleWishlist(numId);
    showToast(isW ? 'info' : 'success', isW ? 'Removed from wishlist.' : 'Added to your wishlist!');
  };

  // Add to Cart
  const handleAddToCart = (product: ProductItem, e: React.MouseEvent, selectedColor?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rawPrice = product.currentPrice || product.price;
    const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '129').replace(/[^\d.]/g, '')) || 129;
    const idNum = Number(product.id.replace(/[^\d]/g, '')) || Math.floor(Math.random() * 100000) + 1;
    const cartProduct: any = {
      id: idNum,
      name: product.title,
      price: numPrice > 0 ? numPrice : 129,
      image: product.image || (product.images && product.images[0]) || '/assets/imgs/theme/placeholder.svg',
      category: product.category || 'Safety Equipment',
    };
    const chosenColor = selectedColor || (Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : undefined);
    const chosenSize = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : undefined;
    addToCart(cartProduct, 1, chosenColor, chosenSize);
  };



  // Available standards extracted from scoped products
  const availableStandards = useMemo(() => {
    const set = new Set<string>();
    baseScopedProducts.forEach((p) => {
      if (p.standard) {
        set.add(p.standard.trim());
      }
    });
    if (set.size === 0) {
      return ['EN 397 Certified', 'EN 166 1F', 'ANSI Z87.1', 'EN 388:2016', 'EN ISO 20471', 'EN 352-1'];
    }
    return Array.from(set);
  }, [baseScopedProducts]);

  // Available sizes extracted from scoped products + standard presets
  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    baseScopedProducts.forEach((p) => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach((s) => set.add(s));
      }
    });
    return Array.from(new Set([...PRESET_SIZES, ...Array.from(set)]));
  }, [baseScopedProducts]);

  // Available colors
  const availableColors = useMemo(() => {
    const map = new Map<string, SystemColor>();

    // 1. Strict 5 System Default Colors
    SYSTEM_COLORS.forEach((col) => {
      map.set(col.name.toLowerCase().trim(), col);
    });

    // 2. Additional custom colors created from Dashboard
    if (Array.isArray(attributesColors)) {
      attributesColors.forEach((col) => {
        if (col && col.name) {
          const key = col.name.toLowerCase().trim();
          if (!map.has(key)) {
            map.set(key, col);
          }
        }
      });
    }

    return Array.from(map.values());
  }, [attributesColors]);

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...baseScopedProducts];

    // Optional URL search query filter (?q=...)
    if (urlSearchQuery) {
      const q = urlSearchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.desc?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.standard?.toLowerCase().includes(q)
      );
    }

    // 1. Collection filter inside page mode
    if (activeCollection === 'new-arrival') {
      result = result.filter(
        (p) =>
          (p.isNewArrival !== false || p.badgeClass === 'new') &&
          !p.discount &&
          !p.offerPercent &&
          !p.isSpecialOffer &&
          (!p.oldPrice || p.oldPrice === p.price)
      );
    } else if (activeCollection === 'most-searched') {
      result = result.filter(
        (p) =>
          p.isMostSearched === true ||
          (p.clicks || 0) + (p.views || 0) > 0 ||
          p.badgeClass === 'hot' ||
          p.badge === 'Top Searched' ||
          p.badge === 'Best Seller'
      );
      result.sort((a, b) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0)));
    } else if (activeCollection === 'special-offers') {
      result = result.filter((p) => !p.offerEndDate && (
        p.isSpecialOffer === true || Boolean(p.discount) || (p.offerPercent && p.offerPercent > 0) ||
        (Boolean(p.oldPrice) && p.oldPrice !== p.price)
      ));
    } else if (activeCollection === 'limited-offers') {
      const today = new Date().toISOString().slice(0, 10);
      result = result.filter((p) => p.isSpecialOffer === true && Boolean(p.offerEndDate) && p.offerEndDate! >= today);
    }

    // 2. Category filter (multiple selection)
    if (selectedCategories.length > 0) {
      result = result.filter((p) =>
        selectedCategories.some((sel) =>
          matchesCategory(p.category, p.categoryId, sel, displayCategories)
        )
      );
    }

    // 3. Size Filter
    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        if (!p.sizes || p.sizes.length === 0) return false;
        return selectedSizes.some((sz) => p.sizes?.includes(sz));
      });
    }

    // 4. Color Filter
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        if (!p.colors || p.colors.length === 0) return false;
        return selectedColors.some((col) =>
          p.colors?.some((c) => {
            const cLow = c.toLowerCase().trim();
            const colLow = col.toLowerCase().trim();
            return cLow === colLow || cLow.includes(colLow) || colLow.includes(cLow);
          })
        );
      });
    }

    // 5. Price Range Filter
    result = result.filter((p) => {
      const pNum = Number(p.currentPrice || parseFloat(p.price?.replace(/[^\d.]/g, '') || '0'));
      return pNum >= priceRange[0] && pNum <= priceRange[1];
    });

    // 6. Standard / Certification Filter
    if (selectedStandard !== 'all') {
      result = result.filter((p) => p.standard?.toLowerCase().includes(selectedStandard.toLowerCase()));
    }

    // 7. Sorting
    result = [...result].sort((a, b) => {
      const priceA = Number(a.currentPrice || parseFloat(a.price?.replace(/[^\d.]/g, '') || '0'));
      const priceB = Number(b.currentPrice || parseFloat(b.price?.replace(/[^\d.]/g, '') || '0'));

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'popular') return ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0));
      if (sortBy === 'discount') return (b.offerPercent || 0) - (a.offerPercent || 0);

      // Default: 'newest' (Newly added shows first)
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [baseScopedProducts, urlSearchQuery, activeCollection, selectedCategories, selectedSizes, selectedColors, priceRange, selectedStandard, sortBy, displayCategories]);

  // Is filter currently active?
  const isAnyFilterActive =
    activeCollection !== 'all' ||
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPriceLimit ||
    selectedStandard !== 'all';

  // Breadcrumbs text and link
  const breadcrumbInfo = useMemo(() => {
    if (pageMode === 'offers') {
      return { label: 'Offer Products', link: '/offer-products' };
    }
    if (pageMode === 'limited-offers') return { label: 'Limited Offers', link: '/limited-offers' };
    if (pageMode === 'most-searched') {
      return { label: 'Most Searched Products', link: '/most-searched-products' };
    }
    if (pageMode === 'products') {
      return { label: 'New Arrival Products', link: '/new-arrival-products' };
    }
    return { label: 'All Categories Products', link: '/all-categories-products' };
  }, [pageMode]);

  // Section title calculation
  const pageTitle = useMemo(() => {
    if (selectedCategories.length === 1) {
      const match = displayCategories.find((c) =>
        matchesCategory(c.name, c.id, selectedCategories[0], displayCategories)
      );
      return match ? match.name : selectedCategories[0];
    }
    if (selectedCategories.length > 1) {
      return `${selectedCategories.length} Categories Selected`;
    }
    if (pageMode === 'offers') {
      return 'Offer Products';
    }
    if (pageMode === 'limited-offers') return 'Limited Offers';
    if (pageMode === 'most-searched') {
      return 'Most Searched Products';
    }
    if (pageMode === 'products') {
      return 'New Arrival Products';
    }
    // category mode
    if (activeCollection === 'new-arrival') return 'New Arrival Products';
    if (activeCollection === 'most-searched') return 'Most Searched Products';
    if (activeCollection === 'special-offers') return 'Offer Products';
    return 'All Categories Products';
  }, [pageMode, activeCollection, selectedCategories, displayCategories]);

  // Page description calculation
  const pageDescription = useMemo(() => {
    if (pageMode === 'offers') {
      return `Exclusive discounted promotions and limited-time certified safety gear offers (${filteredAndSortedProducts.length} items).`;
    }
    if (pageMode === 'limited-offers') return `Time-limited discounted safety products (${filteredAndSortedProducts.length} items).`;
    if (pageMode === 'most-searched') {
      return `Top-viewed certified industrial safety equipment and high-demand protective gear based on customer queries (${filteredAndSortedProducts.length} items).`;
    }
    if (pageMode === 'products') {
      return `Showing newly released industrial protective equipment and certified safety gear (${filteredAndSortedProducts.length} items).`;
    }
    return `Showing certified industrial safety equipment adhering to OSHA, EN, and ANSI standards (${filteredAndSortedProducts.length} items).`;
  }, [pageMode, filteredAndSortedProducts.length]);

  return (
    <main className="main py-4 py-md-5" style={{ backgroundColor: '#ffffff', minHeight: '85vh' }}>
      <div className="container">
        {/* ========================================================
            1. BREADCRUMBS & SECTION TITLE
           ======================================================== */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div>
            <div className="d-flex align-items-center text-muted fs-13 mb-2" style={{ gap: '8px' }}>
              <Link href="/" className="text-muted text-decoration-none hover-green">
                Home
              </Link>
              <span>/</span>
              <Link href={breadcrumbInfo.link} className="text-muted text-decoration-none hover-green">
                {breadcrumbInfo.label}
              </Link>
              {selectedCategories.length === 1 && (
                <>
                  <span>/</span>
                  <span className="text-dark fw-bold text-capitalize">
                    {selectedCategories[0]}
                  </span>
                </>
              )}
            </div>
            <h1 className="fw-bold text-dark mb-1 catalog-page-title" style={{ letterSpacing: '-0.5px' }}>
              {pageTitle}
            </h1>
            <p className="text-muted fs-14 mb-0 catalog-page-desc">
              {pageDescription}
            </p>
          </div>
        </div>

        {/* ========================================================
            2. TOP CATEGORIES HORIZONTAL SLIDER (Left & Right Arrows + Centered Categories)
           ======================================================== */}
        {/* ========================================================
            2. TOP CATEGORIES HORIZONTAL SLIDER (Left & Right Arrows + Centered Categories)
           ======================================================== */}
        <div className="card border-0 mb-4 overflow-hidden category-slider-card-wrap">
          <div
            className="d-flex align-items-center w-100 position-relative"
            style={{ gap: '12px' }}
          >
            {/* Left arrow button */}
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              className="btn-category-slider-arrow flex-shrink-0"
              aria-label="Previous Categories"
              title="Previous Categories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {/* Draggable & Touch-Scrollable Category Slider Track */}
            <div
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="category-slider-track flex-grow-1"
            >
              {repeatedCategorySliderItems.map((item) => {
                const isSelected = item.isAll
                  ? selectedCategories.length === 0
                  : selectedCategories.some((c) =>
                      matchesCategory(item.name, item.id, c, displayCategories)
                    );

                return (
                  <div
                    key={item.uniqueKey}
                    onClick={() => {
                      if (dragDistanceRef.current < 6) {
                        handleCategorySelectFromSlider(item.isAll ? 'all' : item.name, item.id);
                      }
                    }}
                    className={`category-pill-card ${isSelected ? 'active-cat-pill' : ''}`}
                  >
                    <div
                      className="category-icon-box border overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: '42px',
                        height: '42px',
                        minWidth: '42px',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                        borderColor: isSelected ? '#86efac' : '#e9e9e9',
                        pointerEvents: 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.isAll ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      ) : (
                        <img
                          src={item.image || '/assets/imgs/theme/icons/category-1.svg'}
                          alt={item.name}
                          style={{
                            width: '28px',
                            height: '28px',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/imgs/theme/icons/category-1.svg';
                          }}
                        />
                      )}
                    </div>
                    <div className="overflow-hidden" style={{ pointerEvents: 'none' }}>
                      <div
                        className="category-pill-title fw-bold fs-14 text-truncate"
                        style={{ color: isSelected ? '#16a34a' : '#0f172a' }}
                      >
                        {item.name}
                      </div>
                      <div className="category-pill-count text-muted fs-12">{item.count} Products</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right arrow button */}
            <button
              type="button"
              onClick={() => scrollSlider('right')}
              className="btn-category-slider-arrow flex-shrink-0"
              aria-label="Next Categories"
              title="Next Categories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* ========================================================
            3. MAIN CATALOG LAYOUT (Left Sticky Sidebar + Right Grid)
           ======================================================== */}
        <div
          className="d-flex flex-column flex-lg-row pt-2 position-relative"
          style={{
            gap: isSidebarOpen ? '28px' : '0px',
            transition: 'gap 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            alignItems: 'flex-start',
          }}
        >
          {/* --------------------------------------------------------
              LEFT SIDEBAR: FILTERS (Sticky on Scroll & Smoothly Collapsible)
             -------------------------------------------------------- */}
          <aside
            className="filter-sidebar-wrapper"
            style={{
              flex: isSidebarOpen ? '0 0 300px' : '0 0 0px',
              width: isSidebarOpen ? '300px' : '0px',
              maxWidth: isSidebarOpen ? '300px' : '0px',
              opacity: isSidebarOpen ? 1 : 0,
              transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
              overflow: isSidebarOpen ? 'visible' : 'hidden',
              visibility: isSidebarOpen ? 'visible' : 'hidden',
              pointerEvents: isSidebarOpen ? 'auto' : 'none',
              alignSelf: 'flex-start',
              position: 'sticky',
              top: '24px',
              zIndex: 20,
            }}
          >
            <div
              className="filters-sidebar"
              style={{
                width: '300px',
                paddingBottom: '24px',
              }}
            >
              {/* Top Header Card: Filters Title + Clear All Button + Collapse Button */}
              <div
                className="d-flex align-items-center justify-content-between mb-3 bg-white rounded-3 border"
                style={{
                  padding: '14px 16px',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span style={{ fontSize: '15.5px', fontWeight: 700, color: '#0f172a' }}>Filters</span>
                  {isAnyFilterActive && (
                    <span
                      className="badge rounded-pill bg-dark text-white"
                      style={{ fontSize: '10.5px', padding: '3px 7px', fontWeight: 600 }}
                    >
                      Active
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                  {isAnyFilterActive && <button
                    type="button"
                    onClick={handleClearAllFilters}
                    style={{
                      height: '34px',
                      width: '34px',
                      padding: 0,
                      borderRadius: '7px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: '1px solid #b91c1c',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.28)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                    title="Clear all filters"
                    aria-label="Clear all filters"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                  </button>}
                  <button type="button" onClick={() => setIsSidebarOpen(false)} title="Close filters" aria-label="Close filters" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>

                </div>
              </div>

              {/* Card 1: Browse Section (Only visible on Category page; hidden on Products and Offer pages) */}
              {pageMode === 'category' && (
                <div className="filter-card-container">
                  <div
                    className={`filter-card-header ${openSections.browse ? 'is-open' : ''}`}
                    onClick={() => toggleSection('browse')}
                  >
                    <span className="filter-card-title">Browse Section</span>
                    <div className="d-flex align-items-center gap-2">
                      {activeCollection !== 'all' && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCollection('all');
                          }}
                          style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Reset
                        </span>
                      )}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: openSections.browse ? 'rotate(0deg)' : 'rotate(180deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </div>
                  </div>
                  {openSections.browse && (
                    <div className="filter-card-body d-flex flex-column gap-2">
                      {[
                        { key: 'all', label: 'All Products', count: products.filter((p) => p.isActive !== false).length, href: '/products' },
                        { key: 'new-arrival', label: 'New Arrival', count: products.filter((p) => p.isActive !== false && p.isNewArrival !== false && !p.isSpecialOffer).length, href: '/products?filter=new-arrival' },
                        { key: 'most-searched', label: 'Most Searched / Viewed', count: products.filter((p) => p.isActive !== false && ((p.clicks || 0) + (p.views || 0) > 0 || p.badgeClass === 'hot')).length, href: '/products?filter=most-searched' },
                        { key: 'special-offers', label: 'Special Offers', count: products.filter((p) => p.isActive !== false && (p.isSpecialOffer === true || Boolean(p.discount)) && !p.offerEndDate).length, href: '/products?filter=special-offers', isSpecial: true },
                        { key: 'limited-offers', label: 'Limited Offers', count: products.filter((p) => p.isActive !== false && p.isSpecialOffer === true && Boolean(p.offerEndDate)).length, href: '/products?filter=limited-offers', isSpecial: true },
                      ].map((item) => {
                        const isActive = activeCollection === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => router.push(item.href)}
                            className={`filter-browse-item ${isActive ? 'active' : ''}`}
                          >
                            <div className="d-flex align-items-center gap-2.5">
                              <span
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  border: isActive ? '4.5px solid #0f172a' : '1.5px solid #cbd5e1',
                                  backgroundColor: '#ffffff',
                                  display: 'inline-block',
                                  flexShrink: 0,
                                  transition: 'all 0.15s ease',
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: isActive ? 600 : 500,
                                  color: isActive ? '#0f172a' : '#475569',
                                }}
                              >
                                {item.label}
                              </span>
                            </div>
                            <span
                              className={`rounded-pill px-2 py-0.5 ${
                                item.isSpecial
                                  ? 'bg-danger-subtle text-danger fw-bold'
                                  : isActive
                                  ? 'bg-dark text-white fw-semibold'
                                  : 'bg-light text-muted'
                              }`}
                              style={{ fontSize: '11px', minWidth: '26px', textAlign: 'center' }}
                            >
                              {item.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Card 2: Category Filter */}
              <div className="filter-card-container">
                <div
                  className={`filter-card-header ${openSections.category ? 'is-open' : ''}`}
                  onClick={() => toggleSection('category')}
                >
                  <span className="filter-card-title">Category</span>
                  <div className="d-flex align-items-center gap-2">
                    {selectedCategories.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategories([]);
                        }}
                        style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Reset
                      </span>
                    )}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: openSections.category ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </div>
                </div>
                {openSections.category && (
                  <div className="filter-card-body d-flex flex-column gap-1" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {displayCategories.map((cat) => {
                      const isSelected = selectedCategories.some((c) =>
                        matchesCategory(cat.name, cat.id, c, displayCategories)
                      );
                      const count = baseScopedProducts.filter((p) =>
                        matchesCategory(p.category, p.categoryId, cat.name, displayCategories) ||
                        (cat.id && matchesCategory(p.category, p.categoryId, cat.id, displayCategories))
                      ).length;

                      return (
                        <div
                          key={cat.id || cat.name}
                          onClick={() => handleToggleCategory(cat.name, cat.id)}
                          className="d-flex align-items-center justify-content-between p-2 rounded-2"
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{
                                cursor: 'pointer',
                                accentColor: '#16a34a',
                                width: '15px',
                                height: '15px',
                              }}
                            />
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: isSelected ? 600 : 500,
                                color: isSelected ? '#16a34a' : '#334155',
                              }}
                            >
                              {cat.name}
                            </span>
                          </div>
                          <span
                            className="badge rounded-pill"
                            style={{
                              fontSize: '11px',
                              backgroundColor: isSelected ? '#dcfce7' : '#f1f5f9',
                              color: isSelected ? '#16a34a' : '#64748b',
                              fontWeight: 600,
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card 3: Size Filter */}
              <div className="filter-card-container">
                <div
                  className={`filter-card-header ${openSections.size ? 'is-open' : ''}`}
                  onClick={() => toggleSection('size')}
                >
                  <span className="filter-card-title">Size</span>
                  <div className="d-flex align-items-center gap-2">
                    {selectedSizes.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSizes([]);
                        }}
                        style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Reset
                      </span>
                    )}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: openSections.size ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </div>
                </div>
                {openSections.size && (
                  <div className="filter-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {availableSizes.map((size) => {
                        const isSelected = selectedSizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleToggleSize(size)}
                            className={`filter-size-pill ${isSelected ? 'active' : ''}`}
                            title={`Filter by size ${size}`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Color Filter */}
              <div className="filter-card-container">
                <div
                  className={`filter-card-header ${openSections.color ? 'is-open' : ''}`}
                  onClick={() => toggleSection('color')}
                >
                  <span className="filter-card-title">Color</span>
                  <div className="d-flex align-items-center gap-2">
                    {selectedColors.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColors([]);
                        }}
                        style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Reset
                      </span>
                    )}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: openSections.color ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </div>
                </div>
                {openSections.color && (
                  <div className="filter-card-body">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      {availableColors.map((color) => {
                        const isSelected = selectedColors.includes(color.name);
                        return (
                          <div
                            key={color.name}
                            onClick={() => handleToggleColor(color.name)}
                            className={`filter-color-dot ${isSelected ? 'active' : ''}`}
                            style={{
                              backgroundColor: color.hex,
                              border: color.border ? `1px solid ${color.border}` : '1px solid transparent',
                            }}
                            title={color.name}
                          >
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color.hex.toLowerCase() === '#ffffff' ? '#0f172a' : '#ffffff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Price Filter */}
              <div className="filter-card-container">
                <div
                  className={`filter-card-header ${openSections.price ? 'is-open' : ''}`}
                  onClick={() => toggleSection('price')}
                >
                  <span className="filter-card-title">Price</span>
                  <div className="d-flex align-items-center gap-2">
                    {(priceRange[0] > 0 || priceRange[1] < maxPriceLimit) && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setPriceRange([0, maxPriceLimit]);
                        }}
                        style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Reset
                      </span>
                    )}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: openSections.price ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </div>
                </div>
                {openSections.price && (
                  <div className="filter-card-body">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>Range</span>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                        {priceRange[0]} SR — {priceRange[1]} SR
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={maxPriceLimit}
                      step={10}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="form-range w-100"
                      style={{ accentColor: '#16a34a' }}
                    />
                    <div className="d-flex align-items-center justify-content-between mt-2 pt-1">
                      <div className="border rounded-2 px-2 py-1 bg-white text-center" style={{ width: '46%' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Min (SR)</span>
                        <input
                          type="number"
                          value={priceRange[0]}
                          onChange={(e) => setPriceRange([Math.max(0, Number(e.target.value)), priceRange[1]])}
                          className="border-0 p-0 text-center w-100 fw-bold fs-13 text-dark"
                          style={{ outline: 'none' }}
                        />
                      </div>
                      <span className="text-muted fs-12">-</span>
                      <div className="border rounded-2 px-2 py-1 bg-white text-center" style={{ width: '46%' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Max (SR)</span>
                        <input
                          type="number"
                          value={priceRange[1]}
                          onChange={(e) => setPriceRange([priceRange[0], Math.min(maxPriceLimit, Number(e.target.value))])}
                          className="border-0 p-0 text-center w-100 fw-bold fs-13 text-dark"
                          style={{ outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 5: Certifications / Standards Filter */}
              {availableStandards.length > 0 && (
                <div className="filter-card-container">
                  <div
                    className={`filter-card-header ${openSections.standard ? 'is-open' : ''}`}
                    onClick={() => toggleSection('standard')}
                  >
                    <span className="filter-card-title">Certifications & Standards</span>
                    <div className="d-flex align-items-center gap-2">
                      {selectedStandard !== 'all' && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStandard('all');
                          }}
                          style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Reset
                        </span>
                      )}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: openSections.standard ? 'rotate(0deg)' : 'rotate(180deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </div>
                  </div>
                  {openSections.standard && (
                    <div className="filter-card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStandard('all')}
                          className={`filter-std-pill ${selectedStandard === 'all' ? 'active' : ''}`}
                        >
                          All Standards
                        </button>
                        {availableStandards.map((std) => (
                          <button
                            key={std}
                            type="button"
                            onClick={() => setSelectedStandard(std)}
                            className={`filter-std-pill ${selectedStandard === std ? 'active' : ''}`}
                            title={std}
                          >
                            {std}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions Card: Reset All Filters Button */}
              <div className="pt-1 mb-4">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: isAnyFilterActive || isClearClicked ? '#dc2626' : '#0f172a',
                    color: '#ffffff',
                    border: isAnyFilterActive || isClearClicked ? '1px solid #b91c1c' : '1px solid #0f172a',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxShadow: isAnyFilterActive || isClearClicked
                      ? '0 2px 8px rgba(220, 38, 38, 0.28)'
                      : '0 2px 6px rgba(15, 23, 42, 0.15)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isAnyFilterActive || isClearClicked ? '#b91c1c' : '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isAnyFilterActive || isClearClicked ? '#dc2626' : '#0f172a';
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  <span>Reset All Filters</span>
                </button>
              </div>
            </div>
          </aside>

          {/* --------------------------------------------------------
              RIGHT CONTENT: SORTING & PRODUCTS GRID (Smoothly Expands Full Width)
             -------------------------------------------------------- */}
          <div
            className="flex-grow-1"
            style={{
              minWidth: 0,
              width: '100%',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Top Bar: Hamburger Sidebar Toggle + Results Count & Sort Dropdown */}
            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                {/* Modern Hamburger Filter Toggle Button */}
                {!isSidebarOpen && <button
                  type="button"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  style={{
                    height: '38px',
                    padding: '0 15px',
                    borderRadius: '8px',
                    backgroundColor: isSidebarOpen ? '#ffffff' : '#0f172a',
                    color: isSidebarOpen ? '#0f172a' : '#ffffff',
                    border: isSidebarOpen ? '1.5px solid #d1d5db' : '1.5px solid #0f172a',
                    boxShadow: isSidebarOpen ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 6px rgba(15, 23, 42, 0.2)',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (isSidebarOpen) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#94a3b8';
                    } else {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isSidebarOpen) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    } else {
                      e.currentTarget.style.backgroundColor = '#0f172a';
                    }
                  }}
                  title={isSidebarOpen ? 'Hide Filters (Full Width View)' : 'Show Filters Sidebar'}
                  aria-label={isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isSidebarOpen ? '#0f172a' : '#ffffff'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                  <span>Show Filters</span>
                  {isAnyFilterActive && (
                    <span
                      className={`badge rounded-pill ${isSidebarOpen ? 'bg-dark text-white' : 'bg-danger text-white'}`}
                      style={{ fontSize: '10.5px', padding: '2px 7px' }}
                    >
                      Active
                    </span>
                  )}
                </button>}

                <span className="text-muted fs-13 d-none d-sm-inline">
                  Showing <strong className="text-dark">{filteredAndSortedProducts.length}</strong> of {baseScopedProducts.length} items
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                <label className="text-muted fs-13 text-nowrap mb-0 d-none d-sm-inline">Sort by:</label>
                <select
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '13px',
                    minWidth: '170px',
                    backgroundColor: '#ffffff',
                    fontWeight: 500,
                  }}
                >
                  <option value="newest">Featured / Newest</option>
                  <option value="popular">Most Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="discount">Highest Discount</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {forceSkeleton || isLoading ? (
              <div className="row g-3 g-lg-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton
                    key={i}
                    colClass={isSidebarOpen ? 'col-xl-4 col-lg-6 col-sm-6 col-12 mb-3' : 'col-xl-3 col-lg-4 col-sm-6 col-12 mb-3'}
                  />
                ))}
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div
                className="text-center py-5 bg-white rounded-4 border"
                style={{ borderColor: '#e2e8f0', minHeight: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '64px', height: '64px', backgroundColor: '#f1f5f9' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <h4 className="fw-bold text-dark mb-1">No products match your criteria</h4>
                <p className="text-muted fs-14 mb-4" style={{ maxWidth: '420px' }}>
                  Try resetting some filters, selecting a different category, or broadening your price range.
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="btn btn-dark btn-sm px-4 py-2 rounded-3"
                  style={{ fontWeight: 600 }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="row g-3 g-lg-4 skeleton-fade-in">
                {filteredAndSortedProducts.map((prod, idx) => (
                  <CatalogProductCardItem
                    key={prod.id}
                    prod={prod}
                    isSidebarOpen={isSidebarOpen}
                    pageMode={pageMode}
                    isWishlisted={isInWishlist(Number(prod.id.replace(/[^\d]/g, '')) || 1)}
                    onToggleWishlist={toggleWishlist}
                    onProductClick={recordProductClick}
                    onAddToCart={handleAddToCart}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export function ProductsCatalogView(props: ProductsCatalogViewProps) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <ProductsCatalogContent {...props} />
    </Suspense>
  );
}

export default ProductsCatalogView;
