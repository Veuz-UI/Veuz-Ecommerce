'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateProduct } from '@/services/productsService';
import { ProductItem, TechnicalSpecification } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';

interface StandardSpecsState {
  productName: string;
  brand: string;
  modelNo: string;
  standards: string;
  protectionRating: string;
  material: string;
  weight: string;
  sizes: string;
  color: string;
  temperatureRange: string;
  application: string;
  warranty: string;
}

interface CustomSpecItem {
  id: string;
  label: string;
  value: string;
}

function SpecificationsEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const productId = searchParams.get('id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  // Form states
  const [standardSpecs, setStandardSpecs] = useState<StandardSpecsState>({
    productName: '',
    brand: '',
    modelNo: '',
    standards: '',
    protectionRating: '',
    material: '',
    weight: '',
    sizes: '',
    color: '',
    temperatureRange: '',
    application: '',
    warranty: '',
  });

  const [customSpecs, setCustomSpecs] = useState<CustomSpecItem[]>([]);
  const [overview, setOverview] = useState<string>('');

  // Load Product and populate specification fields
  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const loadProductData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}&includeDrafts=true`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const found: ProductItem = json.data;
            setProduct(found);

            if (found.technicalSpecs && Array.isArray(found.technicalSpecs) && found.technicalSpecs.length > 0) {
              // Populate from existing technicalSpecs
              const std: StandardSpecsState = {
                productName: '',
                brand: '',
                modelNo: '',
                standards: found.standard || '',
                protectionRating: '',
                material: '',
                weight: '',
                sizes: found.sizes?.join(', ') || '',
                color: found.colors?.join(', ') || '',
                temperatureRange: '',
                application: '',
                warranty: '',
              };
              const custom: CustomSpecItem[] = [];

              found.technicalSpecs.forEach((spec) => {
                const l = spec.label.toLowerCase();
                if (l.includes('product name') || l === 'name') std.productName = spec.value;
                else if (l.includes('brand') || l.includes('manufacturer')) std.brand = spec.value;
                else if (l.includes('model') || l.includes('part number') || l.includes('item code')) std.modelNo = spec.value;
                else if (l.includes('standard') || l.includes('certification') || l.includes('compliance')) std.standards = spec.value;
                else if (l.includes('protection') || l.includes('rating') || l.includes('class')) std.protectionRating = spec.value;
                else if (l.includes('material')) std.material = spec.value;
                else if (l.includes('weight')) std.weight = spec.value;
                else if (l.includes('size')) std.sizes = spec.value;
                else if (l.includes('color') || l.includes('finish')) std.color = spec.value;
                else if (l.includes('temp') || l.includes('temperature') || l.includes('environmental')) std.temperatureRange = spec.value;
                else if (l.includes('application') || l.includes('industry') || l.includes('usage')) std.application = spec.value;
                else if (l.includes('warranty') || l.includes('shelf life') || l.includes('lifespan')) std.warranty = spec.value;
                else {
                  custom.push({ id: spec.id || `cs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, label: spec.label, value: spec.value });
                }
              });

              if (!std.productName) std.productName = found.title || '';
              if (!std.standards && found.standard) std.standards = found.standard;
              if (!std.sizes && found.sizes && found.sizes.length > 0) std.sizes = found.sizes.join(', ');
              if (!std.color && found.colors && found.colors.length > 0) std.color = found.colors.join(', ');

              setStandardSpecs(std);
              setCustomSpecs(custom);
              setOverview(found.specificationsOverview || '');
            } else if (found.specifications && Array.isArray(found.specifications) && found.specifications.length > 0) {
              // Legacy migration from sections
              const std: StandardSpecsState = {
                productName: found.title || '',
                brand: '',
                modelNo: '',
                standards: found.standard || '',
                protectionRating: '',
                material: '',
                weight: '',
                sizes: found.sizes?.join(', ') || '',
                color: found.colors?.join(', ') || '',
                temperatureRange: '',
                application: '',
                warranty: '',
              };
              const custom: CustomSpecItem[] = [];
              let foundOverview = '';

              found.specifications.forEach((sec) => {
                if (sec.type === 'description' && sec.description) {
                  if (!foundOverview) foundOverview = sec.description;
                } else if (sec.points && Array.isArray(sec.points)) {
                  sec.points.forEach((pt) => {
                    let label = pt.heading || '';
                    let value = pt.text || '';
                    if (!label && value.includes(':')) {
                      const colonIdx = value.indexOf(':');
                      label = value.slice(0, colonIdx).trim();
                      value = value.slice(colonIdx + 1).trim();
                    }
                    if (!label) label = 'Specification';

                    const l = label.toLowerCase();
                    if (l.includes('product name') || l === 'name') std.productName = value;
                    else if (l.includes('brand') || l.includes('manufacturer')) std.brand = value;
                    else if (l.includes('model') || l.includes('part number') || l.includes('item code')) std.modelNo = value;
                    else if (l.includes('standard') || l.includes('certification') || l.includes('compliance')) std.standards = value;
                    else if (l.includes('protection') || l.includes('rating') || l.includes('class')) std.protectionRating = value;
                    else if (l.includes('material')) std.material = value;
                    else if (l.includes('weight')) std.weight = value;
                    else if (l.includes('size')) std.sizes = value;
                    else if (l.includes('color') || l.includes('finish')) std.color = value;
                    else if (l.includes('temp') || l.includes('temperature') || l.includes('environmental')) std.temperatureRange = value;
                    else if (l.includes('application') || l.includes('industry') || l.includes('usage')) std.application = value;
                    else if (l.includes('warranty') || l.includes('shelf life') || l.includes('lifespan')) std.warranty = value;
                    else {
                      custom.push({ id: pt.id || `cs-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, label, value });
                    }
                  });
                }
              });

              setStandardSpecs(std);
              setCustomSpecs(custom);
              setOverview(foundOverview);
            } else {
              // Default prefill from product base data
              setStandardSpecs({
                productName: found.title || '',
                brand: '',
                modelNo: '',
                standards: found.standard || '',
                protectionRating: '',
                material: '',
                weight: '',
                sizes: found.sizes?.join(', ') || '',
                color: found.colors?.join(', ') || '',
                temperatureRange: '',
                application: '',
                warranty: '',
              });
              setCustomSpecs([]);
              setOverview('');
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

  // Handle standard specs field changes
  const handleStandardChange = (field: keyof StandardSpecsState, value: string) => {
    setStandardSpecs((prev) => ({ ...prev, [field]: value }));
  };

  // Add custom specification row
  const handleAddCustomSpec = () => {
    setCustomSpecs((prev) => [
      ...prev,
      { id: `cs-${Date.now()}`, label: '', value: '' },
    ]);
  };

  // Update custom specification
  const handleUpdateCustomSpec = (id: string, field: 'label' | 'value', val: string) => {
    setCustomSpecs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  // Remove custom specification
  const handleRemoveCustomSpec = (id: string) => {
    setCustomSpecs((prev) => prev.filter((item) => item.id !== id));
  };

  // Compile active specifications list for table display / saving
  const getCompiledSpecs = (): TechnicalSpecification[] => {
    const list: TechnicalSpecification[] = [];

    const addIfFilled = (id: string, label: string, val: string) => {
      if (val && val.trim().length > 0) {
        list.push({ id, label, value: val.trim() });
      }
    };

    addIfFilled('spec-pname', 'Product Name', standardSpecs.productName);
    addIfFilled('spec-brand', 'Brand / Manufacturer', standardSpecs.brand);
    addIfFilled('spec-model', 'Model / Item Code', standardSpecs.modelNo);
    addIfFilled('spec-standards', 'Safety Standard & Certification', standardSpecs.standards);
    addIfFilled('spec-rating', 'Protection Level / Class', standardSpecs.protectionRating);
    addIfFilled('spec-weight', 'Product Weight', standardSpecs.weight);
    addIfFilled('spec-sizes', 'Available Sizes', standardSpecs.sizes);
    addIfFilled('spec-material', 'Primary Material', standardSpecs.material);
    addIfFilled('spec-color', 'Color / Finish', standardSpecs.color);
    addIfFilled('spec-temp', 'Operating Temperature Range', standardSpecs.temperatureRange);
    addIfFilled('spec-app', 'Recommended Application', standardSpecs.application);
    addIfFilled('spec-warranty', 'Warranty / Lifespan', standardSpecs.warranty);

    customSpecs.forEach((cs) => {
      if (cs.label.trim() && cs.value.trim()) {
        list.push({
          id: cs.id,
          label: cs.label.trim(),
          value: cs.value.trim(),
        });
      }
    });

    return list;
  };

  // Save specifications
  const handleSave = async () => {
    if (!product) return;

    const compiled = getCompiledSpecs();

    setIsSaving(true);
    try {
      const res = await updateProduct({
        ...product,
        standard: standardSpecs.standards.trim() || product.standard,
        technicalSpecs: compiled,
        specificationsOverview: overview.trim(),
        // Sync backward-compatible specifications structure
        specifications: compiled.length > 0 ? [
          ...(overview.trim() ? [{
            id: 'sec-overview',
            heading: 'Product Overview',
            type: 'description' as const,
            description: overview.trim(),
          }] : []),
          {
            id: 'sec-specs-table',
            heading: 'Technical Specifications',
            type: 'points' as const,
            points: compiled.map((s) => ({
              id: s.id,
              heading: s.label,
              text: s.value,
            })),
          }
        ] : [],
      });

      if (res.success) {
        showToast(
          'success',
          `Saved ${compiled.length} technical specifications for "${product.title}".`,
          'Specifications Saved'
        );
        router.push(`/dashboard/all-products/edit?id=${product.id}`);
      } else {
        showToast('danger', res.message || 'Failed to save specifications.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Network error saving specifications.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSpecsList = getCompiledSpecs();

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

          {/* 1. Breadcrumbs Navigation (Matching Dashboard Layout) */}
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
            <span className="text-dark fw-bold">Specifications Table</span>
          </div>

          {/* 2. Top Header Title & Save Button Bar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-3">
            <div>
              <h3 className="fw-bold text-dark mb-1" style={{ fontSize: '22px', letterSpacing: '-0.4px' }}>
                Product Specifications & Details
              </h3>
              <p className="text-muted fs-13 mb-0">
                Fill out structured safety specifications. Filled attributes are formatted as a clear specifications table on the product page.
              </p>
            </div>

            {/* Save Specifications Button */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-sm d-flex align-items-center gap-2 text-white"
                style={{
                  borderRadius: '8px',
                  padding: '10px 24px',
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

          {/* 3. Product Summary Context Banner */}
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
                className="d-flex align-items-center justify-content-center flex-shrink-0 overflow-hidden"
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
                {(() => {
                  const resolvedImg = (product.image && !product.image.includes('p1.jpg'))
                    ? product.image
                    : (product.colorImages && Object.values(product.colorImages).flat().find((u) => Boolean(u && typeof u === 'string' && !u.includes('p1.jpg')))) || '';

                  if (resolvedImg && !imageError) {
                    return (
                      <img
                        src={resolvedImg}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={() => setImageError(true)}
                      />
                    );
                  }

                  return (
                    <div className="d-flex flex-column align-items-center justify-content-center w-100 h-100 rounded-2" style={{ backgroundColor: '#f8fafc' }}>
                      <iconify-icon icon="solar:box-minimalistic-bold" class="fs-28 text-secondary opacity-75"></iconify-icon>
                    </div>
                  );
                })()}
              </div>

              <div>
                <h4
                  className="fw-bold text-dark mb-1"
                  style={{ fontSize: '16px', letterSpacing: '-0.3px', color: '#0f172a' }}
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
                    {activeSpecsList.length} Attributes Active in Table
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. MAIN CONTENT: SPECIFICATIONS FORM */}
          <div className="d-flex flex-column gap-4">

              {/* SECTION 1: CORE SAFETY SPECIFICATIONS */}
              <div
                className="rounded-3 border overflow-hidden"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' }}
              >
                <div
                  className="d-flex align-items-center justify-content-between border-bottom"
                  style={{ padding: '18px 28px', backgroundColor: '#fcfdfe', borderColor: '#f1f5f9' }}
                >
                  <div className="d-flex align-items-center gap-2.5">
                    <span
                      className="d-inline-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        height: '32px',
                        padding: '0 14px',
                        borderRadius: '6px',
                        backgroundColor: '#0f172a',
                        fontSize: '12px',
                        letterSpacing: '0.3px',
                      }}
                    >
                      Core Safety Specifications
                    </span>
                    <span className="text-muted fs-13">
                      Common technical attributes standard across safety equipment
                    </span>
                  </div>
                </div>

                <div style={{ padding: '28px 32px' }}>
                  <div
                    className="alert alert-light border py-2.5 px-3 rounded-3 d-flex align-items-center gap-2 mb-4"
                    style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                  >
                    <iconify-icon icon="solar:info-circle-bold" class="fs-18 text-primary flex-shrink-0"></iconify-icon>
                    <span className="fs-13 text-secondary">
                      Fill out the parameters relevant to this equipment. <strong>Empty fields are automatically excluded</strong> from the customer storefront table.
                    </span>
                  </div>

                  {/* Clean 2-Column Grid with Perfect Alignment and 24px Gaps */}
                  <div className="row g-4">
                    {/* Row 1: Product Name & Brand */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Product / Equipment Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Safety Rescue Kit / Hard Hat H-700"
                        value={standardSpecs.productName}
                        onChange={(e) => handleStandardChange('productName', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Brand / Manufacturer
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 3M, Honeywell, MSA Safety, Veuz Safety"
                        value={standardSpecs.brand}
                        onChange={(e) => handleStandardChange('brand', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    {/* Row 2: Safety Standards & Protection Level */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2 d-flex align-items-center gap-1.5">
                        <iconify-icon icon="solar:shield-check-bold" class="fs-15 text-success"></iconify-icon>
                        <span>Safety Standard &amp; Certification</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. EN 397:2012 / ANSI Z89.1 Type 1 / CE Certified / OSHA"
                        value={standardSpecs.standards}
                        onChange={(e) => handleStandardChange('standards', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Protection Level / Class / Rating
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Class E &amp; G / FFP3 / Cut Level 5 / Class A Fall Arrest"
                        value={standardSpecs.protectionRating}
                        onChange={(e) => handleStandardChange('protectionRating', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    {/* Row 3: Model & Primary Material */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Model / Item Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. H-700V, SF-900, SKU-4821"
                        value={standardSpecs.modelNo}
                        onChange={(e) => handleStandardChange('modelNo', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Primary Material
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. High-Density Polyethylene (HDPE), Kevlar, Steel"
                        value={standardSpecs.material}
                        onChange={(e) => handleStandardChange('material', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    {/* Row 4: Weight & Available Sizes */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Product Weight
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 30 kg, 450 grams, 1.2 kg"
                        value={standardSpecs.weight}
                        onChange={(e) => handleStandardChange('weight', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Available Sizes / Adjustment
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. M / L / XL, Universal Fit, 52-64 cm"
                        value={standardSpecs.sizes}
                        onChange={(e) => handleStandardChange('sizes', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    {/* Row 5: Color / Finish & Temperature Range */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Color / Finish
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Hi-Vis Yellow, White, Orange, Matte Black"
                        value={standardSpecs.color}
                        onChange={(e) => handleStandardChange('color', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Operating Temperature / Environmental Range
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. -30°C to +60°C / Flame Retardant"
                        value={standardSpecs.temperatureRange}
                        onChange={(e) => handleStandardChange('temperatureRange', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    {/* Row 6: Application & Warranty */}
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Recommended Application / Industry
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Construction, Fire Fighting, Electrical, Oil &amp; Gas"
                        value={standardSpecs.application}
                        onChange={(e) => handleStandardChange('application', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                        Warranty / Expiration / Shelf Life
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 5 Years Shelf Life from MFG Date, 1 Year Warranty"
                        value={standardSpecs.warranty}
                        onChange={(e) => handleStandardChange('warranty', e.target.value)}
                        style={{ height: '44px', padding: '0 16px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13.5px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CUSTOM SPECIFICATIONS (DYNAMIC KEY-VALUE ROWS) */}
              <div
                className="rounded-3 border overflow-hidden"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' }}
              >
                <div
                  className="d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom"
                  style={{ padding: '18px 28px', backgroundColor: '#fcfdfe', borderColor: '#f1f5f9' }}
                >
                  <div>
                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15px' }}>
                      Additional / Custom Specifications
                    </h5>
                    <p className="text-muted fs-12 mb-0">
                      Add any specific attributes unique to this product (e.g. Discharge Duration, Harness D-Rings, Breaking Load).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomSpec}
                    className="btn btn-sm btn-dark text-white d-inline-flex align-items-center gap-1.5 fw-semibold"
                    style={{ borderRadius: '8px', height: '36px', fontSize: '12.5px', padding: '0 18px', backgroundColor: '#0f172a' }}
                  >
                    <iconify-icon icon="solar:add-circle-bold" class="fs-16"></iconify-icon>
                    <span>+ Add Custom Spec Field</span>
                  </button>
                </div>

                <div style={{ padding: '28px 32px' }}>
                  {customSpecs.length === 0 ? (
                    <div className="text-center py-4 rounded-3 border border-dashed" style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }}>
                      <iconify-icon icon="solar:document-add-linear" class="fs-28 text-muted mb-1"></iconify-icon>
                      <p className="text-muted fs-13 mb-2">No custom specification rows added yet.</p>
                      <button
                        type="button"
                        onClick={handleAddCustomSpec}
                        className="btn btn-sm btn-outline-dark"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                      >
                        + Add Custom Specification
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {customSpecs.map((item, index) => (
                        <div
                          key={item.id}
                          className="d-flex align-items-center gap-3 p-3 rounded-3 border"
                          style={{ backgroundColor: '#fcfdfe', borderColor: '#e2e8f0' }}
                        >
                          <span
                            className="badge bg-light text-secondary border d-inline-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '12px', flexShrink: 0 }}
                          >
                            {index + 1}
                          </span>

                          <div className="flex-grow-1 row g-3">
                            <div className="col-12 col-md-5">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Specification Name (e.g. Cylinder Volume)"
                                value={item.label}
                                onChange={(e) => handleUpdateCustomSpec(item.id, 'label', e.target.value)}
                                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}
                              />
                            </div>
                            <div className="col-12 col-md-7">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Specification Value (e.g. 6 Litres / 300 Bar)"
                                value={item.value}
                                onChange={(e) => handleUpdateCustomSpec(item.id, 'value', e.target.value)}
                                style={{ height: '42px', padding: '0 14px', borderRadius: '8px', borderColor: '#cbd5e1', fontSize: '13px' }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCustomSpec(item.id)}
                            className="btn btn-sm btn-light border text-danger flex-shrink-0"
                            title="Delete this row"
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              borderColor: '#fee2e2',
                              backgroundColor: '#fef2f2',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-17"></iconify-icon>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: SAFETY OVERVIEW / COMPLIANCE NOTES (OPTIONAL) */}
              <div
                className="rounded-3 border overflow-hidden"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)' }}
              >
                <div
                  className="border-bottom"
                  style={{ padding: '18px 28px', backgroundColor: '#fcfdfe', borderColor: '#f1f5f9' }}
                >
                  <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15px' }}>
                    Specification Overview &amp; Safety Notes (Optional)
                  </h5>
                  <p className="text-muted fs-12 mb-0">
                    Optional general summary paragraph or inspection guidelines displayed alongside the specifications table.
                  </p>
                </div>
                <div style={{ padding: '28px 32px' }}>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="e.g. Heavy-duty industrial safety kit certified according to international EN and ANSI safety protocols. Recommended for construction, tower climbing, and high-altitude industrial maintenance."
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    style={{
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontSize: '13.5px',
                      lineHeight: '1.7',
                      padding: '16px 18px',
                    }}
                  ></textarea>
                </div>
              </div>

              {/* Bottom Action Save Bar */}
              <div
                className="rounded-3 border d-flex align-items-center justify-content-between p-3.5 mb-2"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', padding: '18px 24px' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <iconify-icon icon="solar:shield-check-bold" class="fs-20 text-success"></iconify-icon>
                  <span className="fs-13 text-secondary">
                    Total <strong>{activeSpecsList.length} specification rows</strong> will be rendered in the storefront table.
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-sm btn-dark text-white fw-semibold"
                    style={{
                      borderRadius: '8px',
                      padding: '10px 28px',
                      fontSize: '13.5px',
                      backgroundColor: '#0f172a',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)',
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Specifications'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
    </>
  );
}

export default function ProductSpecificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-fluid py-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2 fs-13">Loading specifications editor...</p>
        </div>
      }
    >
      <SpecificationsEditor />
    </Suspense>
  );
}
