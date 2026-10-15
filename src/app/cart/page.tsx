'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { fetchProducts } from '@/services/productsService';
import { CATEGORY_PRODUCTS_DATA } from '@/data/categoryProductsData';

// Robust helper to match a cart item to the catalog product
export function findCatalogMatch(catalog: any[], product: any) {
  if (!catalog || !Array.isArray(catalog) || !product) return undefined;
  const prodId = String(product.id || '').trim();
  const prodNumId = prodId.replace(/[^\d]/g, '');
  const prodName = (product.name || product.title || '').trim().toLowerCase();

  return catalog.find((p) => {
    const catId = String(p.id || '').trim();
    const catNumId = catId.replace(/[^\d]/g, '');
    const catTitle = (p.title || p.name || '').trim().toLowerCase();

    // 1. Direct ID match
    if (catId && prodId && catId === prodId) return true;
    // 2. Numeric ID match (e.g., "prod-1792058077081" vs 1792058077081)
    if (catNumId && prodNumId && catNumId === prodNumId) return true;
    // 3. Name / Title match
    if (catTitle && prodName && (catTitle === prodName || catTitle.includes(prodName) || prodName.includes(catTitle))) {
      return true;
    }
    return false;
  });
}

// Helper to truncate product title to max words
const formatProductTitle = (name: string, maxWords = 30) => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length <= maxWords) return name;
  return words.slice(0, maxWords).join(' ') + '...';
};

const COLOR_HEX_MAP: Record<string, string> = {
  black: '#0f172a',
  white: '#ffffff',
  green: '#16a34a',
  blue: '#2563eb',
  red: '#dc2626',
  yellow: '#eab308',
  orange: '#ea580c',
  gray: '#64748b',
  grey: '#64748b',
  'slate gray': '#64748b',
  navy: '#1e3a8a',
  silver: '#94a3b8',
  standard: '#64748b',
};

function getColorHex(colorName?: string): string {
  if (!colorName) return '#94a3b8';
  const clean = colorName.toLowerCase().trim();
  return COLOR_HEX_MAP[clean] || '#64748b';
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, updateCartItemVariant, clearCart, totalCartItems } = useStore();
  const { showToast } = useToast();

  // Load catalog products with fallback to default data
  const [catalogProducts, setCatalogProducts] = useState<any[]>(CATEGORY_PRODUCTS_DATA);

  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCatalogProducts(data);
        }
      })
      .catch((err) => console.warn('Could not load products in cart:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  // Quick View & Edit Drawer state with smooth enter and exit slide transitions
  const [viewingDrawerItem, setViewingDrawerItem] = useState<{
    item: any;
    index: number;
  } | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState<boolean>(false);
  const [drawerSelectedColor, setDrawerSelectedColor] = useState<string>('');
  const [drawerSelectedSize, setDrawerSelectedSize] = useState<string>('');
  const [drawerActiveImageIdx, setDrawerActiveImageIdx] = useState<number>(0);

  // Lock website/body scroll while drawer modal is open
  useEffect(() => {
    if (viewingDrawerItem !== null) {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;

      document.documentElement.classList.add('drawer-scroll-locked');
      document.body.classList.add('drawer-scroll-locked');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // Block mouse wheel and touchmove events outside .product-drawer-body
      const handleWheelOrTouch = (e: WheelEvent | TouchEvent) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const scrollableContainer = target.closest('.product-drawer-body');
        if (!scrollableContainer) {
          e.preventDefault();
        }
      };

      window.addEventListener('wheel', handleWheelOrTouch, { passive: false });
      window.addEventListener('touchmove', handleWheelOrTouch, { passive: false });

      return () => {
        window.removeEventListener('wheel', handleWheelOrTouch);
        window.removeEventListener('touchmove', handleWheelOrTouch);
        document.documentElement.classList.remove('drawer-scroll-locked');
        document.body.classList.remove('drawer-scroll-locked');
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [viewingDrawerItem]);

  const openProductDrawer = (item: any, index: number) => {
    const catalogMatch = findCatalogMatch(catalogProducts, item.product);
    const color = item.selectedColor || (catalogMatch?.colors && catalogMatch.colors.length > 0 ? catalogMatch.colors[0] : '');
    const size = item.selectedSize || (catalogMatch?.sizes && catalogMatch.sizes.length > 0 ? catalogMatch.sizes[0] : '');

    setIsDrawerClosing(false);
    setViewingDrawerItem({ item, index });
    setDrawerSelectedColor(color);
    setDrawerSelectedSize(size);
    setDrawerActiveImageIdx(0);
  };

  const closeProductDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setViewingDrawerItem(null);
      setIsDrawerClosing(false);
    }, 280);
  };

  const handleDrawerColorChange = (newColor: string) => {
    setDrawerSelectedColor(newColor);
    setDrawerActiveImageIdx(0);
  };

  const handleApplyDrawerUpdate = (catalogMatch?: any) => {
    if (viewingDrawerItem !== null) {
      // Find the specific image corresponding to the newly selected color
      const activeColorKey = Object.keys(catalogMatch?.colorImages || {}).find(
        (k) => k.toLowerCase().trim() === (drawerSelectedColor || '').toLowerCase().trim()
      );
      const colorImgs =
        (activeColorKey && catalogMatch?.colorImages?.[activeColorKey]) ||
        (drawerSelectedColor && (catalogMatch?.colorImages as any)?.[drawerSelectedColor]) ||
        (drawerSelectedColor && (viewingDrawerItem.item.product as any)?.colorImages?.[drawerSelectedColor]) ||
        [];
      const newImage = (Array.isArray(colorImgs) && colorImgs.length > 0) ? colorImgs[0] : undefined;

      updateCartItemVariant?.(
        viewingDrawerItem.index,
        drawerSelectedColor || undefined,
        drawerSelectedSize || undefined,
        newImage
      );
      showToast('success', 'Cart item updated successfully!', 'Cart Updated');
      closeProductDrawer();
    }
  };

  // Calculations based on exact cart data
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = Number(item.product.price) || 0;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedPromo || subtotal === 0) return 0;
    return (subtotal * appliedPromo.percent) / 100;
  }, [subtotal, appliedPromo]);

  // Total (Exact product amount in SAR; discount applied only if code active)
  const finalTotal = useMemo(() => {
    if (cart.length === 0) return 0;
    return Math.max(0, subtotal - discountAmount);
  }, [cart.length, subtotal, discountAmount]);

  // Handle promo code submit
  const handleApplyPromo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = promoInput.trim().toUpperCase();

    if (!cleanCode) {
      setPromoError('Please enter a promo code');
      return;
    }

    if (cleanCode === 'HAPPY2022' || cleanCode === 'SAFETY15') {
      setAppliedPromo({ code: cleanCode, percent: 15 });
      setPromoError('');
      showToast('success', `Promo code ${cleanCode} applied! 15% discount`, 'Discount Applied');
    } else if (cleanCode === 'SAVE10' || cleanCode === 'WELCOME10') {
      setAppliedPromo({ code: cleanCode, percent: 10 });
      setPromoError('');
      showToast('success', `Promo code ${cleanCode} applied! 10% discount`, 'Discount Applied');
    } else {
      setPromoError('Invalid promo code');
      showToast('danger', 'Invalid promo code', 'Coupon Error');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
    showToast('info', 'Promo code removed.', 'Cart');
  };

  return (
    <main className="main py-4 py-md-5" style={{ backgroundColor: '#f8fafc', minHeight: '85vh' }}>
      <div className="container">
        {/* Full-width Unified White Card Container (spanning exact container width) */}
        <div
          className="bg-white rounded-4 border p-3 p-sm-4 p-md-5 w-100 shadow-sm"
          style={{
            borderColor: '#edf0f3',
            boxShadow: '0 4px 25px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* 1. Clean Inline Breadcrumb INSIDE the white card */}
          <div className="d-flex align-items-center gap-2 mb-3 fs-13 text-muted">
            <Link href="/" className="text-muted text-decoration-none hover-primary">
              Main
            </Link>
            <span className="text-muted">/</span>
            <span className="text-dark fw-medium">Your Cart</span>
          </div>

          {/* 2. Page Header INSIDE the white card */}
          <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom flex-wrap gap-3" style={{ borderColor: '#f1f5f9' }}>
            <h1
              className="fw-bold mb-0 text-dark d-flex align-items-center gap-2"
              style={{ fontSize: '24px', letterSpacing: '-0.5px' }}
            >
              Your Cart
              <span
                className="d-inline-flex align-items-center justify-content-center text-white fw-bold rounded-circle shadow-sm"
                style={{
                  width: '24px',
                  height: '24px',
                  fontSize: '12px',
                  backgroundColor: '#0f172a',
                  lineHeight: 1,
                }}
              >
                {totalCartItems}
              </span>
            </h1>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="clear-cart-btn"
                title="Clear all items from cart"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.stroke = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#0f172a';
                  const svg = e.currentTarget.querySelector('svg');
                  if (svg) svg.style.stroke = '#0f172a';
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: 'stroke 0.2s ease' }}
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span style={{ color: 'inherit' }}>Clear Cart</span>
              </button>
            )}
          </div>

          {/* ============================================================== */}
          {/* CASE 1: CART IS EMPTY (Animated Icon Without Shadow)           */}
          {/* ============================================================== */}
          {cart.length === 0 ? (
            <div className="py-4 py-md-5 text-center mx-auto" style={{ maxWidth: '640px' }}>
              {/* Pure Vector Animated Shopping Cart Icon (No Square, No Shadow) */}
              <div
                className="animated-cart-container mx-auto mb-4 d-flex align-items-center justify-content-center"
                style={{ width: '150px', height: '150px' }}
              >
                <svg
                  width="130"
                  height="130"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="cart-svg-animated"
                >
                  {/* Floating Sparkles & Accent Stars */}
                  <g className="sparkle-1">
                    <path d="M96 22L98 27L103 29L98 31L96 36L94 31L89 29L94 27L96 22Z" fill="#38bdf8" />
                  </g>
                  <g className="sparkle-2">
                    <path d="M22 34L23.5 38L27.5 39.5L23.5 41L22 45L20.5 41L16.5 39.5L20.5 38L22 34Z" fill="#f59e0b" />
                  </g>
                  <g className="sparkle-3">
                    <circle cx="98" cy="50" r="2.5" fill="#a855f7" />
                    <circle cx="20" cy="62" r="2" fill="#10b981" />
                  </g>

                  {/* Animated Cart Body */}
                  <g className="cart-floating-group">
                    {/* Motion Speed Lines */}
                    <line x1="8" y1="52" x2="16" y2="52" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" className="speed-line-1" />
                    <line x1="4" y1="58" x2="13" y2="58" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" className="speed-line-2" />

                    {/* Cart Handle & Outer Wireframe */}
                    <path
                      d="M24 34H32L41 68H85L93 42H35"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Cart Grid Pattern */}
                    <path
                      d="M44 42H93M46 50H91M49 58H88M47 68L43 42M57 68L55 42M67 68L67 42M77 68L79 42"
                      stroke="#93c5fd"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />

                    {/* Wheels */}
                    <g className="wheel-left">
                      <circle cx="47" cy="80" r="6" fill="#0f172a" />
                      <circle cx="47" cy="80" r="2.5" fill="#ffffff" />
                    </g>
                    <g className="wheel-right">
                      <circle cx="79" cy="80" r="6" fill="#0f172a" />
                      <circle cx="79" cy="80" r="2.5" fill="#ffffff" />
                    </g>

                    {/* Floating Heart / Surprise Badge */}
                    <g className="floating-heart-badge">
                      <circle cx="64" cy="27" r="10" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                      <path
                        d="M64 32.5S59.5 29.5 59.5 27A2.2 2.2 0 0 1 64 25.5A2.2 2.2 0 0 1 68.5 27C68.5 29.5 64 32.5 64 32.5Z"
                        fill="#ef4444"
                      />
                    </g>
                  </g>
                </svg>
              </div>

              {/* Modern Typography */}
              <h2 className="fw-bold text-dark mb-2" style={{ fontSize: '24px', letterSpacing: '-0.4px' }}>
                Your Shopping Cart is Empty
              </h2>
              <p className="text-muted mb-4 fs-14" style={{ lineHeight: '1.6' }}>
                You haven&apos;t added any items to your cart yet. Explore our verified safety equipment, certified
                helmets, protective footwear, and industrial gear.
              </p>

              {/* Action Buttons */}
              <div className="d-flex align-items-center justify-content-center gap-2.5 flex-wrap mb-4">
                <Link
                  href="/products"
                  className="btn btn-primary d-inline-flex align-items-center gap-2 px-4 fw-semibold"
                  style={{
                    height: '46px',
                    borderRadius: '10px',
                    backgroundColor: '#2563eb',
                    borderColor: '#2563eb',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                    fontSize: '14px',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  <span>Explore Catalog</span>
                </Link>

                <Link
                  href="/new-arrival-products"
                  className="btn btn-white border d-inline-flex align-items-center gap-2 px-4 fw-semibold text-dark"
                  style={{
                    height: '46px',
                    borderRadius: '10px',
                    borderColor: '#cbd5e1',
                    fontSize: '14px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span>View New Arrivals</span>
                </Link>
              </div>

              {/* Popular Categories Chips */}
              <div className="pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                <span className="text-muted fs-12 fw-medium text-uppercase d-block mb-2.5" style={{ letterSpacing: '0.5px' }}>
                  Quick Popular Categories
                </span>
                <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                  {[
                    { name: 'Helmets', link: '/products?category=Helmet' },
                    { name: 'Safety Shoes', link: '/products?category=Shoes' },
                    { name: 'Protective Vests', link: '/products?category=Vest' },
                    { name: 'Safety Gloves', link: '/products?category=Gloves' },
                  ].map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.link}
                      className="badge rounded-pill text-decoration-none fw-medium text-dark bg-light px-3 py-2 border"
                      style={{ borderColor: '#e2e8f0', fontSize: '12px' }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* CASE 2: CART HAS ITEMS (Exact Match with Reference Image)      */
            /* ============================================================== */
            <div className="row g-4 align-items-start">
              {/* Left Column: Cart Items List */}
              <div className="col-lg-8">
                <div className="cart-items-wrapper">
                  {cart.map((item, idx) => {
                    const price = Number(item.product.price) || 0;
                    const itemTotal = (price * item.quantity).toFixed(2);

                    // Resolve catalog match to get all available colors & sizes
                    const catalogMatch = findCatalogMatch(catalogProducts, item.product);

                    const availableColors: string[] = Array.from(
                      new Set(
                        [
                          ...(catalogMatch?.colors || []),
                          ...((item.product as any).colors || []),
                          ...(item.selectedColor ? [item.selectedColor] : []),
                        ].filter(Boolean)
                      )
                    );

                    const availableSizes: string[] = Array.from(
                      new Set(
                        [
                          ...(catalogMatch?.sizes || []),
                          ...((item.product as any).sizes || []),
                          ...(item.selectedSize ? [item.selectedSize] : []),
                        ].filter(Boolean)
                      )
                    );

                    const currentColor = item.selectedColor || (availableColors.length > 0 ? availableColors[0] : null);
                    const currentSize = item.selectedSize || (availableSizes.length > 0 ? availableSizes[0] : null);

                    return (
                      <div
                        key={`${item.product.id}-${item.selectedColor || ''}-${item.selectedSize || ''}-${idx}`}
                        className={`cart-item-row ${
                          idx !== cart.length - 1 ? 'border-bottom' : ''
                        }`}
                        style={{ borderColor: '#f1f5f9', padding: '22px 0' }}
                      >
                        {/* ------------------------------------------------------------- */}
                        {/* DESKTOP LAYOUT (>= 768px): Single line aligned with stepper   */}
                        {/* ------------------------------------------------------------- */}
                        <div className="d-none d-md-flex align-items-center justify-content-between gap-3">
                          {/* 1. Left: Image + Info with identical height and alignment */}
                          <div className="d-flex align-items-center gap-3" style={{ flex: '1 1 auto', minWidth: 0 }}>
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0 position-relative overflow-hidden"
                              style={{
                                width: '86px',
                                height: '86px',
                                minWidth: '86px',
                                minHeight: '86px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #f1f5f9',
                              }}
                            >
                              <img
                                src={item.product.image || '/assets/imgs/theme/placeholder.svg'}
                                alt={item.product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = '/assets/imgs/theme/placeholder.svg';
                                }}
                              />
                            </div>

                            <div
                              className="d-flex flex-column justify-content-between"
                              style={{
                                height: '86px',
                                width: 'auto',
                                maxWidth: '400px',
                                minWidth: 0,
                              }}
                            >
                              {/* Product Name (30 words max, max 2 lines, full name in tooltip) */}
                              <h5
                                className="mb-0 fw-bold text-dark fs-14"
                                style={{
                                  lineHeight: '1.42',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  wordBreak: 'break-word',
                                  paddingBottom: '2px',
                                }}
                                title={item.product.name}
                              >
                                <Link
                                  href={`/product-details?id=${item.product.id}`}
                                  className="text-dark text-decoration-none hover-primary"
                                  title={item.product.name}
                                >
                                  {formatProductTitle(item.product.name, 30)}
                                </Link>
                              </h5>

                              {/* All in ONE ROW with padding from heading: Color + Size + Ready To Collect */}
                              <div
                                className="d-flex align-items-center gap-2 flex-nowrap"
                                style={{ paddingTop: '8px' }}
                              >
                                {/* Static Color Badge (No interactive switcher in cart lineup) */}
                                {currentColor ? (
                                  <div
                                    className="d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                                    style={{
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      backgroundColor: '#ffffff',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      color: '#334155',
                                      height: '24px',
                                      lineHeight: 1,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: getColorHex(currentColor),
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        display: 'inline-block',
                                      }}
                                    />
                                    <span>Color: {currentColor}</span>
                                  </div>
                                ) : null}

                                {/* Static Size Badge (No interactive dropdown in cart lineup) */}
                                {currentSize ? (
                                  <div
                                    className="d-inline-flex align-items-center flex-shrink-0"
                                    style={{
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      backgroundColor: '#ffffff',
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      color: '#334155',
                                      height: '24px',
                                      lineHeight: 1,
                                    }}
                                  >
                                    <span>Size: {currentSize}</span>
                                  </div>
                                ) : null}

                                {/* Ready To Collect in the EXACT SAME ROW */}
                                <div
                                  className="d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#334155',
                                    height: '24px',
                                    lineHeight: 1,
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                  </svg>
                                  <span>Ready To Collect</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2. Middle: Quantity Stepper [ - ] 1 [ + ] */}
                          <div className="d-flex align-items-center gap-2 flex-shrink-0 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                  item.selectedColor,
                                  item.selectedSize
                                )
                              }
                              className="cart-qty-btn"
                              title="Decrease quantity"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <span className="cart-qty-sign">−</span>
                            </button>

                            <span className="fw-bold fs-14 text-dark text-center" style={{ minWidth: '24px' }}>
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                  item.selectedColor,
                                  item.selectedSize
                                )
                              }
                              className="cart-qty-btn"
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              <span className="cart-qty-sign">+</span>
                            </button>
                          </div>

                          {/* 3. Price */}
                          <div className="flex-shrink-0 text-end" style={{ minWidth: '95px' }}>
                            <span
                              className="fw-bold text-dark"
                              style={{ fontSize: '17px', letterSpacing: '-0.3px' }}
                            >
                              {itemTotal} SAR
                            </span>
                          </div>

                          {/* 4. Action Buttons: Eye (Quick View & Edit) + Delete */}
                          <div className="flex-shrink-0 d-flex align-items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openProductDrawer(item, idx)}
                              className="cart-item-quickview-btn"
                              title="Quick view & update product"
                              aria-label="View product details"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#64748b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                outline: 'none',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.color = '#2563eb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#64748b';
                              }}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(item.product.id, item.selectedColor, item.selectedSize)
                              }
                              className="cart-item-remove-btn"
                              title="Remove from cart"
                              aria-label="Remove item"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* ------------------------------------------------------------- */}
                        {/* MOBILE PHONE LAYOUT (< 768px): Exact Same Desktop Color Style */}
                        {/* ------------------------------------------------------------- */}
                        <div className="d-flex d-md-none align-items-start gap-3">
                          {/* Left: Thumbnail (matching height of stacked text) */}
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0 overflow-hidden"
                            style={{
                              width: '92px',
                              height: '92px',
                              minWidth: '92px',
                              minHeight: '92px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #f1f5f9',
                            }}
                          >
                            <img
                              src={item.product.image || '/assets/imgs/theme/placeholder.svg'}
                              alt={item.product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = '/assets/imgs/theme/placeholder.svg';
                              }}
                            />
                          </div>

                          {/* Right: Stacked Product Info */}
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            {/* Title (max 2 lines, 30 words max, tooltip) */}
                            <h5
                              className="mb-1 fw-bold text-dark fs-14"
                              style={{
                                lineHeight: '1.3',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word',
                              }}
                              title={item.product.name}
                            >
                              <Link href={`/product-details?id=${item.product.id}`} className="text-dark text-decoration-none" title={item.product.name}>
                                {formatProductTitle(item.product.name, 30)}
                              </Link>
                            </h5>

                            {/* Color Option & Size Box */}
                            <div className="d-flex align-items-center gap-1.5 flex-wrap mb-1.5">
                              {/* Static Color Badge (No interactive switcher on mobile) */}
                              {currentColor ? (
                                <div
                                  className="d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '5px',
                                    backgroundColor: '#ffffff',
                                    padding: '1px 6px',
                                    fontSize: '11px',
                                    color: '#334155',
                                    height: '22px',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      backgroundColor: getColorHex(currentColor),
                                      border: '1px solid rgba(0,0,0,0.1)',
                                      display: 'inline-block',
                                    }}
                                  />
                                  <span>Color: {currentColor}</span>
                                </div>
                              ) : null}

                              {/* Static Size Badge (No interactive dropdown on mobile) */}
                              {currentSize ? (
                                <div
                                  className="d-inline-flex align-items-center flex-shrink-0"
                                  style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '5px',
                                    backgroundColor: '#ffffff',
                                    padding: '1px 6px',
                                    fontSize: '11px',
                                    color: '#334155',
                                    height: '22px',
                                  }}
                                >
                                  <span>Size: {currentSize}</span>
                                </div>
                              ) : null}

                              {/* Ready To Collect in same row */}
                              <div
                                className="d-inline-flex align-items-center gap-1 flex-shrink-0"
                                style={{
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '5px',
                                  backgroundColor: '#ffffff',
                                  padding: '1px 6px',
                                  fontSize: '11px',
                                  color: '#334155',
                                  height: '22px',
                                  lineHeight: 1,
                                }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                                <span>Ready To Collect</span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="fw-bold text-dark fs-15 mb-2">
                              {itemTotal} SAR
                            </div>

                            {/* Bottom Row: Stepper on left, Trash icon on right (Same desktop colors: NO GREEN!) */}
                            <div className="d-flex align-items-center justify-content-between">
                              {/* Desktop-matching Stepper (White background, gray border, dark text: NO GREEN) */}
                              <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedSize)}
                                  className="cart-qty-btn"
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    minWidth: '30px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                    outline: 'none',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                                  }}
                                  disabled={item.quantity <= 1}
                                  aria-label="Decrease quantity"
                                >
                                  <span style={{ fontSize: '16px', lineHeight: 1, fontWeight: 600, color: '#334155' }}>−</span>
                                </button>
                                <span className="fw-bold text-dark text-center px-1" style={{ minWidth: '22px', fontSize: '13px' }}>
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedSize)}
                                  className="cart-qty-btn"
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    minWidth: '30px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                    outline: 'none',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                                  }}
                                  aria-label="Increase quantity"
                                >
                                  <span style={{ fontSize: '16px', lineHeight: 1, fontWeight: 600, color: '#334155' }}>+</span>
                                </button>
                              </div>

                              {/* Actions on right: Eye (Quick View & Edit) + Delete */}
                              <div className="d-flex align-items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openProductDrawer(item, idx)}
                                  className="cart-item-quickview-btn"
                                  title="Quick view & update product"
                                  aria-label="View product details"
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    color: '#64748b',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                    outline: 'none',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                                  }}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                </button>

                                {/* Desktop-matching Trash button (White background, gray border: NO GREEN) */}
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedSize)}
                                  className="cart-item-remove-btn"
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    color: '#64748b',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                    outline: 'none',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#ef4444';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.color = '#64748b';
                                  }}
                                  title="Remove from cart"
                                  aria-label="Remove item"
                                >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Bottom Row (Desktop ONLY: d-none d-md-flex removes it from mobile) */}
                <div className="d-none d-md-flex align-items-center justify-content-between flex-wrap gap-3 pt-4 border-top mt-4" style={{ borderColor: '#f1f5f9' }}>
                  <Link
                    href="/products"
                    className="btn btn-white border d-inline-flex align-items-center gap-2 px-3 fw-semibold text-dark rounded-3"
                    style={{
                      height: '42px',
                      borderColor: '#e2e8f0',
                      backgroundColor: '#ffffff',
                      fontSize: '13px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Back to Store</span>
                  </Link>

                  <div className="d-flex align-items-center gap-1.5 text-muted fs-13">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>Fixed delivery price on all in the cart</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="col-lg-4">
                <div
                  className="rounded-4 p-4 sticky-top border"
                  style={{
                    top: '100px',
                    backgroundColor: '#ffffff',
                    borderColor: '#edf0f3',
                    boxShadow: '0 2px 14px rgba(15, 23, 42, 0.03)',
                    zIndex: 10,
                  }}
                >
                  <span className="text-muted fs-12 fw-semibold text-uppercase d-block mb-1" style={{ letterSpacing: '0.5px' }}>
                    Total Amount
                  </span>
                  {/* Big Heading Price in SAR */}
                  <h2
                    className="fw-bold text-dark mb-4"
                    style={{ fontSize: '28px', letterSpacing: '-0.6px', lineHeight: 1 }}
                  >
                    {finalTotal.toFixed(2)} <span style={{ fontSize: '18px', fontWeight: 600 }}>SAR</span>
                  </h2>

                  {/* Actual breakdown list - NO dummy delivery/pickup lines */}
                  <div className="d-flex flex-column gap-2.5 mb-4 fs-14">
                    {/* Subtotal */}
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Subtotal ({totalCartItems} {totalCartItems === 1 ? 'item' : 'items'})</span>
                      <span className="fw-bold text-dark">{subtotal.toFixed(2)} SAR</span>
                    </div>

                    {/* VAT Info */}
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">VAT</span>
                      <span className="fw-medium text-dark">Inclusive (15%)</span>
                    </div>

                    {/* Promo Code Discount if applied */}
                    {appliedPromo && discountAmount > 0 && (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted">Discount ({appliedPromo.code})</span>
                        <span className="fw-bold text-dark">-{discountAmount.toFixed(2)} SAR</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Input - Styled with black button, well padded, no green */}
                  <div className="mb-4">
                    <form onSubmit={handleApplyPromo} className="d-flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          setPromoError('');
                        }}
                        placeholder="Promo code"
                        className="form-control fw-semibold"
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          borderColor: '#cbd5e1',
                          fontSize: '13.5px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          paddingLeft: '14px',
                        }}
                      />
                      <button
                        type="submit"
                        className="btn fw-semibold px-3.5 d-inline-flex align-items-center justify-content-center text-white"
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          backgroundColor: '#0f172a',
                          borderColor: '#0f172a',
                          fontSize: '13px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Apply
                      </button>
                    </form>

                    {promoError && <div className="text-danger fs-12 mt-1.5">{promoError}</div>}

                    {appliedPromo && (
                      <div
                        className="d-flex align-items-center justify-content-between mt-2.5 p-2 px-3 rounded-2"
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div className="d-flex align-items-center gap-1.5 fs-12 text-dark">
                          <span className="fw-bold">{appliedPromo.code}</span>
                          <span className="text-muted">({appliedPromo.percent}% off applied)</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="btn btn-sm p-0 text-muted fs-11 text-decoration-none hover-danger"
                          style={{ color: '#64748b' }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Total Line */}
                  <div
                    className="d-flex align-items-center justify-content-between pt-3 mb-4 border-top"
                    style={{ borderColor: '#f1f5f9' }}
                  >
                    <span className="fw-bold text-dark fs-16">Total</span>
                    <span className="fw-bold text-dark fs-18">{finalTotal.toFixed(2)} SAR</span>
                  </div>

                  {/* Solid Black Checkout Button matching user color code */}
                  <Link
                    href="/checkout"
                    className="btn w-100 fw-bold d-inline-flex align-items-center justify-content-center gap-2 text-white btn-checkout-black"
                    style={{
                      height: '50px',
                      borderRadius: '12px',
                      backgroundColor: '#0f172a',
                      borderColor: '#0f172a',
                      fontSize: '15px',
                      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.3px',
                    }}
                  >
                    <span>Checkout</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* QUICK VIEW & EDIT PRODUCT DRAWER (Slide Right to Left)        */}
      {/* ============================================================== */}
      {viewingDrawerItem && (() => {
        const item = viewingDrawerItem.item;
        const catalogMatch = findCatalogMatch(catalogProducts, item.product);

        // Check for multiple colors / sizes
        const availableColors: string[] = Array.from(
          new Set(
            [
              ...(catalogMatch?.colors || []),
              ...((item.product as any).colors || []),
            ].filter(Boolean)
          )
        );

        const availableSizes: string[] = Array.from(
          new Set(
            [
              ...(catalogMatch?.sizes || []),
              ...((item.product as any).sizes || []),
            ].filter(Boolean)
          )
        );

        const hasMultipleColors = availableColors.length > 1;
        const hasMultipleSizes = availableSizes.length > 1;
        const hasChangeableOptions = hasMultipleColors || hasMultipleSizes;

        // Collect real gallery images strictly for the selected color if mapped
        const activeColorKey = Object.keys(catalogMatch?.colorImages || {}).find(
          (k) => k.toLowerCase().trim() === (drawerSelectedColor || '').toLowerCase().trim()
        );
        const colorSpecificImgs =
          (activeColorKey && catalogMatch?.colorImages?.[activeColorKey]) ||
          (drawerSelectedColor && (catalogMatch?.colorImages as any)?.[drawerSelectedColor]) ||
          (drawerSelectedColor && (item.product as any)?.colorImages?.[drawerSelectedColor]) ||
          [];

        const validColorImgs = (Array.isArray(colorSpecificImgs) ? colorSpecificImgs : [])
          .filter((img: string) => img && typeof img === 'string' && img.trim() !== '');

        // If the selected color has its own gallery images, ONLY show that color's images!
        // Never mix with images from other colors!
        const allImages: string[] = validColorImgs.length > 0
          ? Array.from(new Set(validColorImgs))
          : Array.from(
              new Set(
                [
                  catalogMatch?.image,
                  ...(catalogMatch?.images || []),
                  item.product.image,
                  ...((item.product as any).images || []),
                ].filter((img: string) => img && typeof img === 'string' && img.trim() !== '')
              )
            );

        const safeIndex = Math.min(drawerActiveImageIdx, Math.max(0, allImages.length - 1));
        const currentDisplayImg = allImages[safeIndex] || '/assets/imgs/theme/placeholder.svg';

        const realDescription = catalogMatch?.desc || (item.product as any).desc || (item.product as any).description || '';

        return (
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1050, overscrollBehavior: 'none' }}
          >
            {/* Backdrop with fade-in and smooth fade-out on close */}
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(3px)',
                cursor: 'pointer',
                opacity: isDrawerClosing ? 0 : 1,
                transition: 'opacity 0.28s ease',
              }}
              onClick={closeProductDrawer}
            />

            {/* Slide-over Drawer Panel: Smooth slide from right to left on open, and slide back left to right on close */}
            <div
              className="position-fixed top-0 end-0 bg-white d-flex flex-column shadow-lg"
              style={{
                width: '100%',
                maxWidth: '520px',
                height: '100vh',
                maxHeight: '100vh',
                zIndex: 1051,
                boxShadow: '-12px 0 35px rgba(0, 0, 0, 0.22)',
                transform: isDrawerClosing ? 'translateX(100%)' : 'translateX(0)',
                transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: isDrawerClosing ? 'none' : 'slideRightToLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
              }}
            >
              {/* 1. Fixed Header with circular close button */}
              <div
                className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between bg-white flex-shrink-0"
                style={{ borderColor: '#f1f5f9', height: '68px', minHeight: '68px' }}
              >
                <div>
                  <span
                    className="text-muted text-uppercase fw-bold d-block"
                    style={{ fontSize: '11px', letterSpacing: '0.6px', lineHeight: 1.2 }}
                  >
                    {catalogMatch?.category || item.product.category || 'Product'}
                  </span>
                  <h5 className="mb-0 fw-bold text-dark fs-16 mt-0.5" style={{ letterSpacing: '-0.2px' }}>
                    {hasChangeableOptions ? 'Edit Product in Cart' : 'Product Details'}
                  </h5>
                </div>

                {/* Explicit, high-contrast Close Button */}
                <button
                  type="button"
                  onClick={closeProductDrawer}
                  aria-label="Close modal"
                  title="Close"
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    minHeight: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* 2. Scrollable Body: scrolls independently while header and footer stay fixed */}
              <div
                className="product-drawer-body p-3 p-md-4"
                style={{
                  flex: '1 1 0%',
                  minHeight: 0,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {/* Product Image Slider Container */}
                <div
                  className="rounded-4 mb-3 d-flex align-items-center justify-content-center position-relative overflow-hidden"
                  style={{
                    height: '270px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <img
                    src={currentDisplayImg}
                    alt={item.product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '12px',
                      transition: 'opacity 0.2s ease',
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = '/assets/imgs/theme/placeholder.svg';
                    }}
                  />

                  {/* Image Slide Navigation Controls (when multiple images) */}
                  {allImages.length > 1 && (
                    <>
                      {/* Left Arrow Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setDrawerActiveImageIdx((prev) =>
                            prev > 0 ? prev - 1 : allImages.length - 1
                          )
                        }
                        aria-label="Previous image"
                        title="Previous image"
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #cbd5e1',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#0f172a',
                          transition: 'all 0.15s ease',
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>

                      {/* Right Arrow Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setDrawerActiveImageIdx((prev) =>
                            prev < allImages.length - 1 ? prev + 1 : 0
                          )
                        }
                        aria-label="Next image"
                        title="Next image"
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #cbd5e1',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#0f172a',
                          transition: 'all 0.15s ease',
                          zIndex: 2,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>

                      {/* Image Counter Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          letterSpacing: '0.4px',
                          zIndex: 2,
                        }}
                      >
                        {safeIndex + 1} / {allImages.length}
                      </div>

                      {/* Slide Indicator Dots */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          zIndex: 2,
                        }}
                      >
                        {allImages.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            type="button"
                            onClick={() => setDrawerActiveImageIdx(dotIdx)}
                            aria-label={`Go to slide ${dotIdx + 1}`}
                            style={{
                              width: safeIndex === dotIdx ? '18px' : '6px',
                              height: '6px',
                              borderRadius: '3px',
                              backgroundColor: safeIndex === dotIdx ? '#0f172a' : '#cbd5e1',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail strip if multiple images */}
                {allImages.length > 1 && (
                  <div className="d-flex align-items-center gap-2 mb-3.5 overflow-x-auto pb-1">
                    {allImages.map((img, i) => {
                      const isActive = safeIndex === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setDrawerActiveImageIdx(i)}
                          className="rounded-3 flex-shrink-0"
                          style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: '#f8fafc',
                            border: isActive ? '2px solid #0f172a' : '1px solid #cbd5e1',
                            boxShadow: isActive ? '0 0 0 2px rgba(15, 23, 42, 0.15)' : 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <img
                            src={img}
                            alt="thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Product Title & Price */}
                <div className="mb-3">
                  <h4 className="fw-bold text-dark fs-16 mb-2" style={{ lineHeight: '1.4' }}>
                    {item.product.name}
                  </h4>
                  <div className="d-flex align-items-center gap-2.5 flex-wrap">
                    <span className="fw-bold text-dark fs-20">
                      {(Number(item.product.price) || 0).toFixed(2)} SAR
                    </span>
                    <span
                      className="badge rounded-pill fw-medium py-1 px-2.5"
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        fontSize: '11px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      📦 Ready To Collect
                    </span>
                  </div>
                </div>

                {/* Quick specs pill badges if available (Generously padded boxes) */}
                {(catalogMatch?.standard || catalogMatch?.gender || catalogMatch?.rating) && (
                  <div className="d-flex align-items-center gap-2.5 flex-wrap mb-3.5">
                    {catalogMatch?.standard && (
                      <span
                        className="d-inline-flex align-items-center gap-1.5 rounded-2"
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: 500,
                          color: '#334155',
                          lineHeight: 1.4,
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span>{catalogMatch.standard}</span>
                      </span>
                    )}
                    {catalogMatch?.gender && (
                      <span
                        className="d-inline-flex align-items-center rounded-2"
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: 500,
                          color: '#334155',
                          lineHeight: 1.4,
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <span>Gender: <strong style={{ color: '#0f172a', fontWeight: 600 }}>{catalogMatch.gender}</strong></span>
                      </span>
                    )}
                    {catalogMatch?.rating && (
                      <span
                        className="d-inline-flex align-items-center gap-1.5 rounded-2"
                        style={{
                          backgroundColor: '#fffdf5',
                          border: '1px solid #fef08a',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          color: '#854d0e',
                          lineHeight: 1.4,
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        <span style={{ color: '#eab308', fontSize: '13px' }}>★</span>
                        <strong style={{ fontWeight: 600 }}>{catalogMatch.rating}</strong>
                        {catalogMatch.reviews && <span style={{ color: '#a16207' }}>({catalogMatch.reviews})</span>}
                      </span>
                    )}
                  </div>
                )}

                {/* Divider only if there are options or specs */}
                <hr className="my-3" style={{ borderColor: '#f1f5f9' }} />

                {/* ========================================================== */}
                {/* COLOR CHANGE OPTION: ONLY SHOWN IF MULTIPLE COLORS (> 1)  */}
                {/* ========================================================== */}
                {hasMultipleColors && (
                  <div className="mb-3.5">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fs-13 fw-bold text-dark">
                        Color: <span className="text-primary">{drawerSelectedColor || availableColors[0]}</span>
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {availableColors.map((colorName) => {
                        const isSelected =
                          (drawerSelectedColor || availableColors[0]).toLowerCase() ===
                          colorName.toLowerCase();
                        const hex = getColorHex(colorName);
                        return (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => handleDrawerColorChange(colorName)}
                            className="d-flex align-items-center gap-2 py-1.5 px-3 rounded-3"
                            style={{
                              border: isSelected ? '2px solid #0f172a' : '1px solid #cbd5e1',
                              backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              boxShadow: isSelected ? '0 1px 4px rgba(15, 23, 42, 0.1)' : 'none',
                            }}
                          >
                            <span
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: hex,
                                border: '1px solid rgba(0,0,0,0.1)',
                                display: 'inline-block',
                              }}
                            />
                            <span className={`fs-12 ${isSelected ? 'fw-bold text-dark' : 'text-secondary'}`}>
                              {colorName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* SIZE CHANGE OPTION: ONLY SHOWN IF MULTIPLE SIZES (> 1)    */}
                {/* ========================================================== */}
                {hasMultipleSizes && (
                  <div className="mb-3.5">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fs-13 fw-bold text-dark">
                        Size: <span className="text-primary">{drawerSelectedSize || availableSizes[0]}</span>
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {availableSizes.map((sizeOption) => {
                        const isSelected =
                          (drawerSelectedSize || availableSizes[0]).toLowerCase() ===
                          sizeOption.toLowerCase();
                        return (
                          <button
                            key={sizeOption}
                            type="button"
                            onClick={() => setDrawerSelectedSize(sizeOption)}
                            className="py-1.5 px-3 rounded-3 fs-12 fw-medium"
                            style={{
                              border: isSelected ? '2px solid #0f172a' : '1px solid #cbd5e1',
                              backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {sizeOption}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* REAL PRODUCT DESCRIPTION & SPECIFICATIONS                 */}
                {/* ========================================================== */}
                <div className="mt-3">
                  <h6
                    className="fw-bold text-dark fs-12 text-uppercase mb-2"
                    style={{ letterSpacing: '0.5px' }}
                  >
                    Product Description
                  </h6>
                  <p className="text-secondary fs-13 mb-3" style={{ lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {realDescription ||
                      'Certified protective equipment manufactured according to heavy-duty industrial safety standards.'}
                  </p>

                  {/* Real Specifications if available */}
                  {catalogMatch?.specifications && catalogMatch.specifications.length > 0 && (
                    <div className="mt-3 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                      <h6
                        className="fw-bold text-dark fs-12 text-uppercase mb-2.5"
                        style={{ letterSpacing: '0.5px' }}
                      >
                        Technical Specifications & Features
                      </h6>
                      {catalogMatch.specifications.map((spec: any, sIdx: number) => (
                        <div key={sIdx} className="mb-3">
                          {spec.heading && (
                            <span className="fw-bold text-dark fs-13 d-block mb-1.5">
                              {spec.heading}
                            </span>
                          )}
                          {spec.description && (
                            <p className="text-muted fs-13 mb-2" style={{ lineHeight: '1.5' }}>
                              {spec.description}
                            </p>
                          )}
                          {spec.points && Array.isArray(spec.points) && (
                            <ul className="list-unstyled mb-0 ps-0 d-flex flex-column gap-1.5">
                              {spec.points.map((pt: any, pIdx: number) => {
                                const ptText = typeof pt === 'string' ? pt : pt.text || pt.heading;
                                return (
                                  <li
                                    key={pIdx}
                                    className="d-flex align-items-start gap-2 fs-13 text-secondary"
                                    style={{ lineHeight: '1.5' }}
                                  >
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#2563eb"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="flex-shrink-0 mt-1"
                                    >
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    <span>{ptText}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Footer: Truly fixed at the bottom */}
              <div
                className="p-3 px-4 border-top bg-white d-flex align-items-center gap-2.5 flex-shrink-0"
                style={{
                  borderColor: '#f1f5f9',
                  boxShadow: '0 -4px 15px rgba(0, 0, 0, 0.04)',
                  height: '76px',
                  minHeight: '76px',
                  backgroundColor: '#ffffff',
                  zIndex: 10,
                }}
              >
                {hasChangeableOptions ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleApplyDrawerUpdate(catalogMatch)}
                      className="btn flex-grow-1 text-white fw-bold d-inline-flex align-items-center justify-content-center gap-2"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a',
                        borderColor: '#0f172a',
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                        letterSpacing: '0.2px',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Apply & Update Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={closeProductDrawer}
                      className="btn border fw-semibold text-dark px-4 flex-shrink-0"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        borderColor: '#cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '13px',
                      }}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`/product-details?id=${catalogMatch?.id || item.product.id}`}
                      className="btn flex-grow-1 text-white fw-bold d-inline-flex align-items-center justify-content-center gap-2 text-decoration-none"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a',
                        borderColor: '#0f172a',
                        fontSize: '14px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                      }}
                    >
                      <span>View Full Product Page</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </Link>

                    <button
                      type="button"
                      onClick={closeProductDrawer}
                      className="btn border fw-semibold text-dark px-4 flex-shrink-0"
                      style={{
                        height: '46px',
                        borderRadius: '10px',
                        borderColor: '#cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '13px',
                      }}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        @keyframes slideRightToLeft {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .product-drawer-body {
          overflow-y: auto !important;
          flex: 1 1 0% !important;
          min-height: 0 !important;
          scrollbar-width: thin !important;
          scrollbar-color: #94a3b8 #f1f5f9 !important;
        }
        .product-drawer-body::-webkit-scrollbar {
          width: 6px !important;
        }
        .product-drawer-body::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
        }
        .product-drawer-body::-webkit-scrollbar-thumb {
          background: #94a3b8 !important;
          border-radius: 4px !important;
        }
        .product-drawer-body::-webkit-scrollbar-thumb:hover {
          background: #64748b !important;
        }
        .clear-cart-btn {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          padding: 6px 14px !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          outline: none !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
        }
        .clear-cart-btn svg {
          stroke: #0f172a !important;
          transition: stroke 0.2s ease !important;
        }
        .clear-cart-btn:hover {
          background-color: #f8fafc !important;
          border-color: #ef4444 !important;
          color: #ef4444 !important;
        }
        .clear-cart-btn:hover svg {
          stroke: #ef4444 !important;
        }
        .hover-primary:hover {
          color: #2563eb !important;
        }
        .hover-danger:hover {
          color: #dc2626 !important;
          transform: scale(1.15);
        }
        .btn-checkout-black:hover {
          background-color: #1e293b !important;
          border-color: #1e293b !important;
          color: #ffffff !important;
        }
        .cart-mobile-trash-btn:hover {
          color: #ef4444 !important;
          transform: scale(1.1);
        }
        .cart-item-remove-btn {
          width: 28px !important;
          height: 28px !important;
          border-radius: 6px !important;
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #64748b !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          padding: 0 !important;
          outline: none !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
        }
        .cart-item-remove-btn:hover {
          background-color: #ffffff !important;
          border-color: #ef4444 !important;
          color: #ef4444 !important;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15) !important;
        }
        .cart-qty-btn {
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          border-radius: 8px !important;
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
          padding: 0 !important;
          outline: none !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
        }
        .cart-qty-btn:hover:not(:disabled) {
          background-color: #f8fafc !important;
          border-color: #94a3b8 !important;
          color: #0f172a !important;
        }
        .cart-qty-btn:disabled {
          opacity: 0.35 !important;
          cursor: not-allowed !important;
        }
        .cart-qty-sign {
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 1 !important;
          color: #334155 !important;
          display: block !important;
          user-select: none !important;
        }

        /* Pure CSS Animated Cart (No square box, No shadow) */
        @keyframes cartFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-9px) rotate(-1.5deg);
          }
        }

        @keyframes badgeBob {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-4px) scale(1.1);
          }
        }

        @keyframes sparkleTwinkle {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.75);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes speedLinePulse {
          0%, 100% {
            opacity: 0.2;
            transform: translateX(0px);
          }
          50% {
            opacity: 0.9;
            transform: translateX(4px);
          }
        }

        .cart-floating-group {
          animation: cartFloat 3s ease-in-out infinite;
          transform-origin: center bottom;
        }

        .floating-heart-badge {
          animation: badgeBob 2.2s ease-in-out infinite;
          transform-origin: 64px 27px;
        }

        .sparkle-1 {
          animation: sparkleTwinkle 2s ease-in-out infinite;
          transform-origin: 96px 29px;
        }

        .sparkle-2 {
          animation: sparkleTwinkle 2.5s ease-in-out 0.4s infinite;
          transform-origin: 22px 39px;
        }

        .sparkle-3 {
          animation: sparkleTwinkle 1.8s ease-in-out 0.8s infinite;
        }

        .speed-line-1,
        .speed-line-2 {
          animation: speedLinePulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
