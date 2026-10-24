'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  fetchLoginSetup,
  saveLoginSetup,
  LoginSlideItem,
  LoginSetupData,
  DEFAULT_LOGIN_SETUP,
} from '@/services/loginSetupService';
import { useToast } from '@/context/ToastContext';
import { LoginSetupSkeleton } from '@/components/ui/skeletons';

export default function LoginSetupDashboardPage() {
  const [setupData, setSetupData] = useState<LoginSetupData>(DEFAULT_LOGIN_SETUP);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const { showToast } = useToast();

  // Load Setup from API / Local Cache
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLoginSetup();
      setSetupData(data);
    } catch (err: any) {
      console.error('Error loading login setup:', err);
      showToast('danger', 'Failed to load login setup data.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live Preview auto-slide timer (keeps 5s standard interval)
  useEffect(() => {
    if (!isPreviewPlaying || setupData.slides.length <= 1) return;

    const timer = setInterval(() => {
      setPreviewSlideIdx((prev) => (prev + 1) % setupData.slides.length);
    }, setupData.autoSlideInterval || 5000);

    return () => clearInterval(timer);
  }, [isPreviewPlaying, setupData.slides.length, setupData.autoSlideInterval]);

  // Clamp preview index
  const safePreviewIdx = previewSlideIdx < setupData.slides.length ? previewSlideIdx : 0;
  const currentPreviewSlide = setupData.slides[safePreviewIdx] || setupData.slides[0];

  // Slide CRUD Handlers
  const handleAddSlide = () => {
    if (setupData.slides.length >= 4) {
      showToast('warning', 'Maximum 4 images allowed for the login slider.');
      return;
    }

    const newSlide: LoginSlideItem = {
      id: `slide-${Date.now()}`,
      image: '/assets/imgs/theme/login-slider-placeholder.svg',
      caption: 'Add your 3-line promotional or welcome caption here for your customers.',
      isActive: true,
    };

    setSetupData((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));

    setPreviewSlideIdx(setupData.slides.length);
    showToast('success', 'New slide added. Remember to click Save Changes.');
  };

  const handleUpdateSlide = (id: string, field: 'image' | 'caption', value: string) => {
    // Enforce 3-line text maximum (approx 180 characters or 3 newline breaks)
    let sanitizedVal = value;
    if (field === 'caption') {
      const lines = value.split('\n');
      if (lines.length > 3) {
        sanitizedVal = lines.slice(0, 3).join('\n');
      }
      if (sanitizedVal.length > 180) {
        sanitizedVal = sanitizedVal.slice(0, 180);
      }
    }

    setSetupData((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => (s.id === id ? { ...s, [field]: sanitizedVal } : s)),
    }));
  };

  const handleDeleteSlide = (id: string) => {
    if (setupData.slides.length <= 1) {
      showToast('warning', 'At least 1 slide must remain on the login page.');
      return;
    }

    setSetupData((prev) => ({
      ...prev,
      slides: prev.slides.filter((s) => s.id !== id),
    }));

    setPreviewSlideIdx(0);
    showToast('info', 'Slide removed.');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...setupData.slides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    setSetupData((prev) => ({
      ...prev,
      slides: newSlides,
    }));
    setPreviewSlideIdx(targetIdx);
  };

  // Upload Image File
  const handleFileUpload = async (slideId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('danger', 'Please choose a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'Image file is too large. Recommended under 5MB.');
      return;
    }

    setUploadingSlideId(slideId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        handleUpdateSlide(slideId, 'image', json.url);
        showToast('success', 'Image uploaded successfully!');
        setUploadingSlideId(null);
        return;
      }
    } catch (err) {
      // Fallback to FileReader below
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateSlide(slideId, 'image', reader.result);
        showToast('success', 'Image uploaded successfully!');
      }
      setUploadingSlideId(null);
    };
    reader.onerror = () => setUploadingSlideId(null);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveLoginSetup(setupData);
      if (res.success) {
        showToast('success', 'Login slider settings saved successfully!');
      } else {
        showToast('danger', res.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* ========================================================
          MAIN WHITE BACKGROUND CARD (Standard Dashboard Style)
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
          <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '22px', gap: '10px' }}>
            <Link href="/dashboard" className="text-muted text-decoration-none">
              Dashboard
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" className="fs-13"></iconify-icon>
            <span className="text-dark fw-bold">Login Setup</span>
          </div>

          {/* 2. Page Header & Actions Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2
                  className="fw-bold text-dark m-0"
                  style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a' }}
                >
                  Login Page Slider Setup
                </h2>
                <span
                  className="badge fs-12 fw-semibold"
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '3px',
                    padding: '4px 9px',
                  }}
                >
                  {setupData.slides.length} / 4 Slides
                </span>
              </div>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Configure auto-sliding visuals and 3-line captions displayed on the storefront login page (Maximum 4 slides).
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAddSlide}
                disabled={setupData.slides.length >= 4}
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#0f172a',
                  padding: '8px 18px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  cursor: setupData.slides.length >= 4 ? 'not-allowed' : 'pointer',
                  opacity: setupData.slides.length >= 4 ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                title={setupData.slides.length >= 4 ? 'Maximum 4 slides reached' : 'Add a new slide'}
              >
                <iconify-icon icon="solar:add-circle-broken" className="fs-16"></iconify-icon>
                <span>Add Slide</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
                style={{
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  padding: '8px 18px',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
                }}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <iconify-icon icon="solar:diskette-bold" className="fs-16"></iconify-icon>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. Main Body: Slide Editors & Live Preview */}
          {isLoading ? (
            <LoginSetupSkeleton />
          ) : (
            <div className="row g-4">
              {/* Left Column: Compact Slide List */}
              <div className="col-xl-7 col-lg-7">
                <div className="d-flex flex-column gap-3">
                  {setupData.slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="rounded-3 p-3 position-relative"
                      style={{
                        backgroundColor: '#ffffff',
                        border: safePreviewIdx === idx ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                        boxShadow: safePreviewIdx === idx ? '0 4px 12px rgba(15, 23, 42, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Slide Card Header */}
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="badge font-12 fw-semibold"
                            style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '3px', padding: '4px 8px' }}
                          >
                            Slide #{idx + 1}
                          </span>
                          {safePreviewIdx === idx && (
                            <span
                              className="badge font-11 fw-semibold"
                              style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '3px', padding: '4px 8px' }}
                            >
                              Previewing Now
                            </span>
                          )}
                        </div>

                        {/* Slide Re-Order and Delete Action Buttons */}
                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border py-1 px-2"
                            disabled={idx === 0}
                            onClick={() => handleMoveSlide(idx, 'up')}
                            title="Move Up"
                            style={{ borderRadius: '6px' }}
                          >
                            <iconify-icon icon="solar:arrow-up-broken" className="fs-14"></iconify-icon>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-light border py-1 px-2"
                            disabled={idx === setupData.slides.length - 1}
                            onClick={() => handleMoveSlide(idx, 'down')}
                            title="Move Down"
                            style={{ borderRadius: '6px' }}
                          >
                            <iconify-icon icon="solar:arrow-down-broken" className="fs-14"></iconify-icon>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-2 ms-1"
                            disabled={setupData.slides.length <= 1}
                            onClick={() => handleDeleteSlide(slide.id)}
                            title={setupData.slides.length <= 1 ? 'At least 1 slide required' : 'Delete this slide'}
                            style={{ borderRadius: '6px' }}
                          >
                            <iconify-icon icon="solar:trash-bin-trash-broken" className="fs-14"></iconify-icon>
                          </button>
                        </div>
                      </div>

                      {/* Slide Card Content: Small Image Preview + Upload Button (NO Image URL text input) */}
                      <div className="d-flex flex-column gap-3">
                        {/* Image Preview & Upload Controls */}
                        <div className="d-flex align-items-center gap-3">
                          {/* Small Preview Image Thumbnail */}
                          <div
                            className="position-relative overflow-hidden rounded-3 border bg-dark flex-shrink-0"
                            style={{
                              width: '76px',
                              height: '92px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                            }}
                          >
                            <img
                              src={slide.image || '/assets/imgs/theme/login-slider-placeholder.svg'}
                              alt={`Slide ${idx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/imgs/theme/login-slider-placeholder.svg';
                              }}
                            />
                          </div>

                          {/* Hidden File Input & Upload Button with Dimensions */}
                          <div className="d-flex flex-column gap-1.5">
                            <input
                              type="file"
                              accept="image/*"
                              ref={(el) => {
                                fileInputRefs.current[slide.id] = el;
                              }}
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileUpload(slide.id, e)}
                            />

                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={uploadingSlideId === slide.id}
                                className="btn btn-sm d-inline-flex align-items-center gap-1.5 font-12 fw-semibold"
                                style={{
                                  width: 'fit-content',
                                  backgroundColor: '#ffffff',
                                  border: '1.5px solid #0f172a',
                                  color: '#0f172a',
                                  borderRadius: '7px',
                                  padding: '5px 12px',
                                }}
                                onClick={() => fileInputRefs.current[slide.id]?.click()}
                              >
                                {uploadingSlideId === slide.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <iconify-icon icon="solar:upload-track-broken" className="fs-15"></iconify-icon>
                                    <span>
                                      {slide.image && !slide.image.includes('placeholder')
                                        ? 'Change Image'
                                        : 'Upload Slide Image'}
                                    </span>
                                  </>
                                )}
                              </button>

                              <span
                                className="badge font-11 fw-bold px-2 py-1"
                                style={{
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                }}
                              >
                                Recommended: 600 × 800 px
                              </span>
                            </div>

                            <span className="text-muted font-11" style={{ lineHeight: 1.4, maxWidth: '420px' }}>
                              <strong className="text-dark">Dimensions:</strong> 600 × 800 px (Portrait 3:4 ratio). Any dimension image you upload will auto-fit cleanly without distortion. (JPG, PNG, WebP up to 5MB).
                            </span>
                          </div>
                        </div>

                        {/* Caption Text Input (Max 3 lines) */}
                        <div>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <label className="form-label font-12 fw-semibold text-dark mb-0">
                              Caption Text (Max 3 Lines):
                            </label>
                            <span className="font-11 text-muted">
                              {slide.caption.length} / 180 chars
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            className="form-control form-control-sm font-13"
                            value={slide.caption}
                            onChange={(e) => handleUpdateSlide(slide.id, 'caption', e.target.value)}
                            placeholder="Enter 3-line promotional or welcome caption..."
                            style={{
                              resize: 'none',
                              lineHeight: '1.45',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              color: '#0f172a',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Storefront Preview (Matching Smooth Dissolve Mockup) */}
              <div className="col-xl-5 col-lg-5">
                <div
                  className="rounded-3 p-3 sticky-top"
                  style={{
                    top: '85px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
                    <div className="d-flex align-items-center gap-1.5">
                      <iconify-icon icon="solar:smartphone-2-broken" className="fs-18 text-dark"></iconify-icon>
                      <h5 className="m-0 font-14 fw-bold text-dark">Live Storefront Preview</h5>
                    </div>

                    <div className="d-flex align-items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                        className="btn btn-sm btn-icon btn-white border py-1 px-2"
                        title={isPreviewPlaying ? 'Pause Auto Slide' : 'Play Auto Slide'}
                        style={{ borderRadius: '6px' }}
                      >
                        <iconify-icon
                          icon={isPreviewPlaying ? 'solar:pause-broken' : 'solar:play-broken'}
                          className="fs-14 text-dark"
                        ></iconify-icon>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewSlideIdx(
                            (prev) => (prev - 1 + setupData.slides.length) % setupData.slides.length
                          )
                        }
                        className="btn btn-sm btn-icon btn-white border py-1 px-2"
                        title="Previous Slide"
                        style={{ borderRadius: '6px' }}
                      >
                        <iconify-icon icon="solar:alt-arrow-left-broken" className="fs-14 text-dark"></iconify-icon>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewSlideIdx((prev) => (prev + 1) % setupData.slides.length)
                        }
                        className="btn btn-sm btn-icon btn-white border py-1 px-2"
                        title="Next Slide"
                        style={{ borderRadius: '6px' }}
                      >
                        <iconify-icon icon="solar:alt-arrow-right-broken" className="fs-14 text-dark"></iconify-icon>
                      </button>
                    </div>
                  </div>

                  <div className="d-flex flex-column align-items-center">
                    {/* Visual Mockup matching the Storefront Login split card */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '300px',
                        height: '420px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#0f172a',
                        boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Stacked Slide Layers for preview cross-fade */}
                      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#0f172a' }}>
                        {setupData.slides.map((slide, idx) => {
                          const isActive = idx === safePreviewIdx;
                          return (
                            <img
                              key={slide.id || idx}
                              src={slide.image || '/assets/imgs/theme/login-slider-placeholder.svg'}
                              alt="Preview"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center center',
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'scale(1)' : 'scale(1.04)',
                                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s ease',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/imgs/theme/login-slider-placeholder.svg';
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Story Progress Bars */}
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 3,
                          display: 'flex',
                          gap: '6px',
                          padding: '14px 16px 0 16px',
                        }}
                      >
                        {setupData.slides.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setPreviewSlideIdx(i)}
                            style={{
                              flex: 1,
                              height: '3px',
                              borderRadius: '999px',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              backgroundColor: safePreviewIdx === i ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                              transition: 'background-color 0.25s ease',
                            }}
                            title={`Jump to slide ${i + 1}`}
                          />
                        ))}
                      </div>

                      {/* Dark Gradient Overlay and 3-line Max Caption */}
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 3,
                          padding: '40px 18px 20px 18px',
                          background:
                            'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0.9) 100%)',
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: '13px',
                            lineHeight: '1.45',
                            color: '#ffffff',
                            fontWeight: 400,
                            letterSpacing: '-0.01em',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '4.35em',
                          }}
                        >
                          {currentPreviewSlide?.caption || 'Enter your slide caption in the editor.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 text-center">
                      <span
                        className="badge font-12 fw-semibold px-2 py-1"
                        style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '5px' }}
                      >
                        Viewing Slide {safePreviewIdx + 1} of {setupData.slides.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
