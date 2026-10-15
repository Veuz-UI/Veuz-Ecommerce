'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface ProductCardImageSliderProps {
  productId: string;
  title: string;
  link: string;
  image: string;
  images?: string[];
  colorImages?: Record<string, string[]>;
  onProductClick?: (id: string) => void;
  selectedColor?: string;
}

export function ProductCardImageSlider({
  productId,
  title,
  link,
  image,
  images,
  colorImages,
  onProductClick,
  selectedColor,
}: ProductCardImageSliderProps) {
  // Collect photos specifically for the selected color if available
  let activeColorPhotos: string[] = [];
  if (selectedColor && colorImages && typeof colorImages === 'object') {
    if (Array.isArray(colorImages[selectedColor])) {
      activeColorPhotos = colorImages[selectedColor];
    } else {
      const norm = selectedColor.trim().toLowerCase();
      const matchKey = Object.keys(colorImages).find((k) => k.trim().toLowerCase() === norm);
      if (matchKey && Array.isArray(colorImages[matchKey])) {
        activeColorPhotos = colorImages[matchKey];
      }
    }
    activeColorPhotos = activeColorPhotos.filter(
      (u) => Boolean(u && typeof u === 'string' && u.trim() && !u.includes('p1.jpg'))
    );
  }

  // Fallback to all Genuine photos if no color-specific photos found
  const colorPhotos = colorImages
    ? Object.values(colorImages).flat().filter((u) => Boolean(u && typeof u === 'string' && u.trim() && !u.includes('p1.jpg')))
    : [];

  const candidateImages = activeColorPhotos.length > 0
    ? activeColorPhotos
    : [
        image && !image.includes('p1.jpg') ? image : '',
        ...(Array.isArray(images) ? images : []),
        ...colorPhotos,
      ].filter((u) => Boolean(u && typeof u === 'string' && u.trim() && !u.includes('p1.jpg')));

  const allImages = Array.from(new Set(candidateImages));

  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // When selectedColor changes, reset slider back to the first angle of this color
  React.useEffect(() => {
    setActiveIdx(0);
  }, [selectedColor]);

  // Next / Prev slide handlers
  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe Left -> Next
        setActiveIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      } else {
        // Swipe Right -> Prev
        setActiveIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      }
    }
    touchStartX.current = null;
  };

  const safeIdx = activeIdx < allImages.length ? activeIdx : 0;
  const currentImg = allImages[safeIdx] || allImages[0] || (image && !image.includes('p1.jpg') ? image : '');
  let computedLink = link
    ? (link.includes('?id=') ? link : (link.startsWith('/product-details') ? `/product-details?id=${productId}` : `${link}${link.includes('?') ? '&' : '?'}id=${productId}`))
    : `/product-details?id=${productId}`;

  if (selectedColor && !computedLink.includes('color=')) {
    computedLink += `${computedLink.includes('?') ? '&' : '?'}color=${encodeURIComponent(selectedColor)}`;
  }

  return (
    <div
      className="product-card-slider-wrapper position-relative w-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image View */}
      <div className="product-img product-img-zoom position-relative">
        <Link
          href={computedLink}
          onClick={() => onProductClick && onProductClick(productId)}
          className="d-flex align-items-center justify-content-center w-100"
          style={{ height: '220px', backgroundColor: 'transparent' }}
        >
          {currentImg ? (
            <img
              key={currentImg}
              src={currentImg}
              alt={`${title} - view ${activeIdx + 1}`}
              className="default-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '10px',
                transition: 'opacity 0.25s ease',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
            />
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: '100%' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </Link>

        {/* Hover Arrow Controls (Desktop) */}
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="card-slider-arrow card-slider-prev"
              aria-label="Previous Image"
              title="Previous Angle"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="card-slider-arrow card-slider-next"
              aria-label="Next Image"
              title="Next Angle"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Slide Navigation Below Product Image Area */}
      {allImages.length > 1 && (
        <div
          className="d-flex align-items-center justify-content-center py-1.5"
          style={{ gap: '6px', minHeight: '20px' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {allImages.map((imgUrl, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveIdx(idx);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                aria-label={`View angle ${idx + 1}`}
                title={`Angle ${idx + 1}`}
                className="border-0 p-0"
                style={{
                  width: isActive ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? '#0f172a' : '#cbd5e1',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
