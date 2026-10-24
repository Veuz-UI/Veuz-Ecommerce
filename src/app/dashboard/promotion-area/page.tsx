'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { fetchPromotionArea, savePromotionArea, PROMOTION_AREA_EVENT } from '@/services/promotionAreaService';
import { PromotionCardItem, DEFAULT_PROMOTION_AREA } from '@/data/defaultPromotionArea';
import { fetchShopSettings } from '@/services/shopSettingsService';
import { ShopCategory } from '@/data/defaultShopSettings';
import { useToast } from '@/context/ToastContext';
import { DashboardTableSkeleton } from '@/components/ui/skeletons';

const STORE_PAGES = [
  { label: 'All Products (/products)', value: '/products' },
  { label: 'New Arrivals (/new-arrival-products)', value: '/new-arrival-products' },
  { label: 'Most Searched (/most-searched-products)', value: '/most-searched-products' },
  { label: 'Limited Offers (/limited-offers)', value: '/limited-offers' },
  { label: 'All Categories (/categories)', value: '/categories' },
];

interface DestinationDropdownProps {
  value: string;
  onChange: (newVal: string) => void;
  categories: ShopCategory[];
}

function DestinationDropdown({ value, onChange, categories }: DestinationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    if (shouldOpenUp) {
      setCoords({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
      });
    } else {
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside or resizing/scrolling
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize(event: Event) {
      // If scrolling inside the dropdown menu itself, let it scroll freely and do not close!
      if (menuRef.current && (event.target === menuRef.current || menuRef.current.contains(event.target as Node))) {
        return;
      }
      // If scrolling the page/parent, update position so it stays attached to the trigger button
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Selected item display text
  const selectedPage = STORE_PAGES.find((p) => p.value === value);
  const selectedCat = categories.find((c) => (c.link || `/products?category=${encodeURIComponent(c.name)}`) === value);
  const displayLabel = selectedPage?.label || (selectedCat ? `${selectedCat.name} (${selectedCat.link || `/products?category=${encodeURIComponent(selectedCat.name)}`})` : value || '/products');

  return (
    <div className="w-100 position-relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        className="form-control form-control-sm d-flex align-items-center justify-content-between text-dark fw-medium bg-white text-start shadow-none"
        style={{
          height: '34px',
          borderRadius: '3px',
          borderColor: isOpen ? '#0f172a' : '#d1d5db',
          boxShadow: isOpen ? '0 0 0 2px rgba(15, 23, 42, 0.1)' : 'none',
          padding: '0 12px',
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
          <iconify-icon icon="solar:cursor-bold" class="fs-14 text-secondary flex-shrink-0"></iconify-icon>
          <span className="text-truncate fs-12 fw-medium text-dark">{displayLabel}</span>
        </div>
        <iconify-icon
          icon="solar:alt-arrow-down-linear"
          class="fs-14 text-muted flex-shrink-0"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        ></iconify-icon>
      </button>

      {/* Floating Dropdown List - Rendered OUTSIDE table container directly into document.body */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="bg-white border shadow-lg"
          style={{
            position: 'fixed',
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            borderRadius: '4px',
            zIndex: 999999,
            maxHeight: '210px',
            overflowY: 'auto',
            borderColor: '#cbd5e1',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Group 1: Store Pages */}
          <div className="px-3 pt-2 pb-1 text-uppercase fs-10 fw-bold text-muted" style={{ letterSpacing: '0.6px', backgroundColor: '#f8fafc' }}>
            Store Pages
          </div>
          {STORE_PAGES.map((page) => {
            const isSelected = value === page.value;
            return (
              <button
                key={page.value}
                type="button"
                className="w-100 text-start px-3 py-2 border-0 bg-transparent d-flex align-items-center justify-content-between fs-12"
                style={{
                  backgroundColor: isSelected ? '#f1f5f9' : 'transparent',
                  color: isSelected ? '#0f172a' : '#334155',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background-color 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                  onChange(page.value);
                  setIsOpen(false);
                }}
              >
                <span className="text-truncate">{page.label}</span>
                {isSelected && (
                  <iconify-icon icon="solar:check-read-bold" class="fs-14 text-dark ms-2 flex-shrink-0"></iconify-icon>
                )}
              </button>
            );
          })}

          {/* Group 2: Product Categories */}
          {categories.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-uppercase fs-10 fw-bold text-muted border-top" style={{ letterSpacing: '0.6px', backgroundColor: '#f8fafc' }}>
                Product Categories
              </div>
              {categories.map((cat) => {
                const catLink = cat.link || `/products?category=${encodeURIComponent(cat.name)}`;
                const isSelected = value === catLink;
                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    className="w-100 text-start px-3 py-2 border-0 bg-transparent d-flex align-items-center justify-content-between fs-12"
                    style={{
                      backgroundColor: isSelected ? '#f1f5f9' : 'transparent',
                      color: isSelected ? '#0f172a' : '#334155',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      onChange(catLink);
                      setIsOpen(false);
                    }}
                  >
                    <span className="text-truncate">{cat.name} ({catLink})</span>
                    {isSelected && (
                      <iconify-icon icon="solar:check-read-bold" class="fs-14 text-dark ms-2 flex-shrink-0"></iconify-icon>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Custom URL */}
          {value &&
            !STORE_PAGES.some((p) => p.value === value) &&
            !categories.some((c) => (c.link || `/products?category=${encodeURIComponent(c.name)}`) === value) && (
              <>
                <div className="px-3 pt-2 pb-1 text-uppercase fs-10 fw-bold text-muted border-top" style={{ letterSpacing: '0.6px', backgroundColor: '#f8fafc' }}>
                  Custom URL
                </div>
                <div className="px-3 py-2 fs-12 fw-semibold text-dark bg-light d-flex align-items-center justify-content-between">
                  <span className="text-truncate">{value}</span>
                  <iconify-icon icon="solar:check-read-bold" class="fs-14 text-dark ms-2 flex-shrink-0"></iconify-icon>
                </div>
              </>
            )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function PromotionAreaPage() {
  const { showToast } = useToast();

  const [promotions, setPromotions] = useState<PromotionCardItem[]>(DEFAULT_PROMOTION_AREA.promotions);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Record<number, { width: number; height: number }>>({});

  const handleImageLoad = (index: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImageDimensions((prev) => ({
        ...prev,
        [index]: { width: img.naturalWidth, height: img.naturalHeight },
      }));
    }
  };

  // Load initial data (promotions + active store categories)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [promoData, shopData] = await Promise.all([
        fetchPromotionArea(),
        fetchShopSettings(),
      ]);

      if (promoData && Array.isArray(promoData.promotions) && promoData.promotions.length > 0) {
        const list = [...promoData.promotions];
        while (list.length < 4) {
          list.push({ id: `promo-card-${list.length + 1}`, image: '', title: '', link: '/products' });
        }
        setPromotions(list.slice(0, 4));
      }
      if (shopData && Array.isArray(shopData.categories)) {
        setCategories(shopData.categories.filter((c) => c.isActive !== false));
      }
    } catch (err: any) {
      console.error('Error loading promotion area:', err);
      showToast('danger', 'Failed to load promotion images.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail.promotions)) {
        const list = [...customEvent.detail.promotions];
        while (list.length < 4) {
          list.push({ id: `promo-card-${list.length + 1}`, image: '', title: '', link: '/products' });
        }
        setPromotions(list.slice(0, 4));
      }
    };

    window.addEventListener(PROMOTION_AREA_EVENT, handleUpdated);
    return () => window.removeEventListener(PROMOTION_AREA_EVENT, handleUpdated);
  }, [loadData]);

  // Handle single card image change
  const handleImageChange = (index: number, newImageUrl: string) => {
    setPromotions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], image: newImageUrl };
      return updated;
    });
  };

  // Handle single card link change from dropdown
  const handleLinkChange = (index: number, newLink: string) => {
    setPromotions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], link: newLink };
      return updated;
    });
  };

  // Upload file for a specific card slot
  const handleFileUpload = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('warning', 'Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'Image file must be under 5MB.');
      return;
    }

    setUploadingSlot(index);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast('danger', json.message || 'Server rejected file upload.');
        return;
      }

      handleImageChange(index, json.url);
      showToast('success', `Promotion Card ${index + 1} image uploaded successfully!`, 'Image Uploaded');
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast('danger', err.message || 'Error uploading image.');
    } finally {
      setUploadingSlot(null);
    }
  };

  // Clear a slot image
  const handleClearSlot = (index: number) => {
    setPromotions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        image: '',
      };
      return updated;
    });
    setImageDimensions((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    showToast('info', `Cleared image for Card ${index + 1}.`);
  };

  // Save changes
  const handleSaveAll = async () => {
    const hasAtLeastOne = promotions.some(
      (p) => Boolean(p.image && p.image.trim() && !p.image.includes('promo-card-'))
    );

    if (!hasAtLeastOne) {
      showToast('warning', 'Please upload at least one promotion image before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePromotionArea({ promotions });
      if (res.success) {
        showToast('success', 'Promotion images updated successfully and synced with the storefront!', 'Promotions Saved');
      } else {
        showToast('danger', res.message || 'Failed to save promotion images.');
      }
    } catch (err: any) {
      showToast('danger', 'Error saving promotion area.');
    } finally {
      setIsSaving(false);
    }
  };

  const slotLabels = [
    {
      title: 'Promotion Card 1 (Left Tall Banner)',
      desc: 'Spans the full height of the left side.',
      recommendedSize: '600 × 740 px',
      previewWidth: '64px',
      previewHeight: '80px',
    },
    {
      title: 'Promotion Card 2 (Top-Left Banner)',
      desc: 'Top-left medium banner on the right grid.',
      recommendedSize: '500 × 350 px',
      previewWidth: '92px',
      previewHeight: '64px',
    },
    {
      title: 'Promotion Card 3 (Top-Right Banner)',
      desc: 'Top-right medium banner on the right grid.',
      recommendedSize: '500 × 350 px',
      previewWidth: '92px',
      previewHeight: '64px',
    },
    {
      title: 'Promotion Card 4 (Bottom Wide Banner)',
      desc: 'Full-width panoramic banner across the bottom right.',
      recommendedSize: '900 × 320 px',
      previewWidth: '124px',
      previewHeight: '44px',
    },
  ];

  return (
    <>
      {/* ========================================================
          MAIN WHITE BACKGROUND CONTAINER
         ======================================================== */}
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-4">
          {/* 1. Breadcrumbs */}
          <div className="d-flex align-items-center text-muted fs-13 mb-3" style={{ gap: '10px' }}>
            <Link href="/dashboard" className="text-muted text-decoration-none">
              Dashboard
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <span className="text-dark fw-bold">Promotion Area</span>
          </div>

          {/* 2. Header and Top Action Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="fw-bold text-dark mb-1" style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a' }}>
                Promotion Area
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Update the 4 promotional images displayed on your storefront and configure their destination page links.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                style={{
                  borderRadius: '8px',
                  padding: '9px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#0f172a',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                }}
                onClick={loadData}
                disabled={isLoading || isSaving}
                title="Reload current images"
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Reload</span>
              </button>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 24px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                }}
                onClick={handleSaveAll}
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <iconify-icon icon="solar:diskette-bold" class="fs-17"></iconify-icon>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 20px 0' }}></div>

          {/* Dimension Guidelines & Interactive Visual Map */}
          <div
            className="p-3 mb-4 rounded-3 border"
            style={{
              backgroundColor: '#f8fafc',
              borderColor: '#e2e8f0',
            }}
          >
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <iconify-icon icon="solar:widget-2-bold" class="fs-20 text-primary flex-shrink-0"></iconify-icon>
                <span className="fw-bold fs-14 text-dark">
                  Storefront Promotion Layout &amp; Card Dimension Specifications
                </span>
              </div>
              <span className="badge bg-dark text-white fs-11 fw-semibold" style={{ borderRadius: '4px', padding: '4px 10px' }}>
                4-Banner Asymmetric Layout
              </span>
            </div>
            <p className="text-muted fs-12 mb-3">
              Each banner slot has a distinct shape on the storefront. All uploaded images automatically adapt to their card container with 100% full visibility (no cut-off text or graphics):
            </p>

            {/* Visual Storefront Mockup Diagram */}
            <div
              className="p-3 rounded-3 mb-3 border bg-white"
              style={{
                borderColor: '#e2e8f0',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 1fr) minmax(280px, 1.5fr)',
                  gap: '12px',
                  minHeight: '170px',
                }}
              >
                {/* Slot 1 Mockup */}
                <div
                  className="p-3 rounded d-flex flex-column justify-content-between text-white"
                  style={{
                    background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-primary text-white fs-10 fw-bold px-2 py-1">Slot 1</span>
                    <span className="fs-10 text-white-50">Left Tall Banner</span>
                  </div>
                  <div className="my-2">
                    <div className="fs-15 fw-bold text-white mb-0.5">600 &times; 740 px</div>
                  </div>
                  <div className="fs-10 text-white-50 border-top pt-1 border-secondary">
                    Full Left Height
                  </div>
                </div>

                {/* Right Stack Mockup */}
                <div className="d-flex flex-column gap-2" style={{ height: '100%' }}>
                  {/* Top 2 Medium Slots */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
                    <div
                      className="p-2.5 rounded d-flex flex-column justify-content-between border"
                      style={{
                        background: '#f1f5f9',
                        borderColor: '#cbd5e1',
                        borderRadius: '6px',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-primary text-white fs-10 fw-bold px-1.5 py-0.5">Slot 2</span>
                        <span className="fs-10 text-muted">Top-Left</span>
                      </div>
                      <div className="my-1">
                        <div className="fs-13 fw-bold text-dark">500 &times; 350 px</div>
                      </div>
                      <div className="fs-9 text-muted border-top pt-0.5">Medium Box</div>
                    </div>

                    <div
                      className="p-2.5 rounded d-flex flex-column justify-content-between border"
                      style={{
                        background: '#f1f5f9',
                        borderColor: '#cbd5e1',
                        borderRadius: '6px',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-primary text-white fs-10 fw-bold px-1.5 py-0.5">Slot 3</span>
                        <span className="fs-10 text-muted">Top-Right</span>
                      </div>
                      <div className="my-1">
                        <div className="fs-13 fw-bold text-dark">500 &times; 350 px</div>
                      </div>
                      <div className="fs-9 text-muted border-top pt-0.5">Medium Box</div>
                    </div>
                  </div>

                  {/* Bottom Wide Slot */}
                  <div
                    className="p-2.5 rounded d-flex justify-content-between align-items-center border"
                    style={{
                      background: '#f1f5f9',
                      borderColor: '#cbd5e1',
                      borderRadius: '6px',
                      flex: 1,
                    }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-1.5 mb-0.5">
                        <span className="badge bg-primary text-white fs-10 fw-bold px-1.5 py-0.5">Slot 4</span>
                        <span className="fs-11 fw-semibold text-dark">Bottom Wide Banner</span>
                      </div>
                      <div className="fs-13 fw-bold text-dark">900 &times; 320 px</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Promotion Cards Vertical Table Style */}
          {isLoading ? (
            <DashboardTableSkeleton rows={4} cols={5} />
          ) : (
            <div className="table-responsive rounded-3 border bg-white mb-3" style={{ borderColor: '#e2e8f0' }}>
              <table className="table align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr className="font-12 text-muted">
                    <th style={{ width: '50px' }} className="ps-3 py-2.5">Slot</th>
                    <th style={{ width: '280px' }} className="py-2.5">Card Position &amp; Exact Size</th>
                    <th style={{ width: '280px' }} className="py-2.5">Image &amp; Upload</th>
                    <th className="py-2.5">Destination Link</th>
                    <th style={{ width: '90px' }} className="py-2.5 text-end pe-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {promotions.map((card, idx) => {
                    const label = slotLabels[idx] || {
                      title: `Promotion Card ${idx + 1}`,
                      desc: 'Promotional banner card on storefront',
                      recommendedSize: '600 × 400 px',
                      previewWidth: '92px',
                      previewHeight: '64px',
                    };
                    const isUploadingThis = uploadingSlot === idx;
                    const dim = imageDimensions[idx];

                    return (
                      <tr key={card.id || `promo-card-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* Slot number */}
                        <td className="ps-3">
                          <span
                            className="d-flex align-items-center justify-content-center fw-bold fs-12 text-white"
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '3px',
                              backgroundColor: '#0f172a',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Card Position & description */}
                        <td>
                          <div className="fw-bold text-dark font-14 mb-0.5">{label.title}</div>
                          <div className="text-muted font-11 mb-2">{label.desc}</div>
                          <div className="d-flex align-items-center gap-1.5 flex-wrap">
                            <span
                              className="badge bg-primary text-white font-11 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                              style={{ borderRadius: '3px', padding: '3px 8px' }}
                              title="Required dimensions for this specific card slot"
                            >
                              <iconify-icon icon="solar:ruler-bold" class="fs-12"></iconify-icon>
                              <span>Size: {label.recommendedSize}</span>
                            </span>
                            {dim ? (
                              <span
                                className="badge bg-success-subtle text-success border border-success-subtle font-10 fw-semibold d-inline-flex align-items-center gap-1"
                                style={{ borderRadius: '3px', padding: '3px 7px' }}
                                title="Dimensions of currently uploaded image"
                              >
                                <iconify-icon icon="solar:check-circle-bold" class="fs-11"></iconify-icon>
                                <span>Uploaded: {dim.width} &times; {dim.height} px</span>
                              </span>
                            ) : card.image ? (
                              <span
                                className="badge bg-secondary-subtle text-secondary font-10 fw-normal"
                                style={{ borderRadius: '3px', padding: '2px 6px' }}
                              >
                                Measuring...
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Image Preview & Upload Button (Fixed 130px Preview Zone for 100% Equal Level Alignment) */}
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            {/* Uniform width preview column so all Change buttons align horizontally */}
                            <div
                              style={{
                                width: '130px',
                                height: '82px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                className="position-relative overflow-hidden border d-flex align-items-center justify-content-center"
                                style={{
                                  width: label.previewWidth || '92px',
                                  height: label.previewHeight || '64px',
                                  borderRadius: '4px',
                                  backgroundColor: '#f8fafc',
                                  borderColor: '#e2e8f0',
                                }}
                              >
                                {card.image ? (
                                  <img
                                    src={card.image}
                                    alt={label.title}
                                    onLoad={(e) => handleImageLoad(idx, e)}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'fill',
                                      borderRadius: '3px',
                                    }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.src = '/assets/imgs/theme/placeholder.svg';
                                    }}
                                  />
                                ) : (
                                  <div className="text-center p-1 text-muted">
                                    <iconify-icon icon="solar:gallery-wide-bold" class="fs-20 text-secondary mb-0.5"></iconify-icon>
                                    <div className="fs-10 fw-medium">No Image</div>
                                  </div>
                                )}

                                {isUploadingThis && (
                                  <div
                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.78)', zIndex: 10, borderRadius: '3px' }}
                                  >
                                    <div className="spinner-border text-light spinner-border-sm" role="status"></div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Upload Button & Size Hint (Uniform width and equal horizontal position) */}
                            <div className="d-flex flex-column gap-1" style={{ width: '105px', flexShrink: 0 }}>
                              <label
                                className="btn btn-sm btn-outline-dark d-inline-flex align-items-center justify-content-center gap-1.5 font-12 fw-semibold mb-0 w-100"
                                style={{ borderRadius: '3px', padding: '6px 0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                <iconify-icon icon="solar:upload-minimalistic-bold" class="fs-14"></iconify-icon>
                                <span>{card.image ? 'Change' : 'Upload'}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  className="d-none"
                                  disabled={isUploadingThis || isSaving}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(idx, file);
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              <span className="font-10 text-muted text-center" style={{ fontSize: '10px' }}>
                                Target: <strong>{label.recommendedSize}</strong>
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Destination Link */}
                        <td style={{ minWidth: '220px' }}>
                          <DestinationDropdown
                            value={card.link || '/products'}
                            onChange={(newVal) => handleLinkChange(idx, newVal)}
                            categories={categories}
                          />
                        </td>

                        {/* Clear Button */}
                        <td className="text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border text-danger d-inline-flex align-items-center gap-1 font-12"
                            style={{ borderRadius: '3px', padding: '5px 12px' }}
                            onClick={() => handleClearSlot(idx)}
                            title="Clear image"
                            disabled={!card.image}
                          >
                            <iconify-icon icon="solar:trash-bin-minimalistic-linear" class="fs-13"></iconify-icon>
                            <span>Clear</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Save Action Bar */}
          <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
              style={{
                borderRadius: '3px',
                padding: '10px 26px',
                backgroundColor: '#0f172a',
                border: '1px solid #0f172a',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
              }}
              onClick={handleSaveAll}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <iconify-icon icon="solar:diskette-bold" class="fs-17"></iconify-icon>
                  <span>Save Promotion Images</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
