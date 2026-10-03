'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { fetchProducts, deleteProduct, PRODUCTS_EVENT } from '@/services/productsService';
import { fetchShopSettings } from '@/services/shopSettingsService';
import { ProductItem } from '@/data/categoryProductsData';
import { ShopCategory } from '@/data/defaultShopSettings';
import { useToast } from '@/context/ToastContext';
import { ClientPortal } from '@/components/common/ClientPortal';

export default function AllProductsPage() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'new-arrival' | 'most-searched' | 'special-offers'>('all');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load products & categories
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, shopData] = await Promise.all([
        fetchProducts(),
        fetchShopSettings(),
      ]);
      setProducts(prods);
      if (shopData && Array.isArray(shopData.categories)) {
        setCategories(shopData.categories);
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      showToast('danger', 'Failed to load products list.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setProducts(customEvent.detail);
      } else {
        loadData();
      }
    };

    window.addEventListener(PRODUCTS_EVENT, handleUpdated);
    return () => window.removeEventListener(PRODUCTS_EVENT, handleUpdated);
  }, [loadData]);

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteProduct(deleteTarget.id);
      if (res.success) {
        showToast('success', `Product "${deleteTarget.title}" deleted successfully.`, 'Product Removed');
        setDeleteTarget(null);
        setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      } else {
        showToast('danger', res.message || 'Failed to delete product.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Tab filter
    if (activeTab === 'new-arrival') {
      list = list.filter((p) => p.isNewArrival !== false);
    } else if (activeTab === 'most-searched') {
      list = list.sort((a, b) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0)));
    } else if (activeTab === 'special-offers') {
      list = list.filter((p) => p.isSpecialOffer === true || Boolean(p.discount));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(
        (p) =>
          p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.categoryId === selectedCategory
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.standard?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, activeTab, selectedCategory, searchQuery]);

  // Metrics
  const totalCount = products.length;
  const newArrivalCount = products.filter((p) => p.isNewArrival !== false).length;
  const offerCount = products.filter((p) => p.isSpecialOffer === true || Boolean(p.discount)).length;
  const totalInteractions = products.reduce((acc, p) => acc + (p.clicks || 0) + (p.views || 0), 0);

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
            <span className="text-dark fw-bold">All Products</span>
          </div>

          {/* 2. Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                All Products
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage your safety equipment catalog and special offers. New Arrivals and Most Searched are automatically managed by the system.
              </p>
            </div>

            <div className="d-flex align-items-center gap-3">
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
                  transition: 'all 0.2s ease',
                }}
                onClick={loadData}
                disabled={isLoading}
                title="Refresh product catalog"
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Refresh</span>
              </button>

              <Link
                href="/dashboard/all-products/edit?mode=create"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 22px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                <iconify-icon icon="solar:add-circle-bold" class="fs-17"></iconify-icon>
                <span>+ Add Product</span>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 24px 0' }}></div>

      {/* ========================================================
          2. KPI STATS CARDS
         ======================================================== */}
      <div className="row g-3 mb-4">
        {/* Total Products */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                  Total Catalog
                </span>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <iconify-icon icon="solar:box-minimalistic-bold" class="fs-20"></iconify-icon>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
                  {totalCount}
                </h3>
                <span className="badge fs-11 fw-semibold bg-light text-secondary border" style={{ padding: '3px 8px' }}>
                  Items in Store
                </span>
              </div>
              <span className="text-muted fs-12 d-block mt-1">
                {products.filter((p) => p.isActive !== false).length} Active on storefront
              </span>
            </div>
          </div>
        </div>

        {/* New Arrivals */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                  New Arrivals
                </span>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <iconify-icon icon="solar:stars-minimalistic-bold" class="fs-20"></iconify-icon>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '24px' }}>
                  {newArrivalCount}
                </h3>
                <span className="badge fs-11 fw-semibold bg-success-subtle text-success border border-success-subtle" style={{ padding: '3px 8px' }}>
                  Slider Feed
                </span>
              </div>
              <span className="text-muted fs-12 d-block mt-1">
                Shows 1st on homepage slider
              </span>
            </div>
          </div>
        </div>

        {/* Special Offers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                  Special Offers
                </span>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                >
                  <iconify-icon icon="solar:tag-price-bold" class="fs-20"></iconify-icon>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-warning" style={{ fontSize: '24px' }}>
                  {offerCount}
                </h3>
                <span className="badge fs-11 fw-semibold bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ padding: '3px 8px' }}>
                  Deals Active
                </span>
              </div>
              <span className="text-muted fs-12 d-block mt-1">
                Discounted price & % badge enabled
              </span>
            </div>
          </div>
        </div>

        {/* Most Searched Interactions */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card h-100 border"
            style={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                  Total Engagement
                </span>
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <iconify-icon icon="solar:eye-bold" class="fs-20"></iconify-icon>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-primary" style={{ fontSize: '24px' }}>
                  {totalInteractions.toLocaleString()}
                </h3>
                <span className="badge fs-11 fw-semibold bg-primary-subtle text-primary border border-primary-subtle" style={{ padding: '3px 8px' }}>
                  Clicks & Views
                </span>
              </div>
              <span className="text-muted fs-12 d-block mt-1">
                Ranks "Most Searched Items"
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. MAIN TABLE CARD WITH FILTER CONTROLS
         ======================================================== */}
      <div
        className="card border"
        style={{
          borderRadius: '12px',
          borderColor: '#e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Card Header with Tabs, Search, and Category filter */}
        <div className="p-4 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            {/* Tab Pills */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`btn btn-sm d-flex align-items-center gap-2 fw-medium ${
                  activeTab === 'all' ? 'btn-dark' : 'btn-light border'
                }`}
                style={{ borderRadius: '8px', padding: '0 16px', height: '38px', fontSize: '13px' }}
              >
                <span>All Products</span>
                <span
                  className={`badge rounded-pill ${
                    activeTab === 'all' ? 'bg-white text-dark' : 'bg-secondary text-white'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {totalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new-arrival')}
                className={`btn btn-sm d-flex align-items-center gap-1.5 fw-medium ${
                  activeTab === 'new-arrival' ? 'btn-dark' : 'btn-light border'
                }`}
                style={{ borderRadius: '8px', padding: '0 16px', height: '38px', fontSize: '13px' }}
              >
                <iconify-icon icon="solar:stars-minimalistic-bold" class="fs-15 text-warning"></iconify-icon>
                <span>New Arrivals</span>
                <span
                  className={`badge rounded-pill ${
                    activeTab === 'new-arrival' ? 'bg-white text-dark' : 'bg-secondary text-white'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {newArrivalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('most-searched')}
                className={`btn btn-sm d-flex align-items-center gap-1.5 fw-medium ${
                  activeTab === 'most-searched' ? 'btn-dark' : 'btn-light border'
                }`}
                style={{ borderRadius: '8px', padding: '0 16px', height: '38px', fontSize: '13px' }}
              >
                <iconify-icon icon="solar:flame-bold" class="fs-15 text-danger"></iconify-icon>
                <span>Most Searched</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('special-offers')}
                className={`btn btn-sm d-flex align-items-center gap-1.5 fw-medium ${
                  activeTab === 'special-offers' ? 'btn-dark' : 'btn-light border'
                }`}
                style={{ borderRadius: '8px', padding: '0 16px', height: '38px', fontSize: '13px' }}
              >
                <iconify-icon icon="solar:tag-price-bold" class="fs-15 text-warning"></iconify-icon>
                <span>Special Offers</span>
                <span
                  className={`badge rounded-pill ${
                    activeTab === 'special-offers' ? 'bg-white text-dark' : 'bg-secondary text-white'
                  }`}
                  style={{ fontSize: '10px' }}
                >
                  {offerCount}
                </span>
              </button>
            </div>

            {/* Right: Search and Category Filter Toolbar (Aligned with matching 38px height) */}
            <div className="d-flex align-items-center gap-2.5 flex-nowrap ms-auto ms-lg-0">
              {/* Category dropdown */}
              <div style={{ minWidth: '190px' }}>
                <select
                  className="form-select form-select-sm fw-medium text-dark shadow-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    borderColor: selectedCategory !== 'all' ? '#0f172a' : '#cbd5e1',
                    backgroundColor: selectedCategory !== 'all' ? '#f8fafc' : '#ffffff',
                    fontSize: '13px',
                    paddingLeft: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Categories ({totalCount})</option>
                  {categories.map((c) => {
                    const count = products.filter(
                      (p) => p.category?.toLowerCase() === c.name.toLowerCase() || p.categoryId === c.id
                    ).length;
                    return (
                      <option key={c.id} value={c.name}>
                        {c.name} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Search input with input-group for vertical alignment */}
              <div style={{ minWidth: '220px', width: '250px' }}>
                <div
                  className="input-group"
                  style={{
                    height: '38px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span
                    className="input-group-text bg-white border-0 text-muted px-2.5 d-flex align-items-center"
                    style={{ fontSize: '15px' }}
                  >
                    <iconify-icon icon="solar:magnifer-linear"></iconify-icon>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 fs-13 ps-1 pe-2 shadow-none"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ height: '36px', backgroundColor: 'transparent' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="btn btn-link p-0 pe-2.5 text-muted d-flex align-items-center text-decoration-none"
                      style={{ border: 'none', background: 'transparent' }}
                      title="Clear search"
                    >
                      <iconify-icon icon="solar:close-circle-bold" class="fs-16"></iconify-icon>
                    </button>
                  )}
                </div>
              </div>

              {/* Reset filter button if active */}
              {(selectedCategory !== 'all' || searchQuery.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="btn btn-sm btn-light border text-danger d-flex align-items-center gap-1 flex-shrink-0"
                  style={{ height: '38px', borderRadius: '8px', padding: '0 12px', fontSize: '12px', fontWeight: 500 }}
                  title="Reset category & search"
                >
                  <iconify-icon icon="solar:restart-linear" class="fs-14"></iconify-icon>
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <tr>
                <th style={{ width: '48px', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>#</th>
                <th style={{ minWidth: '260px', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Product</th>
                <th style={{ minWidth: '180px', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Safety Standard</th>
                <th style={{ minWidth: '160px', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Pricing &amp; Offer</th>
                <th style={{ minWidth: '150px', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Collections</th>
                <th style={{ width: '120px', padding: '12px 16px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
                    <span className="text-muted">Loading products...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="d-flex flex-column align-items-center">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                        style={{ width: '48px', height: '48px', backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                      >
                        <iconify-icon icon="solar:box-minimalistic-broken" class="fs-24"></iconify-icon>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">No products found</h6>
                      <p className="text-muted fs-12 mb-3">
                        {searchQuery ? `No results match "${searchQuery}"` : 'No products in this section yet.'}
                      </p>
                      <Link
                        href="/dashboard/all-products/edit?mode=create"
                        className="btn btn-sm btn-dark"
                        style={{ borderRadius: '6px' }}
                      >
                        + Add First Product
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, idx) => {
                  const isOffer = item.isSpecialOffer === true || Boolean(item.discount);
                  const isNew = item.isNewArrival !== false;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Index */}
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 500 }}>
                        {idx + 1}
                      </td>

                      {/* Product Thumbnail & Details */}
                      <td style={{ padding: '14px 16px' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-3 border overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center"
                            style={{
                              width: '52px',
                              height: '52px',
                              backgroundColor: '#f8fafc',
                              borderColor: '#e2e8f0',
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                              }}
                            />
                          </div>
                          <div>
                            <div className="fw-semibold text-dark mb-0.5 text-truncate" style={{ maxWidth: '320px' }}>
                              {item.title}
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span
                                className="badge bg-light text-secondary border fs-11"
                                style={{ padding: '2px 6px', borderRadius: '4px' }}
                              >
                                {item.category}
                              </span>
                              {item.standard && (
                                <span className="text-muted fs-11" style={{ maxWidth: '180px' }}>
                                  {item.standard}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Safety Standard */}
                      <td style={{ padding: '14px 16px' }}>
                        {item.standard ? (
                          <span
                            className="badge d-inline-flex align-items-center gap-1.5 fw-semibold"
                            style={{
                              backgroundColor: '#f0fdf4',
                              color: '#166534',
                              border: '1px solid #bbf7d0',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              letterSpacing: '0.2px',
                            }}
                          >
                            <iconify-icon icon="solar:shield-check-bold" class="fs-13 text-success"></iconify-icon>
                            <span>{item.standard}</span>
                          </span>
                        ) : (
                          <span className="text-muted fs-12">&mdash;</span>
                        )}
                      </td>

                      {/* Pricing & Offer */}
                      <td style={{ padding: '14px 16px' }}>
                        <div className="d-flex flex-column">
                          <div className="d-flex align-items-baseline gap-1.5">
                            <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                              {item.price}
                            </span>
                            {item.oldPrice && (
                              <span className="text-muted text-decoration-line-through fs-11">
                                {item.oldPrice}
                              </span>
                            )}
                          </div>
                          {isOffer && (
                            <span
                              className="badge bg-danger-subtle text-danger border border-danger-subtle fs-10 fw-bold mt-1 align-self-start"
                              style={{ padding: '2px 6px', borderRadius: '4px' }}
                            >
                              {item.discount || `${item.offerPercent || 15}% OFF`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Collections Flags */}
                      <td style={{ padding: '14px 16px' }}>
                        <div className="d-flex flex-column gap-1">
                          {isNew && (
                            <span
                              className="badge bg-success-subtle text-success border border-success-subtle fs-11 fw-semibold align-self-start"
                              style={{ padding: '3px 7px', borderRadius: '4px' }}
                            >
                              New Arrival (1st)
                            </span>
                          )}
                          {isOffer && (
                            <span
                              className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fs-11 fw-semibold align-self-start"
                              style={{ padding: '3px 7px', borderRadius: '4px' }}
                            >
                              Special Offer
                            </span>
                          )}
                          {!isNew && !isOffer && (
                            <span className="text-muted fs-11">Standard Catalog</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div className="d-flex align-items-center justify-content-end gap-1.5">
                          <Link
                            href={`/dashboard/all-products/sizes?id=${item.id}`}
                            className="btn btn-sm btn-icon"
                            title="Manage Sizes"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <iconify-icon icon="solar:ruler-linear" class="fs-15 text-primary"></iconify-icon>
                          </Link>

                          <Link
                            href={`/dashboard/all-products/colors?id=${item.id}`}
                            className="btn btn-sm btn-icon"
                            title="Manage Colors"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <iconify-icon icon="solar:palette-linear" class="fs-15 text-success"></iconify-icon>
                          </Link>

                          <Link
                            href={`/dashboard/all-products/edit?id=${item.id}`}
                            className="btn btn-sm btn-icon"
                            title="Edit Product"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <iconify-icon icon="solar:pen-linear" class="fs-15"></iconify-icon>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="btn btn-sm btn-icon text-danger"
                            title="Delete Product"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid #fee2e2',
                              backgroundColor: '#fef2f2',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-15"></iconify-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div
          className="p-3.5 px-4 border-top d-flex align-items-center justify-content-between text-muted fs-12"
          style={{ borderColor: '#f1f5f9', backgroundColor: '#fcfdfe' }}
        >
          <span>
            Showing <strong>{filteredProducts.length}</strong> of <strong>{totalCount}</strong> products
          </span>
          <span>Automatic live sync with storefront</span>
        </div>
      </div>

        </div>
      </div>

      {/* ========================================================
          4. DELETE CONFIRMATION MODAL (Using ClientPortal)
         ======================================================== */}
      {deleteTarget && (
        <ClientPortal>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '1.25rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setDeleteTarget(null);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}>
              <div
                className="modal-content border-0 shadow-lg"
                style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#ffffff' }}
              >
                <div className="modal-header border-0 pb-0 pt-4 px-4">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-danger"
                    style={{ width: '48px', height: '48px', backgroundColor: '#fee2e2' }}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-24"></iconify-icon>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    disabled={isDeleting}
                    onClick={() => setDeleteTarget(null)}
                  ></button>
                </div>

                <div className="modal-body px-4 pt-3 pb-4">
                  <h5 className="fw-bold text-dark mb-1">Delete Product?</h5>
                  <p className="text-muted fs-13 mb-3">
                    Are you sure you want to remove <strong>"{deleteTarget.title}"</strong>? This will remove it from the catalog, homepage sliders, and view all pages.
                  </p>

                  <div
                    className="p-2.5 rounded-3 border d-flex align-items-center gap-3 mb-2"
                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    <img
                      src={deleteTarget.image}
                      alt={deleteTarget.title}
                      style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                    />
                    <div className="overflow-hidden">
                      <div className="fw-semibold text-dark fs-13 text-truncate">{deleteTarget.title}</div>
                      <div className="text-muted fs-11">{deleteTarget.price} · {deleteTarget.category}</div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 px-4 pb-4 pt-0 gap-2">
                  <button
                    type="button"
                    className="btn btn-light border px-3 flex-grow-1"
                    disabled={isDeleting}
                    onClick={() => setDeleteTarget(null)}
                    style={{ borderRadius: '8px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 flex-grow-1"
                    disabled={isDeleting}
                    onClick={handleDeleteConfirm}
                    style={{ borderRadius: '8px', fontSize: '13px' }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
}
