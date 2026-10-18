'use client';

import React from 'react';

interface CategorySliderSkeletonProps {
  count?: number;
}

export function CategorySliderSkeleton({ count = 6 }: CategorySliderSkeletonProps) {
  return (
    <div className="category-slider-card-wrap my-3 my-md-4">
      {/* Slider Header Line */}
      <div className="d-flex align-items-center justify-content-between mb-3 px-1">
        <div className="skeleton-box" style={{ width: '180px', height: '22px', borderRadius: '6px' }} />
        <div className="d-flex align-items-center gap-2">
          <div className="skeleton-box skeleton-circle" style={{ width: '38px', height: '38px' }} />
          <div className="skeleton-box skeleton-circle" style={{ width: '38px', height: '38px' }} />
        </div>
      </div>

      {/* Pill Tracks Placeholder */}
      <div className="category-slider-track d-flex gap-2.5 overflow-hidden py-1">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-pill-card skeleton-stagger">
            {/* Circle Icon */}
            <div className="skeleton-box skeleton-circle" style={{ width: '42px', height: '42px', flexShrink: 0 }} />
            {/* Category Name & Count Line */}
            <div className="flex-grow-1">
              <div className="skeleton-box skeleton-text mb-1" style={{ width: '75%', height: '15px' }} />
              <div className="skeleton-box skeleton-text mb-0" style={{ width: '45%', height: '11px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySliderSkeleton;
