'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchBannerSettings, saveBannerSettings, swapBannerOrder, normalizeBannerList } from '@/services/bannerSettingsService';
import { MainBannerItem, PromoBannerItem, BannerSettingsData, countWords } from '@/data/defaultBannerSettings';
import { fetchShopSettings } from '@/services/shopSettingsService';
import { ShopCategory } from '@/data/defaultShopSettings';
import { validateImageFile, compressImage } from '@/utils/imageSecurity';
import { useToast } from '@/context/ToastContext';

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
  const [customInput, setCustomInput] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomInput(value);
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Selected item display text
  const selectedPage = STORE_PAGES.find((p) => p.value === value);
  const selectedCat = categories.find((c) => (c.link || `/products?category=${encodeURIComponent(c.name)}`) === value);
  const displayLabel = selectedPage?.label || (selectedCat ? `${selectedCat.name} (${selectedCat.link || `/products?category=${encodeURIComponent(selectedCat.name)}`})` : value || '/products');

  return (
    <div className="position-relative w-100" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className="form-control d-flex align-items-center justify-content-between text-dark fw-medium bg-white text-start shadow-none"
        style={{
          height: '42px',
          borderRadius: '8px',
          borderColor: isOpen ? '#0f172a' : '#cbd5e1',
          boxShadow: isOpen ? '0 0 0 2px rgba(15, 23, 42, 0.1)' : 'none',
          padding: '0 12px',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
          <iconify-icon icon="solar:cursor-bold" class="fs-15 text-secondary flex-shrink-0"></iconify-icon>
          <span className="text-truncate fs-13 fw-medium text-dark">{displayLabel}</span>
        </div>
        <iconify-icon
          icon="solar:alt-arrow-down-linear"
          class="fs-15 text-muted flex-shrink-0"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        ></iconify-icon>
      </button>

      {/* Floating Dropdown List - 5 items shown, remainder scrolls */}
      {isOpen && (
        <div
          className="position-absolute start-0 w-100 bg-white border rounded-3 shadow-lg"
          style={{
            top: '46px',
            zIndex: 1050,
            maxHeight: '190px', // Exactly 5 items visible, balance scrolls
            overflowY: 'auto',
            borderColor: '#e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Custom Link Input inside dropdown */}
          <div className="p-2 border-bottom bg-light sticky-top" style={{ backgroundColor: '#f8fafc' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white" style={{ borderColor: '#cbd5e1' }}>
                <iconify-icon icon="solar:link-linear" class="fs-13 text-muted"></iconify-icon>
              </span>
              <input
                type="text"
                className="form-control fs-12"
                placeholder="Or type custom URL (e.g. /products)..."
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  onChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsOpen(false);
                  }
                }}
                style={{ borderColor: '#cbd5e1' }}
              />
            </div>
          </div>

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
                    <span className="text-truncate">
                      {cat.name}{' '}
                      <small className="text-muted fw-normal">({catLink})</small>
                    </span>
                    {isSelected && (
                      <iconify-icon icon="solar:check-read-bold" class="fs-14 text-dark ms-2 flex-shrink-0"></iconify-icon>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BannerEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryType = (searchParams.get('type') === 'promo' ? 'promo' : 'main') as 'main' | 'promo';
  const queryId = searchParams.get('id') || '';
  const isCreateMode = !queryId || searchParams.get('mode') === 'create';

  const [bannerType, setBannerType] = useState<'main' | 'promo'>(queryType);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [fullData, setFullData] = useState<BannerSettingsData>({
    mainBanners: [],
    promoBanners: [],
  });

  // Form Fields
  const [id, setId] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [showButton, setShowButton] = useState<boolean>(true);
  const [buttonText, setButtonText] = useState<string>('Shop Now');
  const [link, setLink] = useState<string>('/products');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Load existing banners
  useEffect(() => {
    const loadBanner = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBannerSettings();
        setFullData(data);

        if (!isCreateMode && queryId) {
          // Edit existing banner
          if (queryType === 'main') {
            const found = data.mainBanners.find((b) => b.id === queryId);
            if (found) {
              setBannerType('main');
              setId(found.id);
              setImage(found.image || '');
              setTitle(found.title || '');
              setSubtitle(found.subtitle || '');
              setDesc(found.desc || '');
              setPrice(found.price || '');
              setShowButton(found.showButton !== false && Boolean(found.buttonText));
              setButtonText(found.buttonText || (found.showButton !== false ? 'Shop Now' : ''));
              setLink(found.link || '/products');
              setOrder(found.order || 1);
              setIsActive(found.isActive !== false);
            } else {
              showToast('danger', 'Main banner not found. Switched to create mode.');
              initCreateDefaults('main', data);
            }
          } else {
            const found = data.promoBanners.find((b) => b.id === queryId);
            if (found) {
              setBannerType('promo');
              setId(found.id);
              setImage(found.image || '');
              setTitle(found.title || '');
              setSubtitle(found.subtitle || '');
              setDesc(found.desc || '');
              setPrice(found.price || '');
              setShowButton(found.showButton !== false && Boolean(found.buttonText));
              setButtonText(found.buttonText || (found.showButton !== false ? 'Shop Now' : ''));
              setLink(found.link || '/products');
              setOrder(found.order || 1);
              setIsActive(found.isActive !== false);
            } else {
              showToast('danger', 'Promotion banner not found. Switched to create mode.');
              initCreateDefaults('promo', data);
            }
          }
        } else {
          // Create new banner mode - NO DUMMY VALUES
          initCreateDefaults(queryType, data);
        }

        // Load categories for destination link dropdown
        fetchShopSettings().then((res) => {
          if (res?.categories && Array.isArray(res.categories)) {
            setCategories(res.categories);
          }
        }).catch(() => {});
      } catch (err: any) {
        showToast('danger', 'Failed to load banner details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBanner();
  }, [queryId, queryType, isCreateMode, showToast]);

  // Initialize new banner with EMPTY values and clean placeholders (NO DUMMY CONTENT)
  const initCreateDefaults = (type: 'main' | 'promo', data: BannerSettingsData) => {
    setBannerType(type);
    const newId = `${type}-banner-${Date.now()}`;
    setId(newId);
    const nextOrder = (type === 'main' ? data.mainBanners?.length : data.promoBanners?.length) || 0;
    setOrder(nextOrder + 1 > 12 ? 12 : nextOrder + 1);

    // Empty fields for new banners (Clean placeholder behavior requested by user)
    setImage('');
    setTitle('');
    setSubtitle('');
    setDesc('');
    setPrice('');
    setShowButton(true);
    setButtonText('Shop Now');
    setLink('/products');
    setIsActive(true);
  };

  // Word count calculations
  const titleWordCount = countWords(title);
  const descWordCount = countWords(desc);

  // Handle Secure Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';

    // 1. Client Security: File format lock (Only .jpg, .jpeg, .png, .webp, .svg, .gif)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!hasValidExt) {
      showToast(
        'danger',
        'Security Error: Invalid file format locked. Only JPG, PNG, and WebP images are permitted.',
        'Format Locked'
      );
      return;
    }

    // 2. Client Security: Size validation (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const validation = validateImageFile(file, MAX_SIZE_BYTES);
    if (!validation.valid) {
      showToast('danger', validation.error || 'File validation failed. Max size is 5MB.');
      return;
    }

    // 3. Compress / sanitize image in browser (removes malicious EXIF payload)
    setIsUploading(true);
    try {
      showToast('info', 'Validating and optimizing banner image...');
      const compressed = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.88,
        mimeType: file.type === 'image/png' ? 'image/png' : 'image/webp',
      });

      // 4. Send to server upload endpoint with binary magic bytes verification
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast('danger', json.message || 'Server rejected file upload.');
        return;
      }

      setImage(json.url);
      showToast('success', 'Banner image uploaded securely and verified!');
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast('danger', err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Save banner
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Mandatory Image validation (Image is the only mandatory field)
    if (!image.trim()) {
      showToast('warning', 'Banner image is mandatory. Please upload an image.');
      return;
    }

    // 2. Maximum 50 words on Heading (if provided)
    if (title.trim() && titleWordCount > 50) {
      showToast(
        'danger',
        `Heading exceeds limit (${titleWordCount}/50 words). Please reduce to maximum 50 words.`
      );
      return;
    }

    // 3. Maximum 50 words on Description / Paragraph (if provided)
    if (desc.trim() && descWordCount > 50) {
      showToast(
        'danger',
        `Description exceeds limit (${descWordCount}/50 words). Please reduce to maximum 50 words.`
      );
      return;
    }

    // 4. Check maximum 12 limit for new banners
    if (isCreateMode) {
      if (bannerType === 'main' && fullData.mainBanners.length >= 12) {
        showToast('danger', 'Cannot create banner: Maximum 12 Main Banners limit reached.');
        return;
      }
      if (bannerType === 'promo' && fullData.promoBanners.length >= 12) {
        showToast('danger', 'Cannot create banner: Maximum 12 Promotion Banners limit reached.');
        return;
      }
    }

    setIsSaving(true);

    try {
      let updatedMain = [...fullData.mainBanners];
      let updatedPromo = [...fullData.promoBanners];

      const finalButtonText = showButton ? (buttonText.trim() || 'Shop Now') : '';
      const targetOrder = Math.max(1, Number(order) || 1);

      if (bannerType === 'main') {
        const item: MainBannerItem = {
          id: id || `main-banner-${Date.now()}`,
          image: image.trim(),
          title: title.trim(),
          subtitle: subtitle.trim(),
          desc: desc.trim(),
          price: price.trim(),
          buttonText: finalButtonText,
          showButton: showButton,
          link: link.trim() || '/products',
          isActive,
          order: targetOrder,
        };

        if (isCreateMode) {
          updatedMain = updatedMain.map((b) => (b.order >= targetOrder ? { ...b, order: b.order + 1 } : b));
          updatedMain.push(item);
          updatedMain = normalizeBannerList(updatedMain);
        } else {
          // Automatic swap: if changing from 2 to 1, the banner currently at 1 swaps to 2
          updatedMain = swapBannerOrder(updatedMain, id, targetOrder);
          updatedMain = updatedMain.map((b) => (b.id === id ? { ...item, order: b.order } : b));
        }
      } else {
        const item: PromoBannerItem = {
          id: id || `promo-banner-${Date.now()}`,
          image: image.trim(),
          title: title.trim(),
          subtitle: subtitle.trim(),
          desc: desc.trim(),
          price: price.trim(),
          saleBadge: subtitle.trim() || '',
          discount: price.trim(),
          buttonText: finalButtonText,
          showButton: showButton,
          link: link.trim() || '/products',
          isActive,
          order: targetOrder,
        };

        if (isCreateMode) {
          updatedPromo = updatedPromo.map((b) => (b.order >= targetOrder ? { ...b, order: b.order + 1 } : b));
          updatedPromo.push(item);
          updatedPromo = normalizeBannerList(updatedPromo);
        } else {
          // Automatic swap: if changing from 2 to 1, the banner currently at 1 swaps to 2
          updatedPromo = swapBannerOrder(updatedPromo, id, targetOrder);
          updatedPromo = updatedPromo.map((b) => (b.id === id ? { ...item, order: b.order } : b));
        }
      }

      const res = await saveBannerSettings({
        mainBanners: updatedMain,
        promoBanners: updatedPromo,
      });

      if (res.success) {
        const bannerLabel = title.trim() ? `Banner "${title.replace(/\n/g, ' ')}"` : 'Banner';
        showToast(
          'success',
          `${bannerLabel} saved successfully! Storefront updated in real time.`,
          'Saved Successfully'
        );
        router.push('/dashboard/banner-settings');
      } else {
        showToast('danger', res.message || 'Failed to save banner settings.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentCount = bannerType === 'main' ? fullData.mainBanners.length : fullData.promoBanners.length;
  const isLimitReached = isCreateMode && currentCount >= 12;

  return (
    <>
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-4 p-md-4">
          {/* 1. Breadcrumbs Navigation */}
          <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '24px', gap: '10px' }}>
            <Link href="/dashboard" className="text-muted text-decoration-none">
              Dashboard
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <Link href="/dashboard/banner-settings" className="text-muted text-decoration-none">
              Banner Settings
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <span className="text-dark fw-bold">
              {isCreateMode ? 'Create New Banner' : 'Edit Banner'}
            </span>
          </div>

          {/* 2. Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                {isCreateMode
                  ? `Add New ${bannerType === 'main' ? 'Main Hero' : 'Side Promotion'} Banner`
                  : `Edit ${bannerType === 'main' ? 'Main Hero' : 'Side Promotion'} Banner`}
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Configure banner imagery, heading, description paragraph, link, and visibility.
              </p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <Link
                href="/dashboard/banner-settings"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                style={{
                  borderRadius: '8px',
                  padding: '9px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#0f172a',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                <iconify-icon icon="solar:arrow-left-linear" class="fs-16"></iconify-icon>
                <span>Back to Banners</span>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 24px 0' }}></div>

          {/* Limit Warning if max 12 reached in create mode */}
          {isLimitReached && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert" style={{ borderRadius: '10px' }}>
              <iconify-icon icon="solar:danger-triangle-bold" class="fs-20 text-danger"></iconify-icon>
              <div>
                <strong>Maximum 12 Banners Reached:</strong> You have reached the limit of 12 {bannerType === 'main' ? 'Main' : 'Promotion'} banners. Please delete or edit an existing banner instead.
              </div>
            </div>
          )}

          {/* Main Form + Live Preview Grid */}
          <div className="row g-4">
            {/* Left Column: Form Controls Card */}
            <div className="col-12 col-xl-7">
              <div
                className="p-4 rounded-3"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                      style={{ width: '38px', height: '38px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                    >
                      <iconify-icon icon="solar:pen-new-square-bold" class="fs-18 text-primary"></iconify-icon>
                    </span>
                    <h5 className="fs-15 fw-bold text-dark mb-0">Banner Details &amp; Validation</h5>
                  </div>
                  <span className="badge bg-light text-secondary border fs-12 px-2.5 py-1">
                    Slot #{order} of 12
                  </span>
                </div>

                <form onSubmit={handleSave}>
                  {/* Banner Type Selector */}
                  <div className="mb-4">
                    <label className="form-label fs-13 fw-bold text-dark mb-2">
                      Banner Placement Section <span className="text-danger">*</span>
                    </label>
                    <div className="row g-2">
                      <div className="col-6">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 px-3 text-start d-flex align-items-center gap-2.5 fs-13 fw-semibold ${
                            bannerType === 'main' ? 'border-dark shadow-sm' : 'border'
                          }`}
                          style={{
                            borderRadius: '8px',
                            backgroundColor: bannerType === 'main' ? '#0f172a' : '#ffffff',
                            color: bannerType === 'main' ? '#ffffff' : '#475569',
                            borderColor: bannerType === 'main' ? '#0f172a' : '#cbd5e1',
                          }}
                          onClick={() => {
                            if (isCreateMode) initCreateDefaults('main', fullData);
                          }}
                          disabled={!isCreateMode}
                        >
                          <iconify-icon icon="solar:gallery-wide-bold" class="fs-18"></iconify-icon>
                          <div>
                            <div>Main Hero Slider</div>
                            <small className="opacity-75 fs-11 fw-normal">Hero Left Slider (Max 12)</small>
                          </div>
                        </button>
                      </div>

                      <div className="col-6">
                        <button
                          type="button"
                          className={`btn w-100 py-2.5 px-3 text-start d-flex align-items-center gap-2.5 fs-13 fw-semibold ${
                            bannerType === 'promo' ? 'border-dark shadow-sm' : 'border'
                          }`}
                          style={{
                            borderRadius: '8px',
                            backgroundColor: bannerType === 'promo' ? '#0f172a' : '#ffffff',
                            color: bannerType === 'promo' ? '#ffffff' : '#475569',
                            borderColor: bannerType === 'promo' ? '#0f172a' : '#cbd5e1',
                          }}
                          onClick={() => {
                            if (isCreateMode) initCreateDefaults('promo', fullData);
                          }}
                          disabled={!isCreateMode}
                        >
                          <iconify-icon icon="solar:tag-price-bold" class="fs-18"></iconify-icon>
                          <div>
                            <div>Side Promotion Banner</div>
                            <small className="opacity-75 fs-11 fw-normal">Side Offer Banner (Max 12)</small>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner Image Upload & Guidelines (Mandatory) */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fs-13 fw-bold text-dark mb-0">
                        Banner Image <span className="text-danger">* (Mandatory)</span>
                      </label>
                      <span className="badge bg-light text-muted border fs-11">
                        Format: JPG, PNG, WebP • Max 5MB
                      </span>
                    </div>

                    {/* Banner Dimension & Size Info Message */}
                    <div
                      className="p-3 rounded-3 d-flex align-items-start gap-2.5 mb-3"
                      style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <iconify-icon
                        icon="solar:info-circle-bold"
                        class="fs-20 flex-shrink-0 text-primary mt-0.5"
                      ></iconify-icon>
                      <div className="fs-12 leading-relaxed">
                        <div className="fw-bold fs-13 text-primary mb-1">
                          {bannerType === 'main'
                            ? 'Main Hero Banner Dimension & Size Guidelines'
                            : 'Side Promotion Banner Dimension & Size Guidelines'}
                        </div>
                        <div className="text-secondary d-flex flex-wrap gap-x-4 gap-y-1 mb-1">
                          <span>
                            <strong className="text-dark">Recommended Dimensions:</strong>{' '}
                            {bannerType === 'main'
                              ? '1200 × 530 px (or 1920 × 800 px for ultra-wide)'
                              : '500 × 530 px (portrait side offer card)'}
                          </span>
                          <span>
                            <strong className="text-dark">Maximum File Size:</strong> 5 MB
                          </span>
                          <span>
                            <strong className="text-dark">Accepted Formats:</strong> JPG, PNG, WebP
                          </span>
                        </div>
                        <div className="text-muted fs-11">
                          Uploaded banner will automatically scale and fit within the storefront display smoothly.
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-3 rounded-3 border d-flex flex-column gap-3"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                      {/* Current Image Preview & Upload Button */}
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div
                          style={{
                            width: bannerType === 'main' ? '180px' : '130px',
                            height: '100px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#0f172a',
                            border: '1px solid #cbd5e1',
                            position: 'relative',
                          }}
                        >
                          {image ? (
                            <img
                              src={image}
                              alt="Banner Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-2" style={{ backgroundColor: '#f1f5f9' }}>
                              <iconify-icon icon="solar:gallery-add-bold" class="fs-22 text-secondary mb-1"></iconify-icon>
                              <span className="fs-10 fw-semibold text-center text-secondary">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="d-flex flex-column gap-2 flex-grow-1">
                          <div className="d-flex align-items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                              className="d-none"
                              onChange={handleImageFileChange}
                            />
                            <button
                              type="button"
                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 fs-13 fw-semibold text-white"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              style={{
                                borderRadius: '8px',
                                backgroundColor: '#0f172a',
                                padding: '8px 16px',
                              }}
                            >
                              {isUploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  <span>Verifying & Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <iconify-icon icon="solar:upload-minimalistic-bold" class="fs-16"></iconify-icon>
                                  <span>{image ? 'Replace Image' : 'Upload Image (Mandatory)'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          <span className="text-muted fs-12">
                            {bannerType === 'main'
                              ? 'Recommended: 1200 x 530px high resolution image for crisp hero display.'
                              : 'Recommended: 500 x 530px portrait image for side offer display.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Subtitle / Pre-header */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-bold text-dark mb-1">
                      Banner Subtitle / Category Label
                    </label>
                    <input
                      type="text"
                      className="form-control fs-13"
                      placeholder="e.g. iPhone 16 Pro Max or UP TO"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                    />
                  </div>

                  {/* Banner Heading (Title) - OPTIONAL, MAX 50 WORDS */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label fs-13 fw-bold text-dark mb-0">
                        Banner Heading <span className="text-muted fw-normal fs-12">(Optional - can be left blank)</span>
                      </label>
                      {titleWordCount > 0 && (
                        <span
                          className={`badge fs-11 ${
                            titleWordCount > 50
                              ? 'bg-danger text-white'
                              : titleWordCount > 40
                              ? 'bg-warning text-dark'
                              : 'bg-light text-muted border'
                          }`}
                        >
                          {titleWordCount} / 50 words max
                        </span>
                      )}
                    </div>

                    <textarea
                      className={`form-control fs-13 ${titleWordCount > 50 ? 'is-invalid' : ''}`}
                      rows={2}
                      placeholder="Enter banner heading (optional, leave blank if image contains text)..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ borderColor: titleWordCount > 50 ? '#ef4444' : '#cbd5e1', borderRadius: '8px' }}
                    />
                    {titleWordCount > 50 ? (
                      <small className="text-danger fs-11 mt-1 d-block fw-semibold">
                        Heading exceeds the 50 words maximum limit ({titleWordCount}/50 words). Please shorten your heading.
                      </small>
                    ) : (
                      <small className="text-muted fs-11 mt-1 d-block">
                        Optional. Leave blank if you only want to display the banner image.
                      </small>
                    )}
                  </div>

                  {/* Description / Highlights Paragraph - MAX 50 WORDS */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="form-label fs-13 fw-bold text-dark mb-0">
                        Description / Highlights Paragraph <span className="text-muted fw-normal fs-12">(Optional)</span>
                      </label>
                      {descWordCount > 0 && (
                        <span
                          className={`badge fs-11 ${
                            descWordCount > 50
                              ? 'bg-danger text-white'
                              : descWordCount > 40
                              ? 'bg-warning text-dark'
                              : 'bg-light text-muted border'
                          }`}
                        >
                          {descWordCount} / 50 words max
                        </span>
                      )}
                    </div>

                    <textarea
                      className={`form-control fs-13 ${descWordCount > 50 ? 'is-invalid' : ''}`}
                      rows={3}
                      placeholder="Enter banner description / highlights paragraph (optional, maximum 50 words)..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      style={{ borderColor: descWordCount > 50 ? '#ef4444' : '#cbd5e1', borderRadius: '8px' }}
                    />
                    {descWordCount > 50 ? (
                      <small className="text-danger fs-11 mt-1 d-block fw-semibold">
                        Description exceeds the 50 words maximum limit ({descWordCount}/50 words). Please shorten your text.
                      </small>
                    ) : (
                      <small className="text-muted fs-11 mt-1 d-block">
                        Dynamic paragraph editable from dashboard. Maximum 50 words allowed if provided.
                      </small>
                    )}
                  </div>

                  {/* Price / Offer Tag */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-bold text-dark mb-1">
                      Price / Discount Tag <span className="text-muted fw-normal fs-12">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control fs-13"
                      placeholder="e.g. From $ 50,769 or 50% OFF"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                    />
                  </div>

                  {/* Action Button Controls (Can be hidden / ignored) */}
                  <div className="mb-3 p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="pe-3">
                        <label className="form-label fs-13 fw-bold text-dark mb-0">
                          Show &quot;Shop Now&quot; Action Button
                        </label>
                        <p className="text-muted fs-12 mb-0">
                          Toggle off to hide the button. When hidden, the entire banner image is clickable.
                        </p>
                      </div>
                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={showButton}
                          onChange={(e) => setShowButton(e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            width: '2.6em',
                            height: '1.3em',
                            backgroundColor: showButton ? '#0f172a' : '#cbd5e1',
                            borderColor: showButton ? '#0f172a' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>

                    {showButton && (
                      <div className="mt-3 pt-3 border-top" style={{ borderColor: '#e2e8f0' }}>
                        <label className="form-label fs-12 fw-semibold text-dark mb-1">
                          Button Text Label
                        </label>
                        <input
                          type="text"
                          className="form-control fs-13"
                          placeholder="Shop Now"
                          value={buttonText}
                          onChange={(e) => setButtonText(e.target.value)}
                          style={{
                            borderRadius: '8px',
                            borderColor: '#cbd5e1',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Destination Link */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Destination Link <span className="text-danger">*</span>
                    </label>
                    <DestinationDropdown
                      value={link}
                      onChange={(newVal) => setLink(newVal)}
                      categories={categories}
                    />
                  </div>

                  {/* Display Order */}
                  <div className="mb-4">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Display Order (1 - 12)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className="form-control fs-13"
                      value={order}
                      onChange={(e) => setOrder(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                      style={{
                        borderRadius: '8px',
                        borderColor: '#cbd5e1',
                        maxWidth: '120px',
                      }}
                    />
                  </div>

                  {/* Status Toggle Card */}
                  <div className="mb-4">
                    <div
                      className="d-flex align-items-center justify-content-between p-3.5 p-md-4 rounded-3 border"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}
                    >
                      <div className="pe-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span
                            className="d-inline-block rounded-circle"
                            style={{ width: '8px', height: '8px', backgroundColor: isActive ? '#16a34a' : '#94a3b8' }}
                          ></span>
                          <span className="fs-14 fw-bold text-dark">Storefront Visibility</span>
                          <span
                            className="badge fs-11 fw-semibold ms-1"
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: isActive ? '#f0fdf4' : '#f1f5f9',
                              color: isActive ? '#16a34a' : '#64748b',
                              border: isActive ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            }}
                          >
                            {isActive ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-muted fs-12 mb-0">
                          Show this banner on storefront {bannerType === 'main' ? 'hero slider' : 'side promotion'}
                        </p>
                      </div>
                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            width: '2.8em',
                            height: '1.4em',
                            backgroundColor: isActive ? '#16a34a' : '#cbd5e1',
                            borderColor: isActive ? '#16a34a' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex align-items-center justify-content-end gap-2.5 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                    <Link
                      href="/dashboard/banner-settings"
                      className="btn btn-light fs-13 fw-semibold px-4 py-2"
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      className="btn btn-dark fs-13 fw-semibold px-4 py-2 d-inline-flex align-items-center gap-2 text-white"
                      disabled={isSaving || isUploading || isLimitReached || titleWordCount > 50 || descWordCount > 50}
                      style={{
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        borderColor: '#0f172a',
                        boxShadow: '0 2px 4px rgba(15,23,42,0.25)',
                      }}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <iconify-icon icon="solar:check-circle-bold" class="fs-17"></iconify-icon>
                          <span>{isCreateMode ? 'Publish Banner' : 'Save Changes'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Live Storefront Preview Card */}
            <div className="col-12 col-xl-5">
              <div
                className="p-4 rounded-3 sticky-top"
                style={{
                  top: '90px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                      style={{ width: '38px', height: '38px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    >
                      <iconify-icon icon="solar:eye-bold" class="fs-18 text-success"></iconify-icon>
                    </span>
                    <h5 className="fs-15 fw-bold text-dark mb-0">Live Storefront Preview</h5>
                  </div>
                  <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'} fs-11`}>
                    {isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <p className="text-muted fs-12 mb-3">
                  This shows exactly how your banner renders on the live storefront:
                </p>

                {bannerType === 'main' ? (
                  /* Main Hero Banner Preview */
                  <div
                    className="rounded-3 overflow-hidden position-relative p-4 d-flex align-items-center"
                    style={{
                      minHeight: '280px',
                      backgroundColor: '#0d1527',
                      backgroundImage: image
                        ? (title || subtitle || desc || (showButton && buttonText)
                            ? `linear-gradient(to right, rgba(13, 21, 39, 0.95) 0%, rgba(13, 21, 39, 0.7) 50%, rgba(13, 21, 39, 0.25) 100%), url(${image})`
                            : `url(${image})`)
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {!image && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted" style={{ opacity: 0.35 }}>
                        <iconify-icon icon="solar:gallery-add-bold" class="fs-48 mb-2"></iconify-icon>
                        <span className="fs-13 fw-semibold">Banner Image Placeholder</span>
                      </div>
                    )}
                    {(title || subtitle || desc || (showButton && buttonText)) && (
                      <div style={{ maxWidth: '340px', position: 'relative', zIndex: 2 }}>
                        {subtitle && (
                          <div className="text-muted fs-12 fw-semibold mb-1" style={{ color: '#94a3b8' }}>
                            {subtitle}
                          </div>
                        )}
                        {title && (
                          <h3
                            className="text-white fw-bold mb-2"
                            style={{
                              fontSize: '20px',
                              whiteSpace: 'pre-line',
                              textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                              lineHeight: 1.3,
                            }}
                          >
                            {title}
                          </h3>
                        )}
                        {desc && (
                          <p className="text-white-50 fs-12 mb-3" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                            {desc}
                          </p>
                        )}
                        {showButton && buttonText && (
                          <span
                            className="btn btn-sm text-white fw-semibold px-3 py-1.5"
                            style={{
                              backgroundColor: '#0b1120',
                              border: '1px solid rgba(255,255,255,0.25)',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              pointerEvents: 'none',
                            }}
                          >
                            {buttonText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Promotion Banner Preview */
                  <div
                    className="rounded-3 overflow-hidden position-relative p-4 d-flex align-items-start justify-content-start text-start"
                    style={{
                      minHeight: '280px',
                      backgroundColor: '#0284c7',
                      backgroundImage: image
                        ? (title || subtitle || desc || price || (showButton && buttonText)
                            ? `linear-gradient(135deg, rgba(2, 132, 199, 0.4) 0%, rgba(6, 182, 212, 0.2) 40%, rgba(0, 0, 0, 0.05) 100%), url(${image})`
                            : `url(${image})`)
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {!image && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white" style={{ opacity: 0.35 }}>
                        <iconify-icon icon="solar:gallery-add-bold" class="fs-48 mb-2"></iconify-icon>
                        <span className="fs-13 fw-semibold">Side Banner Placeholder</span>
                      </div>
                    )}
                    {(title || subtitle || desc || price || (showButton && buttonText)) && (
                      <div style={{ position: 'relative', zIndex: 2 }}>
                        {title && (
                          <div className="text-white fw-bold fs-16 text-uppercase mb-1">
                            {title}
                          </div>
                        )}
                        {subtitle && (
                          <div className="text-white fs-12 fw-semibold text-uppercase mb-1">
                            {subtitle}
                          </div>
                        )}
                        {price && (
                          <h2
                            className="fw-bold mb-2 text-white"
                            style={{
                              fontSize: '32px',
                              lineHeight: 1,
                              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                          >
                            {price}
                          </h2>
                        )}
                        {desc && (
                          <p className="text-white fs-12 mb-2" style={{ whiteSpace: 'pre-line', opacity: 0.9 }}>
                            {desc}
                          </p>
                        )}
                        {showButton && buttonText && (
                          <span
                            className="btn btn-sm text-dark bg-white fw-bold px-3 py-1 mt-1"
                            style={{
                              borderRadius: '6px',
                              fontSize: '11px',
                              pointerEvents: 'none',
                            }}
                          >
                            {buttonText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Specs & Security summary box */}
                <div
                  className="mt-4 p-3 rounded-3 border"
                  style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                >
                  <div className="fs-12 fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
                    <iconify-icon icon="solar:shield-check-bold" class="fs-16 text-success"></iconify-icon>
                    <span>Strict Constraints &amp; Validation:</span>
                  </div>
                  <ul className="mb-0 ps-3 text-muted fs-11" style={{ lineHeight: 1.6 }}>
                    <li><strong>Image Mandatory:</strong> Must upload a valid image file (JPG, PNG, WebP). Image is the only mandatory field.</li>
                    <li><strong>Text &amp; Heading:</strong> Optional. Can be left empty for image-only banners (max 50 words if provided).</li>
                    <li><strong>Action Button:</strong> Optional. Can be hidden if desired, leaving the banner image as a direct clickable link.</li>
                    <li><strong>No Dummy Data:</strong> Clean input placeholders used on new banner creation.</li>
                    <li><strong>Capacity Limit:</strong> Maximum 12 banners per category enforced.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function BannerEditPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-loading-stable text-center py-5">
          <div className="spinner-border text-dark" role="status"></div>
          <p className="text-muted fs-14 mt-2">Loading banner editor...</p>
        </div>
      }
    >
      <BannerEditForm />
    </Suspense>
  );
}
