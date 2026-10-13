'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchProducts, recordProductClick } from '@/services/productsService';
import { ProductItem, CATEGORY_PRODUCTS_DATA } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { ProductCardImageSlider } from '@/components/common/ProductCardImageSlider';

// Helper function: Capitalizes every word while preserving known acronyms (EN, ANSI, ISO, etc.)
function toCapitalCase(text?: string): string {
  if (!text) return '';
  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (/^(en|ansi|iso|osha|ce|astm|ppe|us|uk|eu)$/i.test(word) || /^[a-zA-Z]{1,3}\d+$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function ProductDetailsContent() {
  const searchParams = useSearchParams();
  const productId = searchParams?.get('id');
  const { showToast } = useToast();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const [allProducts, setAllProducts] = useState<ProductItem[]>(CATEGORY_PRODUCTS_DATA);
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Product selection state
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'reviews' | 'shipping'>('overview');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Load products & find selected product
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const prods = await fetchProducts();
        if (isMounted) {
          const list = prods && prods.length > 0 ? prods : CATEGORY_PRODUCTS_DATA;
          setAllProducts(list);

          let found: ProductItem | undefined;
          if (productId) {
            found = list.find((p) => p.id === productId);
          }
          if (!found && list.length > 0) {
            found = list[0];
          }

          if (found) {
            setProduct(found);
            recordProductClick(found.id);

            // Initialize selections
            if (found.colors && found.colors.length > 0) {
              setSelectedColor(found.colors[0]);
            } else {
              setSelectedColor('');
            }

            if (found.sizes && found.sizes.length > 0) {
              setSelectedSize(found.sizes[0]);
            } else {
              setSelectedSize('US 9');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Gallery Images List (Checks active color photos first, falls back to cover image + angles)
  const galleryImages = useMemo(() => {
    if (!product) return [];

    // 1. Color-specific gallery photos
    if (selectedColor && product.colorImages && product.colorImages[selectedColor]) {
      const colorSpecific = product.colorImages[selectedColor].filter((u) => Boolean(u && u.trim()));
      if (colorSpecific.length > 0) {
        return colorSpecific;
      }
    }

    // 2. Main product cover + multi-angle images
    const baseImgs = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);
    const unique = Array.from(new Set(baseImgs));

    return unique;
  }, [product, selectedColor]);

  // Sync activeImageIdx if product or selected color changes
  useEffect(() => {
    setActiveImageIdx(0);
  }, [product?.id, selectedColor]);

  // Colors available for this product
  const colorOptions = useMemo(() => {
    if (!product) return [];
    const colors = product.colors || [];

    return colors.map((name, idx) => {
      // Find 1st photo of this color if merchant uploaded color-specific photos
      const colorSpecific = product.colorImages?.[name]?.filter((u) => Boolean(u && u.trim()));
      const preview = (colorSpecific && colorSpecific.length > 0)
        ? colorSpecific[0]
        : (galleryImages[idx % galleryImages.length] || product.image || '');

      return {
        name,
        preview,
      };
    });
  }, [product, galleryImages]);

  // Sizes available for this product
  const sizeOptions = useMemo(() => {
    if (!product) return [];
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    return ['7', '8', '9', '10', '11', '12'];
  }, [product]);

  // Handle color change (switches active color and sets active image to 1st photo)
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    setActiveImageIdx(0);
  };

  // Add to Cart Handler
  const handleAddToCart = () => {
    if (!product) return;

    const numPrice = Number(product.currentPrice || product.originalPrice || parseFloat(product.price?.replace(/[^\d.]/g, '') || '129'));
    const cartProduct: any = {
      id: Number(product.id.replace(/[^\d]/g, '')) || Math.floor(Math.random() * 10000) + 1,
      name: `${product.title} (${selectedColor}) - ${selectedSize}`,
      price: numPrice > 0 ? numPrice : 129,
      image: galleryImages[activeImageIdx] || product.image,
      category: product.category,
    };

    addToCart(cartProduct, 1);
    showToast('success', `Added "${product.title}" to cart!`);
  };

  // Wishlist handler
  const isWishlisted = product ? isInWishlist(Number(product.id.replace(/[^\d]/g, '')) || 1) : false;
  const handleWishlistToggle = () => {
    if (!product) return;
    const numId = Number(product.id.replace(/[^\d]/g, '')) || 1;
    toggleWishlist(numId);
    showToast('success', isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Related products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id && p.isActive !== false && p.category === product.category)
      .slice(0, 4);
  }, [product, allProducts]);

  if (isLoading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '600px' }}>
        <div className="spinner-border text-warning my-5" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading product...</span>
        </div>
        <p className="text-muted fw-semibold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '500px' }}>
        <div className="py-5">
          <i className="fi fi-rs-cross-circle text-danger" style={{ fontSize: '48px' }}></i>
          <h2 className="mt-3 fw-bold">Product Not Found</h2>
          <p className="text-muted">The product you are looking for is unavailable.</p>
          <Link href="/products" className="btn btn-warning rounded-pill px-4 mt-2">
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const currentPriceNum = product.currentPrice ?? product.originalPrice ?? parseFloat(product.price?.replace(/[^\d.]/g, '') || '0');
  const oldPriceVal = product.oldPrice?.replace(/[^\d.]/g, '') || '';
  const hasOffer = Boolean(product.isSpecialOffer || product.discount || product.offerPercent || product.oldPrice);
  const statusLabel = hasOffer
    ? (product.offerEndDate ? 'LIMITED SALE' : 'OFFER')
    : (product.isNewArrival ? 'NEW' : '');
  const statusStyle = product.offerEndDate
    ? { backgroundColor: '#d99400', color: '#ffffff' }
    : hasOffer
      ? { backgroundColor: '#e11d48', color: '#ffffff' }
      : { backgroundColor: '#16a34a', color: '#ffffff' };

  return (
    <div className="product-details-page-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '90px' }}>
      
      {/* 1. CLEAN BREADCRUMB ROW (Single line, matching target: Home > Men > Sneakers > Airion Pro X1) */}
      <div className="container pt-4 pb-3">
        <div className="d-flex align-items-center flex-wrap gap-2 text-capitalize" style={{ fontSize: '14px', color: '#64748b' }}>
          <Link href="/" className="text-decoration-none hover-dark" style={{ color: '#64748b' }}>
            Home
          </Link>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>›</span>
          <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="text-decoration-none hover-dark text-capitalize" style={{ color: '#64748b' }}>
            {toCapitalCase(product.category || 'Footwear')}
          </Link>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>›</span>
          <span style={{ color: '#64748b' }}>
            {toCapitalCase(product.standard ? product.standard.split('&')[0].trim() : 'Performance')}
          </span>
          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>›</span>
          <span className="fw-bold text-capitalize" style={{ color: '#0f172a' }}>
            {toCapitalCase(product.title)}
          </span>
        </div>
      </div>

      {/* 2. MAIN HERO SECTION */}
      <div className="container py-2">
        <div className="row g-4 g-xl-5 align-items-stretch">
          
          {/* ========================================================
              LEFT COLUMN: THUMBNAILS + MAIN IMAGE + FEATURE TILES
              ======================================================== */}
          <div className="col-12 col-lg-6">
            
            {/* Gallery Wrapper */}
            <div className="d-flex flex-row gap-3">
              
              {/* Vertical Thumbnails List (Left side, 5 items) */}
              <div 
                className="d-flex flex-column gap-2.5 flex-shrink-0"
                style={{
                  width: '76px',
                }}
              >
                {galleryImages.slice(0, 5).map((imgUrl, idx) => {
                  const isActive = activeImageIdx === idx;
                  const isLastWithMore = idx === 4 && galleryImages.length > 5;
                  const extraCount = galleryImages.length - 5;

                  return (
                    <button
                      key={`${imgUrl}-${idx}`}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className="p-1 position-relative text-start transition-all"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '3px',
                        border: isActive ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: isActive ? 'scale(1.02)' : 'none',
                        transition: 'opacity 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                      }}
                      title={`View perspective ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.title} angle ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          opacity: isActive ? 1 : 0.45,
                          transition: 'opacity 0.2s ease',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                        }}
                      />
                      {isLastWithMore && extraCount > 0 && (
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.65)',
                            borderRadius: '12px',
                            fontSize: '14px',
                          }}
                        >
                          +{extraCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Main Image Container (Rounded-4, Off-white bg, expand button, pagination dots) */}
              <div
                className="flex-grow-1 position-relative d-flex align-items-center justify-content-center overflow-hidden"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: '5px',
                  minHeight: '580px',
                  height: '580px',
                }}
              >
                {/* Fullscreen Expand Button (Top Right) */}
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="position-absolute top-0 end-0 m-4 btn border-0 d-flex align-items-center justify-content-center"
                  style={{
                    width: '42px',
                    minWidth: '42px',
                    height: '42px',
                    padding: 0,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    zIndex: 10,
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer',
                  }}
                  title="Fullscreen Zoom"
                >
                  <span aria-hidden="true" style={{ color: '#0f172a', fontSize: '24px', fontWeight: 700, lineHeight: 1 }}>⤢</span>
                </button>

                {/* Main Hero Product Image */}
                <div
                  className="w-100 h-100 d-flex align-items-center justify-content-center p-4 cursor-pointer"
                  onClick={() => setIsZoomOpen(true)}
                  title="Click to Zoom"
                >
                  <img
                    key={galleryImages[activeImageIdx]}
                    src={galleryImages[activeImageIdx] || product.image}
                    alt={product.title}
                    style={{
                      maxWidth: '92%',
                      maxHeight: '90%',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.07))',
                      transition: 'all 0.3s ease',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                    }}
                  />
                </div>

                {/* Bottom Pagination Dots (1 orange pill + round dots) */}
                <div
                  className="position-absolute bottom-0 start-50 translate-middle-x mb-4 d-flex align-items-center gap-1.5"
                  style={{ zIndex: 10 }}
                >
                  {galleryImages.slice(0, 5).map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveImageIdx(dotIdx)}
                      className="border-0 p-0 transition-all"
                      style={{
                        width: activeImageIdx === dotIdx ? '22px' : '7px',
                        height: '7px',
                        borderRadius: '4px',
                        backgroundColor: activeImageIdx === dotIdx ? '#0f172a' : '#cbd5e1',
                        cursor: 'pointer',
                      }}
                      title={`Slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================
              RIGHT COLUMN: PRODUCT DETAILS & BUY BOX
              ======================================================== */}
          <div className="col-12 col-lg-6">
            <div className="d-flex flex-column gap-3 ps-lg-1 h-100" style={{ minHeight: '580px' }}>
              
              {/* Badge: New Arrival or Discount */}
              <div>
                <span
                  className="badge px-3 py-1.5 rounded-pill fw-bold text-capitalize"
                  style={{
                    ...(statusLabel ? statusStyle : { backgroundColor: '#0f172a', color: '#ffffff' }),
                    border: 'none',
                    fontSize: '13px',
                    letterSpacing: '0.35px',
                    textTransform: 'capitalize',
                  }}
                >
                  {statusLabel || toCapitalCase(product.badge || 'Product')}
                </span>
              </div>

              {/* Product Title & Subtitle */}
              <div>
                <h1
                  className="fw-bold text-dark mb-1 text-capitalize"
                  style={{
                    fontSize: '34px',
                    letterSpacing: '-0.5px',
                    lineHeight: '1.15',
                    textTransform: 'capitalize',
                  }}
                >
                  {toCapitalCase(product.title)}
                </h1>
                <p className="text-muted mb-0" style={{ fontSize: '15px' }}>
                  {toCapitalCase(product.standard) || 'Performance Sneaker for Everyday Innovators'}
                </p>
              </div>

              {/* Star Rating Row */}
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex text-warning" style={{ fontSize: '18px', letterSpacing: '2px' }}>
                  ★★★★★
                </div>
                <span className="fw-bold text-dark" style={{ fontSize: '15px' }}>
                  {product.rating || '4.8'}
                </span>
                <span className="text-muted" style={{ fontSize: '14px' }}>
                  ({product.reviews || '128'} reviews)
                </span>
              </div>

              {/* Product price and its actual collection status */}
              <div className="d-flex flex-wrap align-items-center gap-3 my-1">
                <span
                  className="fw-bold text-dark"
                  style={{
                    fontSize: '40px',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {currentPriceNum} SR
                </span>
                {hasOffer && oldPriceVal && (
                  <span className="text-muted text-decoration-line-through" style={{ fontSize: '19px', color: '#94a3b8' }}>
                    {oldPriceVal} SR
                  </span>
                )}
                {statusLabel && (
                  <span className="badge px-3 py-2 fw-bold" style={{ ...statusStyle, fontSize: '13px', borderRadius: '5px', lineHeight: 1 }}>
                    {statusLabel}
                  </span>
                )}
                {hasOffer && product.discount && (
                  <span className="badge bg-dark text-white px-2 py-1 fw-bold" style={{ fontSize: '11px', borderRadius: '4px' }}>
                    {product.discount}
                  </span>
                )}
              </div>

              {/* Color Selection — shown only for products with color variants */}
              {colorOptions.length > 0 && <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center justify-content-between">
                  <span style={{ fontSize: '14px', color: '#0f172a' }}>
                    Color: <span className="fw-bold text-capitalize">{toCapitalCase(selectedColor)}</span>
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2.5">
                  {colorOptions.map((c) => {
                    const isSelected = selectedColor === c.name;

                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSelectColor(c.name)}
                        className="btn p-1 rounded-3 position-relative d-flex align-items-center justify-content-center transition-all"
                        style={{
                          width: '64px',
                          height: '56px',
                          backgroundColor: '#f8fafc',
                          border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                          borderRadius: '3px',
                          boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.14)' : 'none',
                          cursor: 'pointer',
                        }}
                        title={`Select color: ${c.name}`}
                      >
                        <img
                          src={c.preview}
                          alt={c.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>}

              {/* Size Selection */}
              <div className="d-flex flex-column gap-2 mt-1">
                <span style={{ fontSize: '14px', color: '#0f172a' }}>
                  Size: <span className="fw-bold text-uppercase">{toCapitalCase(selectedSize)}</span>
                </span>

                {/* Size Buttons Grid (Clean rounded boxes) */}
                <div className="d-flex flex-wrap gap-2">
                  {sizeOptions.map((s) => {
                    const isSelected = selectedSize === s;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className="btn fw-semibold transition-all"
                        style={{
                          width: '48px',
                          minWidth: '48px',
                          height: '40px',
                          padding: 0,
                          borderRadius: '3px',
                          fontSize: '14px',
                          backgroundColor: isSelected ? '#16a34a' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          border: isSelected ? 'none' : '1px solid #e2e8f0',
                          boxShadow: isSelected ? '0 4px 12px rgba(22, 163, 74, 0.28)' : 'none',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Add to Cart + Add to Wishlist */}
              <div className="d-flex align-items-center gap-3 pt-3 mt-auto">
                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm"
                  style={{
                    height: '54px',
                    backgroundColor: '#0f172a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '16px',
                    borderRadius: '14px',
                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.24)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  Add to Cart
                </button>

                {/* Add to Wishlist Button (matching reference) */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className="btn d-flex align-items-center justify-content-center gap-2 rounded-3 transition-all"
                  style={{
                    height: '54px',
                    padding: '0 24px',
                    backgroundColor: isWishlisted ? '#fff1f2' : '#ffffff',
                    border: isWishlisted ? '1.5px solid #fecdd3' : '1.5px solid #e2e8f0',
                    color: isWishlisted ? '#e11d48' : '#0f172a',
                    fontWeight: 600,
                    fontSize: '15px',
                    borderRadius: '14px',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={isWishlisted ? '#e11d48' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                  Add to Wishlist
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. ADDITIONAL DETAILS TABS */}
      <div className="container mt-5 pt-4">
        <div className="card border-0 rounded-4 p-3 p-md-4" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
          
          <div>
              <div>
                <div className="border-top mb-4" style={{ borderColor: '#e2e8f0' }}></div>
                <div className="mb-4 pb-4 border-bottom">
                  <h3 className="fw-bold text-dark mb-3" style={{ fontSize: '18px', lineHeight: '1.3' }}>Product Description</h3>
                  <p className="text-secondary fs-14 mb-0" style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                    {product.desc}
                  </p>
                </div>

                {(product.specifications || []).length === 0 ? (
                  <p className="text-muted fs-14 mb-0">No technical specifications have been added for this product.</p>
                ) : (
                  <div className="d-flex flex-column gap-4">
                    {product.specifications?.map((section) => (
                      <div key={section.id} className="pb-3 border-bottom">
                        <h3 className="fw-bold text-dark mb-3" style={{ fontSize: '18px', lineHeight: '1.3' }}>Product Specification</h3>

                        {section.type === 'description' ? (
                          <p className="text-muted fs-14 mb-0" style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                            {section.description}
                          </p>
                        ) : (
                          <div className="row g-3 mt-1">
                            {section.points?.map((point) => (
                              <div key={point.id} className="col-12 col-md-6">
                                <div className="rounded-3 border h-100 d-flex align-items-start gap-2.5" style={{ padding: '14px 16px', backgroundColor: 'transparent', borderColor: '#e2e8f0' }}>
                                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white" style={{ width: '22px', height: '22px', backgroundColor: '#0f172a', marginTop: '2px' }}>
                                    <iconify-icon icon="solar:check-circle-bold" class="fs-14"></iconify-icon>
                                  </div>
                                  <div>
                                    {point.heading && <strong className="d-block text-dark fs-13 mb-0.5">{point.heading}</strong>}
                                    <span className="fs-13" style={{ lineHeight: '1.45', color: '#0f172a' }}>{point.text}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            {activeTab === 'reviews' && (
              <div>
                <div className="d-flex align-items-center gap-4 mb-4 pb-3 border-bottom">
                  <div>
                    <h2 className="fw-bold text-dark mb-0" style={{ fontSize: '42px' }}>
                      {product.rating || '4.8'}
                    </h2>
                    <div className="text-warning" style={{ fontSize: '18px' }}>★★★★★</div>
                    <span className="text-muted" style={{ fontSize: '13px' }}>Based on {product.reviews || '128'} reviews</span>
                  </div>
                  <div className="flex-grow-1 border-start ps-4">
                    <p className="text-muted mb-1" style={{ fontSize: '14px' }}>
                      98% of customers recommend this product for performance and comfort.
                    </p>
                  </div>
                </div>

                <div className="d-flex flex-column gap-3">
                  <div className="p-3 rounded-3" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold text-dark">Ahmed Al-Mansoor</span>
                      <span className="text-muted" style={{ fontSize: '12px' }}>2 days ago</span>
                    </div>
                    <div className="text-warning mb-2" style={{ fontSize: '13px' }}>★★★★★</div>
                    <p className="text-secondary mb-0" style={{ fontSize: '14px' }}>
                      Outstanding build quality. Fits perfectly and very comfortable for long hours. Highly recommend.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div>
                <h4 className="fw-bold text-dark mb-3">Delivery & Returns Information</h4>
                <div className="row g-4">
                  <div className="col-12 col-md-6">
                    <h6 className="fw-bold text-dark">Fast Domestic Delivery</h6>
                    <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.7' }}>
                      Orders placed before 2:00 PM are dispatched same-day. Standard shipping takes 1 to 3 business days.
                    </p>
                  </div>
                  <div className="col-12 col-md-6">
                    <h6 className="fw-bold text-dark">Hassle-Free 30-Day Returns</h6>
                    <p className="text-secondary" style={{ fontSize: '14px', lineHeight: '1.7' }}>
                      If the size or fit isn&apos;t optimal, initiate a free return or exchange within 30 days of receiving your package.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div className="container mt-5 pt-3">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h3 className="fw-bold text-dark mb-1">Related Products</h3>
              <p className="text-muted mb-0 text-capitalize" style={{ fontSize: '14px' }}>
                More items from {toCapitalCase(product.category)}
              </p>
            </div>
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="btn px-4 btn-sm fw-semibold"
              style={{ borderRadius: '5px', backgroundColor: '#0f172a', borderColor: '#0f172a', color: '#ffffff' }}
            >
              View All {toCapitalCase(product.category)}
            </Link>
          </div>

          <div className="row g-3 g-md-4">
            {relatedProducts.map((rel) => {
              const relCurrentPrice = rel.currentPrice ?? rel.originalPrice ?? parseFloat(rel.price?.replace(/[^\d.]/g, '') || '0');
              const relHasOffer = Boolean(rel.isSpecialOffer || rel.discount || rel.offerPercent || rel.oldPrice);
              const relIsLimited = Boolean(rel.offerEndDate);
              const relIsNew = !relHasOffer && Boolean(rel.isNewArrival || rel.badgeClass === 'new' || rel.badge === 'New Arrival');
              const relStatus = relIsLimited ? 'LIMITED SALE' : relHasOffer ? 'OFFER' : relIsNew ? 'NEW' : '';
              const relStatusStyle = relIsLimited
                ? { backgroundColor: '#d99400', color: '#ffffff' }
                : relHasOffer
                  ? { backgroundColor: '#e11d48', color: '#ffffff' }
                  : { backgroundColor: '#16a34a', color: '#ffffff' };

              return <div key={rel.id} className="col-12 col-sm-6 col-lg-3">
                <div className="product-cart-wrap uniform-product-card w-100 d-flex flex-column">
                  <div className="product-img-action-wrap position-relative">
                    {relStatus && <span className="ref-card-badge" style={relStatusStyle}>{relStatus}</span>}
                    <ProductCardImageSlider
                      productId={rel.id}
                      title={toCapitalCase(rel.title)}
                      link={`/product-details?id=${rel.id}`}
                      image={rel.image}
                      images={rel.images}
                      onProductClick={recordProductClick}
                    />
                  </div>
                  <div className="product-content-wrap d-flex flex-column flex-grow-1 justify-content-between">
                    <div>
                      <h2 className="new-prod-title">
                        <Link href={`/product-details?id=${rel.id}`} className="text-dark text-decoration-none">
                          {toCapitalCase(rel.title)}
                        </Link>
                      </h2>
                      <div className="product-rate d-flex align-items-center mb-2">
                        <span style={{ color: '#0f172a', fontSize: '13px', letterSpacing: '1px' }}>★★★★★</span>
                        <span className="rating-score fw-bold ms-2" style={{ fontSize: '13px', color: '#0f172a' }}>{rel.rating}</span>
                        <span className="rating-reviews ms-2" style={{ fontSize: '13px', color: '#64748b' }}>({rel.reviews})</span>
                      </div>
                      <div className="new-prod-price-box mb-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="new-prod-current-price">{relCurrentPrice} SR</span>
                          {relHasOffer && rel.oldPrice && <span className="new-prod-old-price">{rel.oldPrice}</span>}
                          {relStatus && <span className="badge" style={{ ...relStatusStyle, fontSize: '11px', padding: '4px 7px' }}>{relStatus}</span>}
                          {relHasOffer && rel.discount && <span className="badge bg-dark text-white" style={{ fontSize: '11px', padding: '4px 7px' }}>{rel.discount}</span>}
                        </div>
                        <div className="new-prod-vat-label">Inclusive of VAT</div>
                      </div>
                      <p className="new-prod-desc">{rel.desc}</p>
                      <div className="mb-2"><span className="express-delivery-badge"><i className="fi-rs-bolt"></i>Express Delivery</span></div>
                    </div>
                    <div className="product-card-bottom d-flex align-items-center gap-2 mt-auto">
                      <Link href="/cart" className="btn-add-cart-wide">Add to Cart</Link>
                      <button type="button" aria-label="Add to wishlist" className="btn-wishlist-square"><i className="fi-rs-heart"></i></button>
                    </div>
                  </div>
                </div>
              </div>;
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isZoomOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 9999,
            backgroundColor: 'rgb(0 0 0 / 53%)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => {
            setIsZoomOpen(false);
            setZoomScale(1);
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsZoomOpen(false);
              setZoomScale(1);
            }}
            className="position-absolute top-0 end-0 m-4 btn border-0 d-flex align-items-center justify-content-center"
            style={{
              width: '44px',
              minWidth: '44px',
              height: '44px',
              padding: 0,
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              zIndex: 10001,
            }}
            title="Close Zoom View"
          >
            ✕
          </button>

          <div
            className="d-flex align-items-center justify-content-center p-4 overflow-hidden"
            style={{ maxWidth: '90vw', maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[activeImageIdx] || product.image}
              alt={product.title}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                transform: `scale(${zoomScale})`,
                transition: 'transform 0.2s ease',
                cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
              }}
              onClick={() => setZoomScale((s) => (s === 1 ? 1.75 : 1))}
            />
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {isSizeGuideOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="bg-white rounded-4 p-4 shadow-lg"
            style={{ maxWidth: '580px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Measurement & Size Guide</h5>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="btn btn-light rounded-circle p-0"
                style={{ width: '32px', height: '32px' }}
              >
                ✕
              </button>
            </div>
            <p className="text-muted" style={{ fontSize: '13px' }}>
              Standard sizing chart. If you are between sizes, we recommend selecting the larger size for enhanced comfort.
            </p>

            <div className="table-responsive">
              <table className="table table-sm table-bordered text-center" style={{ fontSize: '13px' }}>
                <thead className="table-light">
                  <tr>
                    <th>US</th>
                    <th>UK</th>
                    <th>EU</th>
                    <th>Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">7</td>
                    <td>6.5</td>
                    <td>40</td>
                    <td>25.0 cm</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">8</td>
                    <td>7.5</td>
                    <td>41</td>
                    <td>26.0 cm</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">9</td>
                    <td>8.5</td>
                    <td>42.5</td>
                    <td>27.0 cm</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">10</td>
                    <td>9.5</td>
                    <td>44</td>
                    <td>28.0 cm</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">11</td>
                    <td>10.5</td>
                    <td>45</td>
                    <td>29.0 cm</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">12</td>
                    <td>11.5</td>
                    <td>46</td>
                    <td>30.0 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="btn btn-dark rounded-pill px-4"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center" style={{ minHeight: '600px' }}>
          <div className="spinner-border text-warning my-5" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading product...</span>
          </div>
        </div>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}
