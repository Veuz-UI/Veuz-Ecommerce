'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardHomePage() {
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'Administrator';

  return (
    <div
      className="card border-0"
      style={{
        borderRadius: '10px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="card-body p-4 p-md-5 text-center" style={{ maxWidth: '540px' }}>
        {/* Avatar */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto 20px auto',
            border: '3px solid #e2e8f0',
          }}
        >
          <img
            src={
              user?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'Admin')}`
            }
            alt={user?.name || 'Admin'}
            width="72"
            height="72"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </div>

        {/* Welcome Heading */}
        <h2
          className="fw-bold text-dark mb-2"
          style={{ fontSize: '24px', letterSpacing: '-0.4px' }}
        >
          Welcome back, {firstName}
        </h2>

        {/* Role Badge */}
        <div className="mb-3">
          <span
            className="badge"
            style={{
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #dbeafe',
              fontSize: '12px',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '6px',
              letterSpacing: '0.3px',
            }}
          >
            {user?.role?.replace('_', ' ') || 'ADMIN'}
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-muted mb-4" style={{ fontSize: '14px', lineHeight: '1.65' }}>
          You are signed in to the Veuz Safety &amp; PPE admin dashboard.
          Use the navigation on the left to manage your platform.
        </p>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #f1f5f9', margin: '0 0 24px 0' }} />

        {/* Quick Links */}
        <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/dashboard/users"
              className="btn btn-sm d-inline-flex align-items-center gap-2 fw-semibold"
              style={{
                borderRadius: '8px',
                padding: '9px 18px',
                backgroundColor: '#0f172a',
                border: '1px solid #0f172a',
                color: '#ffffff',
                fontSize: '13px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                textDecoration: 'none',
              }}
            >
              <iconify-icon icon="solar:users-group-two-rounded-broken" class="fs-16"></iconify-icon>
              <span>User Management</span>
            </Link>
          )}

          <a
            href="/"
            className="btn btn-sm d-inline-flex align-items-center gap-2 fw-semibold"
            style={{
              borderRadius: '8px',
              padding: '9px 18px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#334155',
              fontSize: '13px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              textDecoration: 'none',
            }}
          >
            <iconify-icon icon="solar:shop-2-broken" class="fs-16 text-muted"></iconify-icon>
            <span>View Storefront</span>
          </a>

          <a
            href="/profile"
            className="btn btn-sm d-inline-flex align-items-center gap-2 fw-semibold"
            style={{
              borderRadius: '8px',
              padding: '9px 18px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#334155',
              fontSize: '13px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              textDecoration: 'none',
            }}
          >
            <iconify-icon icon="solar:user-broken" class="fs-16 text-muted"></iconify-icon>
            <span>My Profile</span>
          </a>
        </div>
      </div>
    </div>
  );
}
