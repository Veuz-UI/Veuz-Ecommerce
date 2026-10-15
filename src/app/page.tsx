'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

import { fetchBannerSettings, BANNER_SETTINGS_EVENT } from '@/services/bannerSettingsService';
import { DEFAULT_BANNER_SETTINGS, MainBannerItem, PromoBannerItem } from '@/data/defaultBannerSettings';
import { fetchShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { DEFAULT_SHOP_SETTINGS, ShopCategory } from '@/data/defaultShopSettings';
import { fetchProducts, recordProductClick, PRODUCTS_EVENT } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';
import { fetchPartners, PARTNERS_EVENT } from '@/services/partnersService';
import { DEFAULT_PARTNERS_DATA, PartnersData } from '@/data/defaultPartners';
import { ProductCardImageSlider } from '@/components/common/ProductCardImageSlider';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';

const VERIFIED_CATEGORY_IMAGES = [
  '/assets/imgs/shop/p1.jpg',
  '/assets/imgs/shop/p2.jpg',
  '/assets/imgs/shop/p3.jpg',
  '/assets/imgs/shop/p4.jpg',
  '/assets/imgs/shop/p5.jpg',
  '/assets/imgs/shop/p6.jpg',
];

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
}: {
  prod: any;
  colClass: string;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onProductClick: (id: string) => void;
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
    <div className={colClass}>
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
            {/* Category above Title (Matching Reference Image) */}
            <span
              className="d-block text-muted text-capitalize"
              style={{
                fontSize: '12.5px',
                fontWeight: 500,
                color: '#8c9097',
                marginBottom: '3px',
                letterSpacing: '0.2px',
              }}
            >
              {prod.category
                ? prod.category.replace(/[-_]/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
                : 'Safety Equipment'}
            </span>

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
                {prod.rating ? String(prod.rating).replace('/5', '') : '4.6'}
              </span>
              <span className="rating-reviews" style={{ fontSize: '12.5px', color: '#64748b' }}>
                ({prod.reviews ? String(prod.reviews).replace(/[^0-9]/g, '') || '89' : '89'} reviews)
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
              <div className="new-prod-colors-wrap d-flex align-items-center gap-1.5" style={{ minHeight: '22px' }}>
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
                          width: '14px',
                          height: '14px',
                          padding: 0,
                          borderRadius: '50%',
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
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1.25)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                        }}
                      />
                    );
                  })
                ) : (
                  <span style={{ display: 'inline-block', height: '14px', visibility: 'hidden' }}>&nbsp;</span>
                )}
              </div>
            </div>

            {/* Product Description */}
            <p className="new-prod-desc">{prod.desc}</p>

            {/* Express Delivery Badge & Gender Tag */}
            <div className="mb-2 d-flex align-items-center gap-2 flex-wrap">
              <span className="express-delivery-badge">
                <i className="fi-rs-bolt"></i>Express Delivery
              </span>
              {prod.gender && (
                <span className="product-gender-badge">
                  {prod.gender}
                </span>
              )}
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
              aria-label="Add To Wishlist"
              className={`btn-wishlist-square ${isWishlisted ? 'active' : ''}`}
              onClick={() => onToggleWishlist(prod.id)}
              title="Add to Wishlist"
            >
              <i className={`fi-rs-heart ${isWishlisted ? 'fill-heart text-danger' : ''}`}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeSideSlide, setActiveSideSlide] = useState(0);
  const [activeCatIndex, setActiveCatIndex] = useState(0);
  const [isCatHovered, setIsCatHovered] = useState(false);
  const newProdScrollRef = useRef<HTMLDivElement>(null);
  const mostSearchedScrollRef = useRef<HTMLDivElement>(null);
  const onsaleScrollRef = useRef<HTMLDivElement>(null);
  const browseCatScrollRef = useRef<HTMLDivElement>(null);
  const partnersScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic Catalog Products from Products Service (hydrated safely via useEffect)
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);

  // Dynamic Partners Logos from Partners Service
  const [partnersData, setPartnersData] = useState<PartnersData>(DEFAULT_PARTNERS_DATA);

  // Dynamic Banners from Banner Settings
  const [heroSlides, setHeroSlides] = useState<MainBannerItem[]>(DEFAULT_BANNER_SETTINGS.mainBanners);
  const [sideBannerSlides, setSideBannerSlides] = useState<PromoBannerItem[]>(DEFAULT_BANNER_SETTINGS.promoBanners);

  // Dynamic Categories from Shop Settings (Shop by Categories)
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>(DEFAULT_SHOP_SETTINGS.categories);

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

    const loadBanners = async () => {
      try {
        const data = await fetchBannerSettings();
        if (isMounted && data) {
          const activeMain = (data.mainBanners || [])
            .filter((b) => b.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const activePromo = (data.promoBanners || [])
            .filter((b) => b.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          setHeroSlides(activeMain.length > 0 ? activeMain : DEFAULT_BANNER_SETTINGS.mainBanners);
          setSideBannerSlides(activePromo.length > 0 ? activePromo : DEFAULT_BANNER_SETTINGS.promoBanners);
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
          .filter((b: MainBannerItem) => b.isActive !== false)
          .sort((a: MainBannerItem, b: MainBannerItem) => (a.order || 0) - (b.order || 0));
        const activePromo = (data.promoBanners || [])
          .filter((b: PromoBannerItem) => b.isActive !== false)
          .sort((a: PromoBannerItem, b: PromoBannerItem) => (a.order || 0) - (b.order || 0));

        setHeroSlides(activeMain.length > 0 ? activeMain : DEFAULT_BANNER_SETTINGS.mainBanners);
        setSideBannerSlides(activePromo.length > 0 ? activePromo : DEFAULT_BANNER_SETTINGS.promoBanners);
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

  // Fetch dynamic categories & listen for real-time updates across tabs & dashboard
  useEffect(() => {
    let isMounted = true;

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

  const scrollPartners = (direction: 'prev' | 'next') => {
    if (partnersScrollRef.current) {
      const container = partnersScrollRef.current;
      const firstCard = container.querySelector('.partner-card-box') as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth + 18 : 220;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -cardWidth * 2, behavior: 'smooth' });
        }
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

  const [wishlist, setWishlist] = useState<{ [key: string]: boolean }>({});

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
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

    // Smooth scroll handler for Browse by Safety Categories
  const scrollBrowseCat = (direction: 'prev' | 'next') => {
    if (browseCatScrollRef.current) {
      const container = browseCatScrollRef.current;
      const firstCol = container.querySelector('.browse-cat-card-wrapper') as HTMLElement;
      const colWidth = firstCol ? firstCol.offsetWidth + 28 : 165;
      const scrollStep = colWidth * 2;
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: scrollStep, behavior: 'smooth' });
        }
      } else {
        if (container.scrollLeft <= 15) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollBy({ left: -scrollStep, behavior: 'smooth' });
        }
      }
    }
  };

  // Auto slide for Browse by Safety Categories (3500ms) with pause on hover
  useEffect(() => {
    if (isCatHovered) return;
    const catTimer = setInterval(() => {
      scrollBrowseCat('next');
    }, 3500);
    return () => clearInterval(catTimer);
  }, [isCatHovered]);

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
      const maxScroll = container.scrollWidth - container.clientWidth;

      if (maxScroll <= 0) return;

      if (direction === 'next') {
        if (container.scrollLeft >= maxScroll - 20) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          container.scrollTo({
            left: Math.min(container.scrollLeft + colWidth, maxScroll),
            behavior: 'smooth',
          });
        }
      } else {
        if (container.scrollLeft <= 20) {
          container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
          container.scrollTo({
            left: Math.max(container.scrollLeft - colWidth, 0),
            behavior: 'smooth',
          });
        }
      }
    }
  };



  const renderProductCard = (prod: any, colClass: string) => (
    <HomeProductCard
      key={prod.id}
      prod={prod}
      colClass={colClass}
      isWishlisted={false}
      onToggleWishlist={() => {}}
      onProductClick={recordProductClick}
    />
  );


  // Reusable Product Section Slider:
  // Desktop & Tablet: strictly ONE row of 4 cards per view, smoothly sliding with arrow keys
  // Mobile (< 768px): single horizontal row with smooth scrolling and swipe
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

    if (!items || items.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <p>No products available in this section.</p>
        </div>
      );
    }

    return (
      <div className="w-100">
        <div className="desktop-prod-slider-wrapper position-relative">
          <div ref={scrollRef} className="desktop-prod-slider-track">
            {items.map((prod) => (
              <div key={prod.id} className="desktop-prod-slider-col">
                {renderProductCard(prod, 'w-100')}
              </div>
            ))}
          </div>
        </div>
      </div>
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
                {heroSlides.map((slide, idx) => {
                  const subtitleText = slide.subtitle || '';
                  const titleText = slide.title || '';
                  const descText = slide.desc || '';
                  const bgImage = slide.image || '/assets/imgs/banner/hero-iphone-16.jpg';

                  return (
                    <div
                      key={slide.id || idx}
                      className={`hero-slide-item ${idx === activeSlide ? 'active' : ''}`}
                    >
                      {/* Background Visual */}
                      <div
                        className="hero-slide-bg"
                        style={{
                          backgroundImage: `url(${bgImage})`,
                        }}
                      />
                      <div className="hero-slide-bg-overlay" />

                      {/* Left Typography & CTA */}
                      <div className="hero-slide-content">
                        {subtitleText && (
                          <div className="hero-slide-subtitle">
                            {subtitleText}
                          </div>
                        )}
                        <h1 className="hero-slide-title">
                          {titleText}
                        </h1>
                        {descText && (
                          <p className="hero-slide-desc">
                            {descText}
                          </p>
                        )}
                        <Link href={slide.link || '/products'} className="hero-slide-btn">
                          {slide.buttonText || 'Shop Now'}
                        </Link>
                      </div>
                    </div>
                  );
                })}

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
                {sideBannerSlides.map((slide, idx) => {
                  const saleBadge = slide.saleBadge || 'SALE';
                  const upToText = slide.subtitle || 'UP TO';
                  const discountText = slide.discount || slide.price || '50%';
                  const promoImage = slide.image || '/assets/imgs/banner/promo-shoe-sale.jpg';

                  return (
                    <Link
                      key={slide.id || idx}
                      href={slide.link || '/products'}
                      className={`hero-promo-slide-item ${idx === activeSideSlide ? 'active' : ''}`}
                      style={{
                        backgroundImage: `url(${promoImage})`,
                      }}
                    >
                      <div className="hero-promo-card-overlay" />

                      {/* Top-Left Promotional Badge */}
                      <div className="hero-promo-badge-box">
                        <div className="hero-promo-sale-text">{saleBadge}</div>
                        <div className="hero-promo-upto-row">
                          <span className="hero-promo-upto-text">{upToText}</span>
                          {/* Puma / Athletic silhouette emblem SVG */}
                          <svg width="22" height="14" viewBox="0 0 24 16" fill="#ffffff" style={{ opacity: 0.95 }}>
                            <path d="M22.8 1.4c-.6-.5-1.5-.7-2.3-.4-.5.2-1 .5-1.5.9-.6.5-1.3 1.1-2.1 1.7-1.1.8-2.3 1.4-3.6 1.8-1.5.5-3.1.6-4.7.4-1.2-.2-2.3-.6-3.4-1.2C3.8 3.8 2.5 2.7 1.4 1.4.9.8.3 1.2.1 1.8c-.3 1 .1 2.2.9 2.9 1 1 2.3 1.7 3.6 2.3 1.5.6 3.1.9 4.8.9 1.4 0 2.8-.2 4.1-.7 1.1-.4 2.2-1 3.2-1.7.7-.5 1.4-1.1 2-1.7.5-.5 1.1-.9 1.8-1.2.6-.3 1.3-.3 1.8.1.3.3.4.7.3 1.1-.1.4-.4.8-.8 1-.8.5-1.8.8-2.7 1-.7.1-1.4.2-2.1.2H16c-.6 0-1 .4-1 1s.4 1 1 1h.5c1 0 2-.1 3-.3 1.2-.2 2.4-.7 3.4-1.4.7-.5 1.2-1.1 1.4-1.9.2-.8 0-1.6-.5-2.2z" />
                          </svg>
                        </div>
                        <div className="hero-promo-discount-num">
                          {discountText.replace(/[^\d]/g, '') || '50'}
                          <span className="hero-promo-discount-unit">%</span>
                          <span className="hero-promo-discount-off">OFF</span>
                        </div>
                        {slide.desc && (
                          <div className="hero-promo-desc-text">
                            {slide.desc}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}

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
            <div ref={browseCatScrollRef} className="browse-cat-track-container">
              {shopCategories.map((cat, idx) => {
                const fallbackImg = VERIFIED_CATEGORY_IMAGES[idx % VERIFIED_CATEGORY_IMAGES.length];
                const imgSrc = cat.image && !cat.image.includes('undefined') && cat.image !== '#' ? cat.image : fallbackImg;
                const catLink = cat.link && cat.link !== '#' ? cat.link : `/category?category=${encodeURIComponent(cat.name)}`;
                return (
                  <div key={cat.id || idx} className="browse-cat-card-wrapper">
                    <Link href={catLink} className="browse-cat-card" title={cat.name}>
                      <div className="browse-cat-circle">
                        <img
                          src={imgSrc}
                          alt={cat.name}
                          className="browse-cat-photo"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = fallbackImg;
                          }}
                        />
                      </div>
                      <h4 className="browse-cat-name">{cat.name}</h4>
                    </Link>
                  </div>
                );
              })}
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

      {/* 3. Promotional 3-Card Banners */}
      <section className="banners section-spacer-mb">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="promo-feature-card overflow-hidden">
                <Link href="/products" className="d-block position-relative overflow-hidden w-100 h-100">
                  <img
                    src="/assets/imgs/banner/promo-card-1.jpg"
                    alt="Head & Eye Protection PPE Collection"
                    className="promo-card-img"
                  />
                </Link>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="promo-feature-card overflow-hidden">
                <Link href="/products" className="d-block position-relative overflow-hidden w-100 h-100">
                  <img
                    src="/assets/imgs/banner/promo-card-2.jpg"
                    alt="Industrial Communications & High-Vis Workwear"
                    className="promo-card-img"
                  />
                </Link>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="promo-feature-card overflow-hidden">
                <Link href="/products" className="d-block position-relative overflow-hidden w-100 h-100">
                  <img
                    src="/assets/imgs/banner/promo-card-3.jpg"
                    alt="Workplace Safety & Emergency First Aid Kits"
                    className="promo-card-img"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

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
            <div className="partners-slider-track" ref={partnersScrollRef}>
              {(partnersData.partners && partnersData.partners.length > 0
                ? partnersData.partners.filter((p) => p.isActive !== false)
                : DEFAULT_PARTNERS_DATA.partners
              ).map((partner) => (
                <Link
                  key={partner.id}
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
