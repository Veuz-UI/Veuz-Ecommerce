'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, Pin, Star, ThumbsUp, ThumbsDown, Pencil } from 'lucide-react';
import { fetchProducts, getCachedProducts, recordProductClick } from '@/services/productsService';
import { ProductItem, SYSTEM_COLORS } from '@/data/categoryProductsData';
import type { ProductReview, ReviewSummary } from '@/app/api/reviews/route';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { ProductCardImageSlider } from '@/components/common/ProductCardImageSlider';
import { getDeliveryBadgeProps } from '@/utils/deliveryBadge';

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

function getProductColorInfo(colorName: string): { hex: string; border?: string } {
  const normalized = colorName.trim().toLowerCase();
  const found = SYSTEM_COLORS.find((c) => c.name.toLowerCase() === normalized);
  if (found) {
    return { hex: found.hex, border: found.border };
  }
  const map: Record<string, { hex: string; border?: string }> = {
    yellow: { hex: '#eab308' },
    orange: { hex: '#f97316' },
    grey: { hex: '#64748b' },
    gray: { hex: '#64748b' },
    navy: { hex: '#1e3a8a' },
    brown: { hex: '#78350f' },
  };
  return map[normalized] || { hex: '#94a3b8' };
}

interface RelatedProductCardProps {
  rel: ProductItem;
  isInWishlist: (id: number) => boolean;
  onAddToCart: (item: ProductItem, selectedColor?: string) => void;
  onToggleWishlist: (item: ProductItem) => void;
  onProductClick: (id: string) => void;
}

function RelatedProductCardItem({
  rel,
  isInWishlist,
  onAddToCart,
  onToggleWishlist,
  onProductClick,
}: RelatedProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    if (Array.isArray(rel.colors) && rel.colors.length > 0) {
      if (!selectedColor || !rel.colors.some((c) => c.toLowerCase() === selectedColor.toLowerCase())) {
        setSelectedColor(rel.colors[0]);
      }
    }
  }, [rel.colors]);

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

  const relNumId = Number(rel.id.replace(/[^\d]/g, '')) || 0;
  const isWishlisted = isInWishlist(relNumId);
  const deliveryProps = getDeliveryBadgeProps(rel.deliveryOptionName);

  return (
    <div className="product-cart-wrap uniform-product-card w-100 d-flex flex-column h-100">
      {/* Top Image Slider & Badges */}
      <div className="product-img-action-wrap position-relative">
        {relStatus && (
          <span className="ref-card-badge" style={relStatusStyle}>
            {relStatus}
          </span>
        )}

        {/* Top-Right Circular View Button */}
        <Link
          href={`/product-details?id=${rel.id}`}
          className="ref-card-top-view"
          aria-label="View Product Details"
          title="View Product Details"
          onClick={() => onProductClick(rel.id)}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" fill="#334155" />
          </svg>
        </Link>

        <ProductCardImageSlider
          productId={rel.id}
          title={toCapitalCase(rel.title)}
          link={`/product-details?id=${rel.id}`}
          image={
            (selectedColor && rel.colorImages?.[selectedColor]?.[0]) ||
            (rel.image && !rel.image.includes('p1.jpg') ? rel.image : (rel.images && rel.images[0]) || '')
          }
          images={rel.images}
          colorImages={rel.colorImages}
          selectedColor={selectedColor}
          onProductClick={onProductClick}
        />
      </div>

      {/* Content */}
      <div className="product-content-wrap d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          {/* Delivery & Gender Badges on Top */}
          <div className="d-flex align-items-center gap-1.5 mb-2 flex-wrap">
            <span className={deliveryProps.className}>
              <i className={deliveryProps.icon}></i>
              {deliveryProps.label}
            </span>
            {rel.gender && (
              <span className="product-gender-badge">
                {rel.gender}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h2 className="new-prod-title">
            <Link
              href={`/product-details?id=${rel.id}`}
              onClick={() => onProductClick(rel.id)}
              className="text-dark text-decoration-none"
            >
              {toCapitalCase(rel.title)}
            </Link>
          </h2>

          {/* Star Rating Row */}
          <div className="product-rate d-flex align-items-center mb-1.5" style={{ gap: '5px' }}>
            <span style={{ color: '#f59e0b', fontSize: '14px', lineHeight: 1 }}>★</span>
            <span className="rating-score fw-bold" style={{ fontSize: '13px', color: '#0f172a' }}>
              {rel.rating ? String(rel.rating).replace('/5', '') : '0.0'}
            </span>
            <span className="rating-reviews" style={{ fontSize: '12.5px', color: '#64748b' }}>
              ({rel.reviews ? String(rel.reviews).replace(/[^0-9]/g, '') || '0' : '0'} reviews)
            </span>
          </div>

          {/* Price & Discounts */}
          <div className="new-prod-price-box mb-1">
            <div className="d-flex align-items-center" style={{ gap: '8px', flexWrap: 'wrap' }}>
              <span className="new-prod-current-price">{relCurrentPrice} SR</span>
              {relHasOffer && rel.oldPrice && (
                <span className="new-prod-old-price">{rel.oldPrice}</span>
              )}
              {relStatus && (
                <span className="badge" style={{ ...relStatusStyle, fontSize: '11px', padding: '4px 7px' }}>
                  {relStatus}
                </span>
              )}
              {relHasOffer && rel.discount && (
                <span className="badge bg-dark text-white" style={{ fontSize: '11px', padding: '4px 7px' }}>
                  {rel.discount}
                </span>
              )}
            </div>
            <div className="new-prod-vat-label">Inclusive of VAT</div>

            {/* Color Swatches (Closer gap to action buttons) */}
            <div className="new-prod-colors-wrap d-flex align-items-center gap-1.5 mt-1" style={{ minHeight: '22px' }}>
              {Array.isArray(rel.colors) && rel.colors.length > 0 ? (
                rel.colors.map((colorName: string, cIdx: number) => {
                  const colorInfo = getProductColorInfo(colorName);
                  const isSelected = selectedColor
                    ? selectedColor.toLowerCase() === colorName.toLowerCase()
                    : cIdx === 0;

                  return (
                    <button
                      key={`${rel.id}-color-${colorName}-${cIdx}`}
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

        {/* Action Bar (Close gap to colors and buttons) */}
        <div className="product-card-bottom d-flex align-items-center mt-1" style={{ gap: '6px' }}>
          <button
            type="button"
            onClick={() => onAddToCart(rel, selectedColor)}
            className="btn-add-cart-wide"
            title="Add to Cart"
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              height: '44px',
            }}
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
            onClick={() => onToggleWishlist(rel)}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
            }}
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
  );
}

function ProductDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams?.get('id');
  const { showToast } = useToast();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const [allProducts, setAllProducts] = useState<ProductItem[]>(() => getCachedProducts());
  const [product, setProduct] = useState<ProductItem | null>(() => {
    const list = getCachedProducts();
    if (productId) {
      return list.find((p) => p.id === productId) || null;
    }
    return list[0] || null;
  });
  const [isLoading, setIsLoading] = useState(() => !getCachedProducts().length);

  // Gallery state
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Product selection state
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    totalReviews: 0,
    averageRating: '0.0',
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recommendPercent: 0,
    recommendCount: 0,
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Write Review Drawer state
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewWouldRecommend, setReviewWouldRecommend] = useState<boolean>(true);
  const [reviewLocation, setReviewLocation] = useState<string>('Saudi Arabia');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Sync saved review votes from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('veuz_review_votes');
      if (saved) {
        setUserVotes(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse issues
    }
  }, []);

  // Lock website/body scroll while review modal drawer is open
  useEffect(() => {
    if (isReviewDrawerOpen) {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;

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
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        window.scrollTo(0, scrollY);
        window.removeEventListener('wheel', handleWheelOrTouch);
        window.removeEventListener('touchmove', handleWheelOrTouch);
      };
    }
  }, [isReviewDrawerOpen]);

  // Load products & find selected product
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const prods = await fetchProducts();
        if (isMounted) {
          const list = prods && Array.isArray(prods) ? prods : [];
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
            const paramColor = searchParams?.get('color');
            if (paramColor && found.colors?.some((c) => c.toLowerCase() === paramColor.toLowerCase())) {
              const matched = found.colors.find((c) => c.toLowerCase() === paramColor.toLowerCase());
              setSelectedColor(matched || paramColor);
            } else if (found.colors && found.colors.length > 0) {
              setSelectedColor(found.colors[0]);
            } else {
              setSelectedColor('');
            }

            if (found.sizes && found.sizes.length > 0) {
              setSelectedSize(found.sizes[0]);
            } else {
              setSelectedSize('Regular Size');
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

  // Keyboard navigation & body scroll lock for lightbox modal (Esc to close, Left/Right arrows to move)
  useEffect(() => {
    if (!isZoomOpen) return;

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalTouchAction = document.body.style.touchAction;

    document.documentElement.classList.add('lightbox-open');
    document.body.classList.add('lightbox-open');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';

    // Completely block background wheel and touchmove events
    const handleTouchOrWheel = (e: TouchEvent | WheelEvent) => {
      e.preventDefault();
    };

    window.addEventListener('wheel', handleTouchOrWheel, { passive: false });
    window.addEventListener('touchmove', handleTouchOrWheel, { passive: false });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false);
        setZoomScale(1);
      } else if (e.key === 'ArrowLeft' && galleryImages.length > 1) {
        setZoomScale(1);
        setActiveImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight' && galleryImages.length > 1) {
        setZoomScale(1);
        setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.classList.remove('lightbox-open');
      document.body.classList.remove('lightbox-open');
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.touchAction = originalTouchAction;
      window.scrollTo(0, scrollY);
      window.removeEventListener('wheel', handleTouchOrWheel);
      window.removeEventListener('touchmove', handleTouchOrWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isZoomOpen, galleryImages.length]);

  // Fetch real reviews for active product
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const res = await fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setReviews(data.reviews || []);
          if (data.summary) {
            setReviewSummary(data.summary);
          }
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  // Determine if the logged-in user already wrote a review for this product
  const userExistingReview = useMemo(() => {
    if (!user || !reviews.length) return null;
    return (
      reviews.find(
        (r) =>
          (r.userId && user.id && String(r.userId) === String(user.id)) ||
          (r.userEmail && user.email && r.userEmail.toLowerCase() === user.email.toLowerCase())
      ) || null
    );
  }, [user, reviews]);

  const handleOpenReviewModal = (reviewToEdit?: ProductReview) => {
    if (!user) {
      showToast('Please login to your account to write a review.', 'info');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    const targetReview = reviewToEdit || userExistingReview;

    if (targetReview) {
      // User has already created a review for this product -> EDIT ONLY
      setEditingReviewId(targetReview.id);
      setReviewRating(targetReview.rating || 5);
      setReviewHoverRating(0);
      setReviewTitle(targetReview.title || '');
      setReviewComment(targetReview.comment || '');
      setReviewWouldRecommend(targetReview.wouldRecommend !== false);
      setReviewLocation(targetReview.location || 'Saudi Arabia');
    } else {
      // Fresh review
      setEditingReviewId(null);
      setReviewRating(5);
      setReviewHoverRating(0);
      setReviewTitle('');
      setReviewComment('');
      setReviewWouldRecommend(true);
      setReviewLocation('Saudi Arabia');
    }
    setIsReviewDrawerOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user) {
      showToast('Please login to your account to write a review.', 'info');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!reviewTitle.trim()) {
      showToast('Please enter a review headline or summary.', 'error');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Please enter your review comments.', 'error');
      return;
    }

    const isEditing = Boolean(editingReviewId || userExistingReview);
    const reviewIdToUpdate = editingReviewId || userExistingReview?.id;

    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'edit' : undefined,
          reviewId: reviewIdToUpdate,
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
          wouldRecommend: reviewWouldRecommend,
          userName: user.name || user.email.split('@')[0],
          userEmail: user.email,
          userId: String(user.id),
          location: reviewLocation.trim() || 'Saudi Arabia',
        }),
      });

      const data = await res.json();
      if (data.success && data.review) {
        if (data.isEdit || isEditing) {
          setReviews((prev) => prev.map((r) => (r.id === data.review.id ? data.review : r)));
          showToast('Your review has been updated successfully!', 'success');
        } else {
          setReviews((prev) => [data.review, ...prev]);
          showToast('Thank you! Your review has been submitted successfully.', 'success');
        }
        if (data.summary) {
          setReviewSummary(data.summary);
        }
        setIsReviewDrawerOpen(false);
        setEditingReviewId(null);
        setReviewTitle('');
        setReviewComment('');
      } else {
        showToast(data.error || 'Failed to submit review. Please try again.', 'error');
      }
    } catch (err: any) {
      showToast('Network error while submitting review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleVoteReview = async (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    const previousVote = userVotes[reviewId];
    const nextVote = previousVote === voteType ? undefined : voteType;

    // Optimistically update local vote state & persist in localStorage
    const updatedVotes = { ...userVotes };
    if (nextVote) {
      updatedVotes[reviewId] = nextVote;
    } else {
      delete updatedVotes[reviewId];
    }
    setUserVotes(updatedVotes);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('veuz_review_votes', JSON.stringify(updatedVotes));
      } catch {
        // ignore
      }
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', reviewId, voteType, previousVote }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, helpfulCount: data.review.helpfulCount, unhelpfulCount: data.review.unhelpfulCount }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Failed to vote review:', err);
    }
  };

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

  // Sizes available for this product (Only what the merchant configured; never dummy sizes!)
  const sizeOptions = useMemo(() => {
    if (!product) return [];
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    return [];
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
    const sizeLabel = (sizeOptions.length > 0 && selectedSize && selectedSize !== 'Regular Size')
      ? ` - Size ${selectedSize}`
      : ' - Regular Size';
    const colorLabel = selectedColor ? ` (${selectedColor})` : '';

    const cartProduct: any = {
      id: Number(product.id.replace(/[^\d]/g, '')) || Math.floor(Math.random() * 10000) + 1,
      name: product.title,
      price: numPrice > 0 ? numPrice : 129,
      image: galleryImages[activeImageIdx] || product.image,
      category: product.category,
    };

    addToCart(cartProduct, 1, selectedColor, selectedSize);
  };

  // Wishlist handler
  const isWishlisted = product ? isInWishlist(Number(product.id.replace(/[^\d]/g, '')) || 1) : false;
  const handleWishlistToggle = () => {
    if (!product) return;
    if (!user) {
      showToast('warning', 'Please sign in to save items to your wishlist.', 'Login Required');
      router.push(`/login?redirect=/product-details?id=${product.id}`);
      return;
    }
    const numId = Number(product.id.replace(/[^\d]/g, '')) || 1;
    toggleWishlist(numId);
    showToast('success', isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  // Related products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCat = allProducts.filter(
      (p) =>
        p.id !== product.id &&
        p.isActive !== false &&
        p.category?.toLowerCase() === product.category?.toLowerCase()
    );
    if (sameCat.length >= 4) {
      return sameCat.slice(0, 16);
    }
    const others = allProducts.filter(
      (p) =>
        p.id !== product.id &&
        p.isActive !== false &&
        p.category?.toLowerCase() !== product.category?.toLowerCase()
    );
    return [...sameCat, ...others].slice(0, 16);
  }, [product, allProducts]);

  // Related products slider ref & 3 sets for infinite continuous forward loop
  const relatedSliderRef = useRef<HTMLDivElement>(null);

  const repeatedRelatedProducts = useMemo(() => {
    if (!relatedProducts || relatedProducts.length <= 3) {
      return relatedProducts.map((p, i) => ({ ...p, loopKey: `rel-s1-${p.id}-${i}` }));
    }
    return [
      ...relatedProducts.map((prod, i) => ({ ...prod, loopKey: `rel-s1-${prod.id}-${i}` })),
      ...relatedProducts.map((prod, i) => ({ ...prod, loopKey: `rel-s2-${prod.id}-${i}` })),
      ...relatedProducts.map((prod, i) => ({ ...prod, loopKey: `rel-s3-${prod.id}-${i}` })),
    ];
  }, [relatedProducts]);

  const handlePrevRelated = () => {
    const container = relatedSliderRef.current;
    if (!container) return;
    const cardEl = container.firstElementChild as HTMLElement | null;
    const colWidth = cardEl ? cardEl.offsetWidth + 20 : 280;
    const step = colWidth * 2;
    const setWidth = container.scrollWidth / 3;

    if (setWidth <= 0) return;

    if (container.scrollLeft < step) {
      container.style.scrollBehavior = 'auto';
      container.scrollLeft += setWidth;
      void container.offsetWidth;
    }
    container.style.scrollBehavior = 'smooth';
    container.scrollBy({ left: -step, behavior: 'smooth' });
  };

  const handleNextRelated = () => {
    const container = relatedSliderRef.current;
    if (!container) return;
    const cardEl = container.firstElementChild as HTMLElement | null;
    const colWidth = cardEl ? cardEl.offsetWidth + 20 : 280;
    const step = colWidth * 2;
    const setWidth = container.scrollWidth / 3;

    if (setWidth <= 0) return;

    if (container.scrollLeft >= setWidth * 2 - step) {
      container.style.scrollBehavior = 'auto';
      container.scrollLeft -= setWidth;
      void container.offsetWidth;
    }
    container.style.scrollBehavior = 'smooth';
    container.scrollBy({ left: step, behavior: 'smooth' });
  };

  const handleAddRelatedToCart = (rel: ProductItem, color?: string) => {
    const relPrice = Number(rel.currentPrice || rel.originalPrice || parseFloat(rel.price?.replace(/[^\d.]/g, '') || '129'));
    const cartProduct: any = {
      id: Number(rel.id.replace(/[^\d]/g, '')) || Math.floor(Math.random() * 10000) + 1,
      name: rel.title,
      price: relPrice > 0 ? relPrice : 129,
      image: (color && rel.colorImages?.[color]?.[0]) || rel.image,
      category: rel.category,
    };
    addToCart(cartProduct, 1, color || (Array.isArray(rel.colors) ? rel.colors[0] : undefined));
    showToast('Item added to cart', 'success');
  };

  const handleToggleRelatedWishlist = (rel: ProductItem) => {
    if (!user) {
      showToast('warning', 'Please sign in to save items to your wishlist.', 'Login Required');
      router.push(`/login?redirect=/product-details?id=${product?.id || rel.id}`);
      return;
    }
    const numId = Number(rel.id.replace(/[^\d]/g, '')) || 1;
    const isW = isInWishlist(numId);
    toggleWishlist(numId);
    showToast('success', isW ? `Removed "${toCapitalCase(rel.title)}" from wishlist` : `Added "${toCapitalCase(rel.title)}" to wishlist`);
  };

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
      
      {/* 1. CLEAN BREADCRUMB ROW */}
      <div className="container pt-3 pb-2 pt-md-4 pb-md-3">
        <div className="product-breadcrumb-row d-flex align-items-center flex-wrap gap-1.5 gap-md-2 text-capitalize" style={{ fontSize: '13px', color: '#64748b' }}>
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
          {(() => {
            const rawTitle = toCapitalCase(product.title || '');
            const words = rawTitle.trim().split(/\s+/).filter(Boolean);
            const isLongerThan30Words = words.length > 30;
            const display30Words = isLongerThan30Words
              ? words.slice(0, 30).join(' ') + '...'
              : rawTitle;

            return (
              <span
                className={`breadcrumb-title-wrapper position-relative d-inline-flex align-items-center ${isLongerThan30Words ? 'is-long' : ''}`}
                style={{ verticalAlign: 'middle', maxWidth: 'min(720px, 80vw)' }}
              >
                <span
                  className="breadcrumb-title-track fw-bold text-capitalize"
                  style={{
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                    cursor: isLongerThan30Words ? 'pointer' : 'default',
                  }}
                >
                  <span className="breadcrumb-static-text">
                    {display30Words}
                  </span>
                  {isLongerThan30Words && (
                    <span className="breadcrumb-sliding-text">
                      {rawTitle}
                    </span>
                  )}
                </span>

                {/* Floating Tooltip displaying complete full product name */}
                {isLongerThan30Words && (
                  <span className="breadcrumb-custom-tooltip shadow" role="tooltip">
                    {rawTitle}
                  </span>
                )}
              </span>
            );
          })()}
        </div>
      </div>

      {/* 2. MAIN HERO SECTION */}
      <div className="container py-2">
        <div className="row g-4 g-xl-5 align-items-stretch">
          
          {/* ========================================================
              LEFT COLUMN: THUMBNAILS + MAIN IMAGE + FEATURE TILES
              ======================================================== */}
          <div className="col-12 col-lg-6">
            
            {/* Gallery Wrapper: Horizontal row of thumbnails under main image on mobile; vertical column on left on desktop */}
            <div className="product-details-gallery d-flex flex-column flex-lg-row gap-2 gap-lg-3">
              
              {/* Thumbnails (Order 2 on mobile, Order 1 on desktop) */}
              <div 
                className="product-gallery-thumbs order-2 order-lg-1 d-flex flex-row flex-lg-column gap-2 flex-shrink-0"
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
                      className={`product-gallery-thumb-btn position-relative text-start ${isActive ? 'is-active' : ''}`}
                      title={`View perspective ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${product.title} angle ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          opacity: isActive ? 1 : 0.5,
                          transition: 'opacity 0.2s ease',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = '0';
                        }}
                      />
                      {isLastWithMore && extraCount > 0 && (
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.65)',
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}
                        >
                          +{extraCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Main Image Container (Order 1 on mobile, Order 2 on desktop) */}
              <div
                className="product-gallery-main order-1 order-lg-2 flex-grow-1 position-relative d-flex align-items-center justify-content-center overflow-hidden"
              >
                {/* Fullscreen Expand Button (Top Right) */}
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="position-absolute top-0 end-0 m-3 btn border-0 d-flex align-items-center justify-content-center"
                  style={{
                    width: '38px',
                    minWidth: '38px',
                    height: '38px',
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
                  <span aria-hidden="true" style={{ color: '#0f172a', fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>⤢</span>
                </button>

                {/* Main Hero Product Image */}
                <div
                  className="w-100 h-100 d-flex align-items-center justify-content-center p-3 p-md-4 cursor-pointer"
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
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.06))',
                      transition: 'all 0.3s ease',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '0';
                    }}
                  />
                </div>

                {/* Bottom Pagination Dots */}
                <div
                  className="position-absolute bottom-0 start-50 translate-middle-x mb-2.5 mb-md-3 d-flex align-items-center gap-1.5"
                  style={{ zIndex: 10 }}
                >
                  {galleryImages.slice(0, 5).map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setActiveImageIdx(dotIdx)}
                      className="border-0 p-0 transition-all"
                      style={{
                        width: activeImageIdx === dotIdx ? '20px' : '6px',
                        height: '6px',
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
            <div className="d-flex flex-column gap-2.5 gap-md-3 ps-lg-1 h-100">
              
              {/* Badge: New Arrival or Discount + Gender */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span
                  className="product-details-badge badge px-2.5 py-1 px-md-3 py-md-1.5 rounded-pill fw-bold text-capitalize"
                  style={{
                    ...(statusLabel ? statusStyle : { backgroundColor: '#0f172a', color: '#ffffff' }),
                    border: 'none',
                    fontSize: '12px',
                    letterSpacing: '0.3px',
                    textTransform: 'capitalize',
                  }}
                >
                  {statusLabel || toCapitalCase(product.badge || 'Product')}
                </span>
              </div>

              {/* Product Title & Subtitle */}
              <div>
                <h1 className="product-details-title fw-bold text-dark mb-1 text-capitalize">
                  {toCapitalCase(product.title)}
                </h1>
                <p className="product-details-subtitle text-muted mb-0">
                  {toCapitalCase(product.standard) || 'Performance Sneaker for Everyday Innovators'}
                </p>
              </div>

              {/* Star Rating Row */}
              <div className="d-flex align-items-center gap-2 my-1">
                <span style={{ color: '#f59e0b', fontSize: '20px', lineHeight: 1 }}>★</span>
                <span className="fw-bold text-dark" style={{ fontSize: '18px', letterSpacing: '-0.2px' }}>
                  {reviewSummary ? reviewSummary.averageRating : (product.rating ? String(product.rating).replace('/5', '') : '0.0')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reviews');
                    const tabsEl = document.getElementById('product-tabs-section');
                    if (tabsEl) tabsEl.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '0',
                    margin: '0',
                    color: '#64748b',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#0f172a')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
                >
                  ({reviewSummary ? reviewSummary.totalReviews : (product.reviews ? String(product.reviews).replace(/[^0-9]/g, '') || '0' : '0')} reviews)
                </button>
              </div>

              {/* Product price and its actual collection status */}
              <div className="product-details-price-wrap d-flex flex-wrap align-items-center gap-2 gap-md-3 my-0.5">
                <span className="product-details-current-price fw-bold text-dark">
                  {currentPriceNum} SR
                </span>
                {hasOffer && oldPriceVal && (
                  <span className="product-details-old-price text-muted text-decoration-line-through">
                    {oldPriceVal} SR
                  </span>
                )}
                {statusLabel && (
                  <span
                    className="badge fw-bold d-inline-flex align-items-center justify-content-center"
                    style={{
                      ...statusStyle,
                      fontSize: '13px',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      lineHeight: 1,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {statusLabel}
                  </span>
                )}
                {hasOffer && (product.discount || (product.offerPercent ? `${product.offerPercent}% OFF` : '')) && (
                  <span
                    className="badge bg-dark text-white fw-bold d-inline-flex align-items-center justify-content-center"
                    style={{
                      fontSize: '13px',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      lineHeight: 1,
                      letterSpacing: '0.3px',
                    }}
                  >
                    {product.discount || `${product.offerPercent}% OFF`}
                  </span>
                )}
              </div>

              {/* Target Gender, Size & Delivery Meta in ONE ROW with Box Border */}
              <div className="d-flex align-items-center flex-wrap gap-2 gap-md-3 py-1">
                {product.gender && (
                  <div className="d-flex align-items-center gap-1.5">
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Target Gender:</span>
                    <span
                      className="fw-bold"
                      style={{
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '12px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {product.gender}
                    </span>
                  </div>
                )}

                {/* Delivery Option */}
                <div className="d-flex align-items-center gap-1.5">
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Delivery:</span>
                  <span
                    className="fw-bold d-inline-flex align-items-center gap-1"
                    style={{
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '12px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      lineHeight: 1.3,
                    }}
                  >
                    <i className={getDeliveryBadgeProps(product.deliveryOptionName).icon} style={{ fontSize: '11px', color: '#2563eb' }}></i>
                    <span>{product.deliveryOptionName || 'Standard Delivery'}</span>
                  </span>
                </div>

                {selectedSize && (
                  <div className="d-flex align-items-center gap-1.5">
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Size:</span>
                    <span
                      className="fw-bold text-uppercase"
                      style={{
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        fontSize: '12px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {selectedSize}
                    </span>
                  </div>
                )}
              </div>

              {/* Color Selection — shown only for products with color variants */}
              {colorOptions.length > 0 && <div className="d-flex flex-column gap-1.5">
                <div className="d-flex align-items-center justify-content-between">
                  <span style={{ fontSize: '13.5px', color: '#0f172a' }}>
                    Color: <span className="fw-bold text-capitalize">{toCapitalCase(selectedColor)}</span>
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {colorOptions.map((c) => {
                    const isSelected = selectedColor === c.name;

                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handleSelectColor(c.name)}
                        className="btn p-1 rounded-3 position-relative d-flex align-items-center justify-content-center transition-all"
                        style={{
                          width: '54px',
                          height: '46px',
                          backgroundColor: '#f8fafc',
                          border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                          borderRadius: '4px',
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

              {/* Size Buttons Grid (Only shown when product has multiple selectable sizes; strictly NO green color Free Size button) */}
              {sizeOptions.length > 1 && !(sizeOptions.length === 1 && sizeOptions[0].toLowerCase() === 'free size') && (
                <div className="d-flex flex-column gap-1.5 mt-0.5">
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Select Size:</span>
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
                            minWidth: '42px',
                            height: '36px',
                            padding: '0 10px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#0f172a',
                            border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                            boxShadow: isSelected ? '0 2px 8px rgba(15, 23, 42, 0.16)' : 'none',
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons: Add to Cart + Add to Wishlist */}
              <div className="product-details-actions pt-2 pt-md-3 mt-auto">
                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="product-details-btn-cart btn fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none' }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  Add to Cart
                </button>

                {/* Add to Wishlist Button */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className="product-details-btn-wishlist btn d-flex align-items-center justify-content-center gap-1.5"
                  style={{
                    backgroundColor: isWishlisted ? '#fff1f2' : '#ffffff',
                    border: isWishlisted ? '1.5px solid #fecdd3' : '1.5px solid #e2e8f0',
                    color: isWishlisted ? '#e11d48' : '#0f172a',
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
                  <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. ADDITIONAL DETAILS TABS */}
      <div id="product-tabs-section" className="container mt-5 pt-4">
        <div className="card border-0 rounded-4 p-3 p-md-4" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', boxShadow: 'none' }}>
          
          {/* TAB HEADERS (Responsive horizontal slide in mobile, flush left alignment) */}
          <div
            className="product-details-tabs-header d-flex align-items-center border-bottom mb-4"
            style={{
              borderColor: '#e2e8f0',
              gap: '32px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              style={{
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'description' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                color: activeTab === 'description' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Product Description
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('specifications')}
              style={{
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'specifications' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                color: activeTab === 'specifications' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Product Specification
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              style={{
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'reviews' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                color: activeTab === 'reviews' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <span>Reviews and rating</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  lineHeight: 1,
                  backgroundColor: activeTab === 'reviews' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'reviews' ? '#ffffff' : '#475569',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {reviewSummary.totalReviews}
              </span>
            </button>
          </div>

          {/* TAB 1: PRODUCT DESCRIPTION */}
          {activeTab === 'description' && (
            <div className="py-2">
              <p className="text-secondary fs-14 mb-0" style={{ lineHeight: '1.8', whiteSpace: 'pre-line', color: '#475569' }}>
                {product.desc || 'No detailed description available for this product.'}
              </p>
            </div>
          )}

          {/* TAB 2: PRODUCT SPECIFICATION */}
          {activeTab === 'specifications' && (
            <div className="py-2">
              {(() => {
                const hasTechSpecs = Boolean(product.technicalSpecs && product.technicalSpecs.length > 0);
                const hasLegacySpecs = Boolean(product.specifications && Array.isArray(product.specifications) && product.specifications.length > 0);

                if (!hasTechSpecs && !hasLegacySpecs) {
                  return (
                    <div className="py-5 text-center">
                      <iconify-icon icon="solar:clipboard-list-linear" class="fs-32 text-muted mb-2"></iconify-icon>
                      <p className="text-muted fs-14 mb-0">No technical specifications have been added for this product.</p>
                    </div>
                  );
                }

                if (hasTechSpecs && product.technicalSpecs) {
                  return (
                    <div>
                      {product.specificationsOverview && (
                        <div style={{ marginBottom: '28px' }}>
                          <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '15px', letterSpacing: '-0.2px' }}>
                            Overview &amp; Compliance
                          </h5>
                          <p className="text-secondary fs-14 mb-0" style={{ lineHeight: '1.75', color: '#475569', whiteSpace: 'pre-line' }}>
                            {product.specificationsOverview}
                          </p>
                        </div>
                      )}

                      <div
                        className="table-responsive rounded-3"
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          boxShadow: 'none',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <table
                          className="table mb-0 align-middle"
                          style={{
                            borderColor: '#f1f5f9',
                            boxShadow: 'none',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                              <th
                                style={{
                                  width: '32%',
                                  minWidth: '200px',
                                  padding: '16px 24px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  letterSpacing: '0.5px',
                                  border: 'none',
                                  borderBottom: '1px solid #e2e8f0',
                                  borderRight: '1px solid #f1f5f9',
                                  backgroundColor: '#f8fafc',
                                  color: '#475569',
                                  textTransform: 'uppercase',
                                }}
                              >
                                SPECIFICATION ATTRIBUTE
                              </th>
                              <th
                                style={{
                                  width: '68%',
                                  padding: '16px 24px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  letterSpacing: '0.5px',
                                  border: 'none',
                                  borderBottom: '1px solid #e2e8f0',
                                  backgroundColor: '#f8fafc',
                                  color: '#475569',
                                  textTransform: 'uppercase',
                                }}
                              >
                                DETAILS &amp; COMPLIANCE
                              </th>
                            </tr>
                          </thead>
                          <tbody style={{ backgroundColor: '#ffffff' }}>
                            {product.technicalSpecs.map((spec, sIdx) => {
                              const isLast = sIdx === product.technicalSpecs!.length - 1;
                              return (
                                <tr
                                  key={spec.id || `ts-${sIdx}`}
                                  style={{ backgroundColor: '#ffffff' }}
                                >
                                  <td
                                    className="fw-semibold text-dark text-nowrap"
                                    style={{
                                      padding: '16px 24px',
                                      fontSize: '13.5px',
                                      color: '#0f172a',
                                      borderTop: 'none',
                                      borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                                      borderRight: '1px solid #f1f5f9',
                                      backgroundColor: '#ffffff',
                                    }}
                                  >
                                    {spec.label}
                                  </td>
                                  <td
                                    style={{
                                      padding: '16px 24px',
                                      fontSize: '13.5px',
                                      color: '#334155',
                                      borderTop: 'none',
                                      borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                                      backgroundColor: '#ffffff',
                                    }}
                                  >
                                    {spec.value}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="d-flex flex-column gap-4">
                    {product.specifications!.map((sec, sIdx) => {
                      const isDescription = sec.type === 'description' || (!sec.points && Boolean(sec.description));

                      if (isDescription) {
                        return (
                          <div key={sec.id || `spec-sec-${sIdx}`} style={{ marginBottom: '20px' }}>
                            {sec.heading && (
                              <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '15px' }}>
                                {sec.heading}
                              </h5>
                            )}
                            <p className="text-secondary fs-14 mb-0" style={{ lineHeight: '1.75', color: '#475569', whiteSpace: 'pre-line' }}>
                              {sec.description || ''}
                            </p>
                          </div>
                        );
                      }

                      const points = sec.points || [];
                      if (points.length === 0) return null;

                      return (
                        <div key={sec.id || `spec-sec-${sIdx}`}>
                          {sec.heading && (
                            <h5 className="fw-bold text-dark mb-2.5" style={{ fontSize: '15px' }}>
                              {sec.heading}
                            </h5>
                          )}
                          <div
                            className="table-responsive rounded-3"
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              boxShadow: 'none',
                              overflow: 'hidden',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <table
                              className="table mb-0 align-middle"
                              style={{
                                borderColor: '#f1f5f9',
                                boxShadow: 'none',
                                backgroundColor: '#ffffff',
                              }}
                            >
                              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                  <th
                                    style={{
                                      width: '32%',
                                      minWidth: '200px',
                                      padding: '16px 24px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      letterSpacing: '0.5px',
                                      border: 'none',
                                      borderBottom: '1px solid #e2e8f0',
                                      borderRight: '1px solid #f1f5f9',
                                      backgroundColor: '#f8fafc',
                                      color: '#475569',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    SPECIFICATION
                                  </th>
                                  <th
                                    style={{
                                      width: '68%',
                                      padding: '16px 24px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      letterSpacing: '0.5px',
                                      border: 'none',
                                      borderBottom: '1px solid #e2e8f0',
                                      backgroundColor: '#f8fafc',
                                      color: '#475569',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    DETAILS
                                  </th>
                                </tr>
                              </thead>
                              <tbody style={{ backgroundColor: '#ffffff' }}>
                                {points.map((pt, pIdx) => {
                                  let boldPart = pt.heading || '';
                                  let descPart = pt.text || '';
                                  if (!boldPart && descPart.includes(':')) {
                                    const colonIdx = descPart.indexOf(':');
                                    boldPart = descPart.slice(0, colonIdx).trim();
                                    descPart = descPart.slice(colonIdx + 1).trim();
                                  }
                                  if (!boldPart) boldPart = `Feature #${pIdx + 1}`;
                                  const isLast = pIdx === points.length - 1;

                                  return (
                                    <tr key={pt.id || `pt-${sIdx}-${pIdx}`} style={{ backgroundColor: '#ffffff' }}>
                                      <td
                                        className="fw-semibold text-dark text-nowrap"
                                        style={{
                                          padding: '16px 24px',
                                          fontSize: '13.5px',
                                          color: '#0f172a',
                                          borderTop: 'none',
                                          borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                                          borderRight: '1px solid #f1f5f9',
                                          backgroundColor: '#ffffff',
                                        }}
                                      >
                                        {boldPart}
                                      </td>
                                      <td
                                        style={{
                                          padding: '16px 24px',
                                          fontSize: '13.5px',
                                          color: '#334155',
                                          borderTop: 'none',
                                          borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                                          backgroundColor: '#ffffff',
                                        }}
                                      >
                                        {descPart}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: PRODUCT REVIEW AND RATING */}
          {activeTab === 'reviews' && (
            <div className="py-2">
              {/* TOP REVIEW SUMMARY BOX (MATCHING REFERENCE IMAGE) */}
              <div
                className="rounded-4 border p-4 mb-4"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                }}
              >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '20px' }}>
                    Customer Reviews
                  </h3>
                  <div
                    className="badge rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #dbeafe',
                      fontSize: '12px',
                      padding: '6px 12px',
                    }}
                  >
                    <CheckCircle2 size={14} className="text-primary" />
                    <span>Verified Reviews</span>
                  </div>
                </div>

                {/* Score, Breakdown & CTA Button Grid */}
                <div className="row g-4 align-items-center">
                  {/* Left Column: Overall Score & Recommendation */}
                  <div className="col-12 col-md-4 border-end-md pe-md-4">
                    <div className="d-flex align-items-baseline gap-2">
                      <span className="fw-bold text-dark" style={{ fontSize: '46px', lineHeight: 1 }}>
                        {reviewSummary.averageRating}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-1 my-2">
                      {[1, 2, 3, 4, 5].map((starNum) => {
                        const avg = Number(reviewSummary.averageRating) || 0;
                        const isLit = starNum <= Math.round(avg) && avg > 0;
                        return (
                          <span
                            key={starNum}
                            style={{
                              color: isLit ? '#f59e0b' : '#cbd5e1',
                              fontSize: '18px',
                              lineHeight: 1,
                            }}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>

                    <div className="text-muted fs-13 mb-3">
                      ({reviewSummary.totalReviews} {reviewSummary.totalReviews === 1 ? 'review' : 'reviews'})
                    </div>

                    <div className="pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                      <div className="fw-bold text-dark" style={{ fontSize: '24px', lineHeight: 1.1 }}>
                        {reviewSummary.recommendPercent}%
                      </div>
                      <div className="text-muted fs-13 d-flex align-items-center gap-1.5 mt-1">
                        <span style={{ color: '#ef4444', fontSize: '15px' }}>❤️</span>
                        <span className="fw-semibold text-secondary">Would Recommend</span>
                      </div>
                      <div className="text-muted fs-12 mt-0.5">
                        ({reviewSummary.recommendCount} recommendations)
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Star Breakdown Progress Bars */}
                  <div className="col-12 col-md-7 col-lg-6 ps-md-3">
                    <div className="d-flex flex-column gap-2">
                      {[5, 4, 3, 2, 1].map((starNum) => {
                        const count = reviewSummary.ratingCounts[starNum as 1 | 2 | 3 | 4 | 5] || 0;
                        const percent =
                          reviewSummary.totalReviews > 0
                            ? Math.round((count / reviewSummary.totalReviews) * 100)
                            : 0;

                        return (
                          <div key={starNum} className="d-flex align-items-center gap-2" style={{ fontSize: '13px' }}>
                            <div className="d-flex align-items-center gap-1" style={{ width: '32px' }}>
                              <span className="fw-semibold text-dark">{starNum}</span>
                              <span style={{ color: '#f59e0b' }}>★</span>
                            </div>

                            <div
                              className="flex-grow-1"
                              style={{
                                height: '8px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${percent}%`,
                                  height: '100%',
                                  backgroundColor: '#ea580c',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>

                            <span className="text-muted fw-semibold" style={{ width: '40px', textAlign: 'right' }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* REVIEWS LIST (ZERO DUMMY DATA) */}
              {reviews.length === 0 ? (
                <div
                  className="rounded-4 border text-center py-5 px-4"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                  }}
                >
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '56px', height: '56px', backgroundColor: '#f8fafc', color: '#64748b' }}
                  >
                    <Star size={26} className="text-muted" />
                  </div>
                  <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '18px' }}>
                    No Customer Reviews Yet
                  </h4>
                  <p className="text-muted fs-14 mb-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
                    Be the first to review this product and help other customers make informed decisions!
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal(userExistingReview || undefined)}
                    className="btn px-4 py-2 text-white fw-bold shadow-sm"
                    style={{
                      backgroundColor: '#0f172a',
                      borderRadius: '25px',
                      fontSize: '14px',
                    }}
                  >
                    {userExistingReview ? 'Edit Your Review' : 'Write the First Review'}
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-3 border p-3 p-md-4"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                      }}
                    >
                      {/* Top Row: Stars + Date/Pin */}
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              style={{
                                color: s <= rev.rating ? '#f59e0b' : '#cbd5e1',
                                fontSize: '16px',
                                lineHeight: 1,
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-12">
                          <Pin size={13} className="text-secondary" />
                          <span>
                            {new Date(rev.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Reviewer Name + Verified Buyer */}
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fw-bold text-dark fs-14">{rev.userName}</span>
                        {rev.verifiedBuyer && (
                          <span
                            className="badge d-inline-flex align-items-center gap-1"
                            style={{
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            <CheckCircle2 size={12} className="text-success" />
                            Verified Buyer
                          </span>
                        )}
                      </div>

                      {/* Location */}
                      {rev.location && (
                        <div className="text-muted fs-12 mb-2 d-flex align-items-center gap-1">
                          <span>📍</span>
                          <span>{rev.location}</span>
                        </div>
                      )}

                      {/* Review Title */}
                      <h5 className="fw-bold text-dark fs-15 mb-1.5">{rev.title}</h5>

                      {/* Review Comment */}
                      <p className="text-secondary fs-14 mb-3" style={{ lineHeight: '1.65', color: '#475569' }}>
                        {rev.comment}
                      </p>

                      {/* Store Reply if present */}
                      {rev.storeReply && (
                        <div
                          className="border-start ps-3 py-1 mb-3 rounded-1"
                          style={{ borderColor: '#6366f1', backgroundColor: '#f8fafc' }}
                        >
                          <div className="fw-bold text-dark fs-12 mb-0.5">Store owner reply</div>
                          <div className="text-secondary fs-13">{rev.storeReply}</div>
                        </div>
                      )}

                      {/* Bottom Actions: Helpful, Unhelpful, and Edit Review if own review */}
                      {(() => {
                        const isOwnReview = Boolean(
                          user &&
                          ((rev.userId && user.id && String(rev.userId) === String(user.id)) ||
                           (rev.userEmail && user.email && rev.userEmail.toLowerCase() === user.email.toLowerCase()))
                        );
                        const currentVote = userVotes[rev.id];
                        const isHelpfulActive = currentVote === 'helpful';
                        const isUnhelpfulActive = currentVote === 'unhelpful';

                        return (
                          <div className="d-flex align-items-center gap-3 pt-2 border-top text-muted fs-12 flex-wrap" style={{ borderColor: '#f1f5f9' }}>
                            {/* Helpful Button (No background shade) */}
                            <button
                              type="button"
                              onClick={() => handleVoteReview(rev.id, 'helpful')}
                              className="btn btn-link p-0 text-decoration-none fs-12 d-inline-flex align-items-center gap-1.5"
                              style={{
                                color: isHelpfulActive ? '#2563eb' : '#64748b',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontWeight: isHelpfulActive ? 700 : 500,
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: 'none',
                              }}
                              title={isHelpfulActive ? 'You marked this review as helpful' : 'Mark as helpful'}
                            >
                              <ThumbsUp
                                size={13}
                                fill={isHelpfulActive ? '#2563eb' : 'none'}
                                stroke={isHelpfulActive ? '#2563eb' : 'currentColor'}
                              />
                              <span>Helpful ({rev.helpfulCount || 0})</span>
                            </button>

                            <span className="text-muted" style={{ opacity: 0.35 }}>|</span>

                            {/* Unhelpful Button (No background shade) */}
                            <button
                              type="button"
                              onClick={() => handleVoteReview(rev.id, 'unhelpful')}
                              className="btn btn-link p-0 text-decoration-none fs-12 d-inline-flex align-items-center gap-1.5"
                              style={{
                                color: isUnhelpfulActive ? '#ef4444' : '#64748b',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                fontWeight: isUnhelpfulActive ? 700 : 500,
                                cursor: 'pointer',
                                outline: 'none',
                                boxShadow: 'none',
                              }}
                              title={isUnhelpfulActive ? 'You marked this review as unhelpful' : 'Mark as unhelpful'}
                            >
                              <ThumbsDown
                                size={13}
                                fill={isUnhelpfulActive ? '#ef4444' : 'none'}
                                stroke={isUnhelpfulActive ? '#ef4444' : 'currentColor'}
                              />
                              <span>Unhelpful ({rev.unhelpfulCount || 0})</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  ))}

                  {/* Write a Review / Edit Your Review button at bottom of reviews list */}
                  <div className="d-flex justify-content-center mt-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(userExistingReview || undefined)}
                      className="px-4 py-2.5 text-white fw-bold shadow-sm"
                      style={{
                        backgroundColor: '#0f172a',
                        borderRadius: '25px',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#0f172a';
                      }}
                    >
                      {userExistingReview ? (
                        <>
                          <Pencil size={15} />
                          <span>Edit Your Review</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare size={16} />
                          <span>Write a Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div className="container mt-5 pt-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: 'clamp(20px, 3.5vw, 26px)' }}>
                Related Products
              </h3>
              <p className="text-muted mb-0 text-capitalize" style={{ fontSize: '14px' }}>
                More items from {toCapitalCase(product.category)}
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link
                href={`/products?category=${encodeURIComponent(product.category)}`}
                className="btn px-3 px-sm-4 btn-sm fw-semibold d-inline-flex align-items-center justify-content-center text-nowrap"
                style={{
                  height: '38px',
                  borderRadius: '6px',
                  backgroundColor: '#0f172a',
                  borderColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              >
                View All {toCapitalCase(product.category)}
              </Link>
              <div className="d-flex align-items-center gap-1 ms-1">
                <button
                  type="button"
                  onClick={handlePrevRelated}
                  disabled={relatedProducts.length <= 1}
                  aria-label="Previous products"
                  className="related-nav-btn"
                  title="Previous Products"
                >
                  <ChevronLeft size={18} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={handleNextRelated}
                  disabled={relatedProducts.length <= 1}
                  aria-label="Next products"
                  className="related-nav-btn"
                  title="Next Products"
                >
                  <ChevronRight size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          <div className="related-products-slider" ref={relatedSliderRef}>
            {repeatedRelatedProducts.map((rel) => (
              <div key={rel.loopKey} className="related-product-slide">
                <RelatedProductCardItem
                  rel={rel}
                  isInWishlist={isInWishlist}
                  onAddToCart={handleAddRelatedToCart}
                  onToggleWishlist={handleToggleRelatedWishlist}
                  onProductClick={recordProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL (Directly mounted to document.body via Portal) */}
      {mounted && isZoomOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="product-lightbox-portal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 1000000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            touchAction: 'none',
            overscrollBehavior: 'none',
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={() => {
            setIsZoomOpen(false);
            setZoomScale(1);
          }}
        >
          {/* Main White Canvas Card - Perfectly Centered */}
          <div
            className="product-lightbox-modal position-relative d-flex align-items-center justify-content-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button on White Card Top-Right */}
            <button
              type="button"
              onClick={() => {
                setIsZoomOpen(false);
                setZoomScale(1);
              }}
              aria-label="Close modal"
              title="Close View (Esc)"
              className="product-lightbox-close-btn"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                padding: 0,
                borderRadius: '50%',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                zIndex: 100,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e293b';
                e.currentTarget.style.transform = 'scale(1.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Previous Arrow (<) */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(1);
                  setActiveImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                }}
                className="product-lightbox-arrow-btn"
                aria-label="Previous image"
                title="Previous Image (Left Arrow)"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  minWidth: '40px',
                  minHeight: '40px',
                  padding: 0,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                  zIndex: 90,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            {/* Next Arrow (>) */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomScale(1);
                  setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
                }}
                className="product-lightbox-arrow-btn"
                aria-label="Next image"
                title="Next Image (Right Arrow)"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  minWidth: '40px',
                  minHeight: '40px',
                  padding: 0,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                  zIndex: 90,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}

            {/* Center Image Container */}
            <div
              className="w-100 h-100 d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5 overflow-hidden"
              style={{
                cursor: zoomScale > 1 ? 'grab' : 'zoom-in',
                backgroundColor: '#ffffff',
                touchAction: 'pan-x pan-y',
              }}
              onClick={() => setZoomScale((s) => (s === 1 ? 1.75 : 1))}
              title={zoomScale === 1 ? 'Click to zoom in' : 'Click to zoom out'}
            >
              <img
                key={galleryImages[activeImageIdx]}
                src={galleryImages[activeImageIdx] || product.image}
                alt={product.title}
                style={{
                  maxWidth: '85%',
                  maxHeight: '85%',
                  objectFit: 'contain',
                  transform: `scale(${zoomScale})`,
                  transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.06))',
                  userSelect: 'none',
                }}
              />
            </div>

            {/* Bottom Carousel / Perspective Dots Indicator */}
            {galleryImages.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                  zIndex: 90,
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', lineHeight: 1 }}>
                  {activeImageIdx + 1} / {galleryImages.length}
                </span>
                <div className="d-flex align-items-center gap-1.5 ms-1">
                  {galleryImages.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomScale(1);
                        setActiveImageIdx(dotIdx);
                      }}
                      className="border-0 p-0"
                      style={{
                        width: activeImageIdx === dotIdx ? '16px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: activeImageIdx === dotIdx ? '#0f172a' : '#cbd5e1',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      title={`Go to image ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* SIZE GUIDE MODAL (Directly mounted to document.body via Portal) */}
      {mounted && isSizeGuideOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            zIndex: 1000000,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
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
                className="btn btn-light rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
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
        </div>,
        document.body
      )}

      {/* 5. RIGHT-TO-LEFT WRITE REVIEW MODAL DRAWER */}
      {isReviewDrawerOpen && (
        <>
          {/* Overlay Backdrop */}
          <div
            onClick={() => setIsReviewDrawerOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
              zIndex: 1050,
              transition: 'opacity 0.25s ease',
            }}
          />

          {/* Drawer Panel (Slides Right to Left - Matches Cart Drawer Style) */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(520px, 100vw)',
              backgroundColor: '#ffffff',
              zIndex: 1055,
              boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
                  {product.category || 'Product Review'}
                </span>
                <h5 className="mb-0 fw-bold text-dark fs-16 mt-0.5" style={{ letterSpacing: '-0.2px' }}>
                  {editingReviewId || userExistingReview ? 'Edit Your Review' : 'Write a Review'}
                </h5>
              </div>

              {/* Explicit, high-contrast Circular Close Button matching Cart Modal */}
              <button
                type="button"
                onClick={() => setIsReviewDrawerOpen(false)}
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

            {/* Product Summary Preview Strip */}
            <div
              className="px-4 py-3 border-bottom d-flex align-items-center gap-3 flex-shrink-0"
              style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}
            >
              <img
                src={galleryImages[0] || product.image}
                alt={product.title}
                style={{
                  width: '52px',
                  height: '52px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '4px',
                  flexShrink: 0,
                }}
              />
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <h6 className="fw-bold text-dark mb-1 fs-13 text-truncate" style={{ lineHeight: 1.3 }}>
                  {product.title}
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark fs-13">
                    {product.price}
                  </span>
                  {product.deliveryOptionName && (
                    <span className="badge bg-white text-muted border px-2 py-0.5" style={{ fontSize: '11px', borderColor: '#e2e8f0' }}>
                      {product.deliveryOptionName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Scrollable Body with .product-drawer-body (Scrolls independently while body scroll is blocked) */}
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
              <form onSubmit={handleSubmitReview} id="review-form">
                {/* 1. Overall Rating */}
                <div className="mb-4">
                  <label className="fw-bold text-dark fs-13 mb-2 d-block">
                    Overall Rating <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className="d-flex align-items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = reviewHoverRating > 0 ? star <= reviewHoverRating : star <= reviewRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHoverRating(star)}
                            onMouseLeave={() => setReviewHoverRating(0)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              fontSize: '28px',
                              color: active ? '#f59e0b' : '#cbd5e1',
                              lineHeight: 1,
                              transition: 'transform 0.15s ease',
                              outline: 'none',
                            }}
                            title={`${star} Star`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                    <span
                      className="ms-2 fs-12 fw-semibold px-2.5 py-1 rounded-2"
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a',
                      }}
                    >
                      {(reviewHoverRating === 1 || (!reviewHoverRating && reviewRating === 1)) && 'Poor (1/5)'}
                      {(reviewHoverRating === 2 || (!reviewHoverRating && reviewRating === 2)) && 'Fair (2/5)'}
                      {(reviewHoverRating === 3 || (!reviewHoverRating && reviewRating === 3)) && 'Good (3/5)'}
                      {(reviewHoverRating === 4 || (!reviewHoverRating && reviewRating === 4)) && 'Very Good (4/5)'}
                      {(reviewHoverRating === 5 || (!reviewHoverRating && reviewRating === 5)) && 'Excellent (5/5)'}
                    </span>
                  </div>
                </div>

                {/* 2. Would Recommend (Sleek black/white pill buttons - NEVER green) */}
                <div className="mb-4">
                  <label className="fw-bold text-dark fs-13 mb-2 d-block">
                    Would you recommend this product?
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewWouldRecommend(true)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '25px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: reviewWouldRecommend ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                        backgroundColor: reviewWouldRecommend ? '#0f172a' : '#ffffff',
                        color: reviewWouldRecommend ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        outline: 'none',
                        boxShadow: reviewWouldRecommend ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
                      }}
                    >
                      <ThumbsUp size={14} color={reviewWouldRecommend ? '#ffffff' : '#64748b'} />
                      <span>Yes, I recommend</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewWouldRecommend(false)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '25px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: !reviewWouldRecommend ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                        backgroundColor: !reviewWouldRecommend ? '#0f172a' : '#ffffff',
                        color: !reviewWouldRecommend ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        outline: 'none',
                        boxShadow: !reviewWouldRecommend ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
                      }}
                    >
                      <ThumbsDown size={14} color={!reviewWouldRecommend ? '#ffffff' : '#64748b'} />
                      <span>No</span>
                    </button>
                  </div>
                </div>

                {/* 3. Review Headline / Title */}
                <div className="mb-3.5">
                  <label className="fw-bold text-dark fs-13 mb-1.5 d-block">
                    Review Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Exceptional durability and comfort!"
                    className="form-control rounded-3 fs-14"
                    style={{
                      padding: '11px 14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                {/* 4. Review Comment */}
                <div className="mb-3.5">
                  <label className="fw-bold text-dark fs-13 mb-1.5 d-block">
                    Review Comment <span className="text-danger">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What did you like or dislike? How is the quality, fit, and protection?"
                    className="form-control rounded-3 fs-14"
                    style={{
                      padding: '11px 14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      minHeight: '110px',
                    }}
                  />
                </div>

                {/* 5. Reviewer Name & Location */}
                <div className="row g-2.5 mb-2">
                  <div className="col-12 col-sm-6">
                    <label className="fw-bold text-dark fs-13 mb-1.5 d-block">Your Name</label>
                    <input
                      type="text"
                      value={user?.name || user?.email?.split('@')[0] || ''}
                      readOnly
                      className="form-control rounded-3 fs-13 bg-light text-muted"
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="fw-bold text-dark fs-13 mb-1.5 d-block">Your Location</label>
                    <input
                      type="text"
                      value={reviewLocation}
                      onChange={(e) => setReviewLocation(e.target.value)}
                      placeholder="e.g. Riyadh, Saudi Arabia"
                      className="form-control rounded-3 fs-13"
                      style={{
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* 3. Fixed Footer Actions with generous padding matching Cart Modal */}
            <div
              className="p-3 px-4 border-top d-flex align-items-center gap-2.5 justify-content-end bg-white flex-shrink-0"
              style={{
                borderColor: '#f1f5f9',
                paddingBottom: '22px',
                paddingTop: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setIsReviewDrawerOpen(false)}
                disabled={isSubmittingReview}
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  padding: '0 24px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="review-form"
                disabled={isSubmittingReview}
                style={{
                  height: '46px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  padding: '0 28px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
              >
                {isSubmittingReview ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>{editingReviewId || userExistingReview ? 'Updating Review...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <span>{editingReviewId || userExistingReview ? 'Update Review' : 'Submit Review'}</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Breadcrumb Hover-Slide & Tooltip Styling */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .breadcrumb-title-wrapper {
          position: relative;
        }
        .breadcrumb-title-wrapper .breadcrumb-sliding-text {
          display: none;
        }
        .breadcrumb-title-wrapper.is-long:hover .breadcrumb-static-text {
          display: none;
        }
        .breadcrumb-title-wrapper.is-long:hover .breadcrumb-sliding-text {
          display: inline-block;
          white-space: nowrap;
          animation: breadcrumbSlideAnim 8s ease-in-out infinite alternate;
        }
        @keyframes breadcrumbSlideAnim {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% + min(650px, 55vw)));
          }
        }
        .breadcrumb-title-wrapper .breadcrumb-custom-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 0;
          background-color: #0f172a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          line-height: 1.4;
          padding: 7px 12px;
          border-radius: 6px;
          white-space: normal;
          max-width: 360px;
          width: max-content;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
          pointer-events: none;
          opacity: 0;
          visibility: hidden;
          transform: translateY(4px);
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
          z-index: 1050;
        }
        .breadcrumb-title-wrapper .breadcrumb-custom-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 20px;
          border-width: 5px;
          border-style: solid;
          border-color: #0f172a transparent transparent transparent;
        }
        .breadcrumb-title-wrapper:hover .breadcrumb-custom-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
      `}</style>
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
