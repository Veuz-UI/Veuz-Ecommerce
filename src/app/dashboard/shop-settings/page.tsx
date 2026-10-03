'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { fetchShopSettings, saveShopSettings, SHOP_SETTINGS_EVENT } from '@/services/shopSettingsService';
import { ShopCategory, MainMenuItem } from '@/data/defaultShopSettings';
import { useToast } from '@/context/ToastContext';

export default function ShopSettingsPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'mainMenu'>('categories');
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [mainMenu, setMainMenu] = useState<MainMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'menu'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchShopSettings();
      setCategories(data.categories || []);
      setMainMenu(data.mainMenu || []);
    } catch (err: any) {
      console.error('Error loading shop settings:', err);
      showToast('danger', 'Failed to load shop settings.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.categories) setCategories(customEvent.detail.categories);
        if (customEvent.detail.mainMenu) setMainMenu(customEvent.detail.mainMenu);
      }
    };

    window.addEventListener(SHOP_SETTINGS_EVENT, handleUpdated);
    return () => window.removeEventListener(SHOP_SETTINGS_EVENT, handleUpdated);
  }, [loadData]);

  // Toggle Category Active Status (Always Green)
  const handleToggleCategoryStatus = async (cat: ShopCategory) => {
    const updated = categories.map((c) =>
      c.id === cat.id ? { ...c, isActive: !c.isActive } : c
    );
    setCategories(updated);

    try {
      const res = await saveShopSettings({
        categories: updated,
        mainMenu,
      });
      if (res.success) {
        showToast('success', `Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Inactive'}. Storefront header updated.`);
      } else {
        showToast('danger', res.message || 'Failed to update category status.');
        loadData();
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error updating status.');
      loadData();
    }
  };

  // Toggle Main Menu Active Status (Always Green)
  const handleToggleMenuStatus = async (item: MainMenuItem) => {
    const updated = mainMenu.map((m) =>
      m.id === item.id ? { ...m, isActive: !m.isActive } : m
    );
    setMainMenu(updated);

    try {
      const res = await saveShopSettings({
        categories,
        mainMenu: updated,
      });
      if (res.success) {
        showToast('success', `Menu "${item.name}" is now ${!item.isActive ? 'Active' : 'Inactive'}. Storefront header updated.`);
      } else {
        showToast('danger', res.message || 'Failed to update menu status.');
        loadData();
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error updating status.');
      loadData();
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      let updatedCategories = [...categories];
      let updatedMenu = [...mainMenu];

      if (deleteTarget.type === 'category') {
        updatedCategories = updatedCategories.filter((c) => c.id !== deleteTarget.id);
        setCategories(updatedCategories);
      } else {
        updatedMenu = updatedMenu.filter((m) => m.id !== deleteTarget.id);
        setMainMenu(updatedMenu);
      }

      const res = await saveShopSettings({
        categories: updatedCategories,
        mainMenu: updatedMenu,
      });

      if (res.success) {
        showToast('danger', `Deleted "${deleteTarget.name}" successfully! Header navigation updated.`, 'Deleted Successfully');
        setDeleteTarget(null);
      } else {
        showToast('danger', res.message || 'Failed to delete item.');
        loadData();
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error deleting item.');
      loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.link.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  // Filtered Main Menu
  const filteredMainMenu = useMemo(() => {
    if (!searchQuery.trim()) return mainMenu;
    const q = searchQuery.toLowerCase().trim();
    return mainMenu.filter((m) => m.name.toLowerCase().includes(q) || m.link.toLowerCase().includes(q));
  }, [mainMenu, searchQuery]);

  return (
    <>
      {/* ========================================================
          MAIN BACKGROUND WHITE CARD (Crisp White & Classic Look)
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
          
          {/* 1. Header & Actions Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '24px', gap: '10px' }}>
                <Link href="/dashboard" className="text-muted text-decoration-none">
                  Dashboard
                </Link>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
                <span className="text-dark fw-bold">Shop Settings</span>
              </div>
              <h2 className="fw-bold text-dark" style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}>
                Storefront Navigation &amp; Categories
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage header navigation (max 6 items), mega-menu dropdowns, promo banner uploads, and category catalog.
              </p>
            </div>

            {/* Top Action Buttons: Refresh (White Classic) & Main Btn (Always Black) */}
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
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Refresh</span>
              </button>

              {activeTab === 'categories' ? (
                <Link
                  href="/dashboard/shop-settings/category/new"
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
                  <span>+ Add Category</span>
                </Link>
              ) : (
                <Link
                  href={mainMenu.length >= 6 ? '#' : '/dashboard/shop-settings/menu/new'}
                  className={`btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white ${
                    mainMenu.length >= 6 ? 'disabled opacity-50' : ''
                  }`}
                  style={{
                    borderRadius: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  title={mainMenu.length >= 6 ? 'Maximum 6 menus reached' : 'Add new menu'}
                >
                  <iconify-icon icon="solar:add-circle-bold" class="fs-17"></iconify-icon>
                  <span>+ Add Main Menu ({mainMenu.length}/6)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 22px 0' }}></div>

          {/* 2. Top Metric KPI Summary Cards */}
          <div className="row g-3 mb-4">
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
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Shop Categories
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <iconify-icon icon="solar:folder-with-files-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>{categories.length}</h3>
                    <span
                      className="badge fs-11 fw-semibold d-inline-flex align-items-center gap-1.5"
                      style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 8px' }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                      {categories.filter((c) => c.isActive !== false).length} Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

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
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Main Menu (Max 6)
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <iconify-icon icon="solar:menu-dots-square-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
                      {mainMenu.length} <span className="fs-14 text-muted fw-normal">/ 6</span>
                    </h3>
                    <span
                      className={`badge fs-11 fw-semibold ${
                        mainMenu.length >= 6 ? 'bg-danger text-white' : 'bg-light text-secondary border'
                      }`}
                      style={{ padding: '4px 8px', borderRadius: '4px' }}
                    >
                      {6 - mainMenu.length > 0 ? `${6 - mainMenu.length} slots free` : 'Max limit reached'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

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
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Mega Menus
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <iconify-icon icon="solar:layers-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
                      {mainMenu.filter((m) => m.hasMegaMenu).length}
                    </h3>
                    <span className="text-muted fs-12">With 3-Col &amp; Banner</span>
                  </div>
                </div>
              </div>
            </div>

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
                <div className="card-body p-3.5">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="text-muted fs-12 fw-bold text-uppercase" style={{ letterSpacing: '0.6px', color: '#64748b' }}>
                      Storefront Sync
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <iconify-icon icon="solar:shield-check-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '20px' }}>
                      Live Connected
                    </h3>
                  </div>
                  <span className="text-muted fs-12">Instant cross-tab sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Navigation Tabs & Search Toolbar (Black & White Sleek Tabs) */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 border-bottom pb-3 mb-4">
            <div className="d-flex align-items-center gap-2.5">
              <button
                type="button"
                className={`btn d-flex align-items-center gap-2 fs-14 fw-semibold ${
                  activeTab === 'categories'
                    ? 'text-white shadow-sm'
                    : 'text-secondary border'
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'categories' ? '#0f172a' : '#ffffff',
                  borderColor: activeTab === 'categories' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'categories' ? '#ffffff' : '#475569',
                }}
                onClick={() => setActiveTab('categories')}
              >
                <iconify-icon icon="solar:widget-2-bold" class="fs-17"></iconify-icon>
                <span>Shop Categories</span>
                <span
                  className={`badge ${
                    activeTab === 'categories' ? 'bg-white text-dark' : 'bg-light text-secondary border'
                  } ms-1 fs-12`}
                  style={{ borderRadius: '6px', padding: '3px 8px' }}
                >
                  {categories.length}
                </span>
              </button>

              <button
                type="button"
                className={`btn d-flex align-items-center gap-2 fs-14 fw-semibold ${
                  activeTab === 'mainMenu'
                    ? 'text-white shadow-sm'
                    : 'text-secondary border'
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'mainMenu' ? '#0f172a' : '#ffffff',
                  borderColor: activeTab === 'mainMenu' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'mainMenu' ? '#ffffff' : '#475569',
                }}
                onClick={() => setActiveTab('mainMenu')}
              >
                <iconify-icon icon="solar:hamburger-menu-bold" class="fs-17"></iconify-icon>
                <span>Main Menu (Max 6 Allowed)</span>
                <span
                  className={`badge ${
                    mainMenu.length >= 6
                      ? 'bg-danger text-white'
                      : activeTab === 'mainMenu'
                      ? 'bg-white text-dark'
                      : 'bg-light text-secondary border'
                  } ms-1 fs-12`}
                  style={{ borderRadius: '6px', padding: '3px 8px' }}
                >
                  {mainMenu.length} / 6
                </span>
              </button>
            </div>

            <div className="d-flex align-items-center gap-2" style={{ minWidth: '280px' }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted px-3" style={{ borderColor: '#cbd5e1' }}>
                  <iconify-icon icon="solar:magnifer-linear" class="fs-16"></iconify-icon>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 fs-13 py-2"
                  placeholder={`Search ${activeTab === 'categories' ? 'categories' : 'menu items'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderColor: '#cbd5e1' }}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <iconify-icon icon="solar:close-circle-bold" class="fs-16"></iconify-icon>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Tab 1 Content: Shop Categories Table */}
          {activeTab === 'categories' && (
            <div className="table-responsive rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
              <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '60px', letterSpacing: '0.6px' }}>#</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Category Name</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Storefront Target URL</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Sub-Items (Sub 2)</th>
                    <th className="py-3 px-4 text-center text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Status</th>
                    <th className="py-3 px-4 text-end text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5" style={{ height: '320px', verticalAlign: 'middle' }}>
                        <div className="spinner-border text-dark" role="status"></div>
                        <p className="mt-2 fs-14 text-muted">Loading categories...</p>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <iconify-icon icon="solar:folder-error-bold" class="fs-40 text-muted mb-2"></iconify-icon>
                        <h5 className="fs-15 text-dark fw-bold mb-1">No categories found</h5>
                        <p className="fs-13 text-muted mb-3">Add shop categories to populate the &quot;Shop by Categories&quot; dropdown.</p>
                        <Link
                          href="/dashboard/shop-settings/category/new"
                          className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                          style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                        >
                          + Add Category
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat, idx) => {
                      const countSub = cat.subItems ? cat.subItems.length : 0;
                      return (
                        <tr
                          key={cat.id || idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td className="py-3.5 px-4 text-muted fs-13 fw-semibold">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="d-flex align-items-center gap-3">
                              {cat.image ? (
                                <div
                                  className="rounded-3 border overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center"
                                  style={{ width: '42px', height: '42px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                >
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <span
                                  className="rounded-3 bg-light border d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                                  style={{ width: '42px', height: '42px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                >
                                  <iconify-icon icon="solar:folder-bold" class="fs-20"></iconify-icon>
                                </span>
                              )}
                              <div>
                                <span className="fs-14 fw-bold text-dark d-block mb-0.5">{cat.name}</span>
                                <span className="text-muted fs-12">Header &amp; Browse Item</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className="badge bg-light text-dark border font-monospace fs-12"
                              style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                            >
                              {cat.link}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {cat.hasSubItems !== true ? (
                                <span
                                  className="badge fs-11 fw-semibold d-inline-flex align-items-center gap-1"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#fffbeb',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                  }}
                                  title="Sub-items hidden: Category acts as standalone direct link without flyout"
                                >
                                  <iconify-icon icon="solar:eye-closed-bold" class="fs-13"></iconify-icon>
                                  <span>Hidden (Standalone Link)</span>
                                </span>
                              ) : (
                                <>
                                  <span
                                    className="badge fs-12 fw-semibold"
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      backgroundColor: '#f1f5f9',
                                      color: '#334155',
                                      border: '1px solid #cbd5e1',
                                    }}
                                  >
                                    {countSub} / 5 items
                                  </span>
                                  {cat.subItems?.slice(0, 3).map((sub, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="badge bg-light text-secondary border fs-11"
                                      style={{ padding: '4px 8px', borderRadius: '5px' }}
                                    >
                                      {sub.name}
                                    </span>
                                  ))}
                                  {countSub > 3 && (
                                    <span className="badge bg-light text-muted border fs-11" style={{ padding: '4px 8px', borderRadius: '5px' }}>
                                      +{countSub - 3} more
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          {/* Status: Always Green */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="form-check form-switch d-inline-block m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={cat.isActive !== false}
                                onChange={() => handleToggleCategoryStatus(cat)}
                                style={{
                                  cursor: 'pointer',
                                  width: '2.6em',
                                  height: '1.3em',
                                  backgroundColor: cat.isActive !== false ? '#16a34a' : '#cbd5e1',
                                  borderColor: cat.isActive !== false ? '#16a34a' : '#cbd5e1',
                                }}
                                title="Toggle Active / Inactive"
                              />
                            </div>
                          </td>
                          {/* Actions: Edit always yellow background icon-only, Delete light red icon-only */}
                          <td className="py-3.5 px-4 text-end">
                            <div className="d-flex align-items-center justify-content-end gap-2.5">
                              {/* Edit: Always Yellow Background, No Text, Just Icon */}
                              <Link
                                href={`/dashboard/shop-settings/category/${cat.id}`}
                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                style={{
                                  borderRadius: '8px',
                                  width: '36px',
                                  height: '36px',
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Edit Category & Sub 2"
                              >
                                <iconify-icon icon="solar:pen-new-square-linear" class="fs-18"></iconify-icon>
                              </Link>

                              {/* Delete: Light Red Background, Icon Only */}
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center text-danger"
                                style={{
                                  borderRadius: '8px',
                                  width: '36px',
                                  height: '36px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  transition: 'all 0.15s ease',
                                }}
                                onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
                                title="Delete Category"
                              >
                                <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-18"></iconify-icon>
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
          )}

          {/* 5. Tab 2 Content: Main Menu Table */}
          {activeTab === 'mainMenu' && (
            <div>
              {/* Max 6 Notice Banner */}
              <div
                className={`p-3 mb-3.5 rounded-3 d-flex align-items-center justify-content-between ${
                  mainMenu.length >= 6
                    ? 'bg-danger-subtle text-danger border border-danger-subtle'
                    : 'bg-light text-muted border'
                }`}
                style={{ borderColor: '#e2e8f0' }}
              >
                <div className="d-flex align-items-center gap-2.5 fs-13 fw-medium">
                  <iconify-icon icon="solar:info-circle-bold" class="fs-18 flex-shrink-0"></iconify-icon>
                  <span>
                    Storefront header supports a maximum of <strong>6 main navigation menus</strong> for optimal layout and alignment.
                  </span>
                </div>
                <span
                  className={`badge ${mainMenu.length >= 6 ? 'bg-danger text-white' : 'bg-dark text-white'} fs-12 fw-bold`}
                  style={{ padding: '6px 12px', borderRadius: '6px' }}
                >
                  {mainMenu.length} / 6 Used
                </span>
              </div>

              <div className="table-responsive rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '60px', letterSpacing: '0.6px' }}>#</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Menu Title</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Target URL</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Type &amp; Columns</th>
                      <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Promo Banner</th>
                      <th className="py-3 px-4 text-center text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Status</th>
                      <th className="py-3 px-4 text-end text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5" style={{ height: '320px', verticalAlign: 'middle' }}>
                          <div className="spinner-border text-dark" role="status"></div>
                          <p className="mt-2 fs-14 text-muted">Loading menus...</p>
                        </td>
                      </tr>
                    ) : filteredMainMenu.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5">
                          <iconify-icon icon="solar:menu-dots-square-bold" class="fs-40 text-muted mb-2"></iconify-icon>
                          <h5 className="fs-15 text-dark fw-bold mb-1">No main menu items</h5>
                          <p className="fs-13 text-muted mb-3">Add main menus with mega-dropdown columns and banner images.</p>
                          <Link
                            href="/dashboard/shop-settings/menu/new"
                            className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                            style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                          >
                            + Add Menu Item
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      filteredMainMenu.map((item, idx) => {
                        const colCount = item.columns ? item.columns.length : 0;
                        const hasBanner = item.banner && item.banner.enabled;

                        return (
                          <tr
                            key={item.id || idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <td className="py-3.5 px-4 text-muted fs-13 fw-semibold">{idx + 1}</td>
                            <td className="py-3.5 px-4">
                              <div className="d-flex align-items-center gap-3">
                                <span
                                  className="rounded-3 bg-light border d-flex align-items-center justify-content-center text-dark"
                                  style={{ width: '40px', height: '40px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                >
                                  <iconify-icon icon="solar:link-bold" class="fs-20"></iconify-icon>
                                </span>
                                <div>
                                  <div className="d-flex align-items-center gap-2 mb-0.5">
                                    <span className="fs-14 fw-bold text-dark">{item.name}</span>
                                    {item.badge && (
                                      <span className="badge bg-danger fs-11 fw-bold" style={{ padding: '3px 8px', borderRadius: '5px' }}>
                                        {item.badge}
                                      </span>
                                    )}
                                    {item.isHotDeal && (
                                      <span className="badge bg-warning text-dark fs-11 fw-bold" style={{ padding: '3px 8px', borderRadius: '5px' }}>
                                        HOT DEAL
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-muted fs-12">Header Main Nav Link</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className="badge bg-light text-dark border font-monospace fs-12"
                                style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                              >
                                {item.link}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {item.hasMegaMenu ? (
                                <span
                                  className="badge fs-12 fw-semibold"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                  }}
                                >
                                  Mega Menu ({colCount} / 3 Cols)
                                </span>
                              ) : (
                                <span
                                  className="badge bg-light text-secondary border fs-12"
                                  style={{ padding: '5px 10px', borderRadius: '6px' }}
                                >
                                  Direct Link Only
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {hasBanner ? (
                                <div className="d-flex align-items-center gap-2">
                                  <img
                                    src={item.banner?.image || '/assets/imgs/banner/banner-menu.png'}
                                    alt="Banner"
                                    style={{ width: '34px', height: '34px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                  />
                                  <span
                                    className="badge fs-11 fw-semibold"
                                    style={{ padding: '4px 8px', borderRadius: '5px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                                  >
                                    Custom Banner
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted fs-12">No Banner</span>
                              )}
                            </td>
                            {/* Status: Always Green */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="form-check form-switch d-inline-block m-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={item.isActive !== false}
                                  onChange={() => handleToggleMenuStatus(item)}
                                  style={{
                                    cursor: 'pointer',
                                    width: '2.6em',
                                    height: '1.3em',
                                    backgroundColor: item.isActive !== false ? '#16a34a' : '#cbd5e1',
                                    borderColor: item.isActive !== false ? '#16a34a' : '#cbd5e1',
                                  }}
                                  title="Toggle Active / Inactive"
                                />
                              </div>
                            </td>
                            {/* Actions: Edit always yellow background icon-only, Delete light red icon-only */}
                            <td className="py-3.5 px-4 text-end">
                              <div className="d-flex align-items-center justify-content-end gap-2.5">
                                {/* Edit: Always Yellow Background, No Text, Just Icon */}
                                <Link
                                  href={`/dashboard/shop-settings/menu/${item.id}`}
                                  className="btn btn-sm d-flex align-items-center justify-content-center"
                                  style={{
                                    borderRadius: '8px',
                                    width: '36px',
                                    height: '36px',
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Configure Sub Menu & Image"
                                >
                                  <iconify-icon icon="solar:pen-new-square-linear" class="fs-18"></iconify-icon>
                                </Link>

                                {/* Delete: Light Red Background, Icon Only */}
                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center justify-content-center text-danger"
                                  style={{
                                    borderRadius: '8px',
                                    width: '36px',
                                    height: '36px',
                                    backgroundColor: '#fee2e2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onClick={() => setDeleteTarget({ type: 'menu', id: item.id, name: item.name })}
                                  title="Delete Menu"
                                >
                                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-18"></iconify-icon>
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
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
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
                  style={{ width: '60px', height: '60px' }}
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-30"></iconify-icon>
                </div>
                <h4 className="fw-bold text-dark mb-1.5" style={{ fontSize: '18px' }}>
                  Delete {deleteTarget.type === 'category' ? 'Category' : 'Main Menu'}?
                </h4>
                <p className="text-muted fs-14 mb-4">
                  Are you sure you want to remove &quot;{deleteTarget.name}&quot;? This item will be immediately removed from the header navigation.
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-4 py-2 fs-14 fw-semibold text-secondary"
                    onClick={() => setDeleteTarget(null)}
                    disabled={isDeleting}
                    style={{ borderRadius: '8px', minWidth: '110px' }}
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger px-4 py-2 fs-14 fw-semibold d-flex align-items-center gap-2"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    style={{ borderRadius: '8px', minWidth: '140px' }}
                  >
                    {isDeleting && <div className="spinner-border spinner-border-sm" role="status"></div>}
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
