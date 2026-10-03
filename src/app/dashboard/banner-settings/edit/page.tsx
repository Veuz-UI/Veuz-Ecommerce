'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchBannerSettings, saveBannerSettings } from '@/services/bannerSettingsService';
import { MainBannerItem, PromoBannerItem, BannerSettingsData } from '@/data/defaultBannerSettings';
import { validateImageFile, compressImage } from '@/utils/imageSecurity';
import { useToast } from '@/context/ToastContext';

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
  const [fullData, setFullData] = useState<BannerSettingsData>({
    mainBanners: [],
    promoBanners: [],
  });

  // Form Fields
  const [id, setId] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subtitle, setSubtitle] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('');
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
              setButtonText(found.buttonText || 'Explore Catalog');
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
              setPrice(found.price || '');
              setButtonText(found.buttonText || 'Order Now');
              setLink(found.link || '/products');
              setOrder(found.order || 1);
              setIsActive(found.isActive !== false);
            } else {
              showToast('danger', 'Promotion banner not found. Switched to create mode.');
              initCreateDefaults('promo', data);
            }
          }
        } else {
          // Create new banner mode
          initCreateDefaults(queryType, data);
        }
      } catch (err: any) {
        showToast('danger', 'Failed to load banner details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBanner();
  }, [queryId, queryType, isCreateMode, showToast]);

  const initCreateDefaults = (type: 'main' | 'promo', data: BannerSettingsData) => {
    setBannerType(type);
    const newId = `${type}-banner-${Date.now()}`;
    setId(newId);
    if (type === 'main') {
      const nextOrder = (data.mainBanners?.length || 0) + 1;
      setOrder(nextOrder > 12 ? 12 : nextOrder);
      setImage('/assets/imgs/banner/safety-hero-1.jpg');
      setTitle('Certified Industrial\nSafety & PPE Supplies');
      setButtonText('Explore Catalog');
      setLink('/products');
      setIsActive(true);
    } else {
      const nextOrder = (data.promoBanners?.length || 0) + 1;
      setOrder(nextOrder > 12 ? 12 : nextOrder);
      setImage('/assets/imgs/banner/clean-side-1.jpg');
      setTitle('SPECIAL SAFETY OFFER');
      setSubtitle('CERTIFIED EN & OSHA STANDARD');
      setPrice('FROM 99 SR');
      setButtonText('Order Now');
      setLink('/products');
      setIsActive(true);
    }
  };

  // Handle Secure Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';

    // 1. Client Security: File format lock (Only .jpg, .jpeg, .png, .webp)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
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

    // Validation
    if (!title.trim()) {
      showToast('warning', 'Please enter a banner title.');
      return;
    }
    if (!image.trim()) {
      showToast('warning', 'Please select or upload a banner image.');
      return;
    }

    // Check maximum 12 limit for new banners
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

      if (bannerType === 'main') {
        const item: MainBannerItem = {
          id: id || `main-banner-${Date.now()}`,
          image: image.trim(),
          title: title.trim(),
          buttonText: buttonText.trim() || 'Explore Catalog',
          link: link.trim() || '/products',
          isActive,
          order: Number(order) || 1,
        };

        if (isCreateMode) {
          updatedMain.push(item);
        } else {
          updatedMain = updatedMain.map((b) => (b.id === id ? item : b));
        }
      } else {
        const item: PromoBannerItem = {
          id: id || `promo-banner-${Date.now()}`,
          image: image.trim(),
          title: title.trim(),
          subtitle: subtitle.trim(),
          price: price.trim(),
          buttonText: buttonText.trim() || 'Order Now',
          link: link.trim() || '/products',
          isActive,
          order: Number(order) || 1,
        };

        if (isCreateMode) {
          updatedPromo.push(item);
        } else {
          updatedPromo = updatedPromo.map((b) => (b.id === id ? item : b));
        }
      }

      const res = await saveBannerSettings({
        mainBanners: updatedMain,
        promoBanners: updatedPromo,
      });

      if (res.success) {
        showToast(
          'success',
          `Banner "${title.replace(/\n/g, ' ')}" saved successfully! Storefront updated in real time.`,
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
      {/* ========================================================
          MAIN BACKGROUND WHITE CARD (Matching Shop Settings & Users)
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
                {isCreateMode ? `Add New ${bannerType === 'main' ? 'Main Promotion' : 'Offer Promotion'} Banner` : `Edit ${bannerType === 'main' ? 'Main Promotion' : 'Offer Promotion'} Banner`}
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Configure banner imagery, typography, target URL, and storefront visibility.
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

          {/* Main Form + Live Preview Grid (Cards inside Main Card) */}
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
                    <h5 className="fs-15 fw-bold text-dark mb-0">Banner Details &amp; Parameters</h5>
                  </div>
                  <span className="badge bg-light text-secondary border fs-12 px-2.5 py-1">
                    Slot #{order} of 12
                  </span>
                </div>

                <form onSubmit={handleSave}>
                  {/* Banner Type Selector (Disabled in edit mode to avoid ID mismatch) */}
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
                            <div>Main Banner</div>
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
                            <div>Promotion Banner</div>
                            <small className="opacity-75 fs-11 fw-normal">Side Offer Banner (Max 12)</small>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner Image Upload & Security Notice */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fs-13 fw-bold text-dark mb-0">
                        Banner Image <span className="text-danger">*</span>
                      </label>
                      <span className="badge bg-light text-muted border fs-11">
                        Format Lock: JPG, PNG, WebP • Max 5MB
                      </span>
                    </div>

                    <div
                      className="p-3 rounded-3 border d-flex flex-column gap-3"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                      {/* Current Image Preview & Actions */}
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div
                          style={{
                            width: bannerType === 'main' ? '180px' : '120px',
                            height: '95px',
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
                            <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-12">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="d-flex flex-column gap-2 flex-grow-1">
                          <div className="d-flex align-items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
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
                                  <span>Upload New Image</span>
                                </>
                              )}
                            </button>
                          </div>

                          <span className="text-muted fs-12">
                            {bannerType === 'main'
                              ? 'Recommended: 1200 x 530px high resolution image for crisp hero display.'
                              : 'Recommended: 400 x 530px portrait image for side offer display.'}
                          </span>
                        </div>
                      </div>

                      {/* Image URL Manual Input */}
                      <div>
                        <label className="form-label fs-12 text-muted mb-1">
                          Or enter static image URL / asset path:
                        </label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white" style={{ borderColor: '#cbd5e1' }}>
                            <iconify-icon icon="solar:link-linear" class="fs-15 text-muted"></iconify-icon>
                          </span>
                          <input
                            type="text"
                            className="form-control fs-12"
                            placeholder="/assets/imgs/banner/..."
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            style={{ borderColor: '#cbd5e1' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner Title */}
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-bold text-dark mb-1">
                      Banner Title <span className="text-danger">*</span>
                    </label>
                    {bannerType === 'main' ? (
                      <>
                        <textarea
                          className="form-control fs-13"
                          rows={2}
                          placeholder="e.g. Certified Industrial&#10;Safety & PPE Supplies"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        />
                        <small className="text-muted fs-11 mt-1 d-block">
                          Tip: Press Enter to create a 2-line title like the default hero banners.
                        </small>
                      </>
                    ) : (
                      <input
                        type="text"
                        className="form-control fs-13"
                        placeholder="e.g. FALL ARREST SYSTEMS"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                      />
                    )}
                  </div>

                  {/* Promotion Banner Specific: Subtitle & Price Tag */}
                  {bannerType === 'promo' && (
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Offer Subtitle
                        </label>
                        <input
                          type="text"
                          className="form-control fs-13"
                          placeholder="e.g. OSHA & EN 361 CERTIFIED"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Price / Discount Tag <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control fs-13"
                          placeholder="e.g. FROM 120 SR or SAVE UP TO 30%"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Button Text & Target Link */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        className="form-control fs-14"
                        placeholder={bannerType === 'main' ? 'Explore Catalog' : 'Order Now'}
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          padding: '10px 16px',
                          borderColor: '#cbd5e1',
                          height: '46px',
                        }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Destination Link <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control fs-14"
                        placeholder="/products"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        required
                        style={{
                          borderRadius: '8px',
                          padding: '10px 16px',
                          borderColor: '#cbd5e1',
                          height: '46px',
                        }}
                      />
                    </div>
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
                      className="form-control fs-14"
                      value={order}
                      onChange={(e) => setOrder(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        borderColor: '#cbd5e1',
                        height: '46px',
                      }}
                    />
                    <small className="text-muted fs-12 mt-1.5 d-block">
                      Determines the sequence in the slider (slot 1 is displayed first).
                    </small>
                  </div>

                  {/* Status Toggle Card: With subtle background, proper padding, well-aligned data matching category and menu pages */}
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
                          Show this banner on storefront {bannerType === 'main' ? 'hero promotion slider' : 'side offer promotion'}
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
                      disabled={isSaving || isUploading || isLimitReached}
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
                    {isActive ? 'Active Status' : 'Hidden Status'}
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
                      backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.5) 50%, rgba(15, 23, 42, 0.15) 100%), url(${image || '/assets/imgs/banner/safety-hero-1.jpg'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div style={{ maxWidth: '340px' }}>
                      <h3
                        className="text-white fw-bold mb-3"
                        style={{
                          fontSize: '20px',
                          whiteSpace: 'pre-line',
                          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                          lineHeight: 1.3,
                        }}
                      >
                        {title || 'Certified Industrial\nSafety & PPE Supplies'}
                      </h3>
                      <span
                        className="btn btn-sm text-dark fw-bold px-3 py-1.5"
                        style={{
                          backgroundColor: '#fdc839',
                          borderRadius: '6px',
                          fontSize: '12px',
                          pointerEvents: 'none',
                        }}
                      >
                        {buttonText || 'Explore Catalog'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Promotion Banner Preview */
                  <div
                    className="rounded-3 overflow-hidden position-relative p-4 d-flex align-items-center justify-content-center text-center"
                    style={{
                      minHeight: '280px',
                      backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.15) 100%), url(${image || '/assets/imgs/banner/clean-side-1.jpg'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div>
                      <h4
                        className="text-white fw-bold mb-1"
                        style={{
                          fontSize: '18px',
                          letterSpacing: '0.5px',
                          textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                        }}
                      >
                        {title || 'FALL ARREST SYSTEMS'}
                      </h4>
                      <h6
                        className="text-white-50 fs-12 fw-semibold mb-2"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                      >
                        {subtitle || 'OSHA & EN 361 CERTIFIED'}
                      </h6>
                      <h2
                        className="fw-bold mb-3"
                        style={{
                          color: '#FDC839',
                          fontSize: '26px',
                          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        {price || 'FROM 120 SR'}
                      </h2>
                      <span
                        className="btn btn-sm text-dark fw-bold px-3 py-1.5"
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          pointerEvents: 'none',
                        }}
                      >
                        {buttonText || 'Order Now'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Specs & Security summary box */}
                <div
                  className="mt-4 p-3 rounded-3 border"
                  style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                >
                  <div className="fs-12 fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
                    <iconify-icon icon="solar:shield-check-bold" class="fs-16 text-success"></iconify-icon>
                    <span>Active Security Constraints:</span>
                  </div>
                  <ul className="mb-0 ps-3 text-muted fs-11" style={{ lineHeight: 1.6 }}>
                    <li><strong>Format Locked:</strong> Only .jpg, .jpeg, .png, and .webp allowed.</li>
                    <li><strong>Max Size:</strong> 5MB per upload with client &amp; server validation.</li>
                    <li><strong>Magic Bytes Verified:</strong> Prevents non-image disguised files.</li>
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
