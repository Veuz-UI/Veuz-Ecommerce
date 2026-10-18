'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { fetchBannerSettings, getCachedBannerSettings, getClientCachedBannerSettings, BANNER_SETTINGS_EVENT } from '@/services/bannerSettingsService';
import { DEFAULT_BANNER_SETTINGS, MainBannerItem, PromoBannerItem } from '@/data/defaultBannerSettings';
import { fetchShopSettings, getCachedShopSettings, getClientCachedShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { DEFAULT_SHOP_SETTINGS, ShopCategory } from '@/data/defaultShopSettings';
import { fetchProducts, getCachedProducts, getClientCachedProducts, recordProductClick, PRODUCTS_EVENT } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';
import { fetchPartners, PARTNERS_EVENT } from '@/services/partnersService';
import { DEFAULT_PARTNERS_DATA, PartnersData } from '@/data/defaultPartners';
import { fetchPromotionArea, getCachedPromotionArea, getClientCachedPromotionArea, PROMOTION_AREA_EVENT } from '@/services/promotionAreaService';
import { DEFAULT_PROMOTION_AREA, PromotionCardItem } from '@/data/defaultPromotionArea';
import { ProductCardImageSlider } from '@/components/common/ProductCardImageSlider';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { getDeliveryBadgeProps } from '@/utils/deliveryBadge';
import { ProductCardSkeleton, CategorySliderSkeleton } from '@/components/ui/skeletons';

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

function HomeProductCard({
  prod,
  colClass,
  isWishlisted,
  onToggleWishlist,
  onProductClick,
  index = 0,
}: {
  prod: any;
  colClass: string;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onProductClick: (id: string) => void;
  index?: number;
}) {
  const initialColor = Array.isArray(prod.colors) && prod.colors.length > 0 ? prod.colors[0] : '';
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const { addToCart } = useStore();
  const { showToast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rawPrice = prod.currentPrice || prod.price;
    const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '129').replace(/[^\d.]/g, '')) || 129;
    const idNum = Number(String(prod.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 100000) + 1;
    const cartProduct: any = {
      id: idNum,
      name: prod.title,
      price: numPrice > 0 ? numPrice : 129,
      image: (prod.image && !prod.image.includes('p1.jpg'))
        ? prod.image
        : (prod.img && !prod.img.includes('p1.jpg'))
          ? prod.img
          : (prod.images && prod.images[0]) || '/assets/imgs/theme/placeholder.svg',
      category: prod.category || 'Safety Equipment',
    };
    addToCart(cartProduct, 1, selectedColor || (Array.isArray(prod.colors) ? prod.colors[0] : undefined));
  };

  useEffect(() => {
    if (Array.isArray(prod.colors) && prod.colors.length > 0) {
      if (!selectedColor || !prod.colors.some((c: string) => c.toLowerCase() === selectedColor.toLowerCase())) {
        setSelectedColor(prod.colors[0]);
      }
    }
  }, [prod.colors]);

  const isLimitedOffer = prod.collectionStatus === 'limited' || Boolean(prod.offerEndDate);
  const hasOffer = prod.collectionStatus === 'offer' || isLimitedOffer || ((prod.isSpecialOffer === true || prod.badgeClass === 'hot') && Boolean(prod.discount || prod.badge));
  const isNewArrival = prod.collectionStatus === 'new' || (!hasOffer && (prod.badge === 'New Arrival' || prod.badgeClass === 'new'));
  const isTopSearched = prod.badge === 'Top Searched';
  const limitedOfferDaysLeft = prod.offerEndDate
    ? Math.max(0, Math.ceil((new Date(`${prod.offerEndDate}T23:59:59`).getTime() - Date.now()) / 86400000))
    : null;

  let badgeText = 'New Arrival';
  if (isTopSearched) {
    badgeText = 'Top Searched';
  } else if (hasOffer) {
    badgeText = prod.discount || 'Special Offer';
  } else if (prod.badge && prod.badge !== 'Special Offer') {
    badgeText = prod.badge;
  }

  const baseLink = prod.link && prod.link.includes('?id=') ? prod.link : `/product-details?id=${prod.id}`;
  const productDetailLink = selectedColor
    ? `${baseLink}${baseLink.includes('?') ? '&' : '?'}color=${encodeURIComponent(selectedColor)}`
    : baseLink;

  return (
    <div
      className={`${colClass} product-card-animate-wrap`}
      style={{
        animationDelay: `${(index % 8) * 0.085}s`,
      }}
    >
      <div className="product-cart-wrap uniform-product-card w-100 d-flex flex-column">
        {/* Top image wrap with Top-Left Badge & Top-Right Circular View Button */}
        <div className="product-img-action-wrap position-relative">
          {/* Top-Left Badge */}
          <span className={`ref-card-badge ${isTopSearched ? 'ref-card-badge-top-searched' : hasOffer ? 'ref-card-badge-offer' : isNewArrival ? 'ref-card-badge-new' : ''}`}>{badgeText}</span>

          {/* Top-Right Circular View Button ("Eye" icon) */}
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

          {/* Main Image & Multi-Angle Slider with navigation */}
          <ProductCardImageSlider
            productId={prod.id}
            title={prod.title}
            link={productDetailLink}
            image={
              (prod.image && !prod.image.includes('p1.jpg'))
                ? prod.image
                : (prod.img && !prod.img.includes('p1.jpg'))
                  ? prod.img
                  : (prod.colorImages && Object.values(prod.colorImages).flat().find((u) => Boolean(u && typeof u === 'string' && !u.includes('p1.jpg')))) || ''
            }
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

            {/* Product Title (20px bold) */}
            <h2 className="new-prod-title">
              <Link
                href={productDetailLink}
                onClick={() => onProductClick(prod.id)}
              >
                {prod.title}
              </Link>
            </h2>

            {/* Star Rating with Review Count (Matching Reference Card) */}
            <div className="product-rate d-flex align-items-center mb-2" style={{ gap: '5px' }}>
              <span style={{ color: '#f59e0b', fontSize: '14px', lineHeight: 1 }}>★</span>
              <span className="rating-score fw-bold" style={{ fontSize: '13px', color: '#0f172a' }}>
                {prod.rating ? String(prod.rating).replace('/5', '') : '0.0'}
              </span>
              <span className="rating-reviews" style={{ fontSize: '12.5px', color: '#64748b' }}>
                ({prod.reviews ? String(prod.reviews).replace(/[^0-9]/g, '') || '0' : '0'} reviews)
              </span>
            </div>

            {/* Product Price & Discount Badge */}
            <div className="new-prod-price-box mb-2">
              <div className="d-flex align-items-center" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <span className="new-prod-current-price">{prod.price}</span>
                {hasOffer && prod.oldPrice && (
                  <span className="new-prod-old-price">{prod.oldPrice}</span>
                )}
                {isLimitedOffer ? (
                  <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', fontSize: '11px', padding: '4px 7px' }}>
                    {limitedOfferDaysLeft === null
                      ? 'LIMITED SALE'
                      : limitedOfferDaysLeft === 0
                        ? 'Ends Today'
                        : `${limitedOfferDaysLeft} ${limitedOfferDaysLeft === 1 ? 'Day' : 'Days'} Left`}
                  </span>
                ) : hasOffer ? (
                  <span className="badge" style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '11px', padding: '4px 7px' }}>OFFER</span>
                ) : null}
                {isNewArrival && <span className="badge" style={{ backgroundColor: '#16a34a', color: '#ffffff', fontSize: '11px', padding: '4px 7px' }}>NEW</span>}
              </div>
              <div className="new-prod-vat-label">Inclusive of VAT</div>

              {/* Color Swatches below Price (with interactive click to change image) */}
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

          {/* Reference Card Bottom Action Bar */}
          <div className="product-card-bottom d-flex align-items-center gap-2 mt-auto">
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-add-cart-wide"
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


function ProductSectionSliderTrack({
  items,
  scrollRef,
  isInWishlist,
  onToggleWishlist,
  onProductClick,
}: {
  items: any[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  isInWishlist: (numId: number) => boolean;
  onToggleWishlist: (id: string) => void;
  onProductClick: (id: string) => void;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="d-flex gap-3 overflow-hidden py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} colClass="desktop-prod-slider-col flex-shrink-0" />
        ))}
      </div>
    );
  }

  const repeatedItems = useMemo(() => {
    if (items.length <= 4) return items.map((p, i) => ({ ...p, loopKey: `p-s1-${p.id}-${i}` }));
    return [
      ...items.map((prod, i) => ({ ...prod, loopKey: `p-s1-${prod.id}-${i}` })),
      ...items.map((prod, i) => ({ ...prod, loopKey: `p-s2-${prod.id}-${i}` })),
      ...items.map((prod, i) => ({ ...prod, loopKey: `p-s3-${prod.id}-${i}` })),
    ];
  }, [items]);

  return (
    <div className="w-100 skeleton-fade-in">
      <div className="desktop-prod-slider-wrapper position-relative">
        <div
          ref={scrollRef}
          className="desktop-prod-slider-track hide-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {repeatedItems.map((prod, idx) => (
            <div key={prod.loopKey} className="desktop-prod-slider-col">
              <HomeProductCard
                prod={prod}
                colClass="w-100"
                isWishlisted={isInWishlist(Number(String(prod.id).replace(/[^\d]/g, '')) || 1)}
                onToggleWishlist={onToggleWishlist}
                onProductClick={onProductClick}
                index={idx}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const isDummyBanner = (url?: string) => {
  if (!url) return false;
  return url.includes('hero-iphone-16') ||
         url.includes('clean-hero-1') ||
         url.includes('promo-shoe-sale') ||
         url.includes('clean-side-1') ||
         url.includes('/assets/imgs/banner/');
};

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addToCart, toggleWishlist: storeToggleWishlist, isInWishlist } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeSideSlide, setActiveSideSlide] = useState(0);
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [isCatHovered, setIsCatHovered] = useState(false);
  const newProdScrollRef = useRef<HTMLDivElement>(null);
  const mostSearchedScrollRef = useRef<HTMLDivElement>(null);
  const onsaleScrollRef = useRef<HTMLDivElement>(null);
  const browseCatScrollRef = useRef<HTMLDivElement>(null);
  const partnersScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic Catalog Products initialized with live cached/synced products (Strictly NO dummy data)
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>(() => getCachedProducts());

  // Dynamic Partners Logos from Partners Service
  const [partnersData, setPartnersData] = useState<PartnersData>(DEFAULT_PARTNERS_DATA);

  // Dynamic Banners from Banner Settings (Initializes with live cache/synced banners - NO dummy data)
  const [heroSlides, setHeroSlides] = useState<MainBannerItem[]>(() => {
    const banners = getCachedBannerSettings().mainBanners || [];
    return banners
      .filter((b) => b.isActive !== false && !isDummyBanner(b.image))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });
  const [sideBannerSlides, setSideBannerSlides] = useState<PromoBannerItem[]>(() => {
    const banners = getCachedBannerSettings().promoBanners || [];
    return banners
      .filter((b) => b.isActive !== false && !isDummyBanner(b.image))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  });

  // Dynamic Categories from Shop Settings (Initializes with live cache/synced categories - NO dummy data)
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>(() => {
    const cats = getCachedShopSettings().categories || [];
    const active = cats.filter((c) => c.isActive !== false);
    return active.length > 0 ? active : DEFAULT_SHOP_SETTINGS.categories;
  });

  // Dynamic Promotion Area Cards (3 Cards)
  const [promotions, setPromotions] = useState<PromotionCardItem[]>(() => {
    return getCachedPromotionArea().promotions || DEFAULT_PROMOTION_AREA.promotions;
  });

  // Eagerly preload all banner slide images into browser cache so transitions & refreshes never flash blank
  useEffect(() => {
    if (typeof window !== 'undefined') {
      [...heroSlides, ...sideBannerSlides].forEach((slide) => {
        if (slide.image && !isDummyBanner(slide.image)) {
          const img = new window.Image();
          img.src = slide.image;
        }
      });
    }
  }, [heroSlides, sideBannerSlides]);

  // Guarantee that the home page always starts at the very top (0, 0)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'manual';
        }
      } catch (e) {}
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // Fetch dynamic banners & listen for real-time updates across tabs
  useEffect(() => {
    let isMounted = true;

    // Immediately sync client-side cache on mount without causing SSR hydration mismatch
    const clientBanners = getClientCachedBannerSettings();
    if (clientBanners) {
      const activeMain = (clientBanners.mainBanners || [])
        .filter((b) => b.isActive !== false && !isDummyBanner(b.image))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      const activePromo = (clientBanners.promoBanners || [])
        .filter((b) => b.isActive !== false && !isDummyBanner(b.image))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setHeroSlides(activeMain);
      setSideBannerSlides(activePromo);
    }

    const loadBanners = async () => {
      try {
        const data = await fetchBannerSettings();
        if (isMounted && data) {
          const activeMain = (data.mainBanners || [])
            .filter((b) => b.isActive !== false && !isDummyBanner(b.image))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const activePromo = (data.promoBanners || [])
            .filter((b) => b.isActive !== false && !isDummyBanner(b.image))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          setHeroSlides(activeMain);
          setSideBannerSlides(activePromo);
        }
      } catch (err) {
        console.warn('Error loading dynamic banners:', err);
      }
    };

    loadBanners();

    const handleBannerUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        const data = customEvt.detail;
        const activeMain = (data.mainBanners || [])
          .filter((b: MainBannerItem) => b.isActive !== false && !isDummyBanner(b.image))
          .sort((a: MainBannerItem, b: MainBannerItem) => (a.order || 0) - (b.order || 0));
        const activePromo = (data.promoBanners || [])
          .filter((b: PromoBannerItem) => b.isActive !== false && !isDummyBanner(b.image))
          .sort((a: PromoBannerItem, b: PromoBannerItem) => (a.order || 0) - (b.order || 0));

        setHeroSlides(activeMain);
        setSideBannerSlides(activePromo);
      } else {
        loadBanners();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'veuz_banners_cache') {
        loadBanners();
      }
    };

    window.addEventListener(BANNER_SETTINGS_EVENT, handleBannerUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener(BANNER_SETTINGS_EVENT, handleBannerUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Auto-play main hero slider (every 7.5 seconds - smooth & elegant)
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7500);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  // Auto-play promotion banner slider (every 7 seconds)
  useEffect(() => {
    if (sideBannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSideSlide((prev) => (prev + 1) % sideBannerSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [sideBannerSlides.length]);

  // Ensure active indices never exceed bounds when slides update
  useEffect(() => {
    if (activeSlide >= heroSlides.length && heroSlides.length > 0) {
      setActiveSlide(0);
    }
  }, [heroSlides.length, activeSlide]);

  useEffect(() => {
    if (activeSideSlide >= sideBannerSlides.length && sideBannerSlides.length > 0) {
      setActiveSideSlide(0);
    }
  }, [sideBannerSlides.length, activeSideSlide]);

  // Fetch dynamic categories & listen for real-time updates across tabs & dashboard
  useEffect(() => {
    let isMounted = true;

    // Immediately sync client-side cache on mount without causing SSR hydration mismatch
    const clientCats = getClientCachedShopSettings();
    if (clientCats && Array.isArray(clientCats.categories)) {
      const activeCats = clientCats.categories.filter((c) => c.isActive !== false);
      if (activeCats.length > 0) setShopCategories(activeCats);
    }

    const loadCategories = async () => {
      try {
        const data = await fetchShopSettings();
        if (isMounted && data && Array.isArray(data.categories)) {
          const activeCats = data.categories.filter((c) => c.isActive !== false);
          setShopCategories(activeCats.length > 0 ? activeCats : DEFAULT_SHOP_SETTINGS.categories);
        }
      } catch (err) {
        console.warn('Error loading dynamic categories:', err);
      }
    };

    loadCategories();

    const handleCategoryUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail.categories)) {
        const activeCats = customEvt.detail.categories.filter((c: ShopCategory) => c.isActive !== false);
        setShopCategories(activeCats.length > 0 ? activeCats : DEFAULT_SHOP_SETTINGS.categories);
      } else {
        loadCategories();
      }
    };

    const handleCategoryStorage = (e: StorageEvent) => {
      if (e.key === 'veuz_shop_settings_cache') {
        loadCategories();
      }
    };

    window.addEventListener(SHOP_SETTINGS_EVENT, handleCategoryUpdate);
    window.addEventListener('storage', handleCategoryStorage);

    return () => {
      isMounted = false;
      window.removeEventListener(SHOP_SETTINGS_EVENT, handleCategoryUpdate);
      window.removeEventListener('storage', handleCategoryStorage);
    };
  }, []);

  // Fetch dynamic catalog products & subscribe to updates
  useEffect(() => {
    let isMounted = true;

    // Immediately sync client-side cache on mount without causing SSR hydration mismatch
    const clientProds = getClientCachedProducts();
    if (clientProds && clientProds.length > 0) {
      setCatalogProducts(clientProds);
    }

    const loadProducts = async () => {
      try {
        const prods = await fetchProducts();
        if (isMounted && Array.isArray(prods) && prods.length > 0) {
          setCatalogProducts(prods);
        }
      } catch (err) {
        console.warn('Error loading products for homepage:', err);
      }
    };

    loadProducts();

    const handleProductsUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setCatalogProducts(customEvt.detail);
      } else {
        loadProducts();
      }
    };

    window.addEventListener(PRODUCTS_EVENT, handleProductsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener(PRODUCTS_EVENT, handleProductsUpdated);
    };
  }, []);

  // Fetch dynamic partners & subscribe to real-time updates
  useEffect(() => {
    let isMounted = true;
    const loadPartners = async () => {
      try {
        const data = await fetchPartners();
        if (isMounted && data && Array.isArray(data.partners)) {
          setPartnersData(data);
        }
      } catch (err) {
        console.warn('Error loading dynamic partners:', err);
      }
    };

    loadPartners();

    const handlePartnersUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail.partners)) {
        setPartnersData(customEvt.detail);
      } else {
        loadPartners();
      }
    };

    const handlePartnersStorage = (e: StorageEvent) => {
      if (e.key === 'veuz_partners_cache') {
        loadPartners();
      }
    };

    window.addEventListener(PARTNERS_EVENT, handlePartnersUpdate);
    window.addEventListener('storage', handlePartnersStorage);

    return () => {
      isMounted = false;
      window.removeEventListener(PARTNERS_EVENT, handlePartnersUpdate);
      window.removeEventListener('storage', handlePartnersStorage);
    };
  }, []);

  // Fetch dynamic promotion area & subscribe to real-time updates
  useEffect(() => {
    let isMounted = true;

    // Immediately sync client-side cache on mount without causing SSR hydration mismatch
    const clientPromos = getClientCachedPromotionArea();
    if (clientPromos && Array.isArray(clientPromos.promotions) && clientPromos.promotions.some((p) => Boolean(p.image))) {
      setPromotions(clientPromos.promotions);
    }

    const loadPromotions = async () => {
      try {
        const data = await fetchPromotionArea();
        if (isMounted && data && Array.isArray(data.promotions) && data.promotions.length === 3) {
          setPromotions(data.promotions);
        }
      } catch (err) {
        console.warn('Error loading dynamic promotions:', err);
      }
    };

    loadPromotions();

    const handlePromotionsUpdate = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail && Array.isArray(customEvt.detail.promotions)) {
        setPromotions(customEvt.detail.promotions);
      } else {
        loadPromotions();
      }
    };

    const handlePromotionsStorage = (e: StorageEvent) => {
      if (e.key === 'veuz_promotion_area_cache') {
        loadPromotions();
      }
    };

    window.addEventListener(PROMOTION_AREA_EVENT, handlePromotionsUpdate);
    window.addEventListener('storage', handlePromotionsStorage);

    return () => {
      isMounted = false;
      window.removeEventListener(PROMOTION_AREA_EVENT, handlePromotionsUpdate);
      window.removeEventListener('storage', handlePromotionsStorage);
    };
  }, []);

  // Active partners list & 3 sets for infinite continuous loop
  const activePartnersList = useMemo(() => {
    return partnersData.partners && partnersData.partners.length > 0
      ? partnersData.partners.filter((p) => p.isActive !== false)
      : DEFAULT_PARTNERS_DATA.partners;
  }, [partnersData.partners]);

  const repeatedPartners = useMemo(() => {
    if (!activePartnersList || activePartnersList.length <= 3) {
      return activePartnersList.map((p, i) => ({ ...p, loopKey: `partner-s1-${p.id || i}-${i}` }));
    }
    return [
      ...activePartnersList.map((p, i) => ({ ...p, loopKey: `partner-s1-${p.id || i}-${i}` })),
      ...activePartnersList.map((p, i) => ({ ...p, loopKey: `partner-s2-${p.id || i}-${i}` })),
      ...activePartnersList.map((p, i) => ({ ...p, loopKey: `partner-s3-${p.id || i}-${i}` })),
    ];
  }, [activePartnersList]);

  const scrollPartners = (direction: 'prev' | 'next') => {
    if (partnersScrollRef.current) {
      const container = partnersScrollRef.current;
      const firstCard = container.querySelector('.partner-card-box') as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 18 : 220;
      const step = cardWidth * 2;
      const setWidth = container.scrollWidth / 3;

      if (setWidth <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= setWidth * 2 - step) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft -= setWidth;
          void container.offsetWidth;
        }
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: step, behavior: 'smooth' });
      } else {
        if (container.scrollLeft < step) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft += setWidth;
          void container.offsetWidth;
        }
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }
  };

  // Bounds safety check for category slide index
  useEffect(() => {
    const maxSlide = Math.max(0, shopCategories.length - 7);
    if (activeCatIndex > maxSlide) {
      setActiveCatIndex(0);
    }
  }, [shopCategories.length, activeCatIndex]);

  // Bounds safety checks for active slide indices (reset if banner list decreases)
  useEffect(() => {
    setActiveSlide((prev) => (heroSlides.length > 0 && prev >= heroSlides.length ? 0 : prev));
  }, [heroSlides.length]);

  useEffect(() => {
    setActiveSideSlide((prev) => (sideBannerSlides.length > 0 && prev >= sideBannerSlides.length ? 0 : prev));
  }, [sideBannerSlides.length]);

  const scrollNewProd = (direction: 'prev' | 'next') => {
    if (newProdScrollRef.current) {
      const container = newProdScrollRef.current;
      const firstCol = container.querySelector('.new-prod-pair-column') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 20 : 300;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: colWidth, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -colWidth, behavior: 'smooth' });
        }
      }
    }
  };

  const toggleWishlist = (id: string) => {
    if (!user) {
      showToast('warning', 'Please sign in to save items to your wishlist.', 'Login Required');
      router.push('/login?redirect=/wishlist');
      return;
    }
    const numId = Number(id.replace(/[^\d]/g, '')) || 1;
    storeToggleWishlist(numId);
  };

  // Derive dynamic lists strictly from catalogProducts (synced live with dashboard products)
  // 1. New Arrivals: ONLY show new arrival products from dashboard (strictly NO dummy fallbacks)
  const displayedNewProducts = catalogProducts
    .filter((p) => p.isNewArrival !== false && p.isActive !== false)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map((p) => ({
      ...p,
      id: p.id,
      title: p.title,
      category: p.category || (p as any).categoryName || 'Safety Equipment',
      colors: p.colors || [],
      colorImages: p.colorImages || {},
      desc: p.desc || 'Certified workplace safety and protection equipment.',
      img: p.image || '/assets/imgs/shop/pr1.jpg',
      badge: 'New Arrival',
      badgeClass: 'new' as const,
      price: p.price,
      oldPrice: p.oldPrice,
      discount: p.discount,
      rating: p.rating ? `${p.rating}/5` : '5.0/5',
      reviews: p.reviews ? `${p.reviews} - Reviews` : '0 - Reviews',
      link: `/product-details?id=${p.id}`,
    }));

  // 2. Most Searched: ONLY show most searched/ranked products from dashboard (strictly NO dummy fallbacks)
  const displayedMostSearched = [...catalogProducts]
    .filter((p) => p.isActive !== false)
    .sort((a, b) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0)))
    .map((p) => ({
      ...p,
      id: p.id,
      title: p.title,
      category: p.category || (p as any).categoryName || 'Safety Equipment',
      colors: p.colors || [],
      colorImages: p.colorImages || {},
      desc: p.desc || 'High-performance certified workplace protection equipment.',
      img: p.image || '/assets/imgs/shop/pr2.jpg',
      badge: 'Top Searched',
      badgeClass: 'top-searched' as const,
      collectionStatus: p.offerEndDate ? 'limited' : p.isSpecialOffer ? 'offer' : p.isNewArrival !== false ? 'new' : undefined,
      isSpecialOffer: p.isSpecialOffer,
      isNewArrival: p.isNewArrival,
      offerEndDate: p.offerEndDate,
      price: p.price,
      oldPrice: p.oldPrice,
      discount: p.discount,
      rating: p.rating ? `${p.rating}/5` : '5.0/5',
      reviews: p.reviews ? `${p.reviews} - Reviews` : '0 - Reviews',
      link: `/product-details?id=${p.id}`,
    }));

  // 3. Special Offers: ONLY show products where isSpecialOffer is explicitly TRUE from dashboard (strictly NO dummy fallbacks)
  const displayedOnsale = catalogProducts
    .filter((p) => (p.isSpecialOffer === true || Boolean(p.discount)) && !p.offerEndDate && p.isActive !== false)
    .map((p) => {
      const discountText = p.discount || (p.offerPercent ? `${p.offerPercent}% OFF` : '');
      return {
        ...p,
        id: p.id,
        title: p.title,
        category: p.category || (p as any).categoryName || 'Safety Equipment',
        colors: p.colors || [],
        colorImages: p.colorImages || {},
        desc: p.desc || 'Special discounted offer on certified PPE supplies.',
        img: p.image || '/assets/imgs/shop/pr3.jpg',
        badge: discountText || p.badge || 'Special Offer',
        badgeClass: 'hot' as const,
        isSpecialOffer: true,
        price: p.price,
        oldPrice: p.oldPrice,
        discount: discountText,
        rating: p.rating ? `${p.rating}/5` : '5.0/5',
        reviews: p.reviews ? `${p.reviews} - Reviews` : '0 - Reviews',
        link: `/product-details?id=${p.id}`,
      };
    });

  // Triplicate shop categories for infinite continuous forward looping without reversing
  const repeatedShopCategories = useMemo(() => {
    if (!shopCategories || shopCategories.length <= 3) {
      return shopCategories.map((c, i) => ({ ...c, loopKey: `cat-s1-${c.id || i}-${i}` }));
    }
    return [
      ...shopCategories.map((c, i) => ({ ...c, loopKey: `cat-s1-${c.id || i}-${i}` })),
      ...shopCategories.map((c, i) => ({ ...c, loopKey: `cat-s2-${c.id || i}-${i}` })),
      ...shopCategories.map((c, i) => ({ ...c, loopKey: `cat-s3-${c.id || i}-${i}` })),
    ];
  }, [shopCategories]);

  const scrollBrowseCat = (direction: 'prev' | 'next') => {
    if (browseCatScrollRef.current) {
      const container = browseCatScrollRef.current;
      const firstCol = container.querySelector('.browse-cat-card-wrapper') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 28 : 165;
      const scrollStep = colWidth * 2;
      const setWidth = container.scrollWidth / 3;

      if (setWidth <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= setWidth * 2 - scrollStep) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft -= setWidth;
          void container.offsetWidth;
        }
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: scrollStep, behavior: 'smooth' });
      } else {
        if (container.scrollLeft < scrollStep) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft += setWidth;
          void container.offsetWidth;
        }
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: -scrollStep, behavior: 'smooth' });
      }
    }
  };

  const handlePrevCat = () => {
    scrollBrowseCat('prev');
  };

  const handleNextCat = () => {
    scrollBrowseCat('next');
  };

  const scrollProductSlider = (
    sliderKey: 'newProd' | 'mostSearched' | 'onsale',
    direction: 'prev' | 'next'
  ) => {
    let ref: React.RefObject<HTMLDivElement | null>;
    switch (sliderKey) {
      case 'newProd':
        ref = newProdScrollRef;
        break;
      case 'mostSearched':
        ref = mostSearchedScrollRef;
        break;
      case 'onsale':
        ref = onsaleScrollRef;
        break;
      default:
        return;
    }
    if (ref && ref.current) {
      const container = ref.current;
      const firstCol = container.querySelector('.desktop-prod-slider-col') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 24 : 310;
      const setWidth = container.scrollWidth / 3;

      if (setWidth <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= setWidth * 2 - colWidth) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft -= setWidth;
          void container.offsetWidth;
        }
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: colWidth, behavior: 'smooth' });
      } else {
        if (container.scrollLeft < colWidth) {
          container.style.scrollBehavior = 'auto';
          container.scrollLeft += setWidth;
          void container.offsetWidth;
        }
        container.style.scrollBehavior = 'smooth';
        container.scrollBy({ left: -colWidth, behavior: 'smooth' });
      }
    }
  };

  // Reusable Product Section Slider with infinite continuous loop
  const renderProductSectionSlider = (
    items: any[],
    sliderKey: 'newProd' | 'mostSearched' | 'onsale'
  ) => {
    const scrollRef =
      sliderKey === 'newProd'
        ? newProdScrollRef
        : sliderKey === 'mostSearched'
        ? mostSearchedScrollRef
        : onsaleScrollRef;

    return (
      <ProductSectionSliderTrack
        items={items}
        scrollRef={scrollRef}
        isInWishlist={isInWishlist}
        onToggleWishlist={toggleWishlist}
        onProductClick={recordProductClick}
      />
    );
  };

  return (
    <main className="main">
      {/* 1. Hero Dual Banner Section (Matching Reference Design & Header Alignment) */}
      <section className="hero-banner-section section-spacer-mb">
        <div className="container">
          <div className="hero-banner-row">
            
            {/* Left: Main Hero Slider (Sleek Dark Indigo/Navy Card) */}
            <div className="hero-main-col">
              <div className="hero-slider-card">
                {heroSlides.length === 0 ? (
                  <div className="hero-slide-item active" style={{ cursor: 'default' }}>
                    <div
                      className="d-flex flex-column align-items-center justify-content-center w-100 h-100 position-absolute top-0 start-0"
                      style={{
                        backgroundColor: '#0f172a',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        zIndex: 1,
                      }}
                    >
                      <div className="d-flex flex-column align-items-center justify-content-center p-4 text-center">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                        >
                          <iconify-icon icon="solar:gallery-wide-bold" class="fs-32 text-secondary"></iconify-icon>
                        </div>
                        <span className="fs-14 fw-semibold text-white-50">Hero Banner</span>
                        <span className="fs-11 text-muted mt-1">Upload banner from dashboard</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  heroSlides.map((slide, idx) => {
                    const subtitleText = slide.subtitle || '';
                    const titleText = slide.title || '';
                    const descText = slide.desc || '';
                    const bgImage = !isDummyBanner(slide.image) ? slide.image : '';
                    const shouldShowBtn = slide.showButton !== false && Boolean(slide.buttonText && slide.buttonText.trim());
                    const hasTextContent = Boolean(titleText || subtitleText || descText);
                    const isImageOnly = !hasTextContent && !shouldShowBtn;

                    const slideElement = (
                      <div
                        key={slide.id || idx}
                        className={`hero-slide-item ${idx === activeSlide ? 'active' : ''}`}
                        style={{ cursor: isImageOnly ? 'pointer' : 'default' }}
                      >
                        {/* Background Visual or Placeholder */}
                        {bgImage ? (
                          <img
                            src={bgImage}
                            alt={titleText || 'Hero Banner'}
                            className="hero-slide-bg"
                            loading="eager"
                            decoding="async"
                          />
                        ) : (
                          <div
                            className="d-flex flex-column align-items-center justify-content-center w-100 h-100 position-absolute top-0 start-0"
                            style={{
                              backgroundColor: '#0f172a',
                              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                              zIndex: 1,
                            }}
                          >
                            <div className="d-flex flex-column align-items-center justify-content-center p-4 text-center">
                              <div
                                className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                                style={{ width: '64px', height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                              >
                                <iconify-icon icon="solar:gallery-wide-bold" class="fs-32 text-secondary"></iconify-icon>
                              </div>
                              <span className="fs-14 fw-semibold text-white-50">Hero Banner</span>
                              <span className="fs-11 text-muted mt-1">Upload banner from dashboard</span>
                            </div>
                          </div>
                        )}
                        {/* Dark overlay only needed when text exists to ensure legibility */}
                        {hasTextContent && <div className="hero-slide-bg-overlay" />}

                        {/* Left Typography & CTA */}
                        {(hasTextContent || shouldShowBtn) && (
                          <div className="hero-slide-content">
                            {subtitleText && (
                              <div className="hero-slide-subtitle">
                                {subtitleText}
                              </div>
                            )}
                            {titleText && (
                              <h1 className="hero-slide-title">
                                {titleText}
                              </h1>
                            )}
                            {descText && (
                              <p className="hero-slide-desc">
                                {descText}
                              </p>
                            )}
                            {shouldShowBtn && (
                              <Link href={slide.link || '/products'} className="hero-slide-btn">
                                {slide.buttonText}
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );

                    if (isImageOnly) {
                      return (
                        <Link
                          key={slide.id || idx}
                          href={slide.link || '/products'}
                          className="d-block w-100 h-100 text-decoration-none"
                          style={{ color: 'inherit' }}
                        >
                          {slideElement}
                        </Link>
                      );
                    }

                    return slideElement;
                  })
                )}

                {/* Left & Right Arrow Buttons on Hover */}
                {heroSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="hero-nav-arrow prev"
                      onClick={() => setActiveSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                      aria-label="Previous Slide"
                      title="Previous"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="hero-nav-arrow next"
                      onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
                      aria-label="Next Slide"
                      title="Next"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right: Side Promo Banner Slider Card */}
            <div className="hero-promo-col">
              <div className="hero-promo-slider-card">
                {sideBannerSlides.length === 0 ? (
                  <div
                    className="hero-promo-slide-item active"
                    style={{
                      backgroundColor: '#0f172a',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      pointerEvents: 'auto',
                    }}
                  >
                    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-3 text-center">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                      >
                        <iconify-icon icon="solar:tag-price-bold" class="fs-28 text-white"></iconify-icon>
                      </div>
                      <span className="fs-13 fw-semibold text-white">Side Promotion Banner</span>
                      <span className="fs-11 text-white-50 mt-1">Upload banner from dashboard</span>
                    </div>
                  </div>
                ) : (
                  sideBannerSlides.map((slide, idx) => {
                    const saleBadge = slide.saleBadge || '';
                    const upToText = slide.subtitle || '';
                    const discountText = slide.discount || slide.price || '';
                    const promoImage = !isDummyBanner(slide.image) ? slide.image : '';
                    const hasBadgeContent = Boolean(saleBadge || upToText || discountText || slide.desc);

                    return (
                      <Link
                        key={slide.id || idx}
                        href={slide.link || '/products'}
                        className={`hero-promo-slide-item ${idx === activeSideSlide ? 'active' : ''}`}
                      >
                        {promoImage ? (
                          <img
                            src={promoImage}
                            alt={saleBadge || 'Promotion Banner'}
                            className="hero-promo-slide-img"
                            loading="eager"
                            decoding="async"
                          />
                        ) : (
                          <div
                            className="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-3 text-center"
                            style={{
                              backgroundColor: '#0f172a',
                              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            }}
                          >
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                              style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                            >
                              <iconify-icon icon="solar:tag-price-bold" class="fs-28 text-white"></iconify-icon>
                            </div>
                            <span className="fs-13 fw-semibold text-white">Side Promotion Banner</span>
                            <span className="fs-11 text-white-50 mt-1">Upload banner from dashboard</span>
                          </div>
                        )}

                        {hasBadgeContent && <div className="hero-promo-card-overlay" />}

                        {/* Top-Left Promotional Badge (ONLY rendered if text content is provided) */}
                        {hasBadgeContent && (
                          <div className="hero-promo-badge-box">
                            {saleBadge && <div className="hero-promo-sale-text">{saleBadge}</div>}
                            {upToText && (
                              <div className="hero-promo-upto-row">
                                <span className="hero-promo-upto-text">{upToText}</span>
                              </div>
                            )}
                            {discountText && (
                              <div className="hero-promo-discount-num">
                                {discountText.replace(/[^\d]/g, '') || discountText}
                                {discountText.includes('%') && <span className="hero-promo-discount-unit">%</span>}
                                <span className="hero-promo-discount-off">OFF</span>
                              </div>
                            )}
                            {slide.desc && (
                              <div className="hero-promo-desc-text">
                                {slide.desc}
                              </div>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })
                )}

                {/* Left & Right Arrow Buttons on Hover for Promo Slider */}
                {sideBannerSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="hero-nav-arrow prev hero-promo-arrow"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveSideSlide((prev) => (prev === 0 ? sideBannerSlides.length - 1 : prev - 1));
                      }}
                      aria-label="Previous Offer"
                      title="Previous"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="hero-nav-arrow next hero-promo-arrow"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveSideSlide((prev) => (prev + 1) % sideBannerSlides.length);
                      }}
                      aria-label="Next Offer"
                      title="Next"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    {/* Floating Pagination Dots inside the Promo Slider Card */}
                    <div className="hero-promo-dots-wrapper">
                      {sideBannerSlides.map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          className={`hero-promo-dot ${pIdx === activeSideSlide ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveSideSlide(pIdx);
                          }}
                          aria-label={`Go to offer ${pIdx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Interactive Pagination Dots (Under hero section) */}
          {heroSlides.length > 1 && (
            <div className="hero-pagination-wrapper">
              {heroSlides.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  className={`hero-dot ${dotIdx === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Top Categories Section (Browse by Safety Categories) */}
      <section id="categories-section" className="popular-categories section-spacer-mb">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-25 flex-wrap gap-2">
            <div className="section-tit">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>Browse by Safety Categories</h3>
            </div>
            
            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
              <Link className="btn-view-all-pill" href="/all-categories-products">
                View All
              </Link>
              
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrevCat}
                  className="btn-slider-nav-pill"
                  aria-label="Previous Categories"
                  title="Previous"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNextCat}
                  className="btn-slider-nav-pill"
                  aria-label="Next Categories"
                  title="Next"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Smooth Category Slider Track */}
          <div
            className="browse-categories-slider-wrapper position-relative"
            onMouseEnter={() => setIsCatHovered(true)}
            onMouseLeave={() => setIsCatHovered(false)}
          >
            <div
              ref={browseCatScrollRef}
              className="browse-cat-track-container"
            >
              {repeatedShopCategories.length === 0 ? (
                <div className="d-flex gap-3 w-100 overflow-hidden py-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="browse-cat-card-wrapper">
                      <div className="browse-cat-card">
                        <div className="skeleton-box skeleton-circle browse-cat-circle" />
                        <div className="skeleton-box mt-2" style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                repeatedShopCategories.map((cat, idx) => {
                const imgSrc = cat.image && !cat.image.includes('undefined') && cat.image !== '#' ? cat.image : '/assets/imgs/theme/placeholder.svg';
                const catLink = cat.link && cat.link !== '#' ? cat.link : `/category?category=${encodeURIComponent(cat.name)}`;
                return (
                  <div key={cat.loopKey || cat.id || idx} className="browse-cat-card-wrapper">
                    <Link href={catLink} className="browse-cat-card" title={cat.name}>
                      <div className="browse-cat-circle">
                        <img
                          src={imgSrc}
                          alt={cat.name}
                          className="browse-cat-photo"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = '/assets/imgs/theme/placeholder.svg';
                          }}
                        />
                      </div>
                      <h4 className="browse-cat-name">{cat.name}</h4>
                    </Link>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEW PRODUCTS (Slider + View All Button Style + Arrow Keys) */}
      <section className="product-tabs section-padding position-relative section-spacer-mb">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mb-25 flex-wrap gap-3">
            <div className="section-tit">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>New Arrival Safety Gear & PPE</h3>
            </div>
            
            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
              <Link className="btn-view-all-pill" href="/new-arrival-products">
                View All
              </Link>
              
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => scrollProductSlider('newProd', 'prev')}
                  className="btn-slider-nav-pill"
                  aria-label="Previous"
                  title="Previous"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollProductSlider('newProd', 'next')}
                  className="btn-slider-nav-pill"
                  aria-label="Next"
                  title="Next"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {renderProductSectionSlider(displayedNewProducts, 'newProd')}
        </div>
      </section>

      {/* 3. Promotional Banners (Dynamic, Zero Dummy Images) */}
      {(() => {
        const activePromos = promotions.filter(
          (p) => Boolean(p.image && p.image.trim() && !p.image.includes('promo-card-'))
        );
        if (activePromos.length === 0) return null;

        const colClass =
          activePromos.length === 1
            ? 'col-lg-4 col-md-6 col-12'
            : activePromos.length === 2
            ? 'col-md-6 col-12'
            : 'col-lg-4 col-md-6';

        return (
          <section className="banners section-spacer-mb">
            <div className="container">
              <div className="row g-4">
                {activePromos.map((promo, idx) => (
                  <div key={promo.id || `promo-card-${idx}`} className={colClass}>
                    <div className="promo-feature-card overflow-hidden">
                      <Link href={promo.link || '/products'} className="d-block position-relative overflow-hidden w-100 h-100">
                        <img
                          src={promo.image}
                          alt={promo.title || `Promotional Banner ${idx + 1}`}
                          className="promo-card-img"
                        />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Most Searched Items (Slider + View All Button Style + Arrow Keys) */}
      <section className="product-tabs section-padding position-relative section-spacer-mb">
        <div className="container">
          <div className="section-title d-flex align-items-center justify-content-between mb-25 flex-wrap gap-3">
            <div className="section-tit">
              <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>Most Searched Items</h3>
            </div>
            
            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
              <Link className="btn-view-all-pill" href="/most-searched-products">
                View All
              </Link>
              
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => scrollProductSlider('mostSearched', 'prev')}
                  className="btn-slider-nav-pill"
                  aria-label="Previous"
                  title="Previous"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollProductSlider('mostSearched', 'next')}
                  className="btn-slider-nav-pill"
                  aria-label="Next"
                  title="Next"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          {renderProductSectionSlider(displayedMostSearched, 'mostSearched')}
        </div>
      </section>


      {/* 5. BRAND & SAFETY PARTNERS BANNER WITH OVERLAPPING LOGOS SLIDER */}
      <section className="eco-promo-section section-spacer-mb">
        <div className="container">
          {/* Top Vibrant Green Banner */}
          <div className="eco-banner-wrap">
            {/* Background Decorative SVG */}
            <svg className="eco-banner-vector" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20C50 20 20 70 20 120C20 170 70 180 120 180C170 180 180 130 180 80C180 30 150 20 100 20Z" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M60 140C90 110 130 90 170 70" stroke="white" strokeWidth="6" strokeLinecap="round"/>
              <path d="M110 110C125 95 145 85 165 75" stroke="white" strokeWidth="6" strokeLinecap="round"/>
            </svg>

            {/* Left Banner Text */}
            <div className="eco-banner-content">
              <h2 className="eco-banner-heading">
                {partnersData.title || 'Our Official Brand & Safety Partners'}
              </h2>
              <p className="eco-banner-subtitle">
                {partnersData.subtitle || 'Partnered with globally certified industrial safety, PPE, and equipment manufacturers.'}
              </p>
            </div>

            {/* Right Banner Button */}
            <div className="eco-banner-btn-wrap">
              <Link href={partnersData.buttonLink || '/products'} className="eco-banner-pill-btn">
                {partnersData.buttonText || 'View All Partners'}
              </Link>
            </div>
          </div>

          {/* Overlapping White Feature Partner Logo Cards (Slider) */}
          <div className="partners-slider-wrapper">
            {/* Previous Arrow Button */}
            <button
              type="button"
              className="partner-nav-arrow prev"
              onClick={() => scrollPartners('prev')}
              aria-label="Previous Partner Logos"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Slider Scroll Track */}
            <div
              className="partners-slider-track"
              ref={partnersScrollRef}
            >
              {repeatedPartners.map((partner, idx) => (
                <Link
                  key={partner.loopKey || partner.id || idx}
                  href={partner.link || '/products'}
                  className="partner-card-box"
                  title={partner.name}
                >
                  <div className="partner-logo-frame">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="partner-logo-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/imgs/client/partner1.svg';
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Next Arrow Button */}
            <button
              type="button"
              className="partner-nav-arrow next"
              onClick={() => scrollPartners('next')}
              aria-label="Next Partner Logos"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 6. ONSALE PRODUCTS Section (Slider + View All Button Style + Arrow Keys) */}
      {displayedOnsale.length > 0 && (
        <section className="onsal section-spacer-mb">
          <div className="container">
            <div className="section-title wow animate__animated animate__fadeIn d-flex align-items-center justify-content-between mb-25 flex-wrap gap-3" data-wow-delay="0">
              <div className="title">
                <h3 className="mb-0" style={{ fontSize: '24px', fontWeight: '700' }}>Special Offers & Bulk PPE Deals</h3>
              </div>
              
              <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                <Link className="show-all btn-view-all-pill" href="/offer-products">
                  View All
                </Link>
                
                <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => scrollProductSlider('onsale', 'prev')}
                    className="btn-slider-nav-pill"
                    aria-label="Previous"
                    title="Previous"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollProductSlider('onsale', 'next')}
                    className="btn-slider-nav-pill"
                    aria-label="Next"
                    title="Next"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {renderProductSectionSlider(displayedOnsale, 'onsale')}
          </div>
        </section>
      )}
    </main>
  );
}
