'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { fetchPartners, savePartners, PARTNERS_EVENT } from '@/services/partnersService';
import { PartnerItem, PartnersData, DEFAULT_PARTNERS_DATA } from '@/data/defaultPartners';
import { useToast } from '@/context/ToastContext';
import { ClientPortal } from '@/components/common/ClientPortal';

export default function OurPartnersDashboardPage() {
  const [partnersData, setPartnersData] = useState<PartnersData>(DEFAULT_PARTNERS_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  // Banner Heading Modal state
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(partnersData.title);
  const [sectionSubtitle, setSectionSubtitle] = useState(partnersData.subtitle);
  const [sectionBtnText, setSectionBtnText] = useState(partnersData.buttonText);
  const [sectionBtnLink, setSectionBtnLink] = useState(partnersData.buttonLink);

  // Add / Edit Partner Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingItem, setEditingItem] = useState<PartnerItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);

  // Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<PartnerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPartners();
      setPartnersData(data);
      setSectionTitle(data.title || DEFAULT_PARTNERS_DATA.title);
      setSectionSubtitle(data.subtitle || DEFAULT_PARTNERS_DATA.subtitle);
      setSectionBtnText(data.buttonText || DEFAULT_PARTNERS_DATA.buttonText);
      setSectionBtnLink(data.buttonLink || DEFAULT_PARTNERS_DATA.buttonLink);
    } catch (err: any) {
      console.error('Error loading partners:', err);
      showToast('danger', 'Failed to load partners data.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();

    const handleUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail.partners)) {
        setPartnersData(customEvent.detail);
      }
    };

    window.addEventListener(PARTNERS_EVENT, handleUpdated);
    return () => window.removeEventListener(PARTNERS_EVENT, handleUpdated);
  }, [loadData]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    const list = [...(partnersData.partners || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [partnersData.partners, searchQuery]);

  const totalCount = partnersData.partners?.length || 0;
  const activeCount = partnersData.partners?.filter((p) => p.isActive).length || 0;
  const hiddenCount = totalCount - activeCount;

  // Toggle Status directly from card
  const handleToggleStatus = async (item: PartnerItem) => {
    const isNowActive = !item.isActive;
    const updatedList = partnersData.partners.map((p) =>
      p.id === item.id ? { ...p, isActive: isNowActive } : p
    );
    const updatedData: PartnersData = { ...partnersData, partners: updatedList };
    setPartnersData(updatedData);

    const res = await savePartners(updatedData);
    if (res.success) {
      showToast(
        'success',
        `Partner "${item.name}" is now ${isNowActive ? 'visible' : 'hidden'}.`
      );
    } else {
      showToast('danger', res.message || 'Failed to update partner status.');
      loadData();
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setFormName('');
    setFormLogo('');
    setFormOrder((partnersData.partners.length || 0) + 1);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: PartnerItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormName(item.name || '');
    setFormLogo(item.logo || '');
    setFormOrder(item.order || 1);
  };

  // Handle File Upload ONLY (no URL input)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type) && !file.name.endsWith('.svg')) {
      showToast('danger', 'Please upload a valid image file (PNG, JPG, WebP, GIF, or SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('danger', 'File size exceeds 5MB limit.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        setFormLogo(json.url);
        showToast('success', 'Partner logo uploaded successfully!');
      } else {
        showToast('danger', json.message || 'Upload failed.');
      }
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      showToast('danger', 'Network error during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Add/Edit Partner Modal
  const handleSavePartnerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('danger', 'Please enter a partner or brand name.');
      return;
    }
    if (!formLogo.trim()) {
      showToast('danger', 'Please upload a logo image.');
      return;
    }

    setIsSaving(true);
    let updatedList: PartnerItem[];

    if (modalMode === 'add') {
      const newItem: PartnerItem = {
        id: `partner-${Date.now()}`,
        name: formName.trim(),
        logo: formLogo.trim(),
        link: '/products',
        order: Number(formOrder) || (partnersData.partners.length + 1),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      updatedList = [...partnersData.partners, newItem];
    } else {
      if (!editingItem) return;
      updatedList = partnersData.partners.map((p) =>
        p.id === editingItem.id
          ? {
              ...p,
              name: formName.trim(),
              logo: formLogo.trim(),
              order: Number(formOrder) || p.order,
            }
          : p
      );
    }

    // Sort by order
    updatedList.sort((a, b) => (a.order || 0) - (b.order || 0));

    const updatedData: PartnersData = { ...partnersData, partners: updatedList };
    setPartnersData(updatedData);

    const res = await savePartners(updatedData);
    setIsSaving(false);

    if (res.success) {
      showToast(
        'success',
        modalMode === 'add' ? 'Partner logo added successfully!' : 'Partner logo updated successfully!'
      );
      setModalMode(null);
    } else {
      showToast('danger', res.message || 'Failed to save partner logo.');
      loadData();
    }
  };

  // Save Banner Heading Modal
  const handleSaveBannerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updatedData: PartnersData = {
      ...partnersData,
      title: sectionTitle.trim() || DEFAULT_PARTNERS_DATA.title,
      subtitle: sectionSubtitle.trim() || DEFAULT_PARTNERS_DATA.subtitle,
      buttonText: sectionBtnText.trim() || DEFAULT_PARTNERS_DATA.buttonText,
      buttonLink: sectionBtnLink.trim() || DEFAULT_PARTNERS_DATA.buttonLink,
    };
    setPartnersData(updatedData);

    const res = await savePartners(updatedData);
    setIsSaving(false);

    if (res.success) {
      showToast('success', 'Banner heading updated successfully!');
      setShowBannerModal(false);
    } else {
      showToast('danger', res.message || 'Failed to update banner heading.');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const updatedList = partnersData.partners.filter((p) => p.id !== deleteTarget.id);
    const updatedData: PartnersData = { ...partnersData, partners: updatedList };
    setPartnersData(updatedData);

    const res = await savePartners(updatedData);
    setIsDeleting(false);

    if (res.success) {
      showToast('success', `Partner "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
    } else {
      showToast('danger', res.message || 'Failed to delete partner.');
      loadData();
    }
  };

  return (
    <>
      {/* ========================================================
          MAIN BACKGROUND WHITE CARD (Exact Dashboard Standard Style)
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
            <span className="text-dark fw-bold">Our Partners</span>
          </div>

          {/* 2. Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                Our Partners
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage brand &amp; manufacturer partner logos displayed in the homepage partners slider.
              </p>
            </div>

            {/* Top Action Buttons (Exact Dashboard Style: Outline White & Black Primary) */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
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
                title="Refresh partners list"
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Refresh</span>
              </button>

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
                onClick={() => setShowBannerModal(true)}
              >
                <iconify-icon icon="solar:pen-2-bold" class="fs-16"></iconify-icon>
                <span>Edit Banner Heading</span>
              </button>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 22px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={handleOpenAddModal}
              >
                <iconify-icon icon="solar:add-circle-bold" class="fs-17"></iconify-icon>
                <span>+ Add Partner Logo</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 22px 0' }}></div>

          {/* 3. Top Metric KPI Summary Cards */}
          <div className="row g-3 mb-4">
            {/* Total Partners KPI */}
            <div className="col-12 col-sm-6 col-xl-4">
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
                      Total Partner Logos
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
                      <iconify-icon icon="solar:hand-shake-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-dark" style={{ fontSize: '24px' }}>
                      {totalCount}
                    </h3>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">
                    Configured for homepage slider
                  </span>
                </div>
              </div>
            </div>

            {/* Active KPI */}
            <div className="col-12 col-sm-6 col-xl-4">
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
                      Active in Slider
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      <iconify-icon icon="solar:eye-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '24px' }}>
                      {activeCount}
                    </h3>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">
                    Currently visible on live website
                  </span>
                </div>
              </div>
            </div>

            {/* Hidden KPI */}
            <div className="col-12 col-sm-6 col-xl-4">
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
                      Hidden Logos
                    </span>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        color: '#94a3b8',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <iconify-icon icon="solar:eye-closed-bold" class="fs-20"></iconify-icon>
                    </div>
                  </div>
                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="fw-bold mb-0 text-muted" style={{ fontSize: '24px' }}>
                      {hiddenCount}
                    </h3>
                  </div>
                  <span className="text-muted fs-12 d-block mt-1">
                    Draft / hidden from customers
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Search Filter Bar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
            <div className="position-relative" style={{ maxWidth: '340px', width: '100%' }}>
              <iconify-icon
                icon="solar:magnifer-linear"
                class="position-absolute fs-18 text-muted"
                style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              ></iconify-icon>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search partner by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: '8px',
                  height: '40px',
                  fontSize: '13px',
                  borderColor: '#d1d5db',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-sm position-absolute border-0 text-muted p-0"
                  style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }}
                  onClick={() => setSearchQuery('')}
                >
                  <iconify-icon icon="solar:close-circle-bold" class="fs-16"></iconify-icon>
                </button>
              )}
            </div>

            <div className="text-muted fs-13 d-flex align-items-center gap-3">
              <span className="d-flex align-items-center gap-1.5">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                Active on Storefront
              </span>
              <span className="d-flex align-items-center gap-1.5">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                Hidden
              </span>
            </div>
          </div>

          {/* 5. Partners Grid List */}
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status"></div>
              <p className="text-muted mt-3 fs-14">Loading partner logos...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div
              className="text-center py-5 px-3 rounded-3"
              style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1' }}
            >
              <iconify-icon icon="solar:hand-shake-broken" class="fs-48 text-muted mb-2"></iconify-icon>
              <h5 className="fw-bold text-dark mb-1">No Partner Logos Found</h5>
              <p className="text-muted fs-14 mb-3">
                {searchQuery ? `No partners match "${searchQuery}".` : 'Start by adding your first brand or partner logo.'}
              </p>
              <button
                type="button"
                className="btn btn-sm text-white"
                style={{ borderRadius: '8px', padding: '10px 22px', backgroundColor: '#0f172a' }}
                onClick={handleOpenAddModal}
              >
                + Add Partner Logo
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {filteredPartners.map((item) => (
                <div key={item.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                  <div
                    className="card h-100 border position-relative"
                    style={{
                      borderRadius: '10px',
                      backgroundColor: item.isActive ? '#ffffff' : '#f8fafc',
                      borderColor: '#e2e8f0',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {/* Top Order Badge & Active Switch */}
                    <div className="d-flex align-items-center justify-content-between p-3 pb-0">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '11px',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        Order #{item.order}
                      </span>

                      {/* Active Status Switch Directly on Card */}
                      <div className="form-check form-switch m-0" style={{ minHeight: 'unset' }}>
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          role="switch"
                          checked={item.isActive}
                          onChange={() => handleToggleStatus(item)}
                          title={item.isActive ? 'Visible - click to hide' : 'Hidden - click to show'}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: item.isActive ? '#0f172a' : undefined,
                            borderColor: item.isActive ? '#0f172a' : undefined,
                          }}
                        />
                      </div>
                    </div>

                    {/* Logo Box Preview (White Card Box) */}
                    <div className="px-3 pt-2 pb-2">
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          height: '110px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '16px',
                          border: '1px solid #f1f5f9',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={item.logo}
                          alt={item.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '75px',
                            objectFit: 'contain',
                            filter: item.isActive ? 'none' : 'grayscale(100%) opacity(0.5)',
                            transition: 'all 0.2s ease',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/imgs/client/partner1.svg';
                          }}
                        />
                      </div>
                    </div>

                    {/* Partner Name & Status Badge */}
                    <div className="px-3 py-2">
                      <div className="d-flex align-items-center justify-content-between">
                        <h6 className="fw-bold text-dark m-0 text-truncate" title={item.name} style={{ fontSize: '14px', color: '#0f172a' }}>
                          {item.name}
                        </h6>
                        <span
                          className={`badge ${
                            item.isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-light text-muted border'
                          }`}
                          style={{ fontSize: '11px', borderRadius: '4px', padding: '3px 7px' }}
                        >
                          {item.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div
                      className="d-flex align-items-center justify-content-between px-3 py-2 mt-auto border-top"
                      style={{ borderColor: '#f1f5f9' }}
                    >
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center gap-1"
                        style={{ fontSize: '13px', color: '#0f172a' }}
                        onClick={() => handleOpenEditModal(item)}
                      >
                        <iconify-icon icon="solar:pen-linear" class="fs-14 text-primary"></iconify-icon>
                        <span className="fw-semibold">Edit</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none text-danger p-0 d-flex align-items-center gap-1"
                        style={{ fontSize: '13px' }}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-14"></iconify-icon>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          EDIT BANNER HEADING MODAL (Clean Dedicated Modal)
         ======================================================== */}
      {showBannerModal && (
        <ClientPortal>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header */}
                <div
                  className="modal-header px-4 py-3 border-bottom d-flex align-items-center justify-content-between"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      <iconify-icon icon="solar:pen-2-bold"></iconify-icon>
                    </span>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '17px', color: '#0f172a' }}>
                      Edit Banner Heading &amp; Text
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowBannerModal(false)}
                  ></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveBannerModal}>
                  <div className="modal-body p-4" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Section Main Heading <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={sectionTitle}
                          onChange={(e) => setSectionTitle(e.target.value)}
                          placeholder="e.g. Our Official Brand & Safety Partners"
                          style={{ borderRadius: '8px', height: '42px', fontSize: '13.5px' }}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Subtitle / Description
                        </label>
                        <textarea
                          rows={2}
                          className="form-control"
                          value={sectionSubtitle}
                          onChange={(e) => setSectionSubtitle(e.target.value)}
                          placeholder="Partnered with globally certified industrial safety, PPE, and equipment manufacturers."
                          style={{ borderRadius: '8px', fontSize: '13.5px' }}
                        ></textarea>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Action Button Label
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={sectionBtnText}
                          onChange={(e) => setSectionBtnText(e.target.value)}
                          placeholder="e.g. Become a Partner or View All Partners"
                          style={{ borderRadius: '8px', height: '42px', fontSize: '13.5px' }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Action Button Link
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={sectionBtnLink}
                          onChange={(e) => setSectionBtnLink(e.target.value)}
                          placeholder="e.g. /products or /contact"
                          style={{ borderRadius: '8px', height: '42px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer px-4 py-3 bg-white border-top d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      style={{ borderRadius: '8px', padding: '9px 18px', fontWeight: 600 }}
                      onClick={() => setShowBannerModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm text-white"
                      disabled={isSaving}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 22px',
                        fontWeight: 600,
                        backgroundColor: '#0f172a',
                        border: '1px solid #0f172a',
                      }}
                    >
                      {isSaving ? 'Saving...' : 'Save Banner Heading'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}

      {/* ========================================================
          ADD / EDIT PARTNER MODAL (Only File Upload - No URL, No Destination Link, No Active Btn)
         ======================================================== */}
      {modalMode && (
        <ClientPortal>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header */}
                <div
                  className="modal-header px-4 py-3 border-bottom d-flex align-items-center justify-content-between"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                      }}
                    >
                      <iconify-icon icon={modalMode === 'add' ? 'solar:add-circle-bold' : 'solar:pen-2-bold'}></iconify-icon>
                    </span>
                    <h5 className="modal-title fw-bold text-dark m-0" style={{ fontSize: '17px', color: '#0f172a' }}>
                      {modalMode === 'add' ? 'Add Partner Logo' : `Edit Partner: ${editingItem?.name}`}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setModalMode(null)}
                  ></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSavePartnerModal}>
                  <div className="modal-body p-4" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="row g-3">
                      {/* 1. Partner Name */}
                      <div className="col-12 col-sm-8">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Partner / Brand Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Microsoft, Amazon, 3M, Honeywell..."
                          style={{ borderRadius: '8px', height: '42px', fontSize: '13.5px' }}
                        />
                      </div>

                      {/* 2. Order Number */}
                      <div className="col-12 col-sm-4">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          className="form-control"
                          value={formOrder}
                          onChange={(e) => setFormOrder(Number(e.target.value) || 1)}
                          style={{ borderRadius: '8px', height: '42px', fontSize: '13.5px' }}
                        />
                      </div>

                      {/* 3. Upload File Box ONLY (No URL input) */}
                      <div className="col-12">
                        <label className="form-label fs-13 fw-bold text-dark mb-1">
                          Upload Partner Logo <span className="text-danger">*</span>
                        </label>
                        <div
                          className="p-4 rounded-3 text-center border-2 border-dashed position-relative"
                          style={{
                            backgroundColor: '#ffffff',
                            borderColor: '#cbd5e1',
                            cursor: 'pointer',
                            borderRadius: '10px',
                          }}
                          onClick={() => document.getElementById('partnerLogoUploadOnlyInput')?.click()}
                        >
                          <input
                            type="file"
                            id="partnerLogoUploadOnlyInput"
                            className="d-none"
                            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml, .svg"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />

                          {isUploading ? (
                            <div className="py-2">
                              <div className="spinner-border spinner-border-sm text-dark" role="status"></div>
                              <div className="fs-13 text-muted mt-2">Uploading and verifying logo...</div>
                            </div>
                          ) : (
                            <div className="py-1">
                              <iconify-icon icon="solar:cloud-upload-bold" class="fs-32 text-dark mb-1"></iconify-icon>
                              <div className="fs-13 fw-bold text-dark">Click to browse or upload logo file</div>
                              <div className="text-muted fs-12 mt-1">
                                Supports PNG, JPG, WebP, SVG (Max 5MB)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4. Live Box Preview */}
                      {formLogo && (
                        <div className="col-12">
                          <label className="form-label fs-12 fw-bold text-muted text-uppercase mb-1">
                            Logo Preview
                          </label>
                          <div
                            className="p-3 rounded-2 d-flex align-items-center justify-content-center"
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              height: '110px',
                            }}
                          >
                            <img
                              src={formLogo}
                              alt="Preview"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '75px',
                                objectFit: 'contain',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="modal-footer px-4 py-3 bg-white border-top d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      style={{ borderRadius: '8px', padding: '9px 18px', fontWeight: 600 }}
                      onClick={() => setModalMode(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm text-white"
                      disabled={isSaving || isUploading}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 22px',
                        fontWeight: 600,
                        backgroundColor: '#0f172a',
                        border: '1px solid #0f172a',
                      }}
                    >
                      {isSaving ? 'Saving...' : modalMode === 'add' ? 'Add Partner' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ClientPortal>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
         ======================================================== */}
      {deleteTarget && (
        <ClientPortal>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="modal-body p-4 text-center">
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      marginBottom: '14px',
                    }}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon>
                  </div>

                  <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '17px' }}>Delete Partner Logo?</h5>
                  <p className="text-muted fs-13 mb-3">
                    Are you sure you want to remove <strong>{deleteTarget.name}</strong> from the partners slider?
                  </p>

                  <div
                    className="p-2 mb-4 rounded-2 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', height: '80px' }}
                  >
                    <img
                      src={deleteTarget.logo}
                      alt={deleteTarget.name}
                      style={{ maxHeight: '55px', maxWidth: '140px', objectFit: 'contain' }}
                    />
                  </div>

                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      style={{ borderRadius: '8px', padding: '9px 18px', fontWeight: 600 }}
                      onClick={() => setDeleteTarget(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{ borderRadius: '8px', padding: '9px 20px', fontWeight: 600 }}
                      onClick={handleConfirmDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete'}
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
