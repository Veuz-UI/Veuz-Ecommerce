'use client';

import React from 'react';

export function ProfileSkeleton() {
  return (
    <main className="main" style={{ backgroundColor: '#ffffff', minHeight: '85vh', paddingBottom: '70px' }}>
      <div className="container py-3 py-md-4">
        {/* Page Top Header */}
        <div className="mb-3 mb-md-4 mt-1">
          <div className="skeleton-box mb-2" style={{ width: '180px', height: '28px', borderRadius: '6px' }} />
          <div className="skeleton-box" style={{ width: '320px', height: '14px', borderRadius: '4px' }} />
        </div>

        {/* Main Clean Profile Card Container */}
        <div className="profile-page-card">
          {/* Top Tabs Bar */}
          <div className="d-flex gap-2 gap-md-3 pb-3 mb-4 border-bottom" style={{ borderColor: '#e2e8f0', overflowX: 'hidden' }}>
            <div className="skeleton-box" style={{ width: '110px', height: '38px', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ width: '140px', height: '38px', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ width: '125px', height: '38px', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ width: '145px', height: '38px', borderRadius: '8px' }} />
          </div>

          {/* Profile Picture Box */}
          <div className="profile-avatar-box mb-4">
            <div className="skeleton-box skeleton-circle" style={{ width: '86px', height: '86px', flexShrink: 0 }} />
            <div>
              <div className="skeleton-box mb-2" style={{ width: '140px', height: '16px' }} />
              <div className="d-flex gap-2">
                <div className="skeleton-box" style={{ width: '110px', height: '34px', borderRadius: '8px' }} />
                <div className="skeleton-box" style={{ width: '90px', height: '34px', borderRadius: '8px' }} />
              </div>
            </div>
          </div>

          {/* Form Inputs Grid (6 fields) */}
          <div className="row g-3 g-md-4">
            <div className="col-md-6">
              <div className="skeleton-box mb-2" style={{ width: '90px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
            </div>
            <div className="col-md-6">
              <div className="skeleton-box mb-2" style={{ width: '90px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
            </div>
            <div className="col-md-6">
              <div className="skeleton-box mb-2" style={{ width: '100px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
            </div>
            <div className="col-md-6">
              <div className="skeleton-box mb-2" style={{ width: '110px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
            </div>
            <div className="col-md-6">
              <div className="skeleton-box mb-2" style={{ width: '95px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
            </div>
            <div className="col-md-6">
              <div className="skeleton-box mb-2" style={{ width: '70px', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '46px', borderRadius: '10px' }} />
            </div>
          </div>

          {/* Form Actions */}
          <div className="profile-form-actions mt-4 pt-2">
            <div className="skeleton-box" style={{ width: '140px', height: '46px', borderRadius: '9px' }} />
            <div className="skeleton-box" style={{ width: '100px', height: '46px', borderRadius: '9px' }} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default ProfileSkeleton;
