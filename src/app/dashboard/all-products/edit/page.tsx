'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProducts, createProduct, updateProduct } from '@/services/productsService';
import { fetchShopSettings } from '@/services/shopSettingsService';
import { ProductItem, ProductDetailSection, SYSTEM_COLORS, PRESET_SIZES, SystemColor } from '@/data/categoryProductsData';
import { fetchAttributes } from '@/services/attributesService';
import { ShopCategory } from '@/data/defaultShopSettings';
import { validateImageFile } from '@/utils/imageSecurity';
import {
  processProductStudioPhoto,
  ANGLE_PRESETS,
  AnglePreset,
  AnglePerspective,
  loadImage,
  generateSimulatedAngleCanvas,
} from '@/utils/productStudio';
import { useToast } from '@/context/ToastContext';

function ProductEditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const angleFileInputRef = useRef<HTMLInputElement>(null);

  const queryId = searchParams.get('id') || '';
  const isCreateMode = !queryId || searchParams.get('mode') === 'create';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<ShopCategory[]>([]);

  // Studio & Multi-Angle Settings (Front, Side, Top, Back)
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [studioStandardize, setStudioStandardize] = useState<boolean>(true);
  const [studioBgColor, setStudioBgColor] = useState<'transparent' | 'white' | 'neutral'>('transparent');
  const [isGeneratingAngle, setIsGeneratingAngle] = useState<boolean>(false);
  const [generatingSlot, setGeneratingSlot] = useState<string | null>(null);
  const [angleSlotTarget, setAngleSlotTarget] = useState<number | null>(null);

  // Form Fields (Only merchant-configurable fields)
  const [id, setId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [image, setImage] = useState<string>('/assets/imgs/shop/p1.jpg');
  const [standard, setStandard] = useState<string>('EN 397 & ANSI Z89.1');
  const [location, setLocation] = useState<string>('Riyadh Central Warehouse');
  const [link, setLink] = useState<string>('/product-details');

  // Pricing & Special Offer
  const [originalPrice, setOriginalPrice] = useState<number>(150);
  const [isSpecialOffer, setIsSpecialOffer] = useState<boolean>(false);
  const [offerPercent, setOfferPercent] = useState<number>(15);

  // Specifications State
  const [specifications, setSpecifications] = useState<ProductDetailSection[]>([]);

  // Sizes & Colors State
  const [allColors, setAllColors] = useState<SystemColor[]>(SYSTEM_COLORS);
  const [allSizes, setAllSizes] = useState<string[]>(PRESET_SIZES);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState<string>('');
  const [customColorInput, setCustomColorInput] = useState<string>('');

  // System-managed internal state (preserved on edit)
  const [existingViews, setExistingViews] = useState<number>(0);
  const [existingClicks, setExistingClicks] = useState<number>(0);
  const [existingCreatedAt, setExistingCreatedAt] = useState<number | undefined>(undefined);

  // Load shop categories and existing product if edit mode
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [allProds, shopData, attrs] = await Promise.all([
          fetchProducts(),
          fetchShopSettings(),
          fetchAttributes(),
        ]);

        if (attrs) {
          if (Array.isArray(attrs.colors) && attrs.colors.length > 0) {
            setAllColors(attrs.colors);
          }
          if (Array.isArray(attrs.sizes) && attrs.sizes.length > 0) {
            setAllSizes(attrs.sizes);
          }
        }

        if (shopData && Array.isArray(shopData.categories)) {
          const activeCats = shopData.categories.filter((c) => c.isActive !== false);
          setCategories(activeCats);
          if (isCreateMode && activeCats.length > 0 && !category) {
            setCategory(activeCats[0].name);
            setCategoryId(activeCats[0].id);
          }
        }

        let found: ProductItem | undefined = undefined;
        if (!isCreateMode && queryId) {
          try {
            const singleRes = await fetch(`/api/products?id=${encodeURIComponent(queryId)}`, { cache: 'no-store' });
            if (singleRes.ok) {
              const singleJson = await singleRes.json();
              if (singleJson.success && singleJson.data) {
                found = singleJson.data;
              }
            }
          } catch (e) {
            // fallback
          }
          if (!found) {
            found = allProds.find((p) => p.id === queryId);
          }

          if (found) {
            setId(found.id);
            setTitle(found.title);
            setCategory(found.category || 'General Safety');
            setCategoryId(found.categoryId || '');
            setDesc(found.desc || '');
            setImage(found.image || '/assets/imgs/shop/p1.jpg');
            setStandard(found.standard || 'Certified Safety Standard');
            setLocation(found.location || 'Riyadh Central Warehouse');
            setLink(found.link || '/product-details');
            
            const basePrice = found.originalPrice || parseFloat(found.price?.replace(/[^\d.]/g, '') || '100');
            setOriginalPrice(basePrice);
            setIsSpecialOffer(Boolean(found.isSpecialOffer || found.discount));
            setOfferPercent(found.offerPercent || (found.discount ? parseInt(found.discount) : 15));
            setExistingViews(found.views || 0);
            setExistingClicks(found.clicks || 0);
            setExistingCreatedAt(found.createdAt);
            setSpecifications(found.specifications || []);
            setSizes(found.sizes || []);
            setColors(found.colors || []);
            setGalleryImages(Array.isArray(found.images) ? found.images : []);
          } else {
            showToast('danger', 'Product not found. Switched to create mode.');
            initCreateDefaults();
          }
        } else {
          initCreateDefaults();
        }
      } catch (err: any) {
        showToast('danger', 'Failed to load details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, [queryId, isCreateMode, showToast]);

  const initCreateDefaults = () => {
    setId(`prod-${Date.now()}`);
    setTitle('');
    setDesc('Industrial grade safety equipment meeting national and international workplace compliance standards.');
    setImage('/assets/imgs/shop/p1.jpg');
    setGalleryImages([]);
    setOriginalPrice(160);
    setIsSpecialOffer(false);
    setOfferPercent(15);
    setStandard('EN 397 & ANSI Z89.1');
    setLocation('Riyadh Central Warehouse');
    setExistingViews(0);
    setExistingClicks(0);
    setExistingCreatedAt(undefined);
    setSpecifications([]);
    setSizes([]);
    setColors([]);
  };

  // Size & Color Handlers
  const handleTogglePresetSize = (sz: string) => {
    setSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
      setCustomSizeInput('');
    }
  };

  const handleRemoveSize = (sz: string) => {
    setSizes((prev) => prev.filter((s) => s !== sz));
  };

  const handleToggleColor = (colorName: string) => {
    setColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !colors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setColors((prev) => [...prev, trimmed]);
      setCustomColorInput('');
    }
  };

  const handleRemoveColor = (col: string) => {
    setColors((prev) => prev.filter((c) => c !== col));
  };

  // Live calculation of discounted price
  const calculatedDiscountedPrice = isSpecialOffer && offerPercent > 0
    ? Math.round(originalPrice * (1 - offerPercent / 100))
    : originalPrice;
  const savings = originalPrice - calculatedDiscountedPrice;

  // Handle category change
  const handleCategoryChange = (catName: string) => {
    setCategory(catName);
    const found = categories.find((c) => c.name === catName);
    if (found) {
      setCategoryId(found.id);
    }
  };

  // Studio Upload Pipeline: Validates, Auto-removes BG, Centers 1:1 & Uploads
  const processAndUploadFile = async (file: File): Promise<string | null> => {
    const validation = validateImageFile(file, 5 * 1024 * 1024);
    if (!validation.valid) {
      showToast('danger', validation.error || 'Invalid image file.');
      return null;
    }

    try {
      // 1. Process through Product Studio (Auto Background Removal + 1:1 Normalization + 100% Transparent)
      const { file: processedFile, dataUrl } = await processProductStudioPhoto(file, {
        removeBackground: autoRemoveBg,
        standardizeSize: studioStandardize,
        backgroundColor: 'transparent',
        canvasSize: 1000,
        paddingPercent: 6, // Focused subject tightly
        quality: 1.0,
      });

      // 2. Upload to Server
      const formData = new FormData();
      formData.append('file', processedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        return json.url;
      }
      return dataUrl;
    } catch (err: any) {
      console.error('Studio processing error:', err);
      showToast('danger', err.message || 'Failed to process studio photo.');
      return null;
    }
  };

  // Primary Cover Image Upload Handler
  const handlePrimaryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await processAndUploadFile(file);
      if (url) {
        setImage(url);
        showToast(
          'success',
          autoRemoveBg
            ? 'Background removed & focused on transparent canvas!'
            : 'Front view photo saved successfully.',
          'Front View Ready'
        );
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Additional Angle Image Upload Handler
  const handleAngleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await processAndUploadFile(file);
      if (url) {
        const targetSlot = angleSlotTarget !== null ? angleSlotTarget : 0;
        setGalleryImages((prev) => {
          const next = [...prev];
          while (next.length <= targetSlot) next.push('');
          next[targetSlot] = url;
          return next;
        });
        showToast('success', 'Angle photo added to gallery.', 'Angle Saved');
      }
    } finally {
      setIsUploading(false);
      setAngleSlotTarget(null);
      if (angleFileInputRef.current) angleFileInputRef.current.value = '';
    }
  };

  // 1-Click Direct AI Angle Generation (Directly generates based on which card was clicked!)
  const handleGenerateDirectAngle = async (angle: AnglePerspective, slotIdx: number) => {
    if (!image || image === '/assets/imgs/shop/p1.jpg') {
      showToast('warning', 'Please upload a Front View photo first before generating other angles.');
      return;
    }

    setIsGeneratingAngle(true);
    setGeneratingSlot(angle);
    try {
      const sourceImg = await loadImage(image);
      const angleFile = await generateSimulatedAngleCanvas(sourceImg, angle, 1000);

      const formData = new FormData();
      formData.append('file', angleFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      let finalUrl = '';
      if (uploadRes.ok && uploadJson.success && uploadJson.url) {
        finalUrl = uploadJson.url;
      } else {
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.readAsDataURL(angleFile);
        });
      }

      setGalleryImages((prev) => {
        const next = [...prev];
        while (next.length <= slotIdx) next.push('');
        next[slotIdx] = finalUrl;
        return next;
      });

      const angleLabels: Record<string, string> = { side: 'Side View', top: 'Top View', back: 'Back View' };
      showToast('success', `AI generated ${angleLabels[angle]} with transparent background!`, 'Angle Ready');
    } catch (err: any) {
      console.error('Error generating AI angle:', err);
      showToast('danger', err.message || 'Failed to generate perspective angle.');
    } finally {
      setIsGeneratingAngle(false);
      setGeneratingSlot(null);
    }
  };

  const handleRemoveAngle = (index: number) => {
    setGalleryImages((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = '';
      return next;
    });
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('danger', 'Please enter a product title.');
      return;
    }

    if (originalPrice <= 0) {
      showToast('danger', 'Please enter a valid price greater than 0.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<ProductItem> = {
        id: id || `prod-${Date.now()}`,
        title: title.trim(),
        category: category || 'Safety Equipment',
        categoryId: categoryId,
        desc: desc.trim(),
        image: image || '/assets/imgs/shop/p1.jpg',
        images: galleryImages,
        originalPrice: originalPrice,
        currentPrice: isSpecialOffer ? calculatedDiscountedPrice : originalPrice,
        price: `${isSpecialOffer ? calculatedDiscountedPrice : originalPrice} SR`,
        oldPrice: isSpecialOffer ? `${originalPrice} SR` : undefined,
        discount: isSpecialOffer ? `${offerPercent}% OFF` : undefined,
        isSpecialOffer: isSpecialOffer,
        offerPercent: isSpecialOffer ? offerPercent : undefined,
        badge: isSpecialOffer ? (offerPercent ? `${offerPercent}% OFF` : 'Special Offer') : 'New Arrival',
        badgeClass: isSpecialOffer ? 'sale' : 'new',
        isNewArrival: true,
        standard: standard.trim(),
        location: location.trim(),
        link: link || '/product-details',
        views: isCreateMode ? 0 : existingViews,
        clicks: isCreateMode ? 0 : existingClicks,
        isActive: true,
        createdAt: isCreateMode ? Date.now() : existingCreatedAt,
        specifications: specifications,
        sizes: sizes,
        colors: colors,
      };

      if (isCreateMode) {
        const res = await createProduct(payload);
        if (res.success) {
          showToast(
            'success',
            `Product "${payload.title}" published! It is automatically added as "New Arrival" and will show 1st on the storefront.`,
            'Product Published'
          );
          router.push('/dashboard/all-products');
        } else {
          showToast('danger', res.message || 'Failed to create product.');
        }
      } else {
        const res = await updateProduct(payload);
        if (res.success) {
          showToast(
            'success',
            `Product "${payload.title}" updated successfully!`,
            'Product Updated'
          );
          router.push('/dashboard/all-products');
        } else {
          showToast('danger', res.message || 'Failed to update product.');
        }
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to dedicated Product Specifications & Details builder page
  const handleGoToSpecifications = async () => {
    const targetTitle = title.trim() || 'New Product';
    const targetId = id || `prod-${Date.now()}`;

    setIsSaving(true);
    try {
      const payload: Partial<ProductItem> = {
        id: targetId,
        title: targetTitle,
        category: category || 'General Safety',
        categoryId: categoryId,
        desc: desc.trim(),
        image: image || '/assets/imgs/shop/p1.jpg',
        images: galleryImages,
        originalPrice: originalPrice,
        currentPrice: calculatedDiscountedPrice,
        price: `${calculatedDiscountedPrice} SR`,
        oldPrice: isSpecialOffer ? `${originalPrice} SR` : undefined,
        discount: isSpecialOffer ? `${offerPercent}% OFF` : undefined,
        isSpecialOffer: isSpecialOffer,
        offerPercent: isSpecialOffer ? offerPercent : undefined,
        isNewArrival: true,
        standard: standard.trim(),
        location: location.trim(),
        link: link || '/product-details',
        views: isCreateMode ? 0 : existingViews,
        clicks: isCreateMode ? 0 : existingClicks,
        isActive: true,
        createdAt: isCreateMode ? Date.now() : existingCreatedAt,
        specifications: specifications,
        sizes: sizes,
        colors: colors,
      };

      if (isCreateMode) {
        await createProduct(payload);
      } else {
        await updateProduct(payload);
      }

      router.push(`/dashboard/all-products/specifications?id=${targetId}`);
    } catch (err: any) {
      showToast('danger', 'Could not open specifications editor.');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to dedicated Product Sizes manager page
  const handleGoToSizes = async () => {
    const targetTitle = title.trim() || 'New Product';
    const targetId = id || `prod-${Date.now()}`;

    setIsSaving(true);
    try {
      const payload: Partial<ProductItem> = {
        id: targetId,
        title: targetTitle,
        category: category || 'General Safety',
        categoryId: categoryId,
        desc: desc.trim(),
        image: image || '/assets/imgs/shop/p1.jpg',
        images: galleryImages,
        originalPrice: originalPrice,
        currentPrice: calculatedDiscountedPrice,
        price: `${calculatedDiscountedPrice} SR`,
        oldPrice: isSpecialOffer ? `${originalPrice} SR` : undefined,
        discount: isSpecialOffer ? `${offerPercent}% OFF` : undefined,
        isSpecialOffer: isSpecialOffer,
        offerPercent: isSpecialOffer ? offerPercent : undefined,
        isNewArrival: true,
        standard: standard.trim(),
        location: location.trim(),
        link: link || '/product-details',
        views: isCreateMode ? 0 : existingViews,
        clicks: isCreateMode ? 0 : existingClicks,
        isActive: true,
        createdAt: isCreateMode ? Date.now() : existingCreatedAt,
        specifications: specifications,
        sizes: sizes,
        colors: colors,
      };

      if (isCreateMode) {
        await createProduct(payload);
      } else {
        await updateProduct(payload);
      }

      router.push(`/dashboard/all-products/sizes?id=${targetId}`);
    } catch (err: any) {
      showToast('danger', 'Could not open sizes manager.');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to dedicated Product Colors manager page
  const handleGoToColors = async () => {
    const targetTitle = title.trim() || 'New Product';
    const targetId = id || `prod-${Date.now()}`;

    setIsSaving(true);
    try {
      const payload: Partial<ProductItem> = {
        id: targetId,
        title: targetTitle,
        category: category || 'General Safety',
        categoryId: categoryId,
        desc: desc.trim(),
        image: image || '/assets/imgs/shop/p1.jpg',
        images: galleryImages,
        originalPrice: originalPrice,
        currentPrice: calculatedDiscountedPrice,
        price: `${calculatedDiscountedPrice} SR`,
        oldPrice: isSpecialOffer ? `${originalPrice} SR` : undefined,
        discount: isSpecialOffer ? `${offerPercent}% OFF` : undefined,
        isSpecialOffer: isSpecialOffer,
        offerPercent: isSpecialOffer ? offerPercent : undefined,
        isNewArrival: true,
        standard: standard.trim(),
        location: location.trim(),
        link: link || '/product-details',
        views: isCreateMode ? 0 : existingViews,
        clicks: isCreateMode ? 0 : existingClicks,
        isActive: true,
        createdAt: isCreateMode ? Date.now() : existingCreatedAt,
        specifications: specifications,
        sizes: sizes,
        colors: colors,
      };

      if (isCreateMode) {
        await createProduct(payload);
      } else {
        await updateProduct(payload);
      }

      router.push(`/dashboard/all-products/colors?id=${targetId}`);
    } catch (err: any) {
      showToast('danger', 'Could not open colors manager.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-5 text-center" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
        <span className="text-muted">Loading product details...</span>
      </div>
    );
  }

  return (
    <>
      {/* ========================================================
          MAIN BACKGROUND WHITE CARD (Matching Dashboard Style)
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
            <Link href="/dashboard/all-products" className="text-muted text-decoration-none">
              All Products
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <span className="text-dark fw-bold">
              {isCreateMode ? 'Add New Product' : 'Edit Product'}
            </span>
          </div>

          {/* 2. Header & Action Buttons Bar (NO BACK BUTTON HERE) */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                {isCreateMode ? 'Add New Product' : `Edit: ${title || 'Product'}`}
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                {isCreateMode
                  ? 'Add a new product to your catalog. Newly added products are automatically listed as New Arrival 1st in the slider.'
                  : 'Modify product specifications, pricing, and offer percentages.'}
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Link
                href="/dashboard/all-products"
                className="btn btn-sm d-flex align-items-center gap-1.5"
                style={{
                  borderRadius: '8px',
                  padding: '9px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '13px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                }}
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || isUploading}
                className="btn btn-sm d-flex align-items-center gap-1.5"
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSaving ? (
                  <>
                    <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <iconify-icon icon="solar:diskette-bold" class="fs-16"></iconify-icon>
                    <span>{isCreateMode ? 'Publish Product' : 'Update Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 24px 0' }}></div>

          {/* 3. Nested Cards Inside Main Card */}
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* LEFT COLUMN: Basic Information & Product Image */}
              <div className="col-12 col-xl-7">
                {/* Nested Card 1: Basic Information */}
                <div
                  className="p-4 rounded-3 mb-4"
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
                        style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:box-minimalistic-bold" class="fs-18 text-primary"></iconify-icon>
                      </span>
                      <h5 className="fs-15 fw-bold text-dark mb-0">Basic Product Information</h5>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-3.5">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Product Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. GuardianPro Vented Hard Hat with Ratchet Suspension"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '14px', height: '42px' }}
                    />
                    <div className="form-text fs-12 text-muted">
                      Clear, descriptive name including model and safety rating.
                    </div>
                  </div>

                  {/* Category Selection & Certified Safety Standard */}
                  <div className="row g-3 mb-3.5">
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Shop Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '14px', height: '42px' }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                        {categories.length === 0 && (
                          <option value="General Safety">General Safety</option>
                        )}
                      </select>
                      <div className="form-text fs-12 text-muted">
                        Linked to active categories in your shop settings.
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Certified Safety Standard
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. EN 397 & ANSI Z89.1 / OSHA"
                        value={standard}
                        onChange={(e) => setStandard(e.target.value)}
                        style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '14px', height: '42px' }}
                      />
                      <div className="form-text fs-12 text-muted">
                        Compliance standards displayed on product cards and catalog.
                      </div>
                    </div>
                  </div>

                  {/* Product Specifications & Details Card (Well Padded & Aligned) */}
                  <div
                    className="rounded-3 border mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3"
                    style={{
                      padding: '20px 24px',
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '42px',
                          height: '42px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#0f172a',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                        }}
                      >
                        <iconify-icon icon="solar:document-text-bold" class="fs-20 text-primary"></iconify-icon>
                      </div>

                      <div>
                        <div className="d-flex align-items-center gap-2.5 mb-1 flex-wrap">
                          <span className="fw-bold text-dark fs-14" style={{ letterSpacing: '-0.2px' }}>
                            Product Specifications &amp; Details
                          </span>
                          <span
                            className={`badge d-inline-flex align-items-center gap-1.5 fw-semibold ${
                              specifications.length > 0
                                ? 'bg-dark text-white'
                                : 'bg-white text-secondary border'
                            }`}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              borderColor: '#cbd5e1',
                            }}
                          >
                            <iconify-icon
                              icon={specifications.length > 0 ? 'solar:check-circle-bold' : 'solar:info-circle-linear'}
                              class={`fs-13 ${specifications.length > 0 ? 'text-success' : 'text-muted'}`}
                            ></iconify-icon>
                            <span>
                              {specifications.length > 0
                                ? `${specifications.length} ${specifications.length === 1 ? 'Section' : 'Sections'} Configured`
                                : 'Not Configured Yet'}
                            </span>
                          </span>
                        </div>
                        <span className="text-muted fs-12 d-block" style={{ lineHeight: '1.45' }}>
                          Add rich structured headings, detailed paragraph descriptions, and point-by-point technical specifications.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoToSpecifications}
                      disabled={isSaving}
                      className="btn btn-sm d-flex align-items-center gap-2 text-white flex-shrink-0"
                      style={{
                        borderRadius: '8px',
                        padding: '11px 22px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #0f172a',
                        fontWeight: 600,
                        fontSize: '13px',
                        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <iconify-icon icon="solar:document-add-bold" class="fs-17"></iconify-icon>
                      <span>
                        {specifications.length > 0 || desc.trim().length > 0 ? 'Edit Specifications & Details' : '+ Add Specifications & Details'}
                      </span>
                    </button>
                  </div>

                  {/* Location & Details Link */}
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Warehouse / Fulfillment Hub
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Riyadh Central Warehouse"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '14px', height: '42px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Product URL / Details Page
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="/product-details"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '14px', height: '42px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Nested Card: Product Sizes & Colors (Variations) */}
                <div
                  className="p-4 rounded-3 mb-4"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                        style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:palette-bold" class="fs-18 text-primary"></iconify-icon>
                      </span>
                      <div>
                        <h5 className="fs-15 fw-bold text-dark mb-0">Sizes &amp; Colors</h5>
                        <span className="text-muted fs-12">Manage product sizing and visual color variants on dedicated management pages.</span>
                      </div>
                    </div>
                  </div>

                  {/* 1. Size Management Row */}
                  <div
                    className="p-3.5 mb-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3"
                    style={{ backgroundColor: '#fbfcfe', border: '1px solid #e2e8f0' }}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '36px', height: '36px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:ruler-linear" class="fs-17 text-primary"></iconify-icon>
                      </span>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-14 fw-bold text-dark">Available Sizes</span>
                          <span
                            className="badge bg-light text-dark border fw-semibold"
                            style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '5px', borderColor: '#cbd5e1' }}
                          >
                            {sizes.length} selected
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoToSizes}
                      className="btn btn-sm btn-dark d-flex align-items-center gap-1.5 fw-medium"
                      style={{ borderRadius: '8px', fontSize: '12.5px', padding: '8px 16px' }}
                    >
                      <iconify-icon icon="solar:maximize-square-minimalistic-linear" class="fs-15"></iconify-icon>
                      <span>Configure Sizes</span>
                    </button>
                  </div>

                  {/* 2. Color Management Row */}
                  <div
                    className="p-3.5 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3"
                    style={{ backgroundColor: '#fbfcfe', border: '1px solid #e2e8f0' }}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '36px', height: '36px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:palette-linear" class="fs-17 text-success"></iconify-icon>
                      </span>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-14 fw-bold text-dark">Available Colors</span>
                          <span
                            className="badge bg-light text-dark border fw-semibold"
                            style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '5px', borderColor: '#cbd5e1' }}
                          >
                            {colors.length} selected
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoToColors}
                      className="btn btn-sm btn-dark d-flex align-items-center gap-1.5 fw-medium"
                      style={{ borderRadius: '8px', fontSize: '12.5px', padding: '8px 16px' }}
                    >
                      <iconify-icon icon="solar:maximize-square-minimalistic-linear" class="fs-15"></iconify-icon>
                      <span>Configure Colors</span>
                    </button>
                  </div>
                </div>

                </div>

              {/* RIGHT COLUMN: Pricing & Special Offers + System Automation */}
              <div className="col-12 col-xl-5">
                {/* Nested Card 3: Pricing & Special Offers */}
                <div
                  className="p-4 rounded-3 mb-4"
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
                        style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:tag-price-bold" class="fs-18 text-warning"></iconify-icon>
                      </span>
                      <h5 className="fs-15 fw-bold text-dark mb-0">Pricing &amp; Special Offers</h5>
                    </div>
                  </div>

                  {/* Regular / Base Price */}
                  <div className="mb-3.5">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Actual Value / Base Price (SR) <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0" style={{ borderRadius: '8px 0 0 8px' }}>
                        SR
                      </span>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(Number(e.target.value))}
                        style={{ borderRadius: '0 8px 8px 0', borderColor: '#cbd5e1', fontSize: '14px', height: '42px' }}
                        required
                      />
                    </div>
                    <div className="form-text fs-12 text-muted">
                      The regular retail price.
                    </div>
                  </div>

                  {/* Special Offer Toggle Area */}
                  <div
                    className="rounded-3 border mb-3"
                    style={{
                      padding: '22px 24px',
                      backgroundColor: isSpecialOffer ? '#fffdf0' : '#f8fafc',
                      borderColor: isSpecialOffer ? '#fde047' : '#e2e8f0',
                      transition: 'all 0.25s ease',
                      boxShadow: isSpecialOffer ? '0 2px 8px rgba(234, 179, 8, 0.08)' : 'none',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      <div className="pe-2">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-bold text-dark fs-14">
                            Special Offer Product
                          </span>
                          {isSpecialOffer && (
                            <span
                              className="badge bg-warning text-dark fs-11 fw-bold px-2 py-0.5"
                              style={{ borderRadius: '4px', letterSpacing: '0.3px' }}
                            >
                              DEAL ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-muted fs-12 d-block" style={{ lineHeight: '1.45' }}>
                          Featured on the storefront homepage in &quot;Special Offers&quot; with a custom discount badge.
                        </span>
                      </div>
                      <div className="form-check form-switch mb-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={isSpecialOffer}
                          onChange={(e) => setIsSpecialOffer(e.target.checked)}
                          style={{ cursor: 'pointer', width: '42px', height: '22px' }}
                        />
                      </div>
                    </div>

                    {isSpecialOffer && (
                      <div className="mt-4 pt-3.5 border-top" style={{ borderColor: '#fef08a' }}>
                        <div className="mb-3">
                          <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                            Offer Discount Percentage (%) <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              className="form-control"
                              value={offerPercent}
                              onChange={(e) => setOfferPercent(Number(e.target.value))}
                              style={{
                                borderRadius: '8px 0 0 8px',
                                borderColor: '#cbd5e1',
                                fontSize: '14px',
                                height: '42px',
                              }}
                            />
                            <span
                              className="input-group-text bg-white fw-bold text-warning-emphasis border-start-0"
                              style={{ borderRadius: '0 8px 8px 0', borderColor: '#cbd5e1', fontSize: '13px' }}
                            >
                              % OFF
                            </span>
                          </div>
                          <div className="form-text fs-12 text-muted mt-1">
                            Calculated automatically against base retail price.
                          </div>
                        </div>

                        {/* Live calculation banner with well-spaced padding */}
                        <div
                          className="rounded-3 d-flex flex-column gap-2"
                          style={{
                            padding: '16px 20px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #fde68a',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between py-1">
                            <span className="text-muted fs-13">Discounted Store Price:</span>
                            <span className="fw-bold text-success fs-16">
                              {calculatedDiscountedPrice} SR
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between py-1 border-top" style={{ borderColor: '#f8fafc' }}>
                            <span className="text-muted fs-13">Customer Savings:</span>
                            <span className="fw-semibold text-danger fs-13">
                              {savings} SR ({offerPercent}% OFF)
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                            <span className="text-muted fs-12">Product Card Badge:</span>
                            <span className="badge bg-danger text-white fs-11 fw-bold px-2 py-1" style={{ letterSpacing: '0.3px' }}>
                              {offerPercent}% OFF
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                                {/* Nested Card: Product Studio & Multi-Angle Gallery */}
                <div
                  className="p-4 rounded-3 mb-4"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                        style={{ width: '36px', height: '36px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:gallery-wide-bold" class="fs-18 text-primary"></iconify-icon>
                      </span>
                      <div>
                        <h5 className="fs-15 fw-bold text-dark mb-0">Product Studio &amp; Multi-Angle Gallery</h5>
                        <span className="text-muted fs-11">Main product cover photo &amp; multi-angle slider views</span>
                      </div>
                    </div>

                    <span className="badge bg-dark text-white px-2.5 py-1" style={{ fontSize: '11px', borderRadius: '6px' }}>
                      ✨ 4-Angle Studio
                    </span>
                  </div>

                  {/* Studio Automated Processing Settings */}
                  <div
                    className="p-2.5 rounded-3 mb-3.5"
                    style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fs-11 fw-bold text-dark d-flex align-items-center gap-1">
                        <iconify-icon icon="solar:magic-stick-3-bold" class="fs-13 text-primary"></iconify-icon>
                        <span>Studio Processing</span>
                      </span>
                      <span className="badge bg-success text-white" style={{ fontSize: '9px' }}>
                        100% Transparent Cutout
                      </span>
                    </div>

                    <div className="row g-2">
                      {/* Toggle 1: Auto Remove Background */}
                      <div className="col-6">
                        <button
                          type="button"
                          onClick={() => setAutoRemoveBg(!autoRemoveBg)}
                          className={`btn w-100 btn-sm text-start d-flex align-items-center justify-content-between p-1.5 rounded-2 ${
                            autoRemoveBg ? 'btn-dark' : 'btn-light border'
                          }`}
                          style={{ fontSize: '11px', transition: 'all 0.2s' }}
                        >
                          <span className="d-flex align-items-center gap-1">
                            <iconify-icon icon="solar:scissors-square-bold" class="fs-13"></iconify-icon>
                            <span>Auto Remove BG</span>
                          </span>
                          <span className={`badge ${autoRemoveBg ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                            {autoRemoveBg ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>

                      {/* Toggle 2: 1:1 Studio Standardize & Center */}
                      <div className="col-6">
                        <button
                          type="button"
                          onClick={() => setStudioStandardize(!studioStandardize)}
                          className={`btn w-100 btn-sm text-start d-flex align-items-center justify-content-between p-1.5 rounded-2 ${
                            studioStandardize ? 'btn-dark' : 'btn-light border'
                          }`}
                          style={{ fontSize: '11px', transition: 'all 0.2s' }}
                        >
                          <span className="d-flex align-items-center gap-1">
                            <iconify-icon icon="solar:crop-minimalistic-bold" class="fs-13"></iconify-icon>
                            <span>1:1 Square Focus</span>
                          </span>
                          <span className={`badge ${studioStandardize ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                            {studioStandardize ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hidden File Inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handlePrimaryImageUpload}
                    className="d-none"
                  />
                  <input
                    ref={angleFileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleAngleImageUpload}
                    className="d-none"
                  />

                  {/* 1. MAIN COVER IMAGE (FRONT VIEW) - FEATURED ON TOP */}
                  <div
                    className="p-3 rounded-3 border mb-3.5 bg-white position-relative"
                    style={{
                      borderColor: '#cbd5e1',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="badge bg-primary text-white" style={{ fontSize: '11px', padding: '4px 8px' }}>
                          ★ Main Cover (Front View)
                        </span>
                        <span className="text-muted fs-11">Primary product photo</span>
                      </div>
                      {image !== '/assets/imgs/shop/p1.jpg' && (
                        <button
                          type="button"
                          onClick={() => setImage('/assets/imgs/shop/p1.jpg')}
                          className="btn btn-sm btn-link text-muted p-0 text-decoration-none fs-11"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Prominent Square Preview Box */}
                    <div
                      className="rounded-3 border overflow-hidden position-relative mx-auto d-flex align-items-center justify-content-center my-3"
                      style={{
                        width: '100%',
                        maxWidth: '240px',
                        height: '240px',
                        backgroundColor: 'transparent',
                        backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px',
                        borderColor: '#e2e8f0',
                      }}
                    >
                      <img
                        src={image}
                        alt="Front View"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                        }}
                      />
                      {isUploading && angleSlotTarget === null && (
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.88)' }}
                        >
                          <div className="spinner-border spinner-border-sm text-dark mb-1" role="status"></div>
                          <span className="fs-10 fw-bold text-dark">Processing...</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="btn btn-sm btn-dark w-100 d-flex align-items-center justify-content-center gap-1.5"
                      style={{ borderRadius: '7px', fontSize: '12px', padding: '8px 12px' }}
                    >
                      <iconify-icon icon="solar:upload-track-2-bold" class="fs-16"></iconify-icon>
                      <span>{image !== '/assets/imgs/shop/p1.jpg' ? 'Replace Main Cover Photo' : 'Upload Main Cover Photo'}</span>
                    </button>
                  </div>

                  {/* 2. OTHER ANGLES (BELOW MAIN IMAGE) */}
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2.5 pb-1 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                      <div className="d-flex align-items-center gap-1.5">
                        <iconify-icon icon="solar:camera-rotate-bold" class="fs-16 text-primary"></iconify-icon>
                        <span className="fs-13 fw-bold text-dark">Other Angles</span>
                      </div>
                      <span className="badge bg-light text-muted border fs-10">Storefront Slider (3 Angles)</span>
                    </div>

                    {/* 3-Column Grid for Side, Top, Back Angles */}
                    <div className="row g-2">
                      {/* 1. SIDE VIEW */}
                      <div className="col-4">
                        <div
                          className="p-2 rounded-3 border h-100 d-flex flex-column justify-content-between position-relative"
                          style={{
                            backgroundColor: galleryImages[0] ? '#ffffff' : '#f8fafc',
                            borderColor: '#cbd5e1',
                            borderStyle: galleryImages[0] ? 'solid' : 'dashed',
                            minHeight: '230px',
                          }}
                        >
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                              <span className="badge bg-light text-dark border px-1.5 py-0.5" style={{ fontSize: '9.5px' }}>
                                Side View
                              </span>
                              {galleryImages[0] && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAngle(0)}
                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                  title="Remove Side View"
                                >
                                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-13"></iconify-icon>
                                </button>
                              )}
                            </div>

                            {galleryImages[0] ? (
                              <div
                                className="rounded-2 border overflow-hidden position-relative mx-auto d-flex align-items-center justify-content-center my-1"
                                style={{
                                  width: '100%',
                                  height: '92px',
                                  backgroundColor: 'transparent',
                                  backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 10px 10px',
                                  borderColor: '#e2e8f0',
                                }}
                              >
                                <img
                                  src={galleryImages[0]}
                                  alt="Side View"
                                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                />
                              </div>
                            ) : (
                              <div className="text-center py-3 my-auto">
                                <iconify-icon icon="solar:box-minimalistic-bold" class="fs-22 text-muted mb-1"></iconify-icon>
                                <span className="d-block text-muted" style={{ fontSize: '10px' }}>Empty</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-1.5 border-top" style={{ borderColor: '#f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handleGenerateDirectAngle('side', 0)}
                              disabled={isGeneratingAngle || isUploading || !image || image === '/assets/imgs/shop/p1.jpg'}
                              className="btn btn-sm btn-dark w-100 d-flex align-items-center justify-content-center gap-1 mb-1"
                              style={{ borderRadius: '5px', fontSize: '10.5px', padding: '4px 6px' }}
                              title="Generate Side Angle"
                            >
                              {isGeneratingAngle && generatingSlot === 'side' ? (
                                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}></span>
                              ) : (
                                <>
                                  <iconify-icon icon="solar:magic-stick-3-bold" class="fs-12 text-warning"></iconify-icon>
                                  <span>{galleryImages[0] ? 'Regen' : 'AI Side'}</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAngleSlotTarget(0);
                                angleFileInputRef.current?.click();
                              }}
                              disabled={isUploading}
                              className="btn btn-sm btn-light border w-100 py-0.5"
                              style={{ borderRadius: '5px', fontSize: '10px' }}
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. TOP VIEW */}
                      <div className="col-4">
                        <div
                          className="p-2 rounded-3 border h-100 d-flex flex-column justify-content-between position-relative"
                          style={{
                            backgroundColor: galleryImages[1] ? '#ffffff' : '#f8fafc',
                            borderColor: '#cbd5e1',
                            borderStyle: galleryImages[1] ? 'solid' : 'dashed',
                            minHeight: '230px',
                          }}
                        >
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                              <span className="badge bg-light text-dark border px-1.5 py-0.5" style={{ fontSize: '9.5px' }}>
                                Top View
                              </span>
                              {galleryImages[1] && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAngle(1)}
                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                  title="Remove Top View"
                                >
                                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-13"></iconify-icon>
                                </button>
                              )}
                            </div>

                            {galleryImages[1] ? (
                              <div
                                className="rounded-2 border overflow-hidden position-relative mx-auto d-flex align-items-center justify-content-center my-1"
                                style={{
                                  width: '100%',
                                  height: '92px',
                                  backgroundColor: 'transparent',
                                  backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 10px 10px',
                                  borderColor: '#e2e8f0',
                                }}
                              >
                                <img
                                  src={galleryImages[1]}
                                  alt="Top View"
                                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                />
                              </div>
                            ) : (
                              <div className="text-center py-3 my-auto">
                                <iconify-icon icon="solar:align-top-bold" class="fs-22 text-muted mb-1"></iconify-icon>
                                <span className="d-block text-muted" style={{ fontSize: '10px' }}>Empty</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-1.5 border-top" style={{ borderColor: '#f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handleGenerateDirectAngle('top', 1)}
                              disabled={isGeneratingAngle || isUploading || !image || image === '/assets/imgs/shop/p1.jpg'}
                              className="btn btn-sm btn-dark w-100 d-flex align-items-center justify-content-center gap-1 mb-1"
                              style={{ borderRadius: '5px', fontSize: '10.5px', padding: '4px 6px' }}
                              title="Generate Top Angle"
                            >
                              {isGeneratingAngle && generatingSlot === 'top' ? (
                                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}></span>
                              ) : (
                                <>
                                  <iconify-icon icon="solar:magic-stick-3-bold" class="fs-12 text-warning"></iconify-icon>
                                  <span>{galleryImages[1] ? 'Regen' : 'AI Top'}</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAngleSlotTarget(1);
                                angleFileInputRef.current?.click();
                              }}
                              disabled={isUploading}
                              className="btn btn-sm btn-light border w-100 py-0.5"
                              style={{ borderRadius: '5px', fontSize: '10px' }}
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. BACK VIEW */}
                      <div className="col-4">
                        <div
                          className="p-2 rounded-3 border h-100 d-flex flex-column justify-content-between position-relative"
                          style={{
                            backgroundColor: galleryImages[2] ? '#ffffff' : '#f8fafc',
                            borderColor: '#cbd5e1',
                            borderStyle: galleryImages[2] ? 'solid' : 'dashed',
                            minHeight: '230px',
                          }}
                        >
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                              <span className="badge bg-light text-dark border px-1.5 py-0.5" style={{ fontSize: '9.5px' }}>
                                Back View
                              </span>
                              {galleryImages[2] && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAngle(2)}
                                  className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                  title="Remove Back View"
                                >
                                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-13"></iconify-icon>
                                </button>
                              )}
                            </div>

                            {galleryImages[2] ? (
                              <div
                                className="rounded-2 border overflow-hidden position-relative mx-auto d-flex align-items-center justify-content-center my-1"
                                style={{
                                  width: '100%',
                                  height: '92px',
                                  backgroundColor: 'transparent',
                                  backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 10px 10px',
                                  borderColor: '#e2e8f0',
                                }}
                              >
                                <img
                                  src={galleryImages[2]}
                                  alt="Back View"
                                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                />
                              </div>
                            ) : (
                              <div className="text-center py-3 my-auto">
                                <iconify-icon icon="solar:refresh-square-bold" class="fs-22 text-muted mb-1"></iconify-icon>
                                <span className="d-block text-muted" style={{ fontSize: '10px' }}>Empty</span>
                              </div>
                            )}
                          </div>

                          <div className="pt-1.5 border-top" style={{ borderColor: '#f1f5f9' }}>
                            <button
                              type="button"
                              onClick={() => handleGenerateDirectAngle('back', 2)}
                              disabled={isGeneratingAngle || isUploading || !image || image === '/assets/imgs/shop/p1.jpg'}
                              className="btn btn-sm btn-dark w-100 d-flex align-items-center justify-content-center gap-1 mb-1"
                              style={{ borderRadius: '5px', fontSize: '10.5px', padding: '4px 6px' }}
                              title="Generate Back Angle"
                            >
                              {isGeneratingAngle && generatingSlot === 'back' ? (
                                <span className="spinner-border spinner-border-sm" role="status" style={{ width: '10px', height: '10px' }}></span>
                              ) : (
                                <>
                                  <iconify-icon icon="solar:magic-stick-3-bold" class="fs-12 text-warning"></iconify-icon>
                                  <span>{galleryImages[2] ? 'Regen' : 'AI Back'}</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAngleSlotTarget(2);
                                angleFileInputRef.current?.click();
                              }}
                              disabled={isUploading}
                              className="btn btn-sm btn-light border w-100 py-0.5"
                              style={{ borderRadius: '5px', fontSize: '10px' }}
                            >
                              Upload
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

{/* Nested Card 4: Automatic System Management Notice */}
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
                        style={{ width: '36px', height: '36px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                      >
                        <iconify-icon icon="solar:shield-check-bold" class="fs-18 text-success"></iconify-icon>
                      </span>
                      <h5 className="fs-15 fw-bold text-dark mb-0">Automatic System Management</h5>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '26px',
                          height: '26px',
                          minWidth: '26px',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          border: '1px solid #bbf7d0',
                          marginTop: '1px',
                        }}
                      >
                        <iconify-icon icon="solar:check-circle-bold" class="fs-16"></iconify-icon>
                      </div>
                      <div className="flex-grow-1">
                        <strong className="d-block text-dark fs-13 mb-0.5">New Arrival Placement</strong>
                        <span className="text-muted fs-12" style={{ lineHeight: '1.45' }}>
                          Every newly created product is automatically recognized as <strong>New Arrival</strong> and placed <strong>1st</strong> in the storefront slider.
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '26px',
                          height: '26px',
                          minWidth: '26px',
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          marginTop: '1px',
                        }}
                      >
                        <iconify-icon icon="solar:check-circle-bold" class="fs-16"></iconify-icon>
                      </div>
                      <div className="flex-grow-1">
                        <strong className="d-block text-dark fs-13 mb-0.5">Most Searched Ranking</strong>
                        <span className="text-muted fs-12" style={{ lineHeight: '1.45' }}>
                          System automatically records live customer clicks and views on the storefront to rank items in <strong>Most Searched Items</strong>.
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '26px',
                          height: '26px',
                          minWidth: '26px',
                          backgroundColor: '#f1f5f9',
                          color: '#0f172a',
                          border: '1px solid #e2e8f0',
                          marginTop: '1px',
                        }}
                      >
                        <iconify-icon icon="solar:check-circle-bold" class="fs-16"></iconify-icon>
                      </div>
                      <div className="flex-grow-1">
                        <strong className="d-block text-dark fs-13 mb-0.5">Instant Storefront Publishing</strong>
                        <span className="text-muted fs-12" style={{ lineHeight: '1.45' }}>
                          Products are published automatically upon saving, with live cross-tab cache sync.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ProductEditPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-5 text-center" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
          <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
          <span className="text-muted">Loading editor...</span>
        </div>
      }
    >
      <ProductEditForm />
    </Suspense>
  );
}
