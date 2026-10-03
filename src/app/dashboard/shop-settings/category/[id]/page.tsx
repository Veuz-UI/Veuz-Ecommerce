'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchShopSettings, saveShopSettings } from '@/services/shopSettingsService';
import { ShopCategory, CategorySubItem } from '@/data/defaultShopSettings';
import { useToast } from '@/context/ToastContext';
import { validateImageFile, compressImage } from '@/utils/imageSecurity';

export default function CategoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params?.id as string;
  const isNew = categoryId === 'new';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Delete modal state
  const [deleteSubTarget, setDeleteSubTarget] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [hasSubItems, setHasSubItems] = useState(false);
  const [subItems, setSubItems] = useState<CategorySubItem[]>([]);

  // New sub-item input state
  const [newSubName, setNewSubName] = useState('');
  const [newSubLink, setNewSubLink] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);

  // Inline editing sub-item state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubLink, setEditSubLink] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const settings = await fetchShopSettings();
        if (!isNew) {
          const found = settings.categories.find((c) => c.id === categoryId);
          if (found) {
            setName(found.name);
            setLink(found.link);
            setImage(found.image || '');
            setIsActive(found.isActive !== false);
            setHasSubItems(found.hasSubItems === true);

            let items = found.subItems ? [...found.subItems] : [];
            // Ensure 5th item is "See All" by default if not present
            const hasSeeAll = items.some((item) => item.name.toLowerCase().includes('see all') || item.name.toLowerCase().includes('view all'));
            if (!hasSeeAll && items.length < 5) {
              items.push({
                id: `see-all-${Date.now()}`,
                name: 'See All',
                link: found.link || '/products',
              });
            }
            setSubItems(items);
          } else {
            showToast('danger', 'Category not found.');
          }
        } else {
          setName('');
          setLink('/products?category=');
          setImage('/assets/imgs/shop/p1.jpg');
          setIsActive(true);
          setHasSubItems(false);
          // Default with 5th "See All"
          setSubItems([
            { id: `sub-1`, name: 'Custom Sub 1', link: '/products' },
            { id: `sub-2`, name: 'Custom Sub 2', link: '/products' },
            { id: `sub-3`, name: 'Custom Sub 3', link: '/products' },
            { id: `sub-4`, name: 'Custom Sub 4', link: '/products' },
            { id: `sub-see-all`, name: 'See All', link: '/products' },
          ]);
        }
      } catch (err: any) {
        showToast('danger', err.message || 'Failed to load category.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categoryId, isNew, showToast]);

  // Sub-item helpers: max 5 total
  const canAddMoreSubItems = subItems.length < 5;

  const handleAddSubItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) {
      showToast('danger', 'Please enter a sub-category name.');
      return;
    }
    if (subItems.length >= 5) {
      showToast('danger', 'Maximum 5 sub-items allowed (including See All).');
      return;
    }

    const newItem: CategorySubItem = {
      id: `sub-${Date.now()}`,
      name: newSubName.trim(),
      link: newSubLink.trim() || link || '/products',
    };

    const seeAllIndex = subItems.findIndex((it) => it.name.toLowerCase().includes('see all'));
    let updatedList = [...subItems];
    if (seeAllIndex !== -1 && seeAllIndex === subItems.length - 1) {
      updatedList.splice(seeAllIndex, 0, newItem);
    } else {
      updatedList.push(newItem);
    }

    setSubItems(updatedList);
    setNewSubName('');
    setNewSubLink('');
    setShowAddSub(false);
    showToast('success', 'Sub-item added successfully.');
  };

  const handleStartEditSub = (item: CategorySubItem) => {
    setEditingSubId(item.id);
    setEditSubName(item.name);
    setEditSubLink(item.link);
  };

  const handleSaveEditSub = (id: string) => {
    if (!editSubName.trim()) {
      showToast('danger', 'Sub-category name cannot be empty.');
      return;
    }

    setSubItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, name: editSubName.trim(), link: editSubLink.trim() || link || '/products' } : it))
    );
    setEditingSubId(null);
    showToast('success', 'Sub-category updated.');
  };

  const handleConfirmDeleteSub = () => {
    if (!deleteSubTarget) return;
    setSubItems((prev) => prev.filter((it) => it.id !== deleteSubTarget.id));
    showToast('danger', `Removed "${deleteSubTarget.name}" sub-category.`, 'Deleted Successfully');
    setDeleteSubTarget(null);
  };

  // Secure Category Image Upload Handler (Strict .jpg, .jpeg, .png, .webp, 5MB ceiling, Canvas Compression, Magic Bytes)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow re-selection
    e.target.value = '';

    // 1. Client Security: File format lock
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

    // 2. Client Security: Max 5MB size limit
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    const validation = validateImageFile(file, MAX_SIZE_BYTES);
    if (!validation.valid) {
      showToast('danger', validation.error || 'File validation failed. Max size is 5MB.');
      return;
    }

    // 3. Compress & sanitize image in browser (strips malicious EXIF payloads)
    setIsUploading(true);
    try {
      showToast('info', 'Validating and optimizing category image...');
      const compressed = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.88,
        mimeType: file.type === 'image/png' ? 'image/png' : 'image/webp',
      });

      // Show immediate local preview
      const previewUrl = URL.createObjectURL(compressed);
      setImage(previewUrl);

      // 4. Send to server upload endpoint with binary magic bytes verification
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast('warning', json.message || 'Image preview set locally.');
        return;
      }

      setImage(json.url);
      showToast('success', 'Category image uploaded securely and verified!');
    } catch (err: any) {
      console.error('Category image upload error:', err);
      showToast('danger', err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('danger', 'Please enter category name.');
      return;
    }

    setIsSaving(true);
    try {
      const settings = await fetchShopSettings();
      let updatedCategories = [...settings.categories];

      let finalSubItems = [...subItems];
      const hasSeeAll = finalSubItems.some((it) => it.name.toLowerCase().includes('see all'));
      if (!hasSeeAll && finalSubItems.length < 5) {
        finalSubItems.push({
          id: `see-all-${Date.now()}`,
          name: 'See All',
          link: link || '/products',
        });
      }

      if (isNew) {
        const newCat: ShopCategory = {
          id: `cat-${Date.now()}`,
          name: name.trim(),
          link: link.trim() || `/products?category=${encodeURIComponent(name.toLowerCase().trim())}`,
          image: image.trim(),
          hasSubItems,
          isActive,
          subItems: finalSubItems,
        };
        updatedCategories.push(newCat);
      } else {
        updatedCategories = updatedCategories.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                name: name.trim(),
                link: link.trim() || c.link,
                image: image.trim(),
                hasSubItems,
                isActive,
                subItems: finalSubItems,
              }
            : c
        );
      }

      const res = await saveShopSettings({
        ...settings,
        categories: updatedCategories,
      });

      if (res.success) {
        showToast('success', 'Category saved successfully! Storefront updated.');
        setTimeout(() => {
          router.push('/dashboard/shop-settings');
        }, 900);
      } else {
        showToast('danger', res.message || 'Failed to save category.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error occurred while saving category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Main Full Width White Card (Classic White Look) */}
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
          
          {/* Breadcrumb & Navigation Bar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: '#e2e8f0' }}>
            <div>
              <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '24px', gap: '10px' }}>
                <Link href="/dashboard" className="text-muted text-decoration-none">
                  Dashboard
                </Link>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
                <Link href="/dashboard/shop-settings" className="text-muted text-decoration-none">
                  Shop Settings
                </Link>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
                <span className="text-dark fw-bold">
                  {isNew ? 'Add Category' : 'Edit Category'}
                </span>
              </div>
              <h2 className="fw-bold text-dark" style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}>
                {isNew ? 'Add New Shop Category' : `Edit Category: ${name || '...'}`}
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Configure primary category details, direct storefront links, and up to 5 level-2 sub-items with &quot;See All&quot; default.
              </p>
            </div>

            <Link
              href="/dashboard/shop-settings"
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
              <span>Back to Shop Settings</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="dashboard-loading-stable text-center py-5">
              <div className="spinner-border text-dark" role="status"></div>
              <p className="text-muted fs-14 mt-2">Loading category details...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveCategory}>
              <div className="row g-4">
                
                {/* Left Column: Primary Category Info (White Background & Classic Look) */}
                <div className="col-lg-5">
                  <div
                    className="p-4 rounded-3 h-100"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {/* Header: Primary Category Info */}
                    <div className="d-flex align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9', gap: '16px' }}>
                      <span
                        className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                        style={{ width: '40px', height: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                      >
                        <iconify-icon icon="solar:tag-bold" class="fs-20" style={{ color: '#0f172a' }}></iconify-icon>
                      </span>
                      <div>
                        <h4 className="fw-bold text-dark fs-15 mb-0">Primary Category Info</h4>
                        <p className="text-muted fs-12 mb-0" style={{ marginTop: '2px' }}>General details and target link</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Category Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control fs-14"
                        placeholder="e.g. Tshirts, Bags, Accessories"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                          borderRadius: '8px',
                          padding: '10px 16px',
                          borderColor: '#cbd5e1',
                          height: '46px',
                        }}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Storefront Target URL <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control fs-14"
                        placeholder="e.g. /products?category=tshirts"
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
                      <small className="text-muted fs-12 mt-1.5 d-block">Target destination when clicking category title in the menu.</small>
                    </div>

                    {/* Category Thumbnail Image Card (Storefront Category Card & Dropdown) */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label fs-13 fw-semibold text-dark mb-0">
                          Category Thumbnail Image
                        </label>
                        <span className="badge fs-11 fw-semibold" style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px' }}>
                          Storefront &amp; Dropdown
                        </span>
                      </div>

                      <div
                        className="p-3 rounded-3 border"
                        style={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                        }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          {/* Image Preview Box */}
                          <div
                            className="rounded-3 border overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: '74px',
                              height: '74px',
                              backgroundColor: '#ffffff',
                              borderColor: '#cbd5e1',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                          >
                            {image ? (
                              <img
                                src={image}
                                alt="Category Preview"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  padding: '4px',
                                }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <iconify-icon icon="solar:gallery-wide-bold" class="fs-28 text-muted"></iconify-icon>
                            )}
                          </div>

                          {/* Upload Actions */}
                          <div className="flex-grow-1">
                            <input
                              type="file"
                              id="categoryImageUploadInput"
                              accept=".jpg,.jpeg,.png,.webp"
                              className="d-none"
                              onChange={handleImageFileChange}
                              disabled={isUploading}
                            />

                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1.5">
                              <button
                                type="button"
                                onClick={() => document.getElementById('categoryImageUploadInput')?.click()}
                                disabled={isUploading}
                                className="btn btn-sm d-flex align-items-center gap-1.5 fs-12 fw-semibold text-white"
                                style={{
                                  borderRadius: '6px',
                                  backgroundColor: '#0f172a',
                                  padding: '7px 14px',
                                }}
                              >
                                {isUploading ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    <span>Verifying &amp; Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <iconify-icon icon="solar:upload-minimalistic-bold" class="fs-15"></iconify-icon>
                                    <span>Upload Image</span>
                                  </>
                                )}
                              </button>

                              {image && (
                                <button
                                  type="button"
                                  onClick={() => setImage('')}
                                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 fs-12 fw-semibold"
                                  style={{ borderRadius: '6px', padding: '6px 12px' }}
                                >
                                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-14"></iconify-icon>
                                  <span>Clear</span>
                                </button>
                              )}
                            </div>

                            <span className="text-muted fs-11 d-block">
                              Formats: JPG, PNG, WebP · Max: 5MB · Auto-compressed &amp; Magic-byte verified
                            </span>
                          </div>
                        </div>

                        {/* Static Image / Asset Path Input */}
                        <div>
                          <label className="form-label fs-11 text-muted mb-1">
                            Or enter static image URL / asset path:
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white" style={{ borderColor: '#cbd5e1' }}>
                              <iconify-icon icon="solar:link-linear" class="fs-14 text-muted"></iconify-icon>
                            </span>
                            <input
                              type="text"
                              className="form-control fs-12"
                              placeholder="/assets/imgs/shop/p1.jpg"
                              value={image}
                              onChange={(e) => setImage(e.target.value)}
                              style={{ borderColor: '#cbd5e1' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Card: With subtle background, proper padding, well-aligned data */}
                    <div className="pt-2">
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
                            <span className="fs-14 fw-bold text-dark">Active Status</span>
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
                          <p className="text-muted fs-12 mb-0">Show this category in storefront dropdown and drawer</p>
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
                  </div>
                </div>

                {/* Right Column: Level 2 Sub-Items (White Background & Classic Look) */}
                <div className="col-lg-7">
                  <div
                    className="p-4 rounded-3 h-100"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2" style={{ borderColor: '#f1f5f9' }}>
                      <div className="d-flex align-items-center" style={{ gap: '16px' }}>
                        <span
                          className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                          style={{ width: '40px', height: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <iconify-icon icon="solar:list-bold" class="fs-20" style={{ color: '#0f172a' }}></iconify-icon>
                        </span>
                        <div>
                          <h4 className="fw-bold text-dark fs-15 mb-0">Level 2 Sub-Items</h4>
                          <p className="text-muted fs-12 mb-0" style={{ marginTop: '2px' }}>Max 5 items. 5th slot defaults to &quot;See All&quot;.</p>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {/* Quick Show/Hide Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setHasSubItems(!hasSubItems)}
                          className={`btn btn-sm d-flex align-items-center gap-1.5 fs-12 fw-semibold ${
                            hasSubItems ? 'btn-outline-secondary' : 'btn-warning text-dark'
                          }`}
                          style={{
                            borderRadius: '6px',
                            padding: '6px 12px',
                            transition: 'all 0.2s ease',
                          }}
                          title={hasSubItems ? 'Click to hide Level 2 Sub-Items in storefront' : 'Click to show Level 2 Sub-Items in storefront'}
                        >
                          <iconify-icon icon={hasSubItems ? 'solar:eye-closed-bold' : 'solar:eye-bold'} class="fs-15"></iconify-icon>
                          <span>{hasSubItems ? 'Hide Sub-Items' : 'Show Sub-Items'}</span>
                        </button>

                        <span
                          className={`badge ${subItems.length >= 5 ? 'bg-danger text-white' : 'bg-dark text-white'} fs-12 fw-bold`}
                          style={{ padding: '6px 12px', borderRadius: '6px' }}
                        >
                          {subItems.length} / 5 Slots
                        </span>
                      </div>
                    </div>

                    {/* Sub-Items Storefront Visibility Switch Card */}
                    <div
                      className="d-flex align-items-center justify-content-between p-3 rounded-3 border mb-3"
                      style={{
                        backgroundColor: hasSubItems ? '#f8fafc' : '#fffbeb',
                        borderColor: hasSubItems ? '#e2e8f0' : '#fde68a',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div className="pe-3">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="d-inline-block rounded-circle"
                            style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: hasSubItems ? '#16a34a' : '#d97706',
                            }}
                          ></span>
                          <span className="fs-13 fw-bold text-dark">
                            {hasSubItems ? 'Level 2 Sub-Items Active' : 'Level 2 Sub-Items Hidden'}
                          </span>
                          <span
                            className="badge fs-11 fw-semibold"
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: hasSubItems ? '#f0fdf4' : '#fef3c7',
                              color: hasSubItems ? '#16a34a' : '#b45309',
                              border: hasSubItems ? '1px solid #bbf7d0' : '1px solid #fde68a',
                            }}
                          >
                            {hasSubItems ? 'Storefront Flyout Window Active' : 'Standalone Direct Link (No Hover Flyout)'}
                          </span>
                        </div>
                        <p className="text-muted fs-12 mb-0">
                          {hasSubItems
                            ? 'Hovering this category in the storefront header dropdown expands the Level 2 sub-items flyout window.'
                            : 'Sub-items are hidden in the storefront. This category stays as a standalone link with NO submenu window opening on hover.'}
                        </p>
                      </div>

                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={hasSubItems}
                          onChange={(e) => setHasSubItems(e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            width: '2.8em',
                            height: '1.4em',
                            backgroundColor: hasSubItems ? '#16a34a' : '#cbd5e1',
                            borderColor: hasSubItems ? '#16a34a' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>

                    {!hasSubItems && (
                      <div
                        className="alert d-flex align-items-center gap-2 py-2 px-3 fs-12 mb-3 rounded-2 border"
                        style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}
                      >
                        <iconify-icon icon="solar:info-circle-bold" class="fs-18 flex-shrink-0 text-warning"></iconify-icon>
                        <span>
                          <strong>Standalone Mode:</strong> Sub-items below are saved but <strong>hidden from website users</strong>. The category link stays alone with no flyout window.
                        </span>
                      </div>
                    )}

                    {/* Sub-items list */}
                    <div className="d-flex flex-column gap-3 mb-4">
                      {subItems.map((item, index) => {
                        const isSeeAll = item.name.toLowerCase().includes('see all') || item.name.toLowerCase().includes('view all');
                        const isEditingThis = editingSubId === item.id;

                        if (isEditingThis) {
                          return (
                            <div
                              key={item.id}
                              className="p-3 bg-white rounded-3 border shadow-sm"
                              style={{ borderColor: '#0f172a' }}
                            >
                              <div className="row g-2 align-items-center">
                                <div className="col-5">
                                  <input
                                    type="text"
                                    className="form-control fs-13"
                                    value={editSubName}
                                    onChange={(e) => setEditSubName(e.target.value)}
                                    placeholder="Sub-item Title"
                                    style={{ height: '40px', borderRadius: '6px' }}
                                  />
                                </div>
                                <div className="col-5">
                                  <input
                                    type="text"
                                    className="form-control fs-13"
                                    value={editSubLink}
                                    onChange={(e) => setEditSubLink(e.target.value)}
                                    placeholder="Target URL"
                                    style={{ height: '40px', borderRadius: '6px' }}
                                  />
                                </div>
                                <div className="col-2 d-flex gap-2 justify-content-end">
                                  <button
                                    type="button"
                                    className="btn btn-sm d-flex align-items-center justify-content-center"
                                    onClick={() => handleSaveEditSub(item.id)}
                                    title="Save changes"
                                    style={{
                                      borderRadius: '7px',
                                      width: '36px',
                                      height: '36px',
                                      backgroundColor: '#16a34a',
                                      borderColor: '#16a34a',
                                      color: '#ffffff',
                                      boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                                    }}
                                  >
                                    <iconify-icon icon="solar:check-circle-bold" class="fs-18 text-white"></iconify-icon>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm d-flex align-items-center justify-content-center"
                                    onClick={() => setEditingSubId(null)}
                                    title="Cancel"
                                    style={{
                                      borderRadius: '7px',
                                      width: '36px',
                                      height: '36px',
                                      backgroundColor: '#dc2626',
                                      borderColor: '#dc2626',
                                      color: '#ffffff',
                                      boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
                                    }}
                                  >
                                    <iconify-icon icon="solar:close-circle-bold" class="fs-18 text-white"></iconify-icon>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            className="d-flex align-items-center justify-content-between p-3 rounded-3 border"
                            style={{
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span
                                className="rounded-circle text-muted border d-flex align-items-center justify-content-center fs-12 fw-bold"
                                style={{ width: '30px', height: '30px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                              >
                                {index + 1}
                              </span>
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`fs-14 fw-bold ${isSeeAll ? 'text-dark' : 'text-dark'}`}>
                                    {item.name}
                                  </span>
                                  {isSeeAll && (
                                    <span
                                      className="badge fs-11 fw-semibold"
                                      style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                                    >
                                      Default See All
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted fs-12 mt-0.5">{item.link}</div>
                              </div>
                            </div>

                            {/* Actions: Edit always yellow background icon-only, Delete light red icon-only */}
                            <div className="d-flex align-items-center gap-2">
                              {/* Edit: Yellow Background, Icon Only */}
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                onClick={() => handleStartEditSub(item)}
                                title="Edit Sub-item"
                                style={{
                                  borderRadius: '7px',
                                  width: '34px',
                                  height: '34px',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <iconify-icon icon="solar:pen-new-square-linear" class="fs-16"></iconify-icon>
                              </button>

                              {/* Delete: Light Red Background, Icon Only */}
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center text-danger"
                                onClick={() => setDeleteSubTarget({ id: item.id, name: item.name })}
                                title="Delete Sub-item"
                                style={{
                                  borderRadius: '7px',
                                  width: '34px',
                                  height: '34px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Sub-Item Trigger / Inline Form */}
                    {canAddMoreSubItems ? (
                      showAddSub ? (
                        <div
                          className="p-3.5 bg-white rounded-3 border border-dashed border-2"
                          style={{ borderColor: '#0f172a' }}
                        >
                          <h6 className="fs-13 fw-bold text-dark mb-3">
                            New Sub-Category Item (#{subItems.length + 1} of 5)
                          </h6>
                          <div className="row g-2.5 mb-3">
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="Sub-category name (e.g. Cotton Tshirts)"
                                value={newSubName}
                                onChange={(e) => setNewSubName(e.target.value)}
                                style={{ height: '42px', borderRadius: '7px' }}
                              />
                            </div>
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="Target URL (e.g. /products?cat=cotton)"
                                value={newSubLink}
                                onChange={(e) => setNewSubLink(e.target.value)}
                                style={{ height: '42px', borderRadius: '7px' }}
                              />
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2.5">
                            <button
                              type="button"
                              className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                              style={{ backgroundColor: '#0f172a', borderRadius: '7px' }}
                              onClick={handleAddSubItem}
                            >
                              Add Sub-Item
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-light border fs-13 px-3 py-2"
                              style={{ borderRadius: '7px', borderColor: '#d1d5db' }}
                              onClick={() => {
                                setShowAddSub(false);
                                setNewSubName('');
                                setNewSubLink('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm d-flex align-items-center justify-content-center gap-2 w-100 py-3 fs-13 fw-bold text-dark"
                          style={{
                            borderRadius: '8px',
                            border: '1.5px dashed #0f172a',
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => setShowAddSub(true)}
                        >
                          <iconify-icon icon="solar:add-circle-bold" class="fs-18"></iconify-icon>
                          <span>+ Add Sub-Category (Slot {subItems.length + 1} of 5)</span>
                        </button>
                      )
                    ) : (
                      <div
                        className="alert alert-info py-2.5 px-3.5 fs-13 mb-0 d-flex align-items-center"
                        style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', gap: '14px' }}
                      >
                        <iconify-icon icon="solar:info-circle-bold" class="fs-20 text-muted flex-shrink-0"></iconify-icon>
                        <span className="text-secondary">
                          Maximum limit reached (5 of 5 slots used). 5th slot is configured as &quot;See All&quot;.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Bottom Actions Bar: Cancel and Save Changes Together on Right Side */}
              <div className="d-flex align-items-center justify-content-end gap-3 pt-4 mt-4 border-top" style={{ borderColor: '#e2e8f0' }}>
                <Link
                  href="/dashboard/shop-settings"
                  className="btn btn-sm btn-light border fs-14 fw-semibold text-secondary"
                  style={{
                    borderRadius: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#ffffff',
                    borderColor: '#d1d5db',
                    color: '#334155',
                  }}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-sm fs-14 fw-semibold text-white d-flex align-items-center gap-2.5"
                  style={{
                    borderRadius: '8px',
                    padding: '10px 26px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  {isSaving && <div className="spinner-border spinner-border-sm" role="status"></div>}
                  <iconify-icon icon="solar:diskette-bold" class="fs-18 text-white"></iconify-icon>
                  <span>{isNew ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal for Sub-Item */}
      {deleteSubTarget && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div
              className="modal-content border-0 shadow-lg"
              style={{
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="modal-body p-4 text-center">
                <div
                  className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '56px', height: '56px' }}
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-28"></iconify-icon>
                </div>
                <h4 className="fw-bold text-dark mb-1.5" style={{ fontSize: '18px' }}>
                  Delete Sub-Item?
                </h4>
                <p className="text-muted fs-14 mb-4">
                  Are you sure you want to remove &quot;{deleteSubTarget.name}&quot; from level 2 sub-items?
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-4 py-2 fs-14 fw-semibold text-secondary"
                    onClick={() => setDeleteSubTarget(null)}
                    style={{ borderRadius: '8px', minWidth: '110px' }}
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger px-4 py-2 fs-14 fw-semibold d-flex align-items-center gap-2"
                    onClick={handleConfirmDeleteSub}
                    style={{ borderRadius: '8px', minWidth: '130px' }}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                    <span>Yes, Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
