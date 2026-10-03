'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchBannerSettings, saveBannerSettings, BANNER_SETTINGS_EVENT } from '@/services/bannerSettingsService';
import { MainBannerItem, PromoBannerItem, BannerSettingsData } from '@/data/defaultBannerSettings';
import { useToast } from '@/context/ToastContext';
import { ClientPortal } from '@/components/common/ClientPortal';

export default function BannerSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'main' | 'promo'>('main');
  const [bannerData, setBannerData] = useState<BannerSettingsData>({
    mainBanners: [],
    promoBanners: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'main' | 'promo';
    id: string;
    title: string;
    image: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBannerSettings();
      setBannerData({
        mainBanners: data.mainBanners || [],
        promoBanners: data.promoBanners || [],
      });
    } catch (err: any) {
      console.error('Error loading banner settings:', err);
      showToast('danger', 'Failed to load banner settings.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setBannerData({
          mainBanners: customEvent.detail.mainBanners || [],
          promoBanners: customEvent.detail.promoBanners || [],
        });
      }
    };

    window.addEventListener(BANNER_SETTINGS_EVENT, handleUpdated);
    return () => window.removeEventListener(BANNER_SETTINGS_EVENT, handleUpdated);
  }, [loadData]);

  // Toggle Hide / Show (Status)
  const handleToggleStatus = async (type: 'main' | 'promo', item: MainBannerItem | PromoBannerItem) => {
    const isNowActive = !item.isActive;
    let updatedData: BannerSettingsData;

    if (type === 'main') {
      const updatedList = bannerData.mainBanners.map((b) =>
        b.id === item.id ? { ...b, isActive: isNowActive } : b
      );
      updatedData = { ...bannerData, mainBanners: updatedList };
    } else {
      const updatedList = bannerData.promoBanners.map((b) =>
        b.id === item.id ? { ...b, isActive: isNowActive } : b
      );
      updatedData = { ...bannerData, promoBanners: updatedList };
    }

    setBannerData(updatedData);

    try {
      const res = await saveBannerSettings(updatedData);
      if (res.success) {
        showToast(
          'success',
          `Banner "${item.title.replace(/\n/g, ' ')}" is now ${isNowActive ? 'Active (Visible)' : 'Hidden'}. Storefront updated.`,
          isNowActive ? 'Banner Activated' : 'Banner Hidden'
        );
      } else {
        showToast('danger', res.message || 'Failed to update banner status.');
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
      let updatedData: BannerSettingsData;

      if (deleteTarget.type === 'main') {
        const updatedList = bannerData.mainBanners.filter((b) => b.id !== deleteTarget.id);
        updatedData = { ...bannerData, mainBanners: updatedList };
      } else {
        const updatedList = bannerData.promoBanners.filter((b) => b.id !== deleteTarget.id);
        updatedData = { ...bannerData, promoBanners: updatedList };
      }

      const res = await saveBannerSettings(updatedData);
      if (res.success) {
        setBannerData(updatedData);
        showToast(
          'danger',
          `Banner "${deleteTarget.title.replace(/\n/g, ' ')}" removed successfully. Storefront updated.`,
          'Deleted Successfully'
        );
        setDeleteTarget(null);
      } else {
        showToast('danger', res.message || 'Failed to delete banner.');
        loadData();
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error deleting banner.');
      loadData();
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Main Banners
  const filteredMainBanners = useMemo(() => {
    const list = [...bannerData.mainBanners].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.buttonText && b.buttonText.toLowerCase().includes(q)) ||
        (b.link && b.link.toLowerCase().includes(q))
    );
  }, [bannerData.mainBanners, searchQuery]);

  // Filtered Promo Banners
  const filteredPromoBanners = useMemo(() => {
    const list = [...bannerData.promoBanners].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
        (b.price && b.price.toLowerCase().includes(q)) ||
        (b.buttonText && b.buttonText.toLowerCase().includes(q)) ||
        (b.link && b.link.toLowerCase().includes(q))
    );
  }, [bannerData.promoBanners, searchQuery]);

  const mainCount = bannerData.mainBanners.length;
  const promoCount = bannerData.promoBanners.length;
  const isMainLimitReached = mainCount >= 12;
  const isPromoLimitReached = promoCount >= 12;

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
            <span className="text-dark fw-bold">Banner Settings</span>
          </div>

          {/* 2. Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                Storefront Banner Settings
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage main promotional hero slides (left) and special offer banners (right) with real-time homepage synchronization.
              </p>
            </div>

            {/* Top Action Buttons: Refresh (White Classic) & Main Add Btn (Always Black) */}
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
                title="Refresh banner settings"
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Refresh</span>
              </button>

              {activeTab === 'main' ? (
                <Link
                  href={isMainLimitReached ? '#' : '/dashboard/banner-settings/edit?type=main&mode=create'}
                  className={`btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white ${
                    isMainLimitReached ? 'disabled opacity-50' : ''
                  }`}
                  style={{
                    borderRadius: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                    transition: 'all 0.2s ease',
                    cursor: isMainLimitReached ? 'not-allowed' : 'pointer',
                  }}
                  title={isMainLimitReached ? 'Maximum 12 main banners reached' : 'Add new main banner'}
                >
                  <iconify-icon icon="solar:add-circle-bold" class="fs-17"></iconify-icon>
                  <span>+ Add Main Banner ({mainCount}/12)</span>
                </Link>
              ) : (
                <Link
                  href={isPromoLimitReached ? '#' : '/dashboard/banner-settings/edit?type=promo&mode=create'}
                  className={`btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white ${
                    isPromoLimitReached ? 'disabled opacity-50' : ''
                  }`}
                  style={{
                    borderRadius: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                    transition: 'all 0.2s ease',
                    cursor: isPromoLimitReached ? 'not-allowed' : 'pointer',
                  }}
                  title={isPromoLimitReached ? 'Maximum 12 promotion banners reached' : 'Add new promotion banner'}
                >
                  <iconify-icon icon="solar:add-circle-bold" class="fs-17"></iconify-icon>
                  <span>+ Add Promotion Banner ({promoCount}/12)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 22px 0' }}></div>

          {/* 3. Top Metric KPI Summary Cards (Sub-cards inside main card) */}
          <div className="row g-3 mb-4">
            {/* Main Banners KPI */}
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
                      Main Banners (Hero Left)
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
                      <iconify-icon icon="solar:gallery-wide-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
                      {mainCount} <span className="fs-14 text-muted fw-normal">/ 12</span>
                    </h3>
                    <span
                      className={`badge fs-11 fw-semibold ${
                        isMainLimitReached ? 'bg-danger text-white' : 'bg-light text-secondary border'
                      }`}
                      style={{ padding: '4px 8px', borderRadius: '4px' }}
                    >
                      {12 - mainCount > 0 ? `${12 - mainCount} slots left` : 'Max 12 reached'}
                    </span>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">
                    {bannerData.mainBanners.filter((b) => b.isActive !== false).length} Active on homepage
                  </span>
                </div>
              </div>
            </div>

            {/* Promotion Banners KPI */}
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
                      Promotion Banners (Right)
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
                      <iconify-icon icon="solar:tag-price-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
                      {promoCount} <span className="fs-14 text-muted fw-normal">/ 12</span>
                    </h3>
                    <span
                      className={`badge fs-11 fw-semibold ${
                        isPromoLimitReached ? 'bg-danger text-white' : 'bg-light text-secondary border'
                      }`}
                      style={{ padding: '4px 8px', borderRadius: '4px' }}
                    >
                      {12 - promoCount > 0 ? `${12 - promoCount} slots left` : 'Max 12 reached'}
                    </span>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">
                    {bannerData.promoBanners.filter((b) => b.isActive !== false).length} Active on homepage
                  </span>
                </div>
              </div>
            </div>

            {/* Live Sync Status */}
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
                      Live Storefront Sync
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
                      Real-Time Sync
                    </h3>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">Instant cross-tab updates</span>
                </div>
              </div>
            </div>

            {/* Security & Limits Status */}
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
                      Upload Security
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <iconify-icon icon="solar:lock-keyhole-minimalistic-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '20px' }}>
                      Format Locked
                    </h3>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">JPG, PNG, WebP • Max 5MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Navigation Tabs & Search Toolbar (Matching Shop Settings & Users) */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 border-bottom pb-3 mb-4">
            <div className="d-flex align-items-center gap-2.5">
              {/* Tab 1: Main Banner */}
              <button
                type="button"
                className={`btn d-flex align-items-center gap-2 fs-14 fw-semibold ${
                  activeTab === 'main' ? 'text-white shadow-sm' : 'text-secondary border'
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'main' ? '#0f172a' : '#ffffff',
                  borderColor: activeTab === 'main' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'main' ? '#ffffff' : '#475569',
                }}
                onClick={() => setActiveTab('main')}
              >
                <iconify-icon icon="solar:gallery-wide-bold" class="fs-17"></iconify-icon>
                <span>Main Banner (Hero Slider)</span>
                <span
                  className={`badge ${
                    activeTab === 'main' ? 'bg-white text-dark' : 'bg-light text-secondary border'
                  } ms-1 fs-12`}
                  style={{ borderRadius: '6px', padding: '3px 8px' }}
                >
                  {mainCount} / 12
                </span>
              </button>

              {/* Tab 2: Promotion Banner */}
              <button
                type="button"
                className={`btn d-flex align-items-center gap-2 fs-14 fw-semibold ${
                  activeTab === 'promo' ? 'text-white shadow-sm' : 'text-secondary border'
                }`}
                style={{
                  borderRadius: '8px',
                  padding: '9px 20px',
                  transition: 'all 0.2s ease',
                  backgroundColor: activeTab === 'promo' ? '#0f172a' : '#ffffff',
                  borderColor: activeTab === 'promo' ? '#0f172a' : '#e2e8f0',
                  color: activeTab === 'promo' ? '#ffffff' : '#475569',
                }}
                onClick={() => setActiveTab('promo')}
              >
                <iconify-icon icon="solar:tag-price-bold" class="fs-17"></iconify-icon>
                <span>Promotion Banner (Side Offers)</span>
                <span
                  className={`badge ${
                    activeTab === 'promo' ? 'bg-white text-dark' : 'bg-light text-secondary border'
                  } ms-1 fs-12`}
                  style={{ borderRadius: '6px', padding: '3px 8px' }}
                >
                  {promoCount} / 12
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="d-flex align-items-center gap-2" style={{ minWidth: '280px' }}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted px-3" style={{ borderColor: '#cbd5e1' }}>
                  <iconify-icon icon="solar:magnifer-linear" class="fs-16"></iconify-icon>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 fs-13 py-2"
                  placeholder={`Search ${activeTab === 'main' ? 'main banners' : 'promotion banners'}...`}
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

          {/* 5. Tab 1 Content: Main Banners Table */}
          {activeTab === 'main' && (
            <div className="table-responsive rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
              <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '60px', letterSpacing: '0.6px' }}>#</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '130px', letterSpacing: '0.6px' }}>Preview</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Banner Title & Info</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Target Link & Button</th>
                    <th className="py-3 px-4 text-center text-muted fs-12 text-uppercase fw-bold" style={{ width: '130px', letterSpacing: '0.6px' }}>Status</th>
                    <th className="py-3 px-4 text-end text-muted fs-12 text-uppercase fw-bold" style={{ width: '190px', letterSpacing: '0.6px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5" style={{ height: '320px', verticalAlign: 'middle' }}>
                        <div className="spinner-border text-dark" role="status"></div>
                        <p className="mt-2 fs-14 text-muted">Loading main banners...</p>
                      </td>
                    </tr>
                  ) : filteredMainBanners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <iconify-icon icon="solar:gallery-wide-broken" class="fs-40 text-muted mb-2"></iconify-icon>
                        <h5 className="fs-15 text-dark fw-bold mb-1">No main banners found</h5>
                        <p className="fs-13 text-muted mb-3">Add up to 12 main banners to display in the hero slider.</p>
                        <Link
                          href="/dashboard/banner-settings/edit?type=main&mode=create"
                          className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                          style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                        >
                          + Add Main Banner
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredMainBanners.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Order Index */}
                        <td className="py-3.5 px-4 text-muted fs-13 fw-semibold">
                          <span
                            className="badge bg-light text-dark border fs-12"
                            style={{ padding: '4px 8px', borderRadius: '4px' }}
                          >
                            {item.order || idx + 1}
                          </span>
                        </td>

                        {/* Image Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div
                            style={{
                              width: '105px',
                              height: '60px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/imgs/banner/safety-hero-1.jpg';
                              }}
                            />
                          </div>
                        </td>

                        {/* Title & Info */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span
                              className="fs-14 fw-bold text-dark d-block mb-1"
                              style={{ whiteSpace: 'pre-line', maxWidth: '380px' }}
                            >
                              {item.title}
                            </span>
                            <span className="text-muted fs-12 d-inline-flex align-items-center gap-1">
                              <iconify-icon icon="solar:widget-linear" class="fs-13"></iconify-icon>
                              Hero Slide • {item.isActive !== false ? 'Live on Storefront' : 'Hidden'}
                            </span>
                          </div>
                        </td>

                        {/* Target Link & Button */}
                        <td className="py-3.5 px-4">
                          <div className="d-flex flex-column gap-1">
                            <span
                              className="badge bg-light text-dark border font-monospace fs-12 align-self-start"
                              style={{ padding: '4px 10px', borderRadius: '5px' }}
                            >
                              {item.link || '/products'}
                            </span>
                            <span className="text-muted fs-11">
                              Btn: <strong className="text-dark">{item.buttonText || 'Explore Catalog'}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Status: Active / Hidden Pill */}
                        <td className="py-3.5 px-4 text-center">
                          {item.isActive !== false ? (
                            <span
                              className="badge fs-12 fw-semibold d-inline-flex align-items-center gap-1.5"
                              style={{
                                backgroundColor: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                padding: '5px 12px',
                                borderRadius: '20px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                              Active
                            </span>
                          ) : (
                            <span
                              className="badge fs-12 fw-semibold d-inline-flex align-items-center gap-1.5"
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                padding: '5px 12px',
                                borderRadius: '20px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                              Hidden
                            </span>
                          )}
                        </td>

                        {/* Actions: Hide/Show btn, Edit btn (separate page), Delete btn */}
                        <td className="py-3.5 px-4 text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            {/* Hide / Show Button */}
                            <button
                              type="button"
                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 fs-12 fw-semibold"
                              onClick={() => handleToggleStatus('main', item)}
                              style={{
                                borderRadius: '8px',
                                padding: '7px 12px',
                                backgroundColor: item.isActive !== false ? '#f1f5f9' : '#f0fdf4',
                                color: item.isActive !== false ? '#475569' : '#16a34a',
                                border: item.isActive !== false ? '1px solid #cbd5e1' : '1px solid #bbf7d0',
                                transition: 'all 0.15s ease',
                              }}
                              title={item.isActive !== false ? 'Hide banner from storefront' : 'Show banner on storefront'}
                            >
                              <iconify-icon
                                icon={item.isActive !== false ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                                class="fs-15"
                              ></iconify-icon>
                              <span>{item.isActive !== false ? 'Hide' : 'Show'}</span>
                            </button>

                            {/* Edit: Separate Page (NO modal) */}
                            <Link
                              href={`/dashboard/banner-settings/edit?type=main&id=${item.id}`}
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
                              title="Edit banner on separate page"
                            >
                              <iconify-icon icon="solar:pen-new-square-linear" class="fs-18"></iconify-icon>
                            </Link>

                            {/* Delete: Trash Icon */}
                            <button
                              type="button"
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'main',
                                  id: item.id,
                                  title: item.title,
                                  image: item.image,
                                })
                              }
                              style={{
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                transition: 'all 0.15s ease',
                              }}
                              title="Delete banner"
                            >
                              <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-18"></iconify-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Tab 2 Content: Promotion Banners Table */}
          {activeTab === 'promo' && (
            <div className="table-responsive rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
              <table className="table table-hover align-middle mb-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '60px', letterSpacing: '0.6px' }}>#</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ width: '110px', letterSpacing: '0.6px' }}>Preview</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Promotion Banner Details</th>
                    <th className="py-3 px-4 text-muted fs-12 text-uppercase fw-bold" style={{ letterSpacing: '0.6px' }}>Offer / Price Tag</th>
                    <th className="py-3 px-4 text-center text-muted fs-12 text-uppercase fw-bold" style={{ width: '130px', letterSpacing: '0.6px' }}>Status</th>
                    <th className="py-3 px-4 text-end text-muted fs-12 text-uppercase fw-bold" style={{ width: '190px', letterSpacing: '0.6px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5" style={{ height: '320px', verticalAlign: 'middle' }}>
                        <div className="spinner-border text-dark" role="status"></div>
                        <p className="mt-2 fs-14 text-muted">Loading promotion banners...</p>
                      </td>
                    </tr>
                  ) : filteredPromoBanners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <iconify-icon icon="solar:tag-price-bold" class="fs-40 text-muted mb-2"></iconify-icon>
                        <h5 className="fs-15 text-dark fw-bold mb-1">No promotion banners found</h5>
                        <p className="fs-13 text-muted mb-3">Add up to 12 promotion banners to display in the side promo section.</p>
                        <Link
                          href="/dashboard/banner-settings/edit?type=promo&mode=create"
                          className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                          style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                        >
                          + Add Promotion Banner
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredPromoBanners.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Order Index */}
                        <td className="py-3.5 px-4 text-muted fs-13 fw-semibold">
                          <span
                            className="badge bg-light text-dark border fs-12"
                            style={{ padding: '4px 8px', borderRadius: '4px' }}
                          >
                            {item.order || idx + 1}
                          </span>
                        </td>

                        {/* Image Thumbnail */}
                        <td className="py-3.5 px-4">
                          <div
                            style={{
                              width: '85px',
                              height: '60px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/imgs/banner/clean-side-1.jpg';
                              }}
                            />
                          </div>
                        </td>

                        {/* Title & Subtitle */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="fs-14 fw-bold text-dark d-block mb-0.5">{item.title}</span>
                            <span className="text-muted fs-12 d-block mb-1">{item.subtitle}</span>
                            <span
                              className="badge bg-light text-dark border font-monospace fs-11"
                              style={{ padding: '2px 8px', borderRadius: '4px' }}
                            >
                              {item.link || '/products'}
                            </span>
                          </div>
                        </td>

                        {/* Price / Offer Tag & Button */}
                        <td className="py-3.5 px-4">
                          <div className="d-flex flex-column gap-1">
                            <span
                              className="badge fs-12 fw-bold align-self-start"
                              style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                padding: '5px 10px',
                                borderRadius: '6px',
                              }}
                            >
                              {item.price}
                            </span>
                            <span className="text-muted fs-11">
                              Btn: <strong className="text-dark">{item.buttonText || 'Order Now'}</strong>
                            </span>
                          </div>
                        </td>

                        {/* Status: Active / Hidden Pill */}
                        <td className="py-3.5 px-4 text-center">
                          {item.isActive !== false ? (
                            <span
                              className="badge fs-12 fw-semibold d-inline-flex align-items-center gap-1.5"
                              style={{
                                backgroundColor: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0',
                                padding: '5px 12px',
                                borderRadius: '20px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                              Active
                            </span>
                          ) : (
                            <span
                              className="badge fs-12 fw-semibold d-inline-flex align-items-center gap-1.5"
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                padding: '5px 12px',
                                borderRadius: '20px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                              Hidden
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-end">
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            {/* Hide / Show Button */}
                            <button
                              type="button"
                              className="btn btn-sm d-inline-flex align-items-center gap-1.5 fs-12 fw-semibold"
                              onClick={() => handleToggleStatus('promo', item)}
                              style={{
                                borderRadius: '8px',
                                padding: '7px 12px',
                                backgroundColor: item.isActive !== false ? '#f1f5f9' : '#f0fdf4',
                                color: item.isActive !== false ? '#475569' : '#16a34a',
                                border: item.isActive !== false ? '1px solid #cbd5e1' : '1px solid #bbf7d0',
                                transition: 'all 0.15s ease',
                              }}
                              title={item.isActive !== false ? 'Hide banner from storefront' : 'Show banner on storefront'}
                            >
                              <iconify-icon
                                icon={item.isActive !== false ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                                class="fs-15"
                              ></iconify-icon>
                              <span>{item.isActive !== false ? 'Hide' : 'Show'}</span>
                            </button>

                            {/* Edit: Separate Page (NO modal) */}
                            <Link
                              href={`/dashboard/banner-settings/edit?type=promo&id=${item.id}`}
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
                              title="Edit banner on separate page"
                            >
                              <iconify-icon icon="solar:pen-new-square-linear" class="fs-18"></iconify-icon>
                            </Link>

                            {/* Delete: Trash Icon */}
                            <button
                              type="button"
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'promo',
                                  id: item.id,
                                  title: item.title,
                                  image: item.image,
                                })
                              }
                              style={{
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                transition: 'all 0.15s ease',
                              }}
                              title="Delete banner"
                            >
                              <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-18"></iconify-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal rendered via ClientPortal for perfect full-screen backdrop */}
      {deleteTarget && (
        <ClientPortal>
          <div
            className="modal fade show d-block"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              zIndex: 99999,
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px', width: '92%' }}>
              <div
                className="modal-content border-0 shadow-lg"
                style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                }}
              >
                <div className="p-4 text-center">
                  <div
                    className="mx-auto d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                    }}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-32"></iconify-icon>
                  </div>

                  <h4 className="fs-18 fw-bold text-dark mb-1">Delete Banner</h4>
                  <p className="text-muted fs-13 mb-3">
                    Are you sure you want to delete this {deleteTarget.type === 'main' ? 'main' : 'promotion'} banner? This action will immediately remove it from the storefront.
                  </p>

                  {/* Banner Mini Preview */}
                  <div
                    className="d-flex align-items-center gap-3 p-2.5 rounded-3 mb-4 text-start border"
                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    <img
                      src={deleteTarget.image}
                      alt={deleteTarget.title}
                      style={{
                        width: '65px',
                        height: '45px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div className="fs-13 fw-bold text-dark text-truncate">
                        {deleteTarget.title.replace(/\n/g, ' ')}
                      </div>
                      <span className="text-muted fs-11">
                        {deleteTarget.type === 'main' ? 'Main Promotion Banner' : 'Promotion Offer Banner'}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-light fs-13 fw-semibold px-4 py-2"
                      onClick={() => setDeleteTarget(null)}
                      disabled={isDeleting}
                      style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-1.5"
                      onClick={handleConfirmDelete}
                      disabled={isDeleting}
                      style={{ borderRadius: '8px', backgroundColor: '#dc2626' }}
                    >
                      {isDeleting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                          <span>Yes, Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}
    </>
  );
}
