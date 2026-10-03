'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateProduct } from '@/services/productsService';
import { fetchAttributes, addCustomSize, deleteCustomSize } from '@/services/attributesService';
import { ProductItem, PRESET_SIZES } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';

function ProductSizesManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const productId = searchParams.get('id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<ProductItem | null>(null);

  const [allSizes, setAllSizes] = useState<string[]>(PRESET_SIZES);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load product and all system/custom sizes
  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, attrs] = await Promise.all([
          fetch(`/api/products?id=${encodeURIComponent(productId)}`, { cache: 'no-store' }),
          fetchAttributes(),
        ]);

        if (prodRes.ok) {
          const json = await prodRes.json();
          if (json.success && json.data) {
            const found: ProductItem = json.data;
            setProduct(found);
            setSelectedSizes(Array.isArray(found.sizes) ? found.sizes : []);
          } else {
            showToast('danger', 'Product not found.');
          }
        }

        if (attrs && Array.isArray(attrs.sizes)) {
          setAllSizes(attrs.sizes);
        }
      } catch (err: any) {
        showToast('danger', 'Failed to load product sizes.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId, showToast]);

  // Toggle single size selection
  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Select all visible
  const handleSelectAll = () => {
    const combined = Array.from(new Set([...selectedSizes, ...filteredSizes]));
    setSelectedSizes(combined);
    showToast('info', 'All filtered sizes selected.');
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedSizes([]);
    showToast('info', 'Sizes selection cleared.');
  };

  // Add new custom size
  const handleAddNewSize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSizeInput.trim();
    if (!trimmed) {
      showToast('warning', 'Please enter a size name or value.');
      return;
    }

    if (allSizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('info', `Size "${trimmed}" already exists.`);
      if (!selectedSizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
        const existing = allSizes.find((s) => s.toLowerCase() === trimmed.toLowerCase()) || trimmed;
        setSelectedSizes((prev) => [...prev, existing]);
      }
      setNewSizeInput('');
      return;
    }

    setIsAdding(true);
    try {
      const res = await addCustomSize(trimmed);
      if (res.success && res.data) {
        setAllSizes(res.data.sizes);
        // Automatically select the new size for the current product
        setSelectedSizes((prev) => [...prev, trimmed]);
        setNewSizeInput('');
        showToast('success', `Size "${trimmed}" added and selected for this product!`, 'Size Added');
      } else {
        showToast('danger', res.message || 'Failed to add size.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error adding size.');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete custom size
  const handleDeleteSize = async (sizeToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (PRESET_SIZES.includes(sizeToDelete)) {
      showToast('warning', 'System preset sizes cannot be removed.');
      return;
    }

    try {
      const res = await deleteCustomSize(sizeToDelete);
      if (res.success && res.data) {
        setAllSizes(res.data.sizes);
        setSelectedSizes((prev) => prev.filter((s) => s !== sizeToDelete));
        showToast('info', `Size "${sizeToDelete}" removed from system.`);
      } else {
        showToast('danger', res.message || 'Could not delete size.');
      }
    } catch (err: any) {
      showToast('danger', 'Error deleting size.');
    }
  };

  // Save sizes to product
  const handleSaveProductSizes = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const res = await updateProduct({
        id: product.id,
        sizes: selectedSizes,
      });

      if (res.success) {
        setProduct((prev) => (prev ? { ...prev, sizes: selectedSizes } : null));
        showToast(
          'success',
          `Successfully saved ${selectedSizes.length} sizes under "${product.title}"!`,
          'Sizes Saved'
        );
      } else {
        showToast('danger', res.message || 'Failed to save sizes to product.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered sizes list for inner table
  const filteredSizes = useMemo(() => {
    if (!searchFilter.trim()) return allSizes;
    const query = searchFilter.toLowerCase().trim();
    return allSizes.filter((s) => s.toLowerCase().includes(query));
  }, [allSizes, searchFilter]);

  if (isLoading) {
    return (
      <div className="card border-0 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="card-body p-5 text-center">
          <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
          <span className="text-muted fs-14">Loading product sizes...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card border-0 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="card-body p-5 text-center">
          <h4 className="fw-bold text-dark mb-2">Product Not Found</h4>
          <p className="text-muted fs-14 mb-4">The requested product could not be located in your catalog.</p>
          <Link href="/dashboard/all-products" className="btn btn-dark btn-sm px-4 py-2">
            Back to All Products
          </Link>
        </div>
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
          <div className="d-flex align-items-center text-muted fs-13 mb-3 gap-2">
            <Link href="/dashboard" className="text-muted text-decoration-none">
              Dashboard
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <Link href="/dashboard/all-products" className="text-muted text-decoration-none">
              All Products
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <Link href={`/dashboard/all-products/edit?id=${product.id}`} className="text-muted text-decoration-none">
              {product.title}
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <span className="text-dark fw-bold">Manage Sizes</span>
          </div>

          {/* 2. Top Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span
                  className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                  style={{ width: '38px', height: '38px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                >
                  <iconify-icon icon="solar:ruler-bold" class="fs-20 text-primary"></iconify-icon>
                </span>
                <h2
                  className="fw-bold text-dark mb-0"
                  style={{ fontSize: '22px', letterSpacing: '-0.3px', color: '#0f172a' }}
                >
                  Product Sizes Configuration
                </h2>
              </div>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Select available sizes, add new custom sizing, and save directly under <strong>{product.title}</strong>.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Link
                href={`/dashboard/all-products/edit?id=${product.id}`}
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
                &larr; Back to Product Edit
              </Link>

              <button
                type="button"
                onClick={handleSaveProductSizes}
                disabled={isSaving}
                className="btn btn-sm d-flex align-items-center gap-2 text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 22px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
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
                    <iconify-icon icon="solar:diskette-bold" class="fs-17"></iconify-icon>
                    <span>Save Sizes to Product</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '14px 0 20px 0' }}></div>

          {/* 3. Product Info Card */}
          <div
            className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-3"
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 overflow-hidden border flex-shrink-0"
                style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', position: 'relative' }}
              >
                {product.image ? (
                  <Image src={product.image} alt={product.title} fill className="object-fit-contain p-1" sizes="56px" />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                    <iconify-icon icon="solar:box-minimalistic-bold" class="fs-22"></iconify-icon>
                  </div>
                )}
              </div>
              <div>
                <span className="badge bg-white text-muted border mb-1" style={{ fontSize: '11px', borderColor: '#cbd5e1' }}>
                  {product.category || 'Safety Supplies'}
                </span>
                <h5 className="fs-15 fw-bold text-dark mb-0">{product.title}</h5>
                <span className="text-muted fs-12">Product ID: {product.id} &bull; Price: <strong>{product.price}</strong></span>
              </div>
            </div>

            {/* Currently Selected Summary */}
            <div className="d-flex align-items-center gap-2">
              <div className="text-end">
                <span className="d-block fs-11 text-muted fw-medium text-uppercase">Assigned Sizes</span>
                <span className="fs-14 fw-bold text-dark">
                  {selectedSizes.length} {selectedSizes.length === 1 ? 'Size' : 'Sizes'} Selected
                </span>
              </div>
              <span
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: selectedSizes.length > 0 ? '#f0fdf4' : '#f1f5f9',
                  color: selectedSizes.length > 0 ? '#16a34a' : '#64748b',
                  border: `1.5px solid ${selectedSizes.length > 0 ? '#86efac' : '#cbd5e1'}`,
                }}
              >
                <iconify-icon icon={selectedSizes.length > 0 ? 'solar:check-circle-bold' : 'solar:info-circle-linear'} class="fs-20"></iconify-icon>
              </span>
            </div>
          </div>

          {/* 4. Active Selected Sizes Chips Preview */}
          {selectedSizes.length > 0 ? (
            <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fs-12 fw-semibold text-muted text-uppercase">
                  Currently Selected Under This Product ({selectedSizes.length})
                </span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="btn btn-sm d-inline-flex align-items-center gap-1.5"
                  style={{
                    height: '30px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1.5px solid #fee2e2',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Deselect all sizes for this product"
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-13"></iconify-icon>
                  <span>Clear Selection</span>
                </button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {selectedSizes.map((sz) => (
                  <span
                    key={sz}
                    className="badge bg-dark text-white d-inline-flex align-items-center gap-1.5 py-1.5 px-3"
                    style={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}
                  >
                    <span>{sz}</span>
                    <span
                      onClick={() => handleToggleSize(sz)}
                      style={{ cursor: 'pointer', fontSize: '14px', lineHeight: 1, opacity: 0.8 }}
                      title="Deselect size"
                    >
                      &times;
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="alert alert-warning py-2.5 px-3 fs-13 d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '8px' }}>
              <iconify-icon icon="solar:info-circle-bold" class="fs-17"></iconify-icon>
              <span>No sizes are currently selected for this product. Select sizes from the table below and click <strong>Save Sizes to Product</strong>.</span>
            </div>
          )}

          {/* 5. Add New Custom Size Card (Well Padded & Beautiful) */}
          <div
            className="mb-4 rounded-3"
            style={{
              padding: '22px 26px',
              backgroundColor: '#fbfcfe',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-1.5">
              <span
                className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
              >
                <iconify-icon icon="solar:add-circle-bold" class="fs-18 text-primary"></iconify-icon>
              </span>
              <h6 className="fs-14 fw-bold text-dark mb-0">Add New Size to System</h6>
            </div>
            <p className="text-muted fs-13 mb-3" style={{ maxWidth: '680px' }}>
              Enter any size label (e.g. 4XL, 46, 50, Free Size, 10-inch, 54-62cm). Newly added sizes are instantly saved and available across all products in the dashboard.
            </p>

            <form onSubmit={handleAddNewSize} className="d-flex align-items-center gap-2 flex-wrap" style={{ maxWidth: '540px' }}>
              <div className="input-group" style={{ height: '42px' }}>
                <span className="input-group-text bg-white border text-muted px-3" style={{ borderRadius: '8px 0 0 8px', borderColor: '#cbd5e1' }}>
                  <iconify-icon icon="solar:tag-linear" class="fs-16"></iconify-icon>
                </span>
                <input
                  type="text"
                  className="form-control fs-13 shadow-none border"
                  placeholder="Enter size (e.g. 4XL, 46, One Size, 58-62cm)..."
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  style={{ borderColor: '#cbd5e1', borderRadius: '0', height: '42px' }}
                />
                <button
                  type="submit"
                  disabled={isAdding || !newSizeInput.trim()}
                  className="btn btn-dark fs-13 fw-semibold px-3.5 d-flex align-items-center gap-1.5"
                  style={{ borderRadius: '0 8px 8px 0', height: '42px' }}
                >
                  {isAdding ? (
                    <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                  ) : (
                    <>
                      <iconify-icon icon="solar:add-square-bold" class="fs-16"></iconify-icon>
                      <span>Add Size</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================
              6. INNER TABLE VIEW: ALL SIZES (Aligned & Beautiful)
             ======================================================== */}
          <div
            className="rounded-3 overflow-hidden border"
            style={{
              borderColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Table Action Bar */}
            <div
              className="p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2.5"
              style={{ backgroundColor: '#fcfdfe', borderColor: '#f1f5f9' }}
            >
              <div className="d-flex align-items-center gap-2">
                <h6 className="fs-14 fw-bold text-dark mb-0">System &amp; Custom Sizes</h6>
                <span className="badge bg-light text-muted border" style={{ fontSize: '11px', borderColor: '#cbd5e1' }}>
                  {filteredSizes.length} Total
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Search in sizes */}
                <div className="input-group" style={{ width: '220px', height: '34px' }}>
                  <span className="input-group-text bg-white border-0 text-muted px-2 py-0 border" style={{ borderColor: '#cbd5e1', borderRadius: '6px 0 0 6px' }}>
                    <iconify-icon icon="solar:magnifer-linear" class="fs-14"></iconify-icon>
                  </span>
                  <input
                    type="text"
                    className="form-control fs-12 border shadow-none"
                    placeholder="Search size..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{ borderColor: '#cbd5e1', borderRadius: '0 6px 6px 0', height: '34px' }}
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      className="btn btn-link p-0 px-2 text-muted text-decoration-none"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="btn btn-sm btn-light border text-dark fw-medium"
                  style={{ height: '34px', fontSize: '12px', borderRadius: '6px' }}
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                  style={{ height: '34px', fontSize: '12px', borderRadius: '6px', padding: '0 12px', fontWeight: 500 }}
                  title="Clear all selected sizes"
                >
                  <iconify-icon icon="solar:close-circle-linear" class="fs-14"></iconify-icon>
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Inner Table View */}
            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ width: '60px', padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="form-check-input shadow-none cursor-pointer"
                        checked={filteredSizes.length > 0 && filteredSizes.every((s) => selectedSizes.includes(s))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAll();
                          } else {
                            setSelectedSizes((prev) => prev.filter((s) => !filteredSizes.includes(s)));
                          }
                        }}
                        title="Toggle all visible sizes"
                      />
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Size Label</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Assignment Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSizes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <iconify-icon icon="solar:inbox-line-linear" class="fs-28 d-block mb-1"></iconify-icon>
                        <span>No sizes match &quot;{searchFilter}&quot;. Use the form above to add it.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      const isPreset = PRESET_SIZES.includes(size);

                      return (
                        <tr
                          key={size}
                          onClick={() => handleToggleSize(size)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f8fafc' : 'transparent',
                            transition: 'background-color 0.15s ease',
                          }}
                          className="table-row-hover"
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="form-check-input shadow-none cursor-pointer"
                              checked={isSelected}
                              onChange={() => handleToggleSize(size)}
                            />
                          </td>

                          {/* Size Label */}
                          <td style={{ padding: '12px 16px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <span
                                className="badge bg-light text-dark border fw-bold d-inline-flex align-items-center justify-content-center"
                                style={{
                                  minWidth: '40px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  borderColor: isSelected ? '#0f172a' : '#e2e8f0',
                                  backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                                  color: isSelected ? '#ffffff' : '#0f172a',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {size}
                              </span>
                              <span className="fw-semibold text-dark fs-13">{size}</span>
                            </div>
                          </td>

                          {/* Type */}
                          <td style={{ padding: '12px 16px' }}>
                            {isPreset ? (
                              <span
                                className="badge bg-secondary-subtle text-secondary border border-secondary-subtle fw-medium"
                                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}
                              >
                                System Preset
                              </span>
                            ) : (
                              <span
                                className="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold"
                                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}
                              >
                                Custom Added
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 16px' }}>
                            {isSelected ? (
                              <span
                                className="badge d-inline-flex align-items-center gap-1 fw-semibold"
                                style={{
                                  backgroundColor: '#f0fdf4',
                                  color: '#166534',
                                  border: '1px solid #bbf7d0',
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                }}
                              >
                                <iconify-icon icon="solar:check-circle-bold" class="fs-13 text-success"></iconify-icon>
                                <span>Selected for Product</span>
                              </span>
                            ) : (
                              <span className="text-muted fs-12">&mdash; Not Selected</span>
                            )}
                          </td>

                          {/* Action */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            {!isPreset ? (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSize(size, e)}
                                className="btn btn-sm btn-outline-danger p-1 px-2"
                                title="Delete custom size from system"
                                style={{ fontSize: '11px', borderRadius: '5px' }}
                              >
                                <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-13 align-middle"></iconify-icon>
                                <span className="ms-1">Delete</span>
                              </button>
                            ) : (
                              <span className="text-muted fs-11">Default</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div
              className="p-3 border-top d-flex align-items-center justify-content-between text-muted fs-12"
              style={{ backgroundColor: '#fcfdfe', borderColor: '#f1f5f9' }}
            >
              <span>
                Total <strong>{allSizes.length}</strong> sizes available &bull; <strong>{selectedSizes.length}</strong> selected for this product
              </span>
              <button
                type="button"
                onClick={handleSaveProductSizes}
                disabled={isSaving}
                className="btn btn-sm btn-dark px-3 py-1.5 fs-12 fw-semibold"
                style={{ borderRadius: '6px' }}
              >
                {isSaving ? 'Saving...' : 'Save Sizes'}
              </button>
            </div>
          </div>

          {/* 7. Bottom Action Bar (Back to Product Edit and Save Sizes Together on Right Side) */}
          <div
            className="d-flex align-items-center justify-content-end gap-2.5 border-top"
            style={{ borderColor: '#e2e8f0', paddingTop: '24px', marginTop: '28px' }}
          >
            <Link
              href={`/dashboard/all-products/edit?id=${product.id}`}
              className="btn btn-sm btn-light border text-dark px-3.5 py-2 fw-medium d-inline-flex align-items-center gap-1.5"
              style={{ borderRadius: '8px', fontSize: '13px', height: '40px', backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
            >
              &larr; Back to Product Edit
            </Link>

            <button
              type="button"
              onClick={handleSaveProductSizes}
              disabled={isSaving}
              className="btn btn-dark btn-sm px-4 py-2 fw-bold d-inline-flex align-items-center gap-2"
              style={{ borderRadius: '8px', fontSize: '13px', height: '40px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)' }}
            >
              {isSaving ? (
                <>
                  <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <iconify-icon icon="solar:diskette-bold" class="fs-16"></iconify-icon>
                  <span>Save Sizes to Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductSizesPage() {
  return (
    <Suspense
      fallback={
        <div className="card border-0 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
          <div className="card-body p-5 text-center">
            <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
            <span className="text-muted">Loading sizes editor...</span>
          </div>
        </div>
      }
    >
      <ProductSizesManager />
    </Suspense>
  );
}
