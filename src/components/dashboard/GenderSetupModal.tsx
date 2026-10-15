'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GENDER_OPTIONS } from '@/data/categoryProductsData';

interface GenderSetupModalProps {
  isOpen: boolean;
  selected: string;
  onChange: (gender: string) => void;
  onClose: () => void;
}

const GENDER_DESCRIPTIONS: Record<string, { desc: string; icon: string; badge: string }> = {
  Male: {
    desc: "Engineered specifically for men's sizing, proportions, and workplace safety requirements.",
    icon: 'solar:user-bold',
    badge: 'Men',
  },
  Female: {
    desc: "Tailored specifically for women's ergonomic fit, contouring, and workplace safety requirements.",
    icon: 'solar:user-bold',
    badge: 'Women',
  },
  Unisex: {
    desc: 'Universal ergonomic standard designed to comfortably fit all genders and team members.',
    icon: 'solar:users-group-rounded-bold',
    badge: 'All Genders',
  },
};

export default function GenderSetupModal({ isOpen, selected, onChange, onClose }: GenderSetupModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [tempSelected, setTempSelected] = useState<string>(selected || 'Unisex');

  useEffect(() => {
    if (isOpen) {
      setTempSelected(selected || 'Unisex');
      setShouldRender(true);
      const frame = requestAnimationFrame(() => setIsClosing(false));
      return () => cancelAnimationFrame(frame);
    }
    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setShouldRender(false), 260);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, shouldRender, selected]);

  if (!shouldRender || typeof document === 'undefined') return null;

  const handleSelect = (gender: string) => {
    setTempSelected(gender);
    onChange(gender);
  };

  const handleApply = () => {
    if (tempSelected) {
      onChange(tempSelected);
    }
    onClose();
  };

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-end"
      style={{ zIndex: 110000, backgroundColor: 'rgba(15,23,42,.38)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white h-100 d-flex flex-column shadow-lg"
        style={{
          width: '620px',
          maxWidth: '100vw',
          borderRadius: '4px 0 0 4px',
          animation: `${isClosing ? 'genderModalExitRight' : 'genderModalEnterRight'} .24s cubic-bezier(.16,1,.3,1) forwards`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes genderModalEnterRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes genderModalExitRight {
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

        {/* 1. Header with generous, comfortable padding */}
        <div
          className="border-bottom d-flex align-items-start justify-content-between flex-shrink-0"
          style={{
            borderColor: '#edf0f3',
            backgroundColor: '#ffffff',
            padding: '28px 32px 24px 32px',
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-2.5 mb-1.5 flex-wrap">
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>
                Gender Selection
              </h4>
              <span
                className="badge fw-semibold"
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '11px',
                  padding: '4px 9px',
                  borderRadius: '5px',
                }}
              >
                Mandatory
              </span>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: '13px', lineHeight: '1.5' }}>
              Select target gender audience for this product. Default options: Male, Female, Unisex.
            </p>
          </div>

          {/* Standard Classic Trending Close Button */}
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* 2. Body Content with comfortable padding */}
        <div className="flex-grow-1 overflow-y-auto" style={{ padding: '28px 32px' }}>
          <div className="mb-3.5">
            <span className="fw-bold text-dark text-uppercase" style={{ fontSize: '12px', letterSpacing: '0.6px' }}>
              Select Gender Category
            </span>
            <p className="text-muted fs-12 mb-0 mt-0.5">
              This selection will be highlighted on the storefront and product details page.
            </p>
          </div>

          {/* 3 Selectable Cards for Male, Female, Unisex */}
          <div className="d-flex flex-column gap-3 mb-4">
            {GENDER_OPTIONS.map((opt) => {
              const isSelected = tempSelected === opt;
              const meta = GENDER_DESCRIPTIONS[opt];

              return (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className="rounded-3 transition-all"
                  style={{
                    padding: '18px 22px',
                    backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                    border: isSelected ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: isSelected ? '0 4px 14px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3.5">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: isSelected ? '#0f172a' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#475569',
                          border: isSelected ? 'none' : '1px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <iconify-icon icon={meta?.icon || 'solar:user-bold'} class="fs-22"></iconify-icon>
                      </div>

                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="fs-15 fw-bold text-dark mb-0">{opt}</h6>
                          <span
                            className="badge fw-semibold"
                            style={{
                              backgroundColor: isSelected ? '#0f172a' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#64748b',
                              fontSize: '11px',
                              padding: '3px 9px',
                              borderRadius: '5px',
                              border: isSelected ? 'none' : '1px solid #cbd5e1',
                            }}
                          >
                            {meta?.badge}
                          </span>
                        </div>
                        <p className="text-muted fs-12 mb-0 mt-1" style={{ lineHeight: '1.45' }}>
                          {meta?.desc}
                        </p>
                      </div>
                    </div>

                    {/* Radio / Selection Indicator */}
                    <div className="ps-3 flex-shrink-0">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center transition-all"
                        style={{
                          width: '26px',
                          height: '26px',
                          border: isSelected ? '2px solid #0f172a' : '2px solid #cbd5e1',
                          backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                          color: '#ffffff',
                        }}
                      >
                        {isSelected && <iconify-icon icon="solar:check-read-bold" class="fs-15"></iconify-icon>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Notice Info Box */}
          <div
            className="rounded-3 d-flex align-items-start gap-3"
            style={{
              padding: '16px 20px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              borderRadius: '10px',
            }}
          >
            <iconify-icon icon="solar:info-circle-bold" class="fs-20 flex-shrink-0 mt-0.5 text-success"></iconify-icon>
            <div className="fs-12" style={{ lineHeight: '1.55' }}>
              <strong>Storefront Visibility:</strong> The selected gender (
              <span className="fw-bold">{tempSelected || 'None'}</span>) will be prominently displayed on the storefront
              product badge and detailed specification overview so customers can filter and browse accurately.
            </div>
          </div>
        </div>

        {/* 3. Footer with generous padding & standard classic buttons */}
        <div
          className="border-top d-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            borderColor: '#e2e8f0',
            backgroundColor: '#ffffff',
            padding: '20px 32px',
            boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div className="fs-13 text-muted">
            Current Selection: <strong className="text-dark">{tempSelected || 'None'}</strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={onClose}
              style={{
                height: '40px',
                padding: '0 20px',
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
                height: '40px',
                padding: '0 24px',
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
