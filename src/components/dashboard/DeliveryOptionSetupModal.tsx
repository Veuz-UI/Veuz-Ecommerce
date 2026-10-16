'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { DeliveryOptionItem } from '@/data/defaultShopSettings';

interface DeliveryOptionSetupModalProps {
  isOpen: boolean;
  selectedId: string;
  options: DeliveryOptionItem[];
  onChange: (option: DeliveryOptionItem) => void;
  onClose: () => void;
}

export default function DeliveryOptionSetupModal({
  isOpen,
  selectedId,
  options,
  onChange,
  onClose,
}: DeliveryOptionSetupModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [tempSelectedId, setTempSelectedId] = useState<string>(selectedId || 'del-standard');

  useEffect(() => {
    if (isOpen) {
      setTempSelectedId(selectedId || 'del-standard');
      setShouldRender(true);
      const frame = requestAnimationFrame(() => setIsClosing(false));
      return () => cancelAnimationFrame(frame);
    }
    if (shouldRender) {
      setIsClosing(true);
      const timer = window.setTimeout(() => setShouldRender(false), 240);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, shouldRender, selectedId]);

  if (!shouldRender || typeof document === 'undefined') return null;

  // Active delivery options
  const activeOptions = options && options.length > 0 ? options.filter((o) => o.isActive !== false) : [];

  const handleSelect = (opt: DeliveryOptionItem) => {
    setTempSelectedId(opt.id);
  };

  const handleApply = () => {
    const selectedOption = activeOptions.find((o) => o.id === tempSelectedId) || activeOptions[0];
    if (selectedOption) {
      onChange(selectedOption);
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
          animation: `${isClosing ? 'deliveryModalExitRight' : 'deliveryModalEnterRight'} .24s cubic-bezier(.16,1,.3,1) forwards`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx>{`
          @keyframes deliveryModalEnterRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes deliveryModalExitRight {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100%);
            }
          }
          .delivery-option-card:hover {
            border-color: #0f172a !important;
            transform: translateY(-1px);
          }
        `}</style>

        {/* 1. Header with comfortable padding matching VariantSetupModal */}
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
                Delivery Option Selection
              </h4>
              <span
                className="badge fw-semibold"
                style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  border: '1px solid #bae6fd',
                  fontSize: '11px',
                  padding: '4px 9px',
                  borderRadius: '5px',
                }}
              >
                Store Settings Connected
              </span>
            </div>
            <p className="text-muted mb-0" style={{ fontSize: '13px', lineHeight: '1.5' }}>
              Choose which delivery method applies to this product. The selected badge and shipping charge will display across catalog cards and details.
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

        {/* 2. Scrollable Options Content with clean padding */}
        <div
          className="flex-grow-1 overflow-auto"
          style={{
            padding: '24px 28px',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Active selection banner */}
          <div
            className="rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <span
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                }}
              >
                <iconify-icon icon="solar:delivery-bold" class="fs-16"></iconify-icon>
              </span>
              <div>
                <span className="text-muted fs-11 text-uppercase fw-bold d-block" style={{ letterSpacing: '0.5px' }}>
                  Selected Delivery Method
                </span>
                <span className="fw-bold text-dark fs-14">
                  {activeOptions.find((o) => o.id === tempSelectedId)?.name || 'Standard Delivery'}
                </span>
              </div>
            </div>
            <span
              className="badge px-2.5 py-1.5 fw-bold"
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            >
              {(() => {
                const found = activeOptions.find((o) => o.id === tempSelectedId);
                if (!found) return '15 SR';
                return found.charge === 0 ? 'FREE' : `${found.charge} SR`;
              })()}
            </span>
          </div>

          <div className="mb-2">
            <span className="fw-bold text-dark fs-13 text-uppercase" style={{ letterSpacing: '0.5px' }}>
              Available Methods from Store Settings ({activeOptions.length})
            </span>
          </div>

          {/* List of delivery option cards */}
          <div className="d-flex flex-column gap-2.5">
            {activeOptions.map((opt) => {
              const isSelected = tempSelectedId === opt.id;

              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className="delivery-option-card rounded-3 border transition-all cursor-pointer"
                  style={{
                    padding: '14px 18px',
                    backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                    borderColor: isSelected ? '#0f172a' : '#e2e8f0',
                    borderWidth: isSelected ? '1.5px' : '1px',
                    boxShadow: isSelected ? '0 2px 10px rgba(15, 23, 42, 0.06)' : 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3" style={{ flex: '1 1 auto', minWidth: 0 }}>
                      {/* Crisp Centered Radio Indicator */}
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
                        style={{
                          width: '18px',
                          height: '18px',
                          border: isSelected ? '2px solid #0f172a' : '2px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#0f172a',
                            }}
                          />
                        )}
                      </div>

                      {/* Common Delivery Icon for All Methods */}
                      <span
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <iconify-icon icon="solar:delivery-bold" class="fs-20"></iconify-icon>
                      </span>

                      {/* Text info cleanly aligned */}
                      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <h6 className="fw-bold text-dark mb-0 fs-14" style={{ lineHeight: 1.2 }}>{opt.name}</h6>
                          {opt.id === 'del-standard' && (
                            <span
                              className="badge fw-semibold"
                              style={{
                                fontSize: '10px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              Default
                            </span>
                          )}
                        </div>

                        <p className="text-muted fs-12 mb-1" style={{ lineHeight: '1.4', margin: 0 }}>
                          {opt.description || 'Fast, reliable ground delivery.'}
                        </p>

                        {opt.estimatedDays && (
                          <div className="d-flex align-items-center gap-1.5 text-muted fs-11 mt-1">
                            <iconify-icon icon="solar:clock-circle-bold" class="fs-13 text-secondary"></iconify-icon>
                            <span>Estimated arrival: <strong className="text-dark">{opt.estimatedDays}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Tag */}
                    <div className="text-end flex-shrink-0 ms-2">
                      <span
                        className="badge fw-bold"
                        style={{
                          backgroundColor: opt.charge === 0 ? '#dcfce7' : '#f1f5f9',
                          color: opt.charge === 0 ? '#15803d' : '#0f172a',
                          border: `1px solid ${opt.charge === 0 ? '#bbf7d0' : '#e2e8f0'}`,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        {opt.charge === 0 ? 'FREE' : `${opt.charge} SR`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link hint to Store Settings */}
          <div
            className="rounded-3 p-3 mt-4 d-flex align-items-center justify-content-between"
            style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #e0f2fe',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <iconify-icon icon="solar:info-circle-bold" class="fs-18 text-primary flex-shrink-0"></iconify-icon>
              <span className="fs-12 text-muted" style={{ color: '#0369a1' }}>
                Need to add or edit delivery rates? Manage them under <strong>Store Settings &gt; Delivery Options</strong>.
              </span>
            </div>
            <Link
              href="/dashboard/shop-settings"
              target="_blank"
              className="btn btn-sm btn-light border text-nowrap fw-semibold"
              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '5px' }}
            >
              Open Settings ↗
            </Link>
          </div>
        </div>

        {/* 3. Footer with generous padding matching VariantSetupModal */}
        <div
          className="border-top d-flex align-items-center justify-content-between flex-shrink-0"
          style={{
            borderColor: '#edf0f3',
            backgroundColor: '#ffffff',
            padding: '16px 28px',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm"
            style={{
              borderRadius: '8px',
              padding: '9px 20px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#374151',
              fontWeight: 500,
              fontSize: '13px',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{
              borderRadius: '8px',
              padding: '9px 24px',
              backgroundColor: '#0f172a',
              border: '1px solid #0f172a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
            }}
          >
            <iconify-icon icon="solar:check-circle-bold" class="fs-16"></iconify-icon>
            <span>Apply Delivery Option</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
