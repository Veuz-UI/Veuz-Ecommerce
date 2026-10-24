'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { fetchProducts, getCachedProducts } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';
import { getDeliveryBadgeProps } from '@/utils/deliveryBadge';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { wishlist, toggleWishlist, clearWishlist, addToCart } = useStore();
  const { showToast } = useToast();

  const [allProducts, setAllProducts] = useState<ProductItem[]>(() => getCachedProducts());
  const [productsLoading, setProductsLoading] = useState(true);

  // Load catalog products to match wishlisted IDs
  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((prods) => {
        if (isMounted && Array.isArray(prods) && prods.length > 0) {
          setAllProducts(prods);
        }
      })
      .catch((err) => console.warn('Could not load products for wishlist:', err))
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products matching current wishlist IDs
  const wishlistedProducts = useMemo(() => {
    if (!wishlist || wishlist.length === 0 || allProducts.length === 0) return [];
    return allProducts.filter((p) => {
      const numId = Number(String(p.id).replace(/[^\d]/g, '')) || 0;
      return wishlist.includes(numId);
    });
  }, [wishlist, allProducts]);

  // Handle adding an individual item to cart from wishlist
  const handleAddToCart = (product: ProductItem) => {
    const rawPrice = product.currentPrice || product.price;
    const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '129').replace(/[^\d.]/g, '')) || 129;
    const idNum = Number(String(product.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 100000) + 1;

    const cartProduct: any = {
      id: idNum,
      name: product.title,
      price: numPrice > 0 ? numPrice : 129,
      image: product.image || (product.images && product.images[0]) || '/assets/imgs/theme/placeholder.svg',
      category: product.category || 'Safety Equipment',
    };

    const chosenColor = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0] : undefined;
    const chosenSize = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : undefined;

    addToCart(cartProduct, 1, chosenColor, chosenSize);
  };

  // Handle adding all wishlisted items to cart
  const handleAddAllToCart = () => {
    if (wishlistedProducts.length === 0) return;
    wishlistedProducts.forEach((p) => handleAddToCart(p));
    showToast('success', `Added ${wishlistedProducts.length} items to your shopping cart.`, 'Cart Updated');
  };

  return (
    <main className="main py-4 py-md-5" style={{ backgroundColor: '#ffffff', minHeight: '85vh' }}>
      <div className="container">
        {/* Full-width Unified White Card Container (Matching Cart Page Layout) */}
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
            <span className="text-dark fw-medium">Your Wishlist</span>
          </div>

          {/* 2. Page Header INSIDE the white card */}
          <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom flex-wrap gap-3" style={{ borderColor: '#f1f5f9' }}>
            <h1
              className="fw-bold mb-0 text-dark d-flex align-items-center gap-2"
              style={{ fontSize: '24px', letterSpacing: '-0.5px' }}
            >
              Your Wishlist
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
                {wishlistedProducts.length}
              </span>
            </h1>

            {wishlistedProducts.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                {/* Add All to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="btn btn-dark fw-semibold d-inline-flex align-items-center gap-2 px-3 py-2 text-white shadow-sm"
                  style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    fontSize: '13px',
                    height: '38px',
                    border: '1px solid #0f172a',
                    transition: 'all 0.2s ease',
                  }}
                  title="Add all items to your shopping cart"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span>Add All to Cart</span>
                </button>

                {/* Clear Wishlist Button (Matching Cart Page "Clear Cart" style) */}
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="clear-cart-btn"
                  title="Clear all items from your wishlist"
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
                    height: '38px',
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
                  <span style={{ color: 'inherit' }}>Clear Wishlist</span>
                </button>
              </div>
            )}
          </div>

          {/* Guest User Sign-In Banner inside Wishlist */}
          {!user && (
            <div
              className="d-flex align-items-center justify-content-between p-3 p-md-3.5 mb-4 rounded-3 border flex-wrap gap-3"
              style={{
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '42px', height: '42px', backgroundColor: '#fee2e2', color: '#ef4444' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark fs-14">Keep your favorites permanently</h6>
                  <p className="mb-0 text-muted fs-12">Sign in to sync your personal wishlist across all devices and access it anytime.</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Link
                  href="/login?redirect=/wishlist"
                  className="btn fw-semibold px-3 py-1.5 text-white"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#0f172a',
                    borderRadius: '8px',
                    fontSize: '13px',
                    height: '38px',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/register?redirect=/wishlist"
                  className="btn btn-outline-secondary fw-semibold px-3 py-1.5"
                  style={{
                    borderRadius: '8px',
                    fontSize: '13px',
                    height: '38px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    backgroundColor: '#ffffff',
                  }}
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CASE 1: WISHLIST IS EMPTY (Animated Heart Vector Illustration) */}
          {/* ============================================================== */}
          {wishlistedProducts.length === 0 ? (
            <div className="py-4 py-md-5 text-center mx-auto" style={{ maxWidth: '640px' }}>
              {/* Animated Floating Heart Icon with Accents */}
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
                    <path d="M96 22L98 27L103 29L98 31L96 36L94 31L89 29L94 27L96 22Z" fill="#ef4444" />
                  </g>
                  <g className="sparkle-2">
                    <path d="M22 34L23.5 38L27.5 39.5L23.5 41L22 45L20.5 41L16.5 39.5L20.5 38L22 34Z" fill="#f59e0b" />
                  </g>
                  <g className="sparkle-3">
                    <circle cx="98" cy="50" r="2.5" fill="#ec4899" />
                    <circle cx="20" cy="62" r="2" fill="#3b82f6" />
                  </g>

                  {/* Soft Background Circular Halo */}
                  <circle cx="60" cy="62" r="38" fill="#fef2f2" stroke="#fee2e2" strokeWidth="2" />

                  {/* Main Heart Shape with Glossy Gradient */}
                  <path
                    d="M60 84C60 84 35 68 35 49C35 40 42 33 51 33C56.5 33 60 36.5 60 36.5C60 36.5 63.5 33 69 33C78 33 85 40 85 49C85 68 60 84 60 84Z"
                    fill="#ef4444"
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Heart Inner Highlight Shimmer */}
                  <path
                    d="M44 42C44 38 47 36 50 36"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Modern Typography */}
              <h2 className="fw-bold text-dark mb-2" style={{ fontSize: '24px', letterSpacing: '-0.4px' }}>
                Your Wishlist is Empty
              </h2>
              <p className="text-muted mb-4 fs-14" style={{ lineHeight: '1.6' }}>
                You haven&apos;t saved any favorites yet. Explore our verified industrial safety gear, certified helmets,
                protective footwear, and accessories. Click the heart icon on any product to save it right here.
              </p>

              {/* Action Buttons */}
              <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                <Link
                  href="/products"
                  className="btn btn-dark d-inline-flex align-items-center gap-2 px-4 fw-semibold text-white shadow-sm"
                  style={{
                    height: '46px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    fontSize: '14px',
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span>Explore Products</span>
                </Link>

                <Link
                  href="/new-arrival-products"
                  className="btn btn-white border d-inline-flex align-items-center gap-2 px-4 fw-semibold text-dark shadow-sm"
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
            </div>
          ) : (
            /* ============================================================== */
            /* CASE 2: WISHLIST HAS ITEMS (Unified Full-Width List)           */
            /* ============================================================== */
            <div className="wishlist-items-wrapper">
              {wishlistedProducts.map((prod, idx) => {
                const rawPrice = prod.currentPrice || prod.price;
                const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '129').replace(/[^\d.]/g, '')) || 129;
                const numId = Number(String(prod.id).replace(/[^\d]/g, '')) || 1;
                const deliveryProps = getDeliveryBadgeProps(prod.deliveryOptionName);

                return (
                  <div
                    key={prod.id || idx}
                    className={`wishlist-item-row product-card-animate-wrap ${idx !== wishlistedProducts.length - 1 ? 'border-bottom' : ''}`}
                    style={{
                      borderColor: '#f1f5f9',
                      padding: '22px 0',
                      animationDelay: `${Math.min(idx % 10, 9) * 0.05}s`,
                    }}
                  >
                    {/* DESKTOP LAYOUT (>= 768px): Clean Single Line Row */}
                    <div className="d-none d-md-flex align-items-center justify-content-between gap-3">
                      {/* 1. Left: Product Image + Information */}
                      <div className="d-flex align-items-center gap-3" style={{ flex: '1 1 auto', minWidth: 0 }}>
                        {/* Thumbnail */}
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
                            src={prod.image || (prod.images && prod.images[0]) || '/assets/imgs/theme/placeholder.svg'}
                            alt={prod.title}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/assets/imgs/theme/placeholder.svg';
                            }}
                          />
                        </div>

                        {/* Title, Category & Stock Badge */}
                        <div
                          className="d-flex flex-column justify-content-between"
                          style={{
                            minHeight: '80px',
                            maxWidth: '480px',
                            minWidth: 0,
                          }}
                        >
                          <div>
                            <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1" style={{ letterSpacing: '0.4px' }}>
                              {prod.category || 'Safety Equipment'}
                            </span>
                            <Link
                              href={`/product-details?id=${prod.id}`}
                              className="fw-bold text-dark text-decoration-none hover-primary fs-14 text-truncate-2 d-block"
                              style={{ lineHeight: '1.4' }}
                              title={prod.title}
                            >
                              {prod.title}
                            </Link>
                          </div>

                          {/* Status and Delivery Tags */}
                          <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                            <span
                              className="badge rounded-pill fw-semibold px-2 py-0.5"
                              style={{ backgroundColor: '#ecfdf5', color: '#059669', fontSize: '11px' }}
                            >
                              In Stock
                            </span>
                            {deliveryProps && (
                              <span
                                className={`badge rounded-pill fw-medium px-2 py-0.5 ${deliveryProps.className || 'standard-delivery-badge'}`}
                                style={{ fontSize: '11px' }}
                              >
                                {deliveryProps.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Middle: Unit Price */}
                      <div className="text-center px-4" style={{ minWidth: '130px' }}>
                        <span className="fs-11 text-muted text-uppercase fw-semibold d-block mb-0.5">Price</span>
                        <div className="fw-bold text-dark fs-16">
                          {numPrice.toFixed(2)} <span className="fs-12 fw-normal text-muted">SAR</span>
                        </div>
                      </div>

                      {/* 3. Right: Favorite Heart Icon + Add to Cart + Remove Trash */}
                      <div className="d-flex align-items-center justify-content-end gap-2" style={{ minWidth: '220px' }}>
                        {/* Active Favorited Heart Icon */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(numId)}
                          className="btn p-0 d-inline-flex align-items-center justify-content-center shadow-sm"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fee2e2',
                            color: '#ef4444',
                            transition: 'all 0.2s ease',
                          }}
                          title="Favorited item (Click to remove from favorites)"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToCart(prod)}
                          className="btn btn-dark fw-semibold text-white d-inline-flex align-items-center gap-1.5 px-3 shadow-sm"
                          style={{
                            height: '38px',
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            fontSize: '13px',
                            border: '1px solid #0f172a',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                          </svg>
                          <span>Add to Cart</span>
                        </button>

                        {/* Delete Trash Button */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(numId)}
                          className="btn p-0 d-inline-flex align-items-center justify-content-center"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#64748b',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                          title="Remove from wishlist"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* MOBILE LAYOUT (< 768px): Compact Stacked Card */}
                    <div className="d-flex d-md-none flex-column gap-3">
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center p-2 flex-shrink-0"
                          style={{ width: '74px', height: '74px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}
                        >
                          <img
                            src={prod.image || (prod.images && prod.images[0]) || '/assets/imgs/theme/placeholder.svg'}
                            alt={prod.title}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/assets/imgs/theme/placeholder.svg';
                            }}
                          />
                        </div>

                        <div className="flex-grow-1 min-w-0">
                          <span className="text-muted fs-11 text-uppercase fw-semibold d-block mb-1">
                            {prod.category || 'Safety Equipment'}
                          </span>
                          <Link
                            href={`/product-details?id=${prod.id}`}
                            className="fw-bold text-dark text-decoration-none hover-primary fs-13 d-block text-truncate-2"
                            style={{ lineHeight: '1.3' }}
                          >
                            {prod.title}
                          </Link>
                          <div className="fw-bold text-dark fs-15 mt-1.5">
                            {numPrice.toFixed(2)} <span className="fs-11 text-muted fw-normal">SAR</span>
                          </div>
                        </div>

                        {/* Mobile Favorite Heart Button */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(numId)}
                          className="btn p-0 d-inline-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fee2e2',
                            color: '#ef4444',
                          }}
                          title="Remove from favorites"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      </div>

                      {/* Mobile Actions: Add to Cart + Remove */}
                      <div className="d-flex align-items-center gap-2 pt-2 border-top" style={{ borderColor: '#f8fafc' }}>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(prod)}
                          className="btn btn-dark fw-semibold text-white d-inline-flex align-items-center justify-content-center gap-1.5 flex-grow-1"
                          style={{
                            height: '38px',
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            fontSize: '13px',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                          </svg>
                          <span>Add to Cart</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleWishlist(numId)}
                          className="btn btn-outline-danger p-0 d-inline-flex align-items-center justify-content-center"
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            borderColor: '#fee2e2',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                          }}
                          title="Remove from wishlist"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
