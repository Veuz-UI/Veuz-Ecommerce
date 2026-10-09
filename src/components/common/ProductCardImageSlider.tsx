'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface ProductCardImageSliderProps {
  productId: string;
  title: string;
  link: string;
  image: string;
  images?: string[];
  onProductClick?: (id: string) => void;
}

export function ProductCardImageSlider({
  productId,
  title,
  link,
  image,
  images,
  onProductClick,
}: ProductCardImageSliderProps) {
  // Collect all unique images (Cover + Side + Top + Back)
  const allImages = Array.from(
    new Set([image, ...(Array.isArray(images) ? images : [])])
  ).filter(Boolean);

  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);

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

  const currentImg = allImages[activeIdx] || image || '/assets/imgs/shop/p1.jpg';

  return (
    <div
      className="product-card-slider-wrapper position-relative w-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image View */}
      <div className="product-img product-img-zoom position-relative">
        <Link
          href={link || '/product-details'}
          onClick={() => onProductClick && onProductClick(productId)}
          className="d-flex align-items-center justify-content-center w-100"
          style={{ height: '220px', backgroundColor: 'transparent' }}
        >
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
              (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
            }}
          />
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
