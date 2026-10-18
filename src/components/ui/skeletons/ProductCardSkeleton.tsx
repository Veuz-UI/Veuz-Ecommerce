'use client';

import React from 'react';

interface ProductCardSkeletonProps {
  colClass?: string;
}

export function ProductCardSkeleton({ colClass = 'col-lg-3 col-md-4 col-sm-6 col-12 mb-4' }: ProductCardSkeletonProps) {
  return (
    <div className={`${colClass} skeleton-stagger`}>
      <div className="skeleton-product-card">
        {/* Top Product Image Box Placeholder */}
        <div className="skeleton-box skeleton-product-img position-relative">
          {/* Top-Left Badge Outline */}
          <div
            className="skeleton-box position-absolute"
            style={{
              top: '10px',
              left: '10px',
              width: '55px',
              height: '18px',
              borderRadius: '4px',
              backgroundColor: '#e2e8f0',
            }}
          />
          {/* Top-Right Eye Button Outline */}
          <div
            className="skeleton-box skeleton-circle position-absolute"
            style={{
              top: '10px',
              right: '10px',
              width: '32px',
              height: '32px',
              backgroundColor: '#e2e8f0',
            }}
          />
        </div>

        {/* Content Wrap */}
        <div className="d-flex flex-column flex-grow-1 justify-content-between">
          <div>
            {/* Delivery Option & Gender Badges */}
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="skeleton-box" style={{ width: '85px', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '50px', height: '18px', borderRadius: '4px' }} />
            </div>

            {/* Product Title (Two Shimmer Lines) */}
            <div className="skeleton-box skeleton-text mb-2" style={{ width: '90%', height: '18px' }} />
            <div className="skeleton-box skeleton-text mb-3" style={{ width: '60%', height: '16px' }} />

            {/* Star Rating & Reviews Line */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="skeleton-box" style={{ width: '70px', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '55px', height: '12px', borderRadius: '4px' }} />
            </div>

            {/* Price Line */}
            <div className="d-flex align-items-baseline gap-2 mb-3">
              <div className="skeleton-box" style={{ width: '80px', height: '22px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '50px', height: '14px', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Action Row: Wishlist Button & Add to Cart Button */}
          <div className="d-flex align-items-center gap-2 pt-2 border-top" style={{ borderColor: '#f1f5f9' }}>
            <div className="skeleton-box flex-grow-1" style={{ height: '40px', borderRadius: '8px' }} />
            <div className="skeleton-box skeleton-circle" style={{ width: '40px', height: '40px', flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
