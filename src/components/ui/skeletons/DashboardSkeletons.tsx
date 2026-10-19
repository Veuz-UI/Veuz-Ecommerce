'use client';

import React from 'react';

/**
 * Skeleton Loader for Login Setup Page (Dashboard)
 * Mirrors the 2-column slide configuration + live preview mockup layout
 */
export function LoginSetupSkeleton() {
  return (
    <div className="row g-4 skeleton-fade-in">
      {/* Left Column: Slide Cards Shimmer */}
      <div className="col-xl-7 col-lg-7">
        <div className="d-flex flex-column gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3 p-3 position-relative"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
              }}
            >
              {/* Header row: Slide badge + action icons */}
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="skeleton-box" style={{ width: '68px', height: '22px', borderRadius: '5px' }} />
                  {item === 1 && (
                    <div className="skeleton-box" style={{ width: '85px', height: '20px', borderRadius: '5px' }} />
                  )}
                </div>
                <div className="d-flex align-items-center gap-1.5">
                  <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
                  <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
                  <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
                </div>
              </div>

              {/* Body: Thumbnail + Upload + Caption */}
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  {/* Compact image thumbnail */}
                  <div
                    className="skeleton-box flex-shrink-0"
                    style={{ width: '76px', height: '76px', borderRadius: '8px' }}
                  />
                  {/* Upload button & hint text */}
                  <div className="d-flex flex-column gap-2">
                    <div className="skeleton-box" style={{ width: '115px', height: '32px', borderRadius: '7px' }} />
                    <div className="skeleton-box" style={{ width: '220px', height: '12px', borderRadius: '4px' }} />
                  </div>
                </div>

                {/* Caption input */}
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="skeleton-box" style={{ width: '130px', height: '14px', borderRadius: '4px' }} />
                    <div className="skeleton-box" style={{ width: '60px', height: '12px', borderRadius: '4px' }} />
                  </div>
                  <div className="skeleton-box" style={{ width: '100%', height: '58px', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Live Storefront Preview Mockup Shimmer */}
      <div className="col-xl-5 col-lg-5">
        <div
          className="rounded-3 p-3 sticky-top"
          style={{
            top: '85px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="skeleton-box skeleton-circle" style={{ width: '20px', height: '20px' }} />
              <div className="skeleton-box" style={{ width: '140px', height: '16px', borderRadius: '4px' }} />
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
              <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
            </div>
          </div>

          {/* Mockup Container */}
          <div className="d-flex flex-column align-items-center">
            <div
              className="position-relative overflow-hidden"
              style={{
                width: '100%',
                maxWidth: '300px',
                height: '420px',
                borderRadius: '20px',
                backgroundColor: '#0f172a',
                boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Image Shimmer Layer */}
              <div
                className="skeleton-box position-absolute"
                style={{ inset: 0, width: '100%', height: '100%', borderRadius: '0', backgroundColor: '#1e293b' }}
              />

              {/* Story Bars */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  display: 'flex',
                  gap: '6px',
                  padding: '14px 16px 0 16px',
                }}
              >
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className="skeleton-box"
                    style={{ flex: 1, height: '3px', borderRadius: '999px', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                  />
                ))}
              </div>

              {/* Caption Shimmer */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 3,
                  padding: '40px 18px 20px 18px',
                }}
              >
                <div className="skeleton-box mb-2" style={{ width: '90%', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton-box mb-2" style={{ width: '75%', height: '14px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '50%', height: '14px', borderRadius: '4px' }} />
              </div>
            </div>

            <div className="mt-3">
              <div className="skeleton-box" style={{ width: '120px', height: '20px', borderRadius: '5px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader for Dashboard Card Grids (e.g., Partners, Banners, Promotions)
 */
export function DashboardCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="row g-3 skeleton-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-12 col-md-6 col-lg-4 col-xl-3">
          <div
            className="card h-100 border p-3"
            style={{
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Header: badge + order */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="skeleton-box" style={{ width: '50px', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton-box" style={{ width: '45px', height: '18px', borderRadius: '4px' }} />
            </div>

            {/* Thumbnail Box */}
            <div
              className="skeleton-box mb-3 mx-auto"
              style={{ width: '100%', height: '100px', borderRadius: '8px' }}
            />

            {/* Title / Name */}
            <div className="skeleton-box mb-3 mx-auto" style={{ width: '70%', height: '16px', borderRadius: '4px' }} />

            {/* Footer controls: Status switch + Action buttons */}
            <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-auto">
              <div className="skeleton-box" style={{ width: '70px', height: '22px', borderRadius: '6px' }} />
              <div className="d-flex align-items-center gap-1">
                <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
                <div className="skeleton-box" style={{ width: '28px', height: '26px', borderRadius: '6px' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader for Dashboard Data Tables (e.g., Products, Users, Orders)
 */
export function DashboardTableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-responsive skeleton-fade-in">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            {Array.from({ length: cols }).map((_, idx) => (
              <th key={idx} className="py-3 px-3">
                <div className="skeleton-box" style={{ width: idx === 0 ? '120px' : '80px', height: '14px', borderRadius: '4px' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx}>
              {Array.from({ length: cols }).map((_, cIdx) => (
                <td key={cIdx} className="py-3 px-3">
                  {cIdx === 0 ? (
                    <div className="d-flex align-items-center gap-2.5">
                      <div className="skeleton-box flex-shrink-0" style={{ width: '38px', height: '38px', borderRadius: '6px' }} />
                      <div className="d-flex flex-column gap-1.5 flex-grow-1">
                        <div className="skeleton-box" style={{ width: '85%', height: '14px', borderRadius: '4px' }} />
                        <div className="skeleton-box" style={{ width: '50%', height: '11px', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ) : cIdx === cols - 1 ? (
                    <div className="d-flex align-items-center justify-content-end gap-1.5">
                      <div className="skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                      <div className="skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                    </div>
                  ) : (
                    <div className="skeleton-box" style={{ width: '65%', height: '14px', borderRadius: '4px' }} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
