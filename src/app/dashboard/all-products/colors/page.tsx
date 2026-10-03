'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateProduct } from '@/services/productsService';
import { fetchAttributes, addCustomColor, deleteCustomColor } from '@/services/attributesService';
import { ProductItem, SystemColor, SYSTEM_COLORS } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';

function ProductColorsManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const productId = searchParams.get('id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<ProductItem | null>(null);

  const [allColors, setAllColors] = useState<SystemColor[]>(SYSTEM_COLORS);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563eb');
  const [searchFilter, setSearchFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load product and system + custom colors
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
            setSelectedColors(Array.isArray(found.colors) ? found.colors : []);
          } else {
            showToast('danger', 'Product not found.');
          }
        }

        if (attrs && Array.isArray(attrs.colors)) {
          setAllColors(attrs.colors);
        }
      } catch (err: any) {
        showToast('danger', 'Failed to load product colors.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId, showToast]);

  // Toggle single color selection
  const handleToggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.some((c) => c.toLowerCase() === colorName.toLowerCase())
        ? prev.filter((c) => c.toLowerCase() !== colorName.toLowerCase())
        : [...prev, colorName]
    );
  };

  // Select all visible
  const handleSelectAll = () => {
    const combined = Array.from(
      new Set([...selectedColors, ...filteredColors.map((c) => c.name)])
    );
    setSelectedColors(combined);
    showToast('info', 'All filtered colors selected.');
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSelectedColors([]);
    showToast('info', 'Colors selection cleared.');
  };

  // Add new custom color
  const handleAddNewColor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newColorName.trim();
    let trimmedHex = newColorHex.trim();

    if (!trimmedName) {
      showToast('warning', 'Please provide a color name (e.g. Fluorescent Orange).');
      return;
    }

    if (!trimmedHex.startsWith('#')) {
      trimmedHex = '#' + trimmedHex;
    }

    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!hexRegex.test(trimmedHex)) {
      showToast('warning', 'Please provide a valid Hex Color code (e.g. #ea580c).');
      return;
    }

    setIsAdding(true);
    try {
      const res = await addCustomColor(trimmedName, trimmedHex);
      if (res.success && res.data) {
        setAllColors(res.data.colors);
        // Automatically select the new color for this product
        if (!selectedColors.some((c) => c.toLowerCase() === trimmedName.toLowerCase())) {
          setSelectedColors((prev) => [...prev, trimmedName]);
        }
        setNewColorName('');
        showToast('success', `Color "${trimmedName}" (${trimmedHex}) added and selected for this product!`, 'Color Added');
      } else {
        showToast('danger', res.message || 'Failed to add color.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error adding color.');
    } finally {
      setIsAdding(false);
    }
  };

  // Delete custom color
  const handleDeleteColor = async (colorToDelete: SystemColor, e: React.MouseEvent) => {
    e.stopPropagation();
    const isDefault = SYSTEM_COLORS.some(
      (c) => c.name.toLowerCase() === colorToDelete.name.toLowerCase()
    );
    if (isDefault) {
      showToast('warning', 'Default system colors (Black, White, Blue, Red, Green) cannot be deleted.');
      return;
    }

    try {
      const res = await deleteCustomColor(colorToDelete.name);
      if (res.success && res.data) {
        setAllColors(res.data.colors);
        setSelectedColors((prev) =>
          prev.filter((c) => c.toLowerCase() !== colorToDelete.name.toLowerCase())
        );
        showToast('info', `Color "${colorToDelete.name}" removed from system.`);
      } else {
        showToast('danger', res.message || 'Could not delete color.');
      }
    } catch (err: any) {
      showToast('danger', 'Error deleting color.');
    }
  };

  // Save colors to product
  const handleSaveProductColors = async () => {
    if (!product) return;

    setIsSaving(true);
    try {
      const res = await updateProduct({
        id: product.id,
        colors: selectedColors,
      });

      if (res.success) {
        setProduct((prev) => (prev ? { ...prev, colors: selectedColors } : null));
        showToast(
          'success',
          `Successfully saved ${selectedColors.length} colors under "${product.title}"!`,
          'Colors Saved'
        );
      } else {
        showToast('danger', res.message || 'Failed to save colors to product.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered colors list for inner table
  const filteredColors = useMemo(() => {
    if (!searchFilter.trim()) return allColors;
    const query = searchFilter.toLowerCase().trim();
    return allColors.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.hex.toLowerCase().includes(query)
    );
  }, [allColors, searchFilter]);

  if (isLoading) {
    return (
      <div className="card border-0 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="card-body p-5 text-center">
          <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
          <span className="text-muted fs-14">Loading product colors...</span>
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
            <span className="text-dark fw-bold">Manage Colors</span>
          </div>

          {/* 2. Top Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span
                  className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                  style={{ width: '38px', height: '38px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                >
                  <iconify-icon icon="solar:palette-bold" class="fs-20 text-primary"></iconify-icon>
                </span>
                <h2
                  className="fw-bold text-dark mb-0"
                  style={{ fontSize: '22px', letterSpacing: '-0.3px', color: '#0f172a' }}
                >
                  Product Colors Configuration
                </h2>
              </div>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Select available color options, add custom colors with Name or Hex Code, and save directly under <strong>{product.title}</strong>.
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
                Back to Product
              </Link>

              <button
                type="button"
                onClick={handleSaveProductColors}
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
                    <span>Save Colors to Product</span>
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
                <span className="d-block fs-11 text-muted fw-medium text-uppercase">Assigned Colors</span>
                <span className="fs-14 fw-bold text-dark">
                  {selectedColors.length} {selectedColors.length === 1 ? 'Color' : 'Colors'} Selected
                </span>
              </div>
              <span
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: selectedColors.length > 0 ? '#f0fdf4' : '#f1f5f9',
                  color: selectedColors.length > 0 ? '#16a34a' : '#64748b',
                  border: `1.5px solid ${selectedColors.length > 0 ? '#86efac' : '#cbd5e1'}`,
                }}
              >
                <iconify-icon icon={selectedColors.length > 0 ? 'solar:check-circle-bold' : 'solar:info-circle-linear'} class="fs-20"></iconify-icon>
              </span>
            </div>
          </div>

          {/* 4. Active Selected Colors Swatches Preview */}
          {selectedColors.length > 0 ? (
            <div className="p-3 mb-4 rounded-3" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fs-12 fw-semibold text-muted text-uppercase">
                  Currently Selected Under This Product ({selectedColors.length})
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
                  title="Deselect all colors for this product"
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-13"></iconify-icon>
                  <span>Clear Selection</span>
                </button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {selectedColors.map((colName) => {
                  const matched = allColors.find((c) => c.name.toLowerCase() === colName.toLowerCase());
                  const hex = matched ? matched.hex : '#475569';
                  const isWhite = hex.toLowerCase() === '#ffffff';

                  return (
                    <span
                      key={colName}
                      className="badge bg-white text-dark border d-inline-flex align-items-center gap-2 py-1.5 px-3"
                      style={{ borderRadius: '8px', fontSize: '13px', borderColor: '#cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: hex,
                          border: isWhite ? '1.5px solid #cbd5e1' : '1px solid rgba(0,0,0,0.15)',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                      <span className="fw-semibold">{colName}</span>
                      <span
                        onClick={() => handleToggleColor(colName)}
                        style={{ cursor: 'pointer', fontSize: '14px', lineHeight: 1, opacity: 0.7 }}
                        title="Deselect color"
                      >
                        &times;
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="alert alert-warning py-2.5 px-3 fs-13 d-flex align-items-center gap-2 mb-4" style={{ borderRadius: '8px' }}>
              <iconify-icon icon="solar:info-circle-bold" class="fs-17"></iconify-icon>
              <span>No colors are currently selected for this product. Select colors from the table below and click <strong>Save Colors to Product</strong>.</span>
            </div>
          )}

          {/* 5. Add New Color Form (By Color Name OR Color Code/Hex - Well Padded & Beautiful) */}
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
              <h6 className="fs-14 fw-bold text-dark mb-0">Add New Color to System (Name or Color Code)</h6>
            </div>
            <p className="text-muted fs-13 mb-3" style={{ maxWidth: '680px' }}>
              Provide a Color Name and select/type its Color Code (Hex). Default system has only Black, White, Blue, Red, Green. Any added colors will be stored and selectable for all products in the dashboard.
            </p>

            <form onSubmit={handleAddNewColor} className="row g-2.5 align-items-end" style={{ maxWidth: '780px' }}>
              {/* Color Name Input */}
              <div className="col-12 col-sm-5">
                <label className="form-label fs-12 fw-semibold text-muted mb-1">Color Name</label>
                <div className="input-group" style={{ height: '42px' }}>
                  <span className="input-group-text bg-white border text-muted px-3" style={{ borderRadius: '8px 0 0 8px', borderColor: '#cbd5e1' }}>
                    <iconify-icon icon="solar:text-field-linear" class="fs-16"></iconify-icon>
                  </span>
                  <input
                    type="text"
                    className="form-control fs-13 border shadow-none"
                    placeholder="e.g. Safety Orange, Neon Green..."
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    style={{ borderColor: '#cbd5e1', borderRadius: '0 8px 8px 0', height: '42px' }}
                  />
                </div>
              </div>

              {/* Color Code / Hex & Color Picker */}
              <div className="col-12 col-sm-4">
                <label className="form-label fs-12 fw-semibold text-muted mb-1">Color Code (Hex)</label>
                <div className="input-group" style={{ height: '42px' }}>
                  {/* Native Color Picker Preview */}
                  <span
                    className="input-group-text bg-white border p-1 d-flex align-items-center justify-content-center"
                    style={{
                      borderRadius: '8px 0 0 8px',
                      borderColor: '#cbd5e1',
                      width: '46px',
                      height: '42px',
                    }}
                  >
                    <input
                      type="color"
                      value={newColorHex.startsWith('#') && newColorHex.length === 7 ? newColorHex : '#2563eb'}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      title="Click to pick a color"
                      style={{
                        width: '28px',
                        height: '28px',
                        padding: 0,
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        background: 'none',
                      }}
                    />
                  </span>
                  <input
                    type="text"
                    className="form-control fs-13 border shadow-none text-uppercase"
                    placeholder="#EA580C"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    style={{ borderColor: '#cbd5e1', borderRadius: '0 8px 8px 0', height: '42px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Add Button */}
              <div className="col-12 col-sm-3">
                <button
                  type="submit"
                  disabled={isAdding || !newColorName.trim()}
                  className="btn btn-dark fs-13 fw-semibold w-100 d-flex align-items-center justify-content-center gap-1.5"
                  style={{ height: '42px', borderRadius: '8px' }}
                >
                  {isAdding ? (
                    <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                  ) : (
                    <>
                      <iconify-icon icon="solar:add-square-bold" class="fs-16"></iconify-icon>
                      <span>Add Color</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================
              6. INNER TABLE VIEW: ALL COLORS (Aligned & Beautiful)
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
                <h6 className="fs-14 fw-bold text-dark mb-0">System &amp; Custom Colors</h6>
                <span className="badge bg-light text-muted border" style={{ fontSize: '11px', borderColor: '#cbd5e1' }}>
                  {filteredColors.length} Total
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Search in colors */}
                <div className="input-group" style={{ width: '220px', height: '34px' }}>
                  <span className="input-group-text bg-white border-0 text-muted px-2 py-0 border" style={{ borderColor: '#cbd5e1', borderRadius: '6px 0 0 6px' }}>
                    <iconify-icon icon="solar:magnifer-linear" class="fs-14"></iconify-icon>
                  </span>
                  <input
                    type="text"
                    className="form-control fs-12 border shadow-none"
                    placeholder="Search color name or hex..."
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
                  title="Clear all selected colors"
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
                        checked={
                          filteredColors.length > 0 &&
                          filteredColors.every((c) =>
                            selectedColors.some((sc) => sc.toLowerCase() === c.name.toLowerCase())
                          )
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAll();
                          } else {
                            setSelectedColors((prev) =>
                              prev.filter(
                                (sc) => !filteredColors.some((c) => c.name.toLowerCase() === sc.toLowerCase())
                              )
                            );
                          }
                        }}
                        title="Toggle all visible colors"
                      />
                    </th>
                    <th style={{ width: '80px', padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Swatch</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Color Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Color Code (Hex)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Assignment Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <iconify-icon icon="solar:inbox-line-linear" class="fs-28 d-block mb-1"></iconify-icon>
                        <span>No colors match &quot;{searchFilter}&quot;. Use the form above to add it.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredColors.map((col) => {
                      const isSelected = selectedColors.some(
                        (c) => c.toLowerCase() === col.name.toLowerCase()
                      );
                      const isDefaultSystem = SYSTEM_COLORS.some(
                        (c) => c.name.toLowerCase() === col.name.toLowerCase()
                      );
                      const isWhite = col.hex.toLowerCase() === '#ffffff';

                      return (
                        <tr
                          key={col.name}
                          onClick={() => handleToggleColor(col.name)}
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
                              onChange={() => handleToggleColor(col.name)}
                            />
                          </td>

                          {/* Swatch circle */}
                          <td style={{ padding: '12px 16px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: col.hex,
                                border: isWhite
                                  ? '1.5px solid #cbd5e1'
                                  : col.border
                                  ? `1.5px solid ${col.border}`
                                  : '1.5px solid rgba(0,0,0,0.15)',
                                boxShadow: isSelected
                                  ? '0 0 0 2px #ffffff, 0 0 0 4.5px #0f172a'
                                  : '0 1px 3px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isSelected && (
                                <span
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    backgroundColor: isWhite ? '#0f172a' : '#ffffff',
                                  }}
                                />
                              )}
                            </div>
                          </td>

                          {/* Color Name */}
                          <td style={{ padding: '12px 16px' }}>
                            <span className="fw-semibold text-dark fs-13">{col.name}</span>
                          </td>

                          {/* Hex Code */}
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              className="badge bg-light text-dark border fw-medium"
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                padding: '4px 8px',
                                borderColor: '#e2e8f0',
                              }}
                            >
                              {col.hex.toUpperCase()}
                            </span>
                          </td>

                          {/* Type */}
                          <td style={{ padding: '12px 16px' }}>
                            {isDefaultSystem ? (
                              <span
                                className="badge bg-secondary-subtle text-secondary border border-secondary-subtle fw-medium"
                                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}
                              >
                                System Default (1 of 5)
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

                          {/* Assignment Status */}
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
                            {!isDefaultSystem ? (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteColor(col, e)}
                                className="btn btn-sm btn-outline-danger p-1 px-2"
                                title="Delete custom color from system"
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
                Total <strong>{allColors.length}</strong> colors available &bull; <strong>{selectedColors.length}</strong> selected for this product
              </span>
              <button
                type="button"
                onClick={handleSaveProductColors}
                disabled={isSaving}
                className="btn btn-sm btn-dark px-3 py-1.5 fs-12 fw-semibold"
                style={{ borderRadius: '6px' }}
              >
                {isSaving ? 'Saving...' : 'Save Colors'}
              </button>
            </div>
          </div>

          {/* 7. Bottom Action Bar (Back to Product Edit and Save Colors Together on Right Side) */}
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
              onClick={handleSaveProductColors}
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
                  <span>Save Colors to Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductColorsPage() {
  return (
    <Suspense
      fallback={
        <div className="card border-0 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
          <div className="card-body p-5 text-center">
            <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
            <span className="text-muted">Loading colors editor...</span>
          </div>
        </div>
      }
    >
      <ProductColorsManager />
    </Suspense>
  );
}
