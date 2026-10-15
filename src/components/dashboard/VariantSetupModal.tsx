'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PRESET_SIZES, SYSTEM_COLORS, SystemColor } from '@/data/categoryProductsData';
import {
  fetchAttributes,
  addCustomColor,
  addCustomSize,
  deleteCustomColor,
  deleteCustomSize,
  ATTRIBUTES_EVENT,
} from '@/services/attributesService';

type Mode = 'sizes' | 'colors';

interface VariantSetupModalProps {
  isOpen: boolean;
  mode: Mode;
  selected: string[];
  onChange: (items: string[]) => void;
  onClose: () => void;
}

function getColorNameFromHex(hex: string): string {
  const clean = hex.toLowerCase().trim();
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);

  const namedColors: [string, number, number, number][] = [
    ['Black', 0, 0, 0],
    ['White', 255, 255, 255],
    ['Red', 220, 38, 38],
    ['Dark Red', 153, 27, 27],
    ['Orange', 249, 115, 22],
    ['Rust Orange', 234, 88, 12],
    ['Amber', 245, 158, 11],
    ['Yellow', 234, 179, 8],
    ['Neon Lime', 132, 204, 22],
    ['Green', 22, 163, 74],
    ['Forest Green', 20, 83, 45],
    ['Teal', 13, 148, 136],
    ['Cyan', 6, 182, 212],
    ['Sky Blue', 14, 165, 233],
    ['Royal Blue', 37, 99, 235],
    ['Navy Blue', 30, 58, 138],
    ['Purple', 147, 51, 234],
    ['Hot Pink', 236, 72, 153],
    ['Rose', 225, 29, 72],
    ['Brown', 120, 53, 15],
    ['Slate Gray', 100, 116, 139],
    ['Charcoal', 30, 41, 59],
  ];

  let bestMatch = 'Custom Color';
  let minDistance = Infinity;

  for (const [name, cr, cg, cb] of namedColors) {
    const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = name;
    }
  }

  return bestMatch;
}

export default function VariantSetupModal({
  isOpen,
  mode,
  selected,
  onChange,
  onClose,
}: VariantSetupModalProps) {
  const colorInputRef = React.useRef<HTMLInputElement | null>(null);
  const [availableColors, setAvailableColors] = useState<SystemColor[]>(SYSTEM_COLORS);
  const [availableSizes, setAvailableSizes] = useState<string[]>(PRESET_SIZES);
  const [customValue, setCustomValue] = useState('');
  const [selectedHex, setSelectedHex] = useState('#ea580c');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [tempSelected, setTempSelected] = useState<string[]>(selected);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const data = await fetchAttributes();
        if (data.colors && Array.isArray(data.colors)) {
          setAvailableColors(data.colors);
        }
        if (data.sizes && Array.isArray(data.sizes)) {
          setAvailableSizes(data.sizes);
        }
      } catch (e) {
        // Fallback to presets
      }
    };

    if (isOpen) {
      setTempSelected(selected);
      setShouldRender(true);
      loadAttributes();
      const frame = requestAnimationFrame(() => setIsClosing(false));
      return () => cancelAnimationFrame(frame);
    }
    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setShouldRender(false), 240);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, shouldRender, selected]);

  useEffect(() => {
    const handleAttrsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (Array.isArray(customEvent.detail.colors)) {
          setAvailableColors(customEvent.detail.colors);
        }
        if (Array.isArray(customEvent.detail.sizes)) {
          setAvailableSizes(customEvent.detail.sizes);
        }
      }
    };
    window.addEventListener(ATTRIBUTES_EVENT, handleAttrsUpdated);
    return () => window.removeEventListener(ATTRIBUTES_EVENT, handleAttrsUpdated);
  }, []);

  if (!shouldRender || typeof document === 'undefined') return null;

  const isSize = mode === 'sizes';
  const defaults = isSize
    ? (availableSizes.length > 0 ? availableSizes : PRESET_SIZES)
    : (availableColors.length > 0 ? availableColors.map((color) => color.name) : SYSTEM_COLORS.map((color) => color.name));

  const title = isSize ? 'Manage Product Sizes' : 'Manage Product Colors';

  const toggle = (value: string) => {
    setTempSelected((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleDeleteItem = async (value: string) => {
    setDeletingItem(value);
    try {
      if (isSize) {
        const res = await deleteCustomSize(value);
        if (res.success && res.data && Array.isArray(res.data.sizes)) {
          setAvailableSizes(res.data.sizes);
        } else {
          setAvailableSizes((prev) => prev.filter((s) => s.toLowerCase() !== value.toLowerCase()));
        }
      } else {
        const res = await deleteCustomColor(value);
        if (res.success && res.data && Array.isArray(res.data.colors)) {
          setAvailableColors(res.data.colors);
        } else {
          setAvailableColors((prev) => prev.filter((c) => c.name.toLowerCase() !== value.toLowerCase()));
        }
      }

      setTempSelected((prev) => prev.filter((item) => item.toLowerCase() !== value.toLowerCase()));
    } catch (err) {
      console.error('Error deleting attribute item:', err);
    } finally {
      setDeletingItem(null);
    }
  };

  const handleAddPickedColor = async () => {
    const hex = selectedHex.toLowerCase().trim();
    const existingSameHex = availableColors.find((c) => c.hex.toLowerCase() === hex);
    let name = existingSameHex ? existingSameHex.name : getColorNameFromHex(hex);
    if (!existingSameHex && availableColors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      name = `${name} (${hex.toUpperCase()})`;
    }

    setIsSavingCustom(true);
    try {
      // 1. Save to backend /api/attributes so it persists in the default list permanently
      const res = await addCustomColor(name, hex);
      if (res.success && res.data && Array.isArray(res.data.colors)) {
        setAvailableColors(res.data.colors);
      } else {
        setAvailableColors((prev) => {
          if (prev.some((c) => c.name.toLowerCase() === name.toLowerCase())) return prev;
          return [...prev, { name, hex }];
        });
      }

      // 2. Automatically select this color
      if (!tempSelected.some((item) => item.toLowerCase() === name.toLowerCase())) {
        setTempSelected((prev) => [...prev, name]);
      }
    } catch (err) {
      console.error('Error adding custom color:', err);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const addCustomSizeHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = customValue.trim();
    if (!value) return;

    setIsSavingCustom(true);
    try {
      const res = await addCustomSize(value);
      if (res.success && res.data && Array.isArray(res.data.sizes)) {
        setAvailableSizes(res.data.sizes);
      } else {
        setAvailableSizes((prev) => (prev.includes(value) ? prev : [...prev, value]));
      }

      if (!tempSelected.some((item) => item.toLowerCase() === value.toLowerCase())) {
        setTempSelected((prev) => [...prev, value]);
      }
      setCustomValue('');
    } catch (err) {
      console.error('Error adding custom size:', err);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleApply = () => {
    onChange(tempSelected);
    onClose();
  };

  const getHex = (name: string) =>
    availableColors.find((color) => color.name.toLowerCase() === name.toLowerCase())?.hex ||
    SYSTEM_COLORS.find((color) => color.name.toLowerCase() === name.toLowerCase())?.hex ||
    '#64748b';

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-end"
      style={{ zIndex: 110000, backgroundColor: 'rgba(15,23,42,.38)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white h-100 d-flex flex-column shadow-lg"
        style={{
          width: '700px',
          maxWidth: '100vw',
          borderRadius: '4px 0 0 4px',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          animation: `${isClosing ? 'variantModalExitRight' : 'variantModalEnterRight'} .24s cubic-bezier(.16,1,.3,1) forwards`,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <style jsx>{`
          @keyframes variantModalEnterRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes variantModalExitRight {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100%);
            }
          }
        `}</style>

        {/* 1. Header with generous padding & matching Gender Modal style */}
        <div
          className="border-bottom d-flex align-items-start justify-content-between flex-shrink-0"
          style={{
            borderColor: '#edf0f3',
            backgroundColor: '#ffffff',
            padding: '24px 28px 20px 28px',
            boxSizing: 'border-box',
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2.5 mb-1.5 flex-wrap">
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>
                {title}
              </h4>
              <span
                className="badge fw-semibold"
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  fontSize: '11px',
                  padding: '4px 9px',
                  borderRadius: '5px',
                }}
              >
                {isSize ? 'Product Sizes' : 'Product Colors'}
              </span>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: '13px', lineHeight: '1.5' }}>
              Choose from default {isSize ? 'sizes' : 'colors'} or pick new colors to save permanently in your catalog list.
            </p>
          </div>

          {/* Standard Classic Trending Close Button with Hover */}
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
              marginTop: '-4px',
              marginRight: '-6px',
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
            title="Close"
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

        {/* 2. Body with consistent padding matching Header & Footer */}
        <div className="flex-grow-1 overflow-y-auto" style={{ padding: '24px 28px', boxSizing: 'border-box' }}>
          {/* Aligned Header Control Bar directly above table */}
          <div
            className="d-flex align-items-center justify-content-between mb-3 pb-2.5 border-bottom flex-wrap gap-2.5"
            style={{ borderColor: '#edf0f3' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-13 text-dark text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Default Available {isSize ? 'Sizes' : 'Colors'}
              </span>
              <span
                className="badge"
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '4px 9px',
                  fontSize: '11px',
                  borderRadius: '5px',
                }}
              >
                {tempSelected.length} Selected
              </span>
            </div>

            {/* Right side aligned action controls */}
            {isSize ? (
              <form onSubmit={addCustomSizeHandler} className="d-flex align-items-center gap-2 m-0">
                <input
                  value={customValue}
                  onChange={(event) => setCustomValue(event.target.value)}
                  className="form-control"
                  placeholder="e.g. XXL, 46"
                  style={{
                    height: '38px',
                    borderRadius: '7px',
                    borderColor: '#cbd5e1',
                    fontSize: '12.5px',
                    width: '130px',
                  }}
                />
                <button
                  type="submit"
                  disabled={isSavingCustom}
                  className="btn btn-dark px-3 fw-semibold d-inline-flex align-items-center gap-1"
                  style={{ height: '38px', borderRadius: '7px', fontSize: '12.5px', whiteSpace: 'nowrap' }}
                >
                  <iconify-icon icon="solar:add-circle-bold" class="fs-15"></iconify-icon>
                  <span>{isSavingCustom ? 'Adding...' : 'Add Size'}</span>
                </button>
              </form>
            ) : (
              <div className="d-flex align-items-center gap-2">
                {/* Hidden native color input triggered via button */}
                <input
                  ref={colorInputRef}
                  type="color"
                  value={selectedHex}
                  onChange={(e) => setSelectedHex(e.target.value)}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    width: '1px',
                    height: '1px',
                  }}
                  tabIndex={-1}
                />

                {/* Color Swatch Trigger Button */}
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="btn btn-white border d-inline-flex align-items-center gap-2 px-2.5"
                  style={{
                    height: '38px',
                    borderRadius: '7px',
                    borderColor: '#cbd5e1',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                    backgroundColor: '#ffffff',
                  }}
                  title="Click to open color picker"
                >
                  <span
                    className="d-inline-block rounded-circle flex-shrink-0"
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: selectedHex,
                      border: '1.5px solid #ffffff',
                      boxShadow: '0 0 0 1px #cbd5e1',
                    }}
                  />
                  <span className="font-monospace fs-12 fw-bold text-dark text-uppercase">{selectedHex}</span>
                  <span className="text-muted fs-11 fw-normal">(Pick)</span>
                </button>

                {/* Confirm Add Color Button */}
                <button
                  type="button"
                  onClick={handleAddPickedColor}
                  disabled={isSavingCustom}
                  className="btn btn-dark d-inline-flex align-items-center gap-1.5 px-3 fw-semibold"
                  style={{
                    height: '38px',
                    borderRadius: '7px',
                    fontSize: '12.5px',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isSavingCustom ? (
                    <span className="spinner-border spinner-border-sm text-white" role="status"></span>
                  ) : (
                    <>
                      <iconify-icon icon="solar:add-circle-bold" class="fs-15"></iconify-icon>
                      <span>Add Color</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Table List */}
          <div className="rounded-3 border overflow-hidden mb-4" style={{ borderColor: '#e2e8f0' }}>
            <table className="table table-sm align-middle mb-0">
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th className="px-3 py-2.5 fs-12 text-muted fw-bold">{isSize ? 'SIZE' : 'COLOR'}</th>
                  <th className="px-3 py-2.5 fs-12 text-muted fw-bold text-end" style={{ width: '150px' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {defaults.map((value) => {
                  const isChecked = tempSelected.includes(value);
                  return (
                    <tr key={value} style={{ transition: 'background-color 0.15s ease' }}>
                      <td className="px-3 py-2.5 fs-13 fw-medium text-dark">
                        <div className="d-flex align-items-center" style={{ gap: '14px' }}>
                          {!isSize && (
                            <span
                              className="rounded-circle flex-shrink-0"
                              style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: getHex(value),
                                border:
                                  getHex(value).toLowerCase() === '#ffffff'
                                    ? '1.5px solid #cbd5e1'
                                    : '1px solid rgba(0,0,0,0.15)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                              }}
                            />
                          )}
                          <span className="text-dark fw-medium">{value}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-end" style={{ width: '150px' }}>
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggle(value)}
                            className={`btn btn-sm ${
                              isChecked ? 'btn-dark' : 'btn-light border'
                            } d-inline-flex align-items-center justify-content-center gap-1.5`}
                            style={{
                              minWidth: '88px',
                              height: '32px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              color: isChecked ? '#ffffff' : '#334155',
                              backgroundColor: isChecked ? '#0f172a' : '#f8fafc',
                              borderColor: isChecked ? '#0f172a' : '#e2e8f0',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isChecked ? (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Selected</span>
                              </>
                            ) : (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>Add</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(value);
                            }}
                            disabled={deletingItem === value}
                            className="btn btn-sm p-0 d-inline-flex align-items-center justify-content-center"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              color: '#ef4444',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fee2e2',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              flexShrink: 0,
                            }}
                            title={`Delete "${value}" from catalog`}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = '#fee2e2';
                            }}
                          >
                            {deletingItem === value ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                style={{ width: '12px', height: '12px', borderWidth: '1.5px' }}
                              />
                            ) : (
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Footer with generous padding & matching Gender Modal style */}
        <div
          className="border-top d-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            borderColor: '#e2e8f0',
            backgroundColor: '#ffffff',
            padding: '16px 28px',
            boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.03)',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="fs-13 text-muted me-3"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={tempSelected.join(', ')}
          >
            Current Selection:{' '}
            <strong className="text-dark">
              {tempSelected.length > 0
                ? `${tempSelected.length} ${isSize ? 'Sizes' : 'Colors'} (${tempSelected.slice(0, 3).join(', ')}${tempSelected.length > 3 ? '...' : ''})`
                : 'None'}
            </strong>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm"
              onClick={onClose}
              style={{
                height: '38px',
                padding: '0 18px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-dark"
              onClick={handleApply}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
              }}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
