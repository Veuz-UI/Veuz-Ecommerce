'use client';

import React, { useState, useEffect } from 'react';
import { reframeImageCanvas } from '@/utils/productStudio';
import { useToast } from '@/context/ToastContext';

interface FocalAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  angleLabel: string;
  onSave: (newUrl: string) => void;
}

export default function FocalAdjustmentModal({
  isOpen,
  onClose,
  imageUrl,
  angleLabel,
  onSave,
}: FocalAdjustmentModalProps) {
  const { showToast } = useToast();
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(1.2); // Start with a slight hero zoom by default
      setPanX(0);
      setPanY(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!imageUrl) return;
    setIsApplying(true);
    try {
      const processedFile = await reframeImageCanvas(imageUrl, zoom, panX, panY, 1000);
      const formData = new FormData();
      formData.append('file', processedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        onSave(json.url);
        showToast('success', `${angleLabel} focus and framing updated successfully!`);
        onClose();
      } else {
        showToast('danger', json.message || 'Failed to save focused angle.');
      }
    } catch (err: any) {
      console.error('Failed to reframe angle:', err);
      showToast('danger', err?.message || 'Error updating angle focus.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header */}
          <div className="modal-header px-4 py-3 border-bottom bg-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 bg-warning-subtle text-warning"
                style={{ width: '32px', height: '32px' }}
              >
                <iconify-icon icon="solar:crop-minimalistic-bold" class="fs-18"></iconify-icon>
              </span>
              <div>
                <h6 className="modal-title fw-bold text-dark fs-15 mb-0">Adjust Subject Focus &amp; Zoom</h6>
                <small className="text-muted fs-12">{angleLabel} Framing</small>
              </div>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={isApplying} />
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ backgroundColor: '#f8fafc' }}>
            {/* Live Interactive Viewport */}
            <div
              className="rounded-3 border overflow-hidden position-relative mx-auto mb-3 shadow-sm d-flex align-items-center justify-content-center"
              style={{
                width: '100%',
                maxWidth: '320px',
                aspectRatio: '1 / 1',
                backgroundColor: '#ffffff',
                backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 14px 14px',
                borderColor: '#cbd5e1',
              }}
            >
              <img
                src={imageUrl}
                alt={angleLabel}
                style={{
                  width: '88%',
                  height: '88%',
                  objectFit: 'contain',
                  transform: `scale(${zoom}) translate(${panX}%, ${panY}%)`,
                  transition: 'transform 0.1s ease-out',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
              <div
                className="position-absolute bottom-0 end-0 m-2 px-2 py-1 bg-dark bg-opacity-75 text-white rounded fs-11"
                style={{ pointerEvents: 'none' }}
              >
                {Math.round(zoom * 100)}% Zoom
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="mb-3 bg-white p-3 rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label fs-12 fw-bold text-dark mb-0">
                  <iconify-icon icon="solar:magnifer-zoom-in-bold" class="text-primary me-1 fs-14"></iconify-icon>
                  Zoom Level ({Math.round(zoom * 100)}%)
                </label>
                <div className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                    onClick={() => setZoom(1.0)}
                  >
                    1.0x
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                    onClick={() => setZoom(1.4)}
                  >
                    1.4x (Hero)
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-0 px-2 fs-11"
                    onClick={() => setZoom(1.8)}
                  >
                    1.8x
                  </button>
                </div>
              </div>
              <input
                type="range"
                className="form-range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
            </div>

            {/* Pan Adjustment Controls */}
            <div className="bg-white p-3 rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label fs-12 fw-bold text-dark mb-0">
                  <iconify-icon icon="solar:move-arrows-bold" class="text-primary me-1 fs-14"></iconify-icon>
                  Pan / Center Subject
                </label>
                {(panX !== 0 || panY !== 0) && (
                  <button
                    type="button"
                    className="btn btn-link text-primary p-0 fs-11 text-decoration-none"
                    onClick={() => {
                      setPanX(0);
                      setPanY(0);
                    }}
                  >
                    Reset Center
                  </button>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3 py-1.5"
                  onClick={() => setPanX((prev) => Math.max(-40, prev - 5))}
                  title="Shift Left"
                >
                  <iconify-icon icon="solar:arrow-left-bold" class="fs-14"></iconify-icon>
                </button>
                <div className="d-flex flex-column gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-3 py-1"
                    onClick={() => setPanY((prev) => Math.max(-40, prev - 5))}
                    title="Shift Up"
                  >
                    <iconify-icon icon="solar:arrow-up-bold" class="fs-14"></iconify-icon>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-3 py-1"
                    onClick={() => setPanY((prev) => Math.min(40, prev + 5))}
                    title="Shift Down"
                  >
                    <iconify-icon icon="solar:arrow-down-bold" class="fs-14"></iconify-icon>
                  </button>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary px-3 py-1.5"
                  onClick={() => setPanX((prev) => Math.min(40, prev + 5))}
                  title="Shift Right"
                >
                  <iconify-icon icon="solar:arrow-right-bold" class="fs-14"></iconify-icon>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer px-4 py-3 bg-white border-top d-flex align-items-center justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light border px-3 fs-13"
              onClick={onClose}
              disabled={isApplying}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-dark px-4 fs-13 d-flex align-items-center gap-1.5"
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  <span>Applying Focus...</span>
                </>
              ) : (
                <>
                  <iconify-icon icon="solar:check-circle-bold" class="fs-15"></iconify-icon>
                  <span>Save &amp; Focus Subject</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
