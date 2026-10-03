'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateProduct } from '@/services/productsService';
import { ProductItem, ProductDetailSection } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';

function SpecificationsEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const productId = searchParams.get('id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [sections, setSections] = useState<ProductDetailSection[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Load Product and existing specifications with fresh cache-bypassing fetch
  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const loadProductData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const found: ProductItem = json.data;
            setProduct(found);

            // Crucial fix: Respect empty array [] if user previously deleted all sections!
            if (found.specifications !== undefined && Array.isArray(found.specifications)) {
              setSections(found.specifications);
            } else {
              setSections([]);
            }
            return;
          }
        }
        showToast('danger', 'Product not found.');
      } catch (err: any) {
        showToast('danger', 'Failed to load product specifications.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [productId, showToast]);

  // Add a new section
  const handleAddSection = (type: 'description' | 'points' = 'description') => {
    const newSection: ProductDetailSection = {
      id: `sec-${Date.now()}`,
      heading: type === 'points' ? 'Technical Specifications' : 'Product Overview',
      type: type,
      description: type === 'description' ? '' : undefined,
      points: type === 'points' ? [{ id: `pt-${Date.now()}-1`, heading: '', text: '' }] : undefined,
    };
    setSections([...sections, newSection]);
    showToast('info', 'New specification section added.');
  };

  // Remove section
  const handleRemoveSection = (sectionId: string) => {
    const updated = sections.filter((s) => s.id !== sectionId);
    setSections(updated);
    showToast('info', 'Section removed. Remember to click "Save Specifications" to commit changes.');
  };

  // Move section up/down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSections(updated);
  };

  // Update section heading
  const handleUpdateHeading = (sectionId: string, heading: string) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, heading } : s)));
  };

  // Switch section type (Description vs Points)
  const handleSwitchType = (sectionId: string, newType: 'description' | 'points') => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        if (newType === 'points') {
          return {
            ...s,
            type: 'points',
            points: s.points && s.points.length > 0 ? s.points : [{ id: `pt-${Date.now()}`, heading: '', text: '' }],
          };
        } else {
          return {
            ...s,
            type: 'description',
            description: s.description || '',
          };
        }
      })
    );
  };

  // Update section description
  const handleUpdateDescription = (sectionId: string, description: string) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, description } : s)));
  };

  // Add point to section
  const handleAddPoint = (sectionId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const pts = s.points ? [...s.points] : [];
        pts.push({ id: `pt-${Date.now()}`, heading: '', text: '' });
        return { ...s, points: pts };
      })
    );
  };

  // Remove point from section
  const handleRemovePoint = (sectionId: string, pointId: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const pts = s.points?.filter((p) => p.id !== pointId) || [];
        return { ...s, points: pts.length > 0 ? pts : [{ id: `pt-${Date.now()}`, heading: '', text: '' }] };
      })
    );
  };

  // Update point heading
  const handleUpdatePointHeading = (sectionId: string, pointId: string, heading: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const pts = s.points?.map((p) => (p.id === pointId ? { ...p, heading } : p)) || [];
        return { ...s, points: pts };
      })
    );
  };

  // Update point text
  const handleUpdatePointText = (sectionId: string, pointId: string, text: string) => {
    setSections(
      sections.map((s) => {
        if (s.id !== sectionId) return s;
        const pts = s.points?.map((p) => (p.id === pointId ? { ...p, text } : p)) || [];
        return { ...s, points: pts };
      })
    );
  };

  // Save specifications (commits deletion or updates directly to database)
  const handleSave = async () => {
    if (!product) return;

    // Filter out completely blank unedited entries
    const cleaned = sections.filter((s) => {
      if (s.type === 'description') {
        return s.heading.trim().length > 0 || (s.description && s.description.trim().length > 0);
      } else {
        const hasValidPoint = s.points?.some((p) => p.text.trim().length > 0 || (p.heading && p.heading.trim().length > 0));
        return s.heading.trim().length > 0 || hasValidPoint;
      }
    });

    setIsSaving(true);
    try {
      const res = await updateProduct({
        ...product,
        specifications: cleaned,
      });

      if (res.success) {
        showToast(
          'success',
          cleaned.length > 0
            ? `Saved ${cleaned.length} specification sections for "${product.title}".`
            : `All specification sections cleared for "${product.title}".`,
          'Specifications Saved'
        );
        router.push(`/dashboard/all-products/edit?id=${product.id}`);
      } else {
        showToast('danger', res.message || 'Failed to save specifications.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error saving specifications.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card border-0 mb-4" style={{ borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="card-body p-5 text-center">
          <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
          <span className="text-muted fs-14">Loading product specifications...</span>
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
          <div className="d-flex align-items-center text-muted fs-13 mb-4 gap-2">
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
            <span className="text-dark fw-bold">Specifications &amp; Details</span>
          </div>

          {/* 2. Header & Action Buttons Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
            <div>
              <h2
                className="fw-bold text-dark mb-1"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a' }}
              >
                Product Specifications &amp; Details
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Add rich headings, paragraph descriptions, and point-by-point specifications for <strong>{product.title}</strong>.
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
                Cancel
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-sm d-flex align-items-center gap-2 text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 22px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  fontWeight: 600,
                  fontSize: '13px',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
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
                    <span>Save Specifications</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderBottom: '1px solid #f1f5f9', margin: '16px 0 24px 0' }}></div>

          {/* 3. Product Summary Context Banner (Well Padded & Formatted) */}
          <div
            className="rounded-3 border d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4"
            style={{
              padding: '20px 24px',
              backgroundColor: '#f8fafc',
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div className="d-flex align-items-center gap-3.5">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                }}
              >
                <img
                  src={product.image || '/assets/imgs/shop/p1.jpg'}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                  }}
                />
              </div>

              <div>
                <h4
                  className="fw-bold text-dark mb-1"
                  style={{ fontSize: '17px', letterSpacing: '-0.3px', color: '#0f172a' }}
                >
                  {product.title}
                </h4>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span
                    className="badge bg-white text-dark border fs-12 fw-semibold"
                    style={{ padding: '4px 10px', borderRadius: '6px', borderColor: '#e2e8f0' }}
                  >
                    {product.category}
                  </span>
                  <span className="fw-bold text-success fs-13">{product.price}</span>
                  {product.standard && (
                    <>
                      <span className="text-muted fs-12">·</span>
                      <span
                        className="badge bg-success-subtle text-success border border-success-subtle fs-11"
                        style={{ padding: '3px 8px', borderRadius: '4px' }}
                      >
                        {product.standard}
                      </span>
                    </>
                  )}
                  <span className="text-muted fs-12">·</span>
                  <span
                    className="badge bg-light text-secondary border fs-11 fw-medium"
                    style={{ padding: '3px 8px', borderRadius: '4px' }}
                  >
                    {sections.length} {sections.length === 1 ? 'Section' : 'Sections'} Configured
                  </span>
                </div>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`btn btn-sm d-flex align-items-center gap-1.5 fw-medium ${
                  activeTab === 'editor' ? 'btn-dark text-white' : 'btn-light border text-dark'
                }`}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  padding: '0 16px',
                  fontSize: '13px',
                  boxShadow: activeTab === 'editor' ? '0 2px 4px rgba(15, 23, 42, 0.2)' : 'none',
                }}
              >
                <iconify-icon icon="solar:pen-bold" class="fs-15"></iconify-icon>
                <span>Specification Builder</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`btn btn-sm d-flex align-items-center gap-1.5 fw-medium ${
                  activeTab === 'preview' ? 'btn-dark text-white' : 'btn-light border text-dark'
                }`}
                style={{
                  height: '38px',
                  borderRadius: '8px',
                  padding: '0 16px',
                  fontSize: '13px',
                  boxShadow: activeTab === 'preview' ? '0 2px 4px rgba(15, 23, 42, 0.2)' : 'none',
                }}
              >
                <iconify-icon icon="solar:eye-bold" class="fs-15"></iconify-icon>
                <span>Storefront Preview</span>
              </button>
            </div>
          </div>

          {/* 4. Main Body: Builder Mode or Preview Mode */}
          {activeTab === 'editor' ? (
            <div>
              {/* Sections List */}
              {sections.length === 0 ? (
                <div
                  className="text-center py-5 rounded-3 border border-dashed mb-4"
                  style={{ borderColor: '#cbd5e1', backgroundColor: '#fcfdfe', padding: '48px 24px' }}
                >
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center text-muted mb-3"
                    style={{ width: '56px', height: '56px', backgroundColor: '#f1f5f9' }}
                  >
                    <iconify-icon icon="solar:document-add-linear" class="fs-28"></iconify-icon>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">No Specifications Configured</h5>
                  <p className="text-muted fs-13 mb-4" style={{ maxWidth: '440px', margin: '0 auto' }}>
                    You can add technical specifications, compliance standards, or paragraph overviews. If left empty, only basic product details will show on the storefront.
                  </p>
                  <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddSection('points')}
                      className="btn btn-dark btn-sm d-flex align-items-center gap-2 text-white"
                      style={{
                        borderRadius: '8px',
                        fontSize: '13px',
                        padding: '10px 22px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #0f172a',
                        fontWeight: 600,
                      }}
                    >
                      <iconify-icon icon="solar:list-check-bold" class="fs-17"></iconify-icon>
                      <span>+ Add Point-by-Point Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('description')}
                      className="btn btn-light border btn-sm d-flex align-items-center gap-2"
                      style={{
                        borderRadius: '8px',
                        fontSize: '13px',
                        padding: '10px 22px',
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        color: '#374151',
                        fontWeight: 500,
                      }}
                    >
                      <iconify-icon icon="solar:text-bold" class="fs-17"></iconify-icon>
                      <span>+ Add Paragraph Section</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="rounded-3 border"
                      style={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Section Card Top Header */}
                      <div
                        className="d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom"
                        style={{ padding: '16px 24px', backgroundColor: '#fcfdfe', borderColor: '#f1f5f9' }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="badge bg-dark text-white rounded-pill px-3 py-1 fw-bold"
                            style={{ fontSize: '11px', letterSpacing: '0.4px' }}
                          >
                            Section #{index + 1}
                          </span>

                          <span className="text-muted fs-12 fw-medium">Display Format:</span>
                          <div className="btn-group btn-group-sm" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                            <button
                              type="button"
                              onClick={() => handleSwitchType(section.id, 'description')}
                              className={`btn btn-sm ${
                                section.type === 'description' ? 'btn-dark text-white fw-semibold' : 'btn-light border text-dark'
                              }`}
                              style={{ fontSize: '12px', padding: '6px 14px' }}
                            >
                              <iconify-icon icon="solar:text-bold" class="fs-13 me-1.5"></iconify-icon>
                              Paragraph Description
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchType(section.id, 'points')}
                              className={`btn btn-sm ${
                                section.type === 'points' ? 'btn-dark text-white fw-semibold' : 'btn-light border text-dark'
                              }`}
                              style={{ fontSize: '12px', padding: '6px 14px' }}
                            >
                              <iconify-icon icon="solar:list-check-bold" class="fs-13 me-1.5"></iconify-icon>
                              Point-by-Point Items
                            </button>
                          </div>
                        </div>

                        {/* Section Control Buttons */}
                        <div className="d-flex align-items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveSection(index, 'up')}
                            disabled={index === 0}
                            className="btn btn-sm btn-light border text-muted px-2.5 py-1.5"
                            title="Move section up"
                            style={{ borderRadius: '6px' }}
                          >
                            <iconify-icon icon="solar:arrow-up-linear" class="fs-14"></iconify-icon>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSection(index, 'down')}
                            disabled={index === sections.length - 1}
                            className="btn btn-sm btn-light border text-muted px-2.5 py-1.5"
                            title="Move section down"
                            style={{ borderRadius: '6px' }}
                          >
                            <iconify-icon icon="solar:arrow-down-linear" class="fs-14"></iconify-icon>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(section.id)}
                            className="btn btn-sm btn-light border text-danger px-2.5 py-1.5"
                            title="Delete section"
                            style={{ borderRadius: '6px', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}
                          >
                            <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-14"></iconify-icon>
                          </button>
                        </div>
                      </div>

                      {/* Section Card Content Body */}
                      <div className="p-4" style={{ padding: '24px 28px' }}>
                        {/* Section Heading Input */}
                        <div className="mb-4">
                          <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                            Section Heading <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Technical Specifications, Key Protection Features, Material Standards..."
                            value={section.heading}
                            onChange={(e) => handleUpdateHeading(section.id, e.target.value)}
                            style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '14px', height: '42px', fontWeight: 500 }}
                          />
                        </div>

                        {/* Type 1: Paragraph Description (Well-Padded) */}
                        {section.type === 'description' && (
                          <div>
                            <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                              Section Paragraph Description
                            </label>
                            <textarea
                              className="form-control"
                              rows={5}
                              placeholder="Enter comprehensive paragraph description, product background, guidelines, or details..."
                              value={section.description || ''}
                              onChange={(e) => handleUpdateDescription(section.id, e.target.value)}
                              style={{
                                borderRadius: '10px',
                                borderColor: '#cbd5e1',
                                fontSize: '14px',
                                lineHeight: '1.65',
                                padding: '16px 18px',
                              }}
                            ></textarea>
                            <div className="form-text fs-12 text-muted mt-2">
                              Renders as formatted paragraph text under this section heading on the storefront product page.
                            </div>
                          </div>
                        )}

                        {/* Type 2: Point by Point (Well-Padded & Aligned) */}
                        {section.type === 'points' && (
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <div>
                                <label className="form-label fs-13 fw-semibold text-dark mb-0">
                                  Point-by-Point Specification Items
                                </label>
                                <span className="text-muted fs-12 d-block">
                                  Define point headings and descriptions for bulleted specifications.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddPoint(section.id)}
                                className="btn btn-sm btn-dark d-flex align-items-center gap-1.5 text-white"
                                style={{
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  padding: '7px 16px',
                                  backgroundColor: '#0f172a',
                                  border: '1px solid #0f172a',
                                  fontWeight: 500,
                                }}
                              >
                                <iconify-icon icon="solar:add-circle-bold" class="fs-15"></iconify-icon>
                                <span>+ Add Another Point</span>
                              </button>
                            </div>

                            <div className="d-flex flex-column gap-3">
                              {section.points?.map((pt, ptIndex) => (
                                <div
                                  key={pt.id}
                                  className="rounded-3 border d-flex align-items-start gap-3"
                                  style={{
                                    padding: '18px 20px',
                                    backgroundColor: '#f8fafc',
                                    borderColor: '#e2e8f0',
                                  }}
                                >
                                  {/* Number Circle Badge */}
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      backgroundColor: '#0f172a',
                                      fontSize: '11px',
                                      marginTop: '28px',
                                    }}
                                  >
                                    {ptIndex + 1}
                                  </div>

                                  {/* Point Heading (e.g. "Outer Shell" or "Certification") */}
                                  <div style={{ width: '32%', minWidth: '160px' }}>
                                    <label className="form-label fs-12 text-dark mb-1.5 fw-semibold">
                                      Point Heading / Label (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="e.g. Shell Material"
                                      value={pt.heading || ''}
                                      onChange={(e) => handleUpdatePointHeading(section.id, pt.id, e.target.value)}
                                      style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13px', height: '40px' }}
                                    />
                                  </div>

                                  {/* Point Description / Value */}
                                  <div className="flex-grow-1">
                                    <label className="form-label fs-12 text-dark mb-1.5 fw-semibold">
                                      Point Description / Detail <span className="text-danger">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="e.g. High-density polycarbonate with ventilation slots..."
                                      value={pt.text}
                                      onChange={(e) => handleUpdatePointText(section.id, pt.id, e.target.value)}
                                      style={{ borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13px', height: '40px' }}
                                    />
                                  </div>

                                  {/* Remove Point */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePoint(section.id, pt.id)}
                                    className="btn btn-sm text-danger flex-shrink-0"
                                    title="Remove this point"
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '8px',
                                      border: '1px solid #fee2e2',
                                      backgroundColor: '#fef2f2',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginTop: '26px',
                                      padding: 0,
                                    }}
                                  >
                                    <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-17"></iconify-icon>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add New Section Buttons Bar */}
                  <div
                    className="rounded-3 border d-flex align-items-center justify-content-center gap-3 flex-wrap"
                    style={{
                      padding: '24px 28px',
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAddSection('points')}
                      className="btn btn-dark btn-sm d-flex align-items-center gap-2 px-4 py-2 text-white"
                      style={{
                        borderRadius: '8px',
                        fontSize: '13px',
                        padding: '10px 22px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #0f172a',
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                      }}
                    >
                      <iconify-icon icon="solar:list-check-bold" class="fs-17"></iconify-icon>
                      <span>+ Add Point-by-Point Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddSection('description')}
                      className="btn btn-light border btn-sm d-flex align-items-center gap-2 px-4 py-2"
                      style={{
                        borderRadius: '8px',
                        fontSize: '13px',
                        padding: '10px 22px',
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        color: '#374151',
                        fontWeight: 500,
                      }}
                    >
                      <iconify-icon icon="solar:text-bold" class="fs-17"></iconify-icon>
                      <span>+ Add Paragraph Section</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW MODE */
            <div className="rounded-3 border" style={{ padding: '28px', backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="mb-4 pb-3 border-bottom d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="fw-bold text-dark mb-1">Customer Storefront View Preview</h4>
                  <p className="text-muted fs-13 mb-0">How these specifications and details will appear on the product details page.</p>
                </div>
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 fs-12">
                  Live Preview Mode
                </span>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-5 text-muted fs-13">No specifications configured to preview yet.</div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {sections.map((sec, idx) => (
                    <div key={sec.id} className="pb-3 border-bottom">
                      <h4 className="fw-bold text-dark fs-17 mb-2 d-flex align-items-center gap-2">
                        <span className="text-primary fs-14">#{idx + 1}</span>
                        <span>{sec.heading || 'Untitled Section'}</span>
                      </h4>

                      {sec.type === 'description' ? (
                        <p className="text-muted fs-14 mb-0" style={{ lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                          {sec.description || 'No description provided.'}
                        </p>
                      ) : (
                        <div className="row g-3 mt-1">
                          {sec.points && sec.points.length > 0 ? (
                            sec.points.map((pt) => (
                              <div key={pt.id} className="col-12 col-md-6">
                                <div
                                  className="rounded-3 border h-100 d-flex align-items-start gap-2.5"
                                  style={{ padding: '14px 16px', backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}
                                >
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 text-success"
                                    style={{ width: '22px', height: '22px', backgroundColor: '#dcfce7', marginTop: '2px' }}
                                  >
                                    <iconify-icon icon="solar:check-circle-bold" class="fs-14"></iconify-icon>
                                  </div>
                                  <div>
                                    {pt.heading && (
                                      <strong className="d-block text-dark fs-13 mb-0.5">{pt.heading}</strong>
                                    )}
                                    <span className="text-muted fs-13" style={{ lineHeight: '1.45' }}>
                                      {pt.text || 'Point detail'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-muted fs-13">No points added.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProductSpecificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-5 text-center" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
          <div className="spinner-border text-dark spinner-border-sm me-2" role="status"></div>
          <span className="text-muted">Loading specifications editor...</span>
        </div>
      }
    >
      <SpecificationsEditor />
    </Suspense>
  );
}
