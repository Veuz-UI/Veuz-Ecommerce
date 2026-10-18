'use client';

import React from 'react';
import { ProductCardSkeleton } from './ProductCardSkeleton';

export function CatalogSkeleton() {
  return (
    <main className="main" style={{ minHeight: '85vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
      <div className="container py-3 py-md-4">
        {/* Top Header & Breadcrumb Skeleton */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4 pb-2 border-bottom">
          <div>
            <div className="skeleton-box mb-2" style={{ width: '160px', height: '14px' }} />
            <div className="skeleton-box" style={{ width: '240px', height: '28px', borderRadius: '6px' }} />
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="skeleton-box" style={{ width: '120px', height: '38px', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ width: '140px', height: '38px', borderRadius: '8px' }} />
          </div>
        </div>

        <div className="row g-3 g-lg-4">
          {/* Left Sidebar Filter Skeleton */}
          <div className="col-lg-3 d-none d-lg-block">
            <div className="bg-white p-3 p-xl-4 rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
              <div className="skeleton-box mb-4" style={{ width: '60%', height: '20px' }} />

              {/* Categories block */}
              <div className="mb-4">
                <div className="skeleton-box mb-3" style={{ width: '45%', height: '16px' }} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between mb-2">
                    <div className="skeleton-box" style={{ width: '65%', height: '14px' }} />
                    <div className="skeleton-box" style={{ width: '25px', height: '14px' }} />
                  </div>
                ))}
              </div>

              {/* Price filter block */}
              <div className="mb-4 pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                <div className="skeleton-box mb-3" style={{ width: '40%', height: '16px' }} />
                <div className="skeleton-box mb-3" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
                <div className="d-flex justify-content-between">
                  <div className="skeleton-box" style={{ width: '60px', height: '14px' }} />
                  <div className="skeleton-box" style={{ width: '60px', height: '14px' }} />
                </div>
              </div>

              {/* Colors block */}
              <div className="pt-3 border-top" style={{ borderColor: '#f1f5f9' }}>
                <div className="skeleton-box mb-3" style={{ width: '35%', height: '16px' }} />
                <div className="d-flex flex-wrap gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="skeleton-box skeleton-circle" style={{ width: '26px', height: '26px' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Product Grid Skeleton */}
          <div className="col-lg-9 col-12">
            <div className="row g-3 g-lg-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} colClass="col-xl-3 col-lg-4 col-sm-6 col-12 mb-3" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CatalogSkeleton;
