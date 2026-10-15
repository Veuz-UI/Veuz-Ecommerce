'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SystemColor, SYSTEM_COLORS } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';
import { processProductStudioPhoto } from '@/utils/productStudio';

interface ColorGalleryDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: string[];
  sizes: string[];
  onAddColor?: (colorName: string) => void;
  onAddSize?: (size: string) => void;
  colorImages: Record<string, string[]>;
  onSaveColorImages: (newColorImages: Record<string, string[]>) => void;
  colorSizes: Record<string, string[]>;
  onSaveColorSizes: (newColorSizes: Record<string, string[]>) => void;
  imageOnly?: boolean;
  onSaveMainPhotos?: (photos: string[]) => void;
  mainPhotos?: {
    cover: string;
    angles: string[];
  };
  productTitle?: string;
  allSystemColors?: SystemColor[];
}

const SLOT_CONFIGS = [
  { index: 0, label: '★ Front View (Cover)', required: true, icon: 'solar:camera-bold' },
  { index: 1, label: 'Side View', required: true, icon: 'solar:box-minimalistic-bold' },
  { index: 2, label: 'Top View', required: true, icon: 'solar:align-top-bold' },
  { index: 3, label: 'Back View', required: true, icon: 'solar:refresh-square-bold' },
  { index: 4, label: 'Detail / 45° View', required: false, icon: 'solar:magnifer-zoom-in-bold' },
];

export default function ColorGalleryDrawerModal({
  isOpen,
  onClose,
  colors,
  sizes,
  onAddColor,
  onAddSize,
  colorImages,
  onSaveColorImages,
  colorSizes,
  onSaveColorSizes,
  imageOnly = false,
  onSaveMainPhotos,
  mainPhotos,
  productTitle,
  allSystemColors = SYSTEM_COLORS,
}: ColorGalleryDrawerModalProps) {
  const { showToast } = useToast();

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const [activeColor, setActiveColor] = useState<string>('');
  const [localColorImages, setLocalColorImages] = useState<Record<string, string[]>>({});
  const [localColorSizes, setLocalColorSizes] = useState<Record<string, string[]>>({});
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // New color inline adder inside modal
  const [isAddingInlineColor, setIsAddingInlineColor] = useState<boolean>(false);
  const [inlineColorInput, setInlineColorInput] = useState<string>('');
  const [isAddingInlineSize, setIsAddingInlineSize] = useState<boolean>(false);
  const [inlineSizeInput, setInlineSizeInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentSlotRef = useRef<number>(0);

  // Sync state when modal opens or colorImages changes
  useEffect(() => {
    if (isOpen) {
      const mainPhotoSet = [mainPhotos?.cover || '', ...(mainPhotos?.angles || [])].slice(0, 5);
      setLocalColorImages(colors.length ? (colorImages ? { ...colorImages } : {}) : { __main__: mainPhotoSet });
      setLocalColorSizes(colorSizes ? { ...colorSizes } : {});
      if (colors.length > 0) {
        if (!activeColor || !colors.includes(activeColor)) {
          setActiveColor(colors[0]);
        }
      } else {
        setActiveColor('__main__');
      }
    }
  }, [isOpen, colors, colorImages, colorSizes]);

  // Ensure active color exists when colors list updates
  useEffect(() => {
    if (colors.length > 0 && (!activeColor || !colors.includes(activeColor))) {
      setActiveColor(colors[0]);
    } else if (colors.length === 0 && activeColor !== '__main__') {
      setActiveColor('__main__');
    }
  }, [colors, activeColor]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => setIsClosing(false));
      return () => cancelAnimationFrame(frame);
    }

    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setShouldRender(false), 260);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender || typeof document === 'undefined') return null;

  // Active color images array (guaranteed 5 items)
  const currentImages: string[] = (() => {
    if (!activeColor) return ['', '', '', '', ''];
    const list = localColorImages[activeColor] || [];
    const padded = [...list];
    while (padded.length < 5) padded.push('');
    return padded.slice(0, 5);
  })();

  const filledCount = currentImages.filter((img) => Boolean(img && img.trim())).length;
  const isMeetsRequirement = filledCount >= 4;
  const activeLabel = activeColor === '__main__' ? 'Main Product' : activeColor;

  // Color hex lookup
  const getColorHex = (name: string) => {
    if (name === '__main__') return '#64748b';
    const found = allSystemColors.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return found ? found.hex : '#64748b';
  };

  // Upload handler for a specific slot
  const handleSlotUploadClick = (slotIdx: number) => {
    currentSlotRef.current = slotIdx;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input to allow re-selecting same file if desired
    e.target.value = '';
    if (!file || !activeColor) return;

    const slotIdx = currentSlotRef.current;
    setIsUploading(true);
    setUploadingSlot(slotIdx);

    try {
      showToast(
        'info',
        autoRemoveBg
          ? 'Removing background with AI & standardizing...'
          : 'Uploading product photo...',
        'Processing'
      );

      // Process through AI Studio pipeline (removes background + 1:1 square focus on 100% transparent canvas)
      const { file: processedFile, dataUrl } = await processProductStudioPhoto(file, {
        removeBackground: autoRemoveBg,
        standardizeSize: true,
        backgroundColor: 'transparent',
        canvasSize: 1000,
        paddingPercent: 6,
      });

      // Show immediate local preview
      setLocalColorImages((prev) => {
        const curList = [...(prev[activeColor] || ['', '', '', '', ''])];
        while (curList.length < 5) curList.push('');
        curList[slotIdx] = dataUrl;
        return {
          ...prev,
          [activeColor]: curList,
        };
      });

      const formData = new FormData();
      formData.append('file', processedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.url) {
        throw new Error(json.message || 'Image upload failed');
      }

      const uploadedUrl = json.url;

      setLocalColorImages((prev) => {
        const curList = [...(prev[activeColor] || ['', '', '', '', ''])];
        while (curList.length < 5) curList.push('');
        curList[slotIdx] = uploadedUrl;
        return {
          ...prev,
          [activeColor]: curList,
        };
      });

      showToast(
        'success',
        autoRemoveBg
          ? `AI removed background & centered photo for ${activeLabel} (${SLOT_CONFIGS[slotIdx].label})!`
          : `Photo updated for ${activeLabel} (${SLOT_CONFIGS[slotIdx].label})!`,
        'Photo Ready'
      );
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast('danger', err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
      setUploadingSlot(null);
    }
  };

  // Remove photo from slot
  const handleRemovePhoto = (slotIdx: number) => {
    if (!activeColor) return;
    setLocalColorImages((prev) => {
      const curList = [...(prev[activeColor] || ['', '', '', '', ''])];
      while (curList.length < 5) curList.push('');
      curList[slotIdx] = '';
      return {
        ...prev,
        [activeColor]: curList,
      };
    });
  };

  // Copy 5 photos from main product gallery
  const handleCopyFromMain = () => {
    if (!activeColor || !mainPhotos) return;
    const copied: string[] = [
      mainPhotos.cover || '',
      mainPhotos.angles[0] || '',
      mainPhotos.angles[1] || '',
      mainPhotos.angles[2] || '',
      mainPhotos.angles[3] || '',
    ];

    setLocalColorImages((prev) => ({
      ...prev,
      [activeColor]: copied,
    }));

    showToast('info', `Main 5 photos copied to ${activeColor}. You can replace any angle photo.`, 'Photos Copied');
  };

  // Clear all 5 photos for active color
  const handleClearColorPhotos = () => {
    if (!activeColor) return;
    setLocalColorImages((prev) => ({
      ...prev,
      [activeColor]: ['', '', '', '', ''],
    }));
    showToast('info', `Photos cleared for ${activeColor}.`);
  };

  const toggleSizeForActiveColor = (size: string) => {
    if (!activeColor) return;
    setLocalColorSizes((prev) => {
      const assigned = prev[activeColor] || [];
      return {
        ...prev,
        [activeColor]: assigned.includes(size) ? assigned.filter((item) => item !== size) : [...assigned, size],
      };
    });
  };

  // Inline add color
  const handleAddInlineColorSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inlineColorInput.trim();
    if (!trimmed) return;

    if (onAddColor) {
      onAddColor(trimmed);
    }
    setActiveColor(trimmed);
    setInlineColorInput('');
    setIsAddingInlineColor(false);
    showToast('success', `Color "${trimmed}" added! Now add its 5 photos.`, 'Color Added');
  };

  const handleAddInlineSizeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inlineSizeInput.trim();
    if (!trimmed) return;
    onAddSize?.(trimmed);
    setInlineSizeInput('');
    setIsAddingInlineSize(false);
    showToast('success', `Size "${trimmed}" added to this product.`, 'Size Added');
  };

  // Save and validate - Strictly enforce minimum 4 photos for EVERY selected color!
  const handleSaveAndClose = () => {
    if (colors.length > 0) {
      const incompleteColors: { name: string; count: number }[] = [];
      colors.forEach((col) => {
        const imgs = (localColorImages[col] || []).filter((u) => Boolean(u && u.trim()));
        if (imgs.length < 4) {
          incompleteColors.push({ name: col, count: imgs.length });
        }
      });

      if (incompleteColors.length > 0) {
        const details = incompleteColors.map((ic) => `"${ic.name}" (${ic.count}/4 photos)`).join(', ');
        showToast(
          'danger',
          `Each selected color requires minimum 4 photos (Mandatory)! Incomplete: ${details}. Please upload at least 4 photos for each color.`,
          'Mandatory Photos Required'
        );
        // Automatically switch to first incomplete color tab so user can upload right away
        setActiveColor(incompleteColors[0].name);
        return;
      }
    } else {
      // If no color variants, check main photos
      const mainList = (localColorImages['__main__'] || []).filter((u) => Boolean(u && u.trim()));
      if (mainList.length < 4) {
        showToast(
          'danger',
          `Minimum 4 photos are mandatory for the product (${mainList.length}/4 uploaded). Please upload at least 4 angles.`,
          'Mandatory Photos Required'
        );
        return;
      }
    }

    const { __main__: mainPhotosForProduct, ...variantImages } = localColorImages;
    onSaveColorImages(variantImages);
    if (mainPhotosForProduct) onSaveMainPhotos?.(mainPhotosForProduct.slice(0, 5));
    onSaveColorSizes(localColorSizes);
    showToast('success', 'All color variant galleries validated and saved successfully!', 'Galleries Saved');
    onClose();
  };

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        zIndex: 110000,
        backgroundColor: 'rgba(15, 23, 42, 0.32)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        padding: '0',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="d-none"
      />

      {/* Centered product-detail style modal */}
      <div
        className="h-100 bg-white d-flex flex-column shadow-lg"
        style={{
          width: '720px',
          maxWidth: '100vw',
          height: '100%',
          borderRadius: '3px',
          overflow: 'hidden',
          animation: `${isClosing ? 'modalExitRight' : 'modalEnterRight'} 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CSS Keyframe Animation */}
        <style jsx>{`
          @keyframes modalEnterRight {
            from {
              opacity: 0;
              transform: translateX(100%) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
          @keyframes modalExitRight {
            from {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateX(100%) scale(0.985);
            }
          }
        `}</style>

        {/* 1. DRAWER HEADER */}
        <div
          className="border-bottom d-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            padding: '24px 28px 20px 28px',
            borderColor: '#e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="fs-18 fw-bold text-dark mb-0">Variants &amp; Product Images</h4>
              <span className="badge bg-light text-muted border px-2 py-0.5" style={{ fontSize: '11px' }}>
                Multi-Angle Studio
              </span>
            </div>
            <p className="text-muted fs-12 mb-0">
              {productTitle ? productTitle : 'Set each color, its available sizes, and up to 5 images.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn p-0 d-flex align-items-center justify-content-center transition-all flex-shrink-0"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0f172a';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#0f172a';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Close"
            title="Close Drawer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* 2. COLOR SELECTOR TABS & INLINE ADDER */}
        {(!imageOnly || colors.length > 0) && <div className="p-3 px-4 border-bottom flex-shrink-0" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
          {!imageOnly && <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="fs-12 fw-bold text-dark text-uppercase d-flex align-items-center gap-1.5">
              <iconify-icon icon="solar:palette-bold" class="fs-15 text-primary"></iconify-icon>
              <span>Available Colors ({colors.length})</span>
            </span>

            {/* Inline Add Color Button */}
            {!imageOnly && (!isAddingInlineColor ? (
              <button
                type="button"
                onClick={() => setIsAddingInlineColor(true)}
                className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1 py-1 px-2.5"
                style={{ fontSize: '11px', borderRadius: '6px' }}
              >
                <iconify-icon icon="solar:add-circle-bold" class="fs-14"></iconify-icon>
                <span>Add Color</span>
              </button>
            ) : (
              <form onSubmit={handleAddInlineColorSubmit} className="d-flex align-items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Neon Yellow"
                  value={inlineColorInput}
                  onChange={(e) => setInlineColorInput(e.target.value)}
                  autoFocus
                  className="form-control form-control-sm"
                  style={{ width: '140px', fontSize: '11.5px', height: '28px' }}
                />
                <button type="submit" className="btn btn-sm btn-dark py-0 px-2" style={{ height: '28px', fontSize: '11px' }}>
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingInlineColor(false)}
                  className="btn btn-sm btn-light border py-0 px-1.5 text-muted"
                  style={{ height: '28px', fontSize: '11px' }}
                >
                  ✕
                </button>
              </form>
            ))}
          </div>}

          {!imageOnly && <><div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <span className="fs-12 fw-bold text-dark text-uppercase d-flex align-items-center gap-1.5">
              <iconify-icon icon="solar:ruler-linear" class="fs-15 text-primary"></iconify-icon>
              <span>Available Sizes ({sizes.length})</span>
            </span>
            {!isAddingInlineSize ? (
              <button type="button" onClick={() => setIsAddingInlineSize(true)} className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1 py-1 px-2.5" style={{ fontSize: '11px', borderRadius: '6px' }}>
                <iconify-icon icon="solar:add-circle-bold" class="fs-14"></iconify-icon>
                <span>Add Size</span>
              </button>
            ) : (
              <form onSubmit={handleAddInlineSizeSubmit} className="d-flex align-items-center gap-1.5">
                <input type="text" placeholder="e.g. XXL" value={inlineSizeInput} onChange={(e) => setInlineSizeInput(e.target.value)} autoFocus className="form-control form-control-sm" style={{ width: '110px', fontSize: '11.5px', height: '28px' }} />
                <button type="submit" className="btn btn-sm btn-dark py-0 px-2" style={{ height: '28px', fontSize: '11px' }}>Add</button>
                <button type="button" onClick={() => setIsAddingInlineSize(false)} className="btn btn-sm btn-light border py-0 px-1.5 text-muted" style={{ height: '28px', fontSize: '11px' }}>×</button>
              </form>
            )}
          </div>
          <div className="d-flex flex-wrap gap-1.5 mb-3">
            {sizes.length ? sizes.map((size) => <span key={`setup-size-${size}`} className="badge bg-white text-dark border fw-medium" style={{ fontSize: '10.5px', padding: '4px 8px' }}>{size}</span>) : <span className="text-muted fs-11">No sizes added yet.</span>}
          </div>
          </>}

          {/* Color Tabs Row */}
          {colors.length > 0 && (
            <div className="d-flex align-items-center gap-2 flex-wrap" style={{ maxHeight: '110px', overflowY: 'auto' }}>
              {colors.map((colorName) => {
                const isActive = activeColor === colorName;
                const colHex = getColorHex(colorName);
                const colImgs = (localColorImages[colorName] || []).filter((u) => Boolean(u && u.trim()));
                const count = colImgs.length;
                const meetsReq = count >= 4;

                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setActiveColor(colorName)}
                    className="btn btn-sm d-flex align-items-center gap-2 position-relative"
                    style={{
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#ffffff' : '#1e293b',
                      border: isActive ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                      boxShadow: isActive ? '0 2px 6px rgba(15, 23, 42, 0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Color Swatch Dot */}
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: colHex,
                        border: colHex.toLowerCase() === '#ffffff' ? '1px solid #cbd5e1' : '1px solid rgba(0,0,0,0.1)',
                        flexShrink: 0,
                      }}
                    />
                    <span>{colorName}</span>

                    {/* Photo count indicator */}
                    <span
                      className={`badge ${meetsReq ? (isActive ? 'bg-success text-white' : 'bg-success-subtle text-success border border-success') : (isActive ? 'bg-warning text-dark' : 'bg-warning-subtle text-warning border border-warning')}`}
                      style={{ fontSize: '9.5px', padding: '2px 5px', borderRadius: '4px' }}
                    >
                      {count}/5
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>}

        {!imageOnly && colors.length > 0 && (
          <div className="px-4 py-3 border-bottom flex-shrink-0" style={{ borderColor: '#e2e8f0' }}>
            <div className="rounded-3 border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
              <table className="table table-sm align-middle mb-0" style={{ fontSize: '11px' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th className="px-3 py-2 text-muted fw-bold">COLOR</th>
                    <th className="px-3 py-2 text-muted fw-bold">AVAILABLE SIZES</th>
                    <th className="px-3 py-2 text-muted fw-bold text-center">PHOTOS</th>
                    <th className="px-3 py-2 text-muted fw-bold text-end">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((colorName) => {
                    const assignedSizes = localColorSizes[colorName] || [];
                    const photoCount = (localColorImages[colorName] || []).filter((url) => Boolean(url && url.trim())).length;
                    return (
                      <tr key={`variant-row-${colorName}`}>
                        <td className="px-3 py-2 fw-semibold text-dark">{colorName}</td>
                        <td className="px-3 py-2 text-muted">{assignedSizes.length ? assignedSizes.join(', ') : 'Not assigned'}</td>
                        <td className="px-3 py-2 text-center"><span className="badge bg-light text-dark border">{photoCount}/5</span></td>
                        <td className="px-3 py-2 text-end">
                          <button type="button" className="btn btn-sm btn-dark" style={{ fontSize: '10px', padding: '4px 8px' }} onClick={() => setActiveColor(colorName)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ACTIVE COLOR GALLERY CONTENT (SCROLLABLE) */}
        <div className="flex-grow-1 overflow-y-auto" style={{ padding: '24px 28px', backgroundColor: '#ffffff' }}>
          {!activeColor ? (
            colors.length === 0 ? (
              <div className="text-center py-4">
                <h5 className="fs-15 fw-bold text-dark mb-1">Main Product Image</h5>
                <p className="text-muted fs-12 mb-3">No color variants are configured for this product.</p>
                <div className="mx-auto rounded-3 border d-flex align-items-center justify-content-center overflow-hidden" style={{ width: 'min(100%, 360px)', height: '280px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  {mainPhotos?.cover ? (
                    <img src={mainPhotos.cover} alt={productTitle || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }} />
                  ) : (
                    <span className="text-muted fs-12">No main image uploaded.</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <iconify-icon icon="solar:palette-bold" class="fs-48 text-muted mb-2"></iconify-icon>
                <h5 className="fs-15 fw-bold text-dark">Select a color above</h5>
                <p className="text-muted fs-12">Choose one of the product colors to configure its sizes and images.</p>
              </div>
            )
          ) : (
            <div>
              {/* Active Color Info Card & Requirement Alert */}
              <div
                className="p-3 rounded-3 mb-3.5 d-flex align-items-center justify-content-between flex-wrap gap-2"
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <span
                    className="rounded-circle shadow-sm flex-shrink-0"
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: getColorHex(activeColor),
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 0 1px #cbd5e1',
                    }}
                  />
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="fs-14 fw-bold text-dark mb-0">{activeLabel} Gallery</h5>
                      <span
                        className={`badge ${isMeetsRequirement ? 'bg-success' : 'bg-warning text-dark'}`}
                        style={{ fontSize: '10px' }}
                      >
                        {filledCount}/5 Photos {isMeetsRequirement ? '✓ Requirement Met' : '⚠ Min 4 Required'}
                      </span>
                    </div>
                    <span className="text-muted fs-11">
                      {isMeetsRequirement
                        ? 'Ready for storefront! Meets mandatory 4-photo requirement.'
                        : 'Upload at least 4 photos (Front view + 3 other angles) for this color.'}
                    </span>
                  </div>
                </div>

                {/* AI Background Removal Toggle Switch */}
                <div className="form-check form-switch d-inline-flex align-items-center gap-1.5 m-0 flex-shrink-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="modalAutoRemoveBg"
                    checked={autoRemoveBg}
                    onChange={(e) => setAutoRemoveBg(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label fs-11 fw-semibold text-dark" htmlFor="modalAutoRemoveBg" style={{ cursor: 'pointer' }}>
                    <span className="badge me-1" style={{ fontSize: '9px', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}>AI</span>
                    Auto-Remove BG
                  </label>
                </div>
              </div>

              {!imageOnly && <div className="p-3 rounded-3 mb-3.5" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                  <span className="fs-12 fw-bold text-dark">Assign sizes for {activeColor}</span>
                  <span className="text-muted fs-11">Select only sizes available in this color.</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {sizes.length ? sizes.map((size) => {
                    const selected = (localColorSizes[activeColor] || []).includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSizeForActiveColor(size)}
                        className="btn btn-sm"
                        style={{ minWidth: '42px', fontSize: '11px', backgroundColor: selected ? '#0f172a' : '#ffffff', color: selected ? '#ffffff' : '#334155', border: selected ? '1px solid #0f172a' : '1px solid #cbd5e1' }}
                      >
                        {size}
                      </button>
                    );
                  }) : <span className="text-muted fs-11">Add product sizes first, then assign them to this color.</span>}
                </div>
              </div>
              }

              {/* Requirement Alert banner if < 4 photos */}
              {!isMeetsRequirement && (
                <div
                  className="alert alert-warning py-2 px-3 fs-12 mb-3.5 d-flex align-items-center gap-2"
                  style={{ borderRadius: '8px', border: '1px solid #fde68a' }}
                >
                  <iconify-icon icon="solar:info-circle-bold" class="fs-17 text-warning flex-shrink-0"></iconify-icon>
                  <div>
                    <strong>Minimum 4 photos mandatory:</strong> You have {filledCount} photo{filledCount === 1 ? '' : 's'}. Please add {4 - filledCount} more to fulfill store requirements.
                  </div>
                </div>
              )}

              {/* 5 PHOTO SLOTS CARDS */}
              <div className="row g-3">
                {SLOT_CONFIGS.map((slot) => {
                  const photoUrl = currentImages[slot.index] || '';
                  const hasPhoto = Boolean(photoUrl && photoUrl.trim());
                  const isCurrentUploading = isUploading && uploadingSlot === slot.index;

                  return (
                    <div key={slot.index} className={slot.index === 0 ? 'col-12' : 'col-6'}>
                      <div
                        className="rounded-3 border h-100 d-flex flex-column justify-content-between position-relative"
                        style={{
                          padding: '12px 14px',
                          backgroundColor: hasPhoto ? '#ffffff' : '#f8fafc',
                          borderColor: hasPhoto ? '#cbd5e1' : '#e2e8f0',
                          borderStyle: hasPhoto ? 'solid' : 'dashed',
                          borderWidth: hasPhoto ? '1px' : '1.5px',
                          boxShadow: hasPhoto ? '0 1px 4px rgba(0,0,0,0.03)' : 'none',
                        }}
                      >
                        {/* Slot Header */}
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <div className="d-flex align-items-center gap-1.5">
                            <span
                              className={`badge ${
                                slot.index === 0
                                  ? 'bg-dark text-white'
                                  : slot.required
                                  ? 'bg-secondary text-white'
                                  : 'bg-light text-muted border'
                              }`}
                              style={{
                                fontSize: '10.5px',
                                padding: '3.5px 7px',
                                borderRadius: '5px',
                                fontWeight: 600,
                              }}
                            >
                              {slot.label}
                            </span>
                            {slot.required && (
                              <span className="text-danger fs-12 fw-bold" title="Mandatory photo">*</span>
                            )}
                          </div>

                          {hasPhoto && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(slot.index)}
                              className="btn btn-sm d-flex align-items-center gap-1 text-danger border-0 px-2 py-0.5"
                              style={{ fontSize: '11px', borderRadius: '5px', backgroundColor: '#fef2f2', fontWeight: 500 }}
                              title="Remove photo"
                            >
                              <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-13"></iconify-icon>
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {/* Image Preview Area */}
                        <div
                          className="rounded-2 border overflow-hidden position-relative mx-auto d-flex align-items-center justify-content-center my-1"
                          style={{
                            width: '100%',
                            height: slot.index === 0 ? '128px' : '96px',
                            backgroundColor: hasPhoto ? '#ffffff' : '#f8fafc',
                            borderColor: '#e2e8f0',
                          }}
                        >
                          {hasPhoto ? (
                            <img
                              src={photoUrl}
                              alt={`${activeLabel} - ${slot.label}`}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-center py-2 px-2 d-flex flex-column align-items-center justify-content-center">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                                style={{
                                  width: slot.index === 0 ? '36px' : '28px',
                                  height: slot.index === 0 ? '36px' : '28px',
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                <iconify-icon icon={slot.icon} class={slot.index === 0 ? 'fs-18' : 'fs-14'}></iconify-icon>
                              </div>
                              <span className="fw-semibold text-secondary" style={{ fontSize: '11px', letterSpacing: '0.1px' }}>
                                {slot.label} Placeholder
                              </span>
                              <span className="text-muted" style={{ fontSize: '9.5px' }}>
                                {slot.required ? 'Mandatory slot' : 'Optional angle'}
                              </span>
                            </div>
                          )}

                          {/* Uploading Spinner Overlay */}
                          {isCurrentUploading && (
                            <div
                              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                              style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)' }}
                            >
                              <div className="spinner-border spinner-border-sm text-dark mb-1" role="status"></div>
                              <span className="fs-10 fw-bold text-dark">Uploading...</span>
                            </div>
                          )}
                        </div>

                        {/* Slot Action Button */}
                        <div className="mt-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
                          <button
                            type="button"
                            onClick={() => handleSlotUploadClick(slot.index)}
                            disabled={isUploading}
                            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-1.5 fw-semibold transition-all"
                            style={{
                              height: '34px',
                              borderRadius: '7px',
                              fontSize: '11.5px',
                              backgroundColor: hasPhoto
                                ? '#ffffff'
                                : slot.index === 0
                                ? '#0f172a'
                                : '#ffffff',
                              color: hasPhoto
                                ? '#1e293b'
                                : slot.index === 0
                                ? '#ffffff'
                                : '#0f172a',
                              border: hasPhoto
                                ? '1px solid #cbd5e1'
                                : slot.index === 0
                                ? 'none'
                                : '1px solid #cbd5e1',
                              boxShadow: slot.index === 0 && !hasPhoto
                                ? '0 2px 4px rgba(15, 23, 42, 0.15)'
                                : '0 1px 2px rgba(0, 0, 0, 0.04)',
                              cursor: isUploading ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <iconify-icon
                              icon={hasPhoto ? 'solar:refresh-bold' : 'solar:camera-add-bold'}
                              class="fs-14"
                            ></iconify-icon>
                            <span>{hasPhoto ? 'Replace Image' : 'Upload Image'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. DRAWER FOOTER (SAVE & APPLY) */}
        <div
          className="border-top d-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            minHeight: '74px',
            padding: '16px 28px',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="fs-12 text-muted fw-medium">
              {colors.length} color{colors.length === 1 ? '' : 's'} configured
            </span>
          </div>

          <div className="d-flex align-items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-light border fw-medium"
              style={{ minWidth: '96px', height: '38px', borderRadius: '7px', fontSize: '13px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="btn btn-sm btn-dark px-3.5 d-flex align-items-center gap-1.5 fw-semibold"
              style={{ minWidth: '165px', height: '38px', justifyContent: 'center', borderRadius: '7px', fontSize: '13px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)' }}
            >
              <iconify-icon icon="solar:check-circle-bold" class="fs-16 text-success"></iconify-icon>
              <span>Apply Color Photos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}
