'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { DEFAULT_SHOP_SETTINGS, ShopCategory } from '@/data/defaultShopSettings';
import { fetchProducts, recordProductClick, PRODUCTS_EVENT } from '@/services/productsService';
import { CATEGORY_PRODUCTS_DATA, ProductItem, SYSTEM_COLORS, PRESET_SIZES, SystemColor } from '@/data/categoryProductsData';
import { fetchAttributes, ATTRIBUTES_EVENT } from '@/services/attributesService';
import { useToast } from '@/context/ToastContext';
import { ProductCardImageSlider } from '@/components/common/ProductCardImageSlider';

export type CatalogPageMode = 'category' | 'products' | 'offers' | 'most-searched';
type CollectionFilter = 'all' | 'new-arrival' | 'most-searched' | 'special-offers';
type SortOption = 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'discount';

interface ProductsCatalogViewProps {
  pageMode?: CatalogPageMode;
}

function ProductsCatalogContent({ pageMode = 'category' }: ProductsCatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const urlCategoryParam = searchParams.get('category') || searchParams.get('selected') || 'all';
  const urlFilterParam = (searchParams.get('filter') || 'all') as CollectionFilter;
  const urlSearchQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState<ShopCategory[]>(DEFAULT_SHOP_SETTINGS.categories);
  const [products, setProducts] = useState<ProductItem[]>(CATEGORY_PRODUCTS_DATA);
  const [isLoading, setIsLoading] = useState(false);

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const dragDistanceRef = useRef(0);

  // Update collection filter if query param changes
  useEffect(() => {
    if (urlFilterParam) {
      setActiveCollection(urlFilterParam);
    }
  }, [urlFilterParam]);

  useEffect(() => {
    if (urlCategoryParam && urlCategoryParam !== 'all') {
      setSelectedCategories([urlCategoryParam]);
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
        }, 120);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Draggable top slider handlers (Smooth dragging)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current || e.button !== 0) return;
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
      }, 120);
    }
  };

  // Touch handlers for mobile / tablet swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    isMouseDownRef.current = true;
    dragDistanceRef.current = 0;
    startXRef.current = e.touches[0].pageX;
    scrollStartRef.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.scrollBehavior = 'auto';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDownRef.current || !sliderRef.current) return;
    const distance = e.touches[0].pageX - startXRef.current;
    dragDistanceRef.current = Math.abs(distance);
    sliderRef.current.scrollLeft = scrollStartRef.current - distance;
  };

  const handleTouchEnd = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      if (sliderRef.current) {
        sliderRef.current.style.scrollBehavior = 'smooth';
      }
      setTimeout(() => {
        dragDistanceRef.current = 0;
      }, 120);
    }
  };

  // Scroll Slider via Left / Right Arrow Buttons
  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const amount = 340;
    const current = container.scrollLeft;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    
    if (direction === 'right') {
      if (current >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: amount, behavior: 'smooth' });
      }
    } else {
      if (current <= 15) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -amount, behavior: 'smooth' });
      }
    }
  };

  // Category Selection from Slider
  const handleCategorySelectFromSlider = (catName: string) => {
    if (dragDistanceRef.current > 10) {
      return;
    }
    if (catName === 'all') {
      setSelectedCategories([]);
    } else {
      setSelectedCategories((prev) =>
        prev.length === 1 && prev[0].toLowerCase() === catName.toLowerCase()
          ? []
          : [catName]
      );
    }
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
    setWishlist((prev) => {
      const next = !prev[productId];
      showToast(next ? 'success' : 'info', next ? 'Added to your wishlist!' : 'Removed from wishlist.');
      return { ...prev, [productId]: next };
    });
  };

  // Add to Cart
  const handleAddToCart = (product: ProductItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showToast('success', `Added "${product.title}" to your cart!`, 'Cart Updated');
  };

  // ========================================================
  // BASE PRODUCTS SCOPING BASED ON PAGE MODE
  // ========================================================
  // 1. category page: All products
  // 2. products page: New products and most viewed / most searched products
  // 3. offers page: Strictly offer products (isSpecialOffer === true, discount, or offerPercent > 0)
  const baseScopedProducts = useMemo(() => {
    const active = products.filter((p) => p.isActive !== false);

    if (pageMode === 'offers') {
      return active.filter(
        (p) =>
          p.isSpecialOffer === true ||
          Boolean(p.discount) ||
          (p.offerPercent && p.offerPercent > 0) ||
          p.badgeClass === 'sale'
      );
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
      result = result.filter(
        (p) =>
          p.isSpecialOffer === true ||
          Boolean(p.discount) ||
          (p.offerPercent && p.offerPercent > 0) ||
          (Boolean(p.oldPrice) && p.oldPrice !== p.price)
      );
    }

    // 2. Category filter (multiple selection)
    if (selectedCategories.length > 0) {
      const lowerSelected = selectedCategories.map((c) => c.toLowerCase());
      result = result.filter((p) => {
        const cat = p.category?.toLowerCase() || '';
        return lowerSelected.some((sel) => cat.includes(sel) || sel.includes(cat) || p.categoryId === sel);
      });
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
  }, [baseScopedProducts, urlSearchQuery, activeCollection, selectedCategories, selectedSizes, selectedColors, priceRange, selectedStandard, sortBy]);

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
    if (selectedCategories.length === 1) return selectedCategories[0];
    if (pageMode === 'offers') {
      return 'Offer Products';
    }
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
  }, [pageMode, activeCollection, selectedCategories]);

  // Page description calculation
  const pageDescription = useMemo(() => {
    if (pageMode === 'offers') {
      return `Exclusive discounted promotions and limited-time certified safety gear offers (${filteredAndSortedProducts.length} items).`;
    }
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
            <h1 className="fw-bold text-dark mb-1" style={{ fontSize: '28px', letterSpacing: '-0.5px' }}>
              {pageTitle}
            </h1>
            <p className="text-muted fs-14 mb-0">
              {pageDescription}
            </p>
          </div>
        </div>

        {/* ========================================================
            2. TOP CATEGORIES HORIZONTAL SLIDER (Left & Right Arrows + Centered Categories)
           ======================================================== */}
        <div
          className="card border-0 mb-4 overflow-hidden"
          style={{
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
            padding: '16px 20px',
          }}
        >
          <div className="d-flex align-items-center w-100 position-relative" style={{ gap: '14px' }}>
            {/* Left arrow button (White bg with subtle border & shadow) */}
            <button
              type="button"
              onClick={() => scrollSlider('left')}
              className="btn-category-slider-arrow flex-shrink-0"
              aria-label="Scroll Left"
              title="Previous Categories"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
                padding: 0,
                zIndex: 3,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {/* Draggable Category Slider Track */}
            <div
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="category-slider-track d-flex align-items-center flex-nowrap hide-scrollbar"
              style={{
                flex: '1 1 0%',
                minWidth: 0,
                width: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexWrap: 'nowrap',
                whiteSpace: 'nowrap',
                gap: '12px',
                cursor: 'grab',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                userSelect: 'none',
                WebkitOverflowScrolling: 'touch',
                padding: '6px 2px',
                scrollBehavior: 'smooth',
              }}
            >
              {/* All Categories Option */}
              <div
                onClick={() => handleCategorySelectFromSlider('all')}
                className={`category-pill-card d-flex align-items-center flex-shrink-0 ${
                  selectedCategories.length === 0 ? 'active-cat-pill' : ''
                }`}
                style={{
                  minWidth: '205px',
                  height: '66px',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  backgroundColor: selectedCategories.length === 0 ? '#f0fdf4' : '#ffffff',
                  border: selectedCategories.length === 0 ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                  boxShadow: selectedCategories.length === 0
                    ? '0 4px 14px rgba(22, 163, 74, 0.16)'
                    : '0 2px 6px rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                <div
                  className="rounded-3 border overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center"
                  style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: '#f8fafc',
                    borderColor: selectedCategories.length === 0 ? '#86efac' : '#e2e8f0',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div className="overflow-hidden" style={{ pointerEvents: 'none' }}>
                  <div
                    className="fw-bold fs-14 text-truncate"
                    style={{ color: selectedCategories.length === 0 ? '#16a34a' : '#0f172a' }}
                  >
                    All Categories
                  </div>
                  <div className="text-muted fs-12">{baseScopedProducts.length} Products</div>
                </div>
              </div>

              {/* Dynamic Categories */}
              {categories.map((cat, idx) => {
                const isSelected = selectedCategories.some(
                  (c) => c.toLowerCase() === cat.name.toLowerCase()
                );
                const count = baseScopedProducts.filter(
                  (p) =>
                    p.category?.toLowerCase() === cat.name.toLowerCase() ||
                    p.categoryId === cat.id
                ).length;

                return (
                  <div
                    key={cat.id || idx}
                    onClick={() => handleCategorySelectFromSlider(cat.name)}
                    className={`category-pill-card d-flex align-items-center flex-shrink-0 ${
                      isSelected ? 'active-cat-pill' : ''
                    }`}
                    style={{
                      minWidth: '210px',
                      height: '66px',
                      borderRadius: '14px',
                      padding: '10px 16px',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      border: isSelected ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                      boxShadow: isSelected
                        ? '0 4px 14px rgba(22, 163, 74, 0.16)'
                        : '0 2px 6px rgba(0, 0, 0, 0.02)',
                      cursor: 'pointer',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      userSelect: 'none',
                    }}
                  >
                    <div
                      className="rounded-3 border overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: '44px',
                        height: '44px',
                        backgroundColor: '#ffffff',
                        borderColor: isSelected ? '#86efac' : '#e2e8f0',
                        pointerEvents: 'none',
                      }}
                    >
                      <img
                        src={cat.image || '/assets/imgs/theme/icons/category-1.svg'}
                        alt={cat.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'contain',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/imgs/theme/icons/category-1.svg';
                        }}
                      />
                    </div>
                    <div className="overflow-hidden" style={{ pointerEvents: 'none' }}>
                      <div
                        className="fw-bold fs-14 text-truncate"
                        style={{ color: isSelected ? '#16a34a' : '#0f172a' }}
                      >
                        {cat.name}
                      </div>
                      <div className="text-muted fs-12">{count} Products</div>
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
              aria-label="Scroll Right"
              title="Next Categories"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                cursor: 'pointer',
                padding: 0,
                zIndex: 3,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      borderRadius: '7px',
                      backgroundColor: isAnyFilterActive || isClearClicked ? '#dc2626' : '#0f172a',
                      color: '#ffffff',
                      border: isAnyFilterActive || isClearClicked ? '1px solid #b91c1c' : '1px solid #0f172a',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isAnyFilterActive || isClearClicked
                        ? '0 2px 8px rgba(220, 38, 38, 0.28)'
                        : '0 2px 6px rgba(15, 23, 42, 0.15)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isAnyFilterActive || isClearClicked ? '#b91c1c' : '#1e293b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isAnyFilterActive || isClearClicked ? '#dc2626' : '#0f172a';
                    }}
                    title="Clear all filters"
                    aria-label="Clear all filters"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Clear all</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                      width: '34px',
                      height: '34px',
                      minWidth: '34px',
                      borderRadius: '7px',
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#334155',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e2e8f0';
                      e.currentTarget.style.borderColor = '#94a3b8';
                      e.currentTarget.style.color = '#0f172a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.color = '#334155';
                    }}
                    title="Hide Filters Sidebar"
                    aria-label="Hide Filters Sidebar"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <polyline points="15 9 12 12 15 15" />
                    </svg>
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
                        { key: 'all', label: 'All Products', count: baseScopedProducts.length },
                        { key: 'new-arrival', label: 'New Arrival', count: baseScopedProducts.filter((p) => p.isNewArrival !== false || p.badgeClass === 'new').length },
                        { key: 'most-searched', label: 'Most Searched / Viewed', count: baseScopedProducts.filter((p) => (p.clicks || 0) + (p.views || 0) > 0 || p.badgeClass === 'hot').length },
                        { key: 'special-offers', label: 'Special Offers', count: baseScopedProducts.filter((p) => p.isSpecialOffer === true || Boolean(p.discount)).length, isSpecial: true },
                      ].map((item) => {
                        const isActive = activeCollection === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => setActiveCollection(item.key as CollectionFilter)}
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

              {/* Card 2: Size Filter */}
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
                <button
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
                  <span>{isSidebarOpen ? 'Hide Filters' : 'Show Filters'}</span>
                  {isAnyFilterActive && (
                    <span
                      className={`badge rounded-pill ${isSidebarOpen ? 'bg-dark text-white' : 'bg-danger text-white'}`}
                      style={{ fontSize: '10.5px', padding: '2px 7px' }}
                    >
                      Active
                    </span>
                  )}
                </button>

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
            {filteredAndSortedProducts.length === 0 ? (
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
              <div className="row g-3 g-lg-4">
                {filteredAndSortedProducts.map((prod) => {
                  const hasActiveOffer = prod.isSpecialOffer === true && Boolean(prod.discount || prod.offerPercent);
                  const displayDiscount = hasActiveOffer
                    ? (prod.discount || (prod.offerPercent ? `${prod.offerPercent}% OFF` : ''))
                    : '';
                  const currentPrice = prod.price || (prod.currentPrice ? `${prod.currentPrice} SR` : '');

                  // Determine clean card badge
                  let cardBadge = 'New Arrival';
                  if (hasActiveOffer) {
                    cardBadge = displayDiscount || 'Special Offer';
                  } else if (pageMode === 'products' || prod.isNewArrival !== false) {
                    cardBadge = 'New Arrival';
                  } else if (prod.badge && prod.badge !== 'Special Offer') {
                    cardBadge = prod.badge;
                  }

                  return (
                    <div
                      key={prod.id}
                      className={isSidebarOpen ? 'col-12 col-sm-6 col-md-6 col-lg-4 col-xl-4 d-flex' : 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3 d-flex'}
                      style={{ transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    >
                      <div className="product-cart-wrap uniform-product-card w-100 d-flex flex-column">
                        {/* Image Wrap with Top-Left Badge & Top-Right Circular Wishlist Heart */}
                        <div className="product-img-action-wrap position-relative">
                          {/* Top-Left Badge */}
                          <span className="ref-card-badge">
                            {cardBadge}
                          </span>

                          {/* Top-Right Circular Wishlist Button */}
                          <button
                            type="button"
                            aria-label="Add To Wishlist"
                            className={`ref-card-top-wishlist ${wishlist[prod.id] ? 'active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(prod.id);
                            }}
                            title="Add to Wishlist"
                          >
                            <i className={`fi-rs-heart ${wishlist[prod.id] ? 'fill-heart text-danger' : ''}`}></i>
                          </button>

                          {/* Main Product Image & Multi-Angle Slider with navigation */}
                          <ProductCardImageSlider
                            productId={prod.id}
                            title={prod.title}
                            link={prod.link}
                            image={prod.image}
                            images={prod.images}
                            onProductClick={recordProductClick}
                          />
                        </div>

                        {/* Product Content Wrap */}
                        <div className="product-content-wrap d-flex flex-column flex-grow-1 justify-content-between">
                          <div>
                            {/* Product Title (20px bold) */}
                            <h2 className="new-prod-title">
                              <Link
                                href={prod.link}
                                onClick={() => recordProductClick(prod.id)}
                              >
                                {prod.title}
                              </Link>
                            </h2>

                            {/* Star Rating with Review Count (Matching Reference Card) */}
                            <div className="product-rate d-flex align-items-center mb-2">
                              <div className="ref-card-stars me-2">
                                <span style={{ color: '#0f172a', fontSize: '13px', letterSpacing: '1px' }}>★★★★★</span>
                              </div>
                              <span className="rating-score fw-bold" style={{ fontSize: '13px', color: '#0f172a', marginRight: '4px' }}>
                                {prod.rating || '4.8'}
                              </span>
                              <span className="rating-reviews" style={{ fontSize: '13px', color: '#64748b' }}>
                                ({prod.reviews || '85'} reviews)
                              </span>
                            </div>

                            {/* Product Price & Discount Badge (22px bold current price + 14px old price + solid black discount badge) */}
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
                                {hasActiveOffer && displayDiscount && (
                                  <span className="ref-card-discount-black">
                                    {displayDiscount}
                                  </span>
                                )}
                              </div>
                              <div className="new-prod-vat-label">Inclusive of VAT</div>
                            </div>

                            {/* Product Description (14px, 2-line clamp, placed below price) */}
                            <p className="new-prod-desc">
                              {prod.desc || 'Certified industrial safety gear with high performance compliance.'}
                            </p>

                            {/* Express Delivery Badge */}
                            <div className="mb-2">
                              <span className="express-delivery-badge">
                                <i className="fi-rs-bolt"></i>Express Delivery
                              </span>
                            </div>
                          </div>

                          {/* Reference Card Bottom Action Bar (Wide Black Add to Cart + Square Wishlist Button) */}
                          <div className="product-card-bottom d-flex align-items-center gap-2 mt-auto">
                            <button
                              type="button"
                              className="btn-add-cart-wide"
                              onClick={(e) => handleAddToCart(prod, e)}
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
                              className={`btn-wishlist-square ${wishlist[prod.id] ? 'active' : ''}`}
                              onClick={() => toggleWishlist(prod.id)}
                              title="Add to Wishlist"
                            >
                              <i className={`fi-rs-heart ${wishlist[prod.id] ? 'fill-heart text-danger' : ''}`}></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
    <Suspense
      fallback={
        <div className="py-5 text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading Catalog...</span>
          </div>
        </div>
      }
    >
      <ProductsCatalogContent {...props} />
    </Suspense>
  );
}

export default ProductsCatalogView;
