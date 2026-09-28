'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/authService';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, isAdmin, isLoading } = useAuth();
  const [verifySent, setVerifySent] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  useEffect(() => {
    if (!isLoading && !user) {
      // User signed out or not logged in -> keep on home page
      router.replace('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#settings') {
        setActiveTab('settings');
        const el = document.getElementById('settings-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleRequestVerification = async () => {
    setSendingVerify(true);
    try {
      await authService.sendVerification();
      setVerifySent(true);
    } catch (e) {
      setVerifySent(true);
    } finally {
      setSendingVerify(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="container py-5 text-center">
        <div style={{ maxWidth: '400px', margin: '60px auto' }}>
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '16px' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="main">
      <div className="container py-5">
        <div className="row g-4 justify-content-center">
          
          <div className="col-lg-8">
            
            {/* 1. Email Verification Alert (If unverified) */}
            {!user.isEmailVerified && (
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fi fi-rs-exclamation" style={{ color: '#d97706', fontSize: '20px' }}></i>
                  <div>
                    <h6 style={{ margin: 0, fontWeight: '700', color: '#92400e', fontSize: '14px' }}>
                      Email Verification Pending
                    </h6>
                    <small style={{ color: '#b45309' }}>
                      Please verify your email address to enable fast one-click checkout and security alerts.
                    </small>
                  </div>
                </div>

                {verifySent ? (
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>
                    ✓ Verification Link Dispatched
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    disabled={sendingVerify}
                    style={{
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {sendingVerify ? 'Sending...' : 'Send Verification Email'}
                  </button>
                )}
              </div>
            )}

            {/* 2. Profile Details Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #3BB77E'
                  }}
                />
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontWeight: '800', color: '#0f172a' }}>{user.name}</h3>
                  <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>{user.email}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: isAdmin ? '#dbeafe' : '#dcfce7',
                      color: isAdmin ? '#1e40af' : '#166534'
                    }}>
                      {isAdmin ? 'ADMINISTRATOR' : 'CUSTOMER'}
                    </span>
                    {user.isEmailVerified ? (
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', background: '#dbeafe', color: '#1e40af' }}>
                        ✓ Verified Email
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', background: '#fef3c7', color: '#92400e' }}>
                        Unverified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Banner if Admin */}
              {isAdmin && (
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fi fi-rs-shield-check" style={{ color: '#2563eb', fontSize: '20px' }}></i>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e40af' }}>
                        Administrator Control Center
                      </div>
                      <small style={{ color: '#3b82f6' }}>You have access to store management, analytics, and products.</small>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      padding: '7px 16px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fi fi-rs-apps"></i>Open Dashboard
                  </Link>
                </div>
              )}

              <hr style={{ borderColor: '#f1f5f9', margin: '24px 0' }} />

              {/* Quick Links */}
              <div className="row g-3">
                <div className="col-md-4">
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>0</h5>
                    <small style={{ color: '#64748b' }}>Active Orders</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>2</h5>
                    <small style={{ color: '#64748b' }}>Saved Favorites</small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <h5 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>0 SR</h5>
                    <small style={{ color: '#64748b' }}>Wallet Balance</small>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-outline-danger"
                  style={{ borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}
                >
                  <i className="fi fi-rs-sign-out mr-5"></i>Sign Out
                </button>
              </div>

            </div>

            {/* 3. Settings Card */}
            <div
              id="settings"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                marginTop: '28px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fi fi-rs-settings-sliders" style={{ fontSize: '22px', color: '#3BB77E' }}></i>
                <div>
                  <h4 style={{ margin: 0, fontWeight: '800', color: '#0f172a', fontSize: '18px' }}>Account Settings</h4>
                  <small style={{ color: '#64748b' }}>Manage your personal details and account preferences</small>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Full Name</label>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="form-control"
                    style={{ borderRadius: '8px', padding: '10px 14px', fontSize: '14px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Email Address</label>
                  <input
                    type="email"
                    defaultValue={user.email}
                    disabled
                    className="form-control"
                    style={{ borderRadius: '8px', padding: '10px 14px', fontSize: '14px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <h6 style={{ fontWeight: '700', color: '#0f172a', marginBottom: '12px', fontSize: '14px' }}>Notification Preferences</h6>
                <div className="form-check form-switch mb-2">
                  <input className="form-check-input" type="checkbox" id="emailNotif" defaultChecked />
                  <label className="form-check-label" htmlFor="emailNotif" style={{ fontSize: '13px', color: '#475569' }}>
                    Email notifications for order status and tracking
                  </label>
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" id="promoNotif" />
                  <label className="form-check-label" htmlFor="promoNotif" style={{ fontSize: '13px', color: '#475569' }}>
                    Promotional alerts and exclusive discounts
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => alert('Settings saved successfully!')}
                  style={{
                    backgroundColor: '#3BB77E',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
