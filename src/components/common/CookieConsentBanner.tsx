'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { requestBrowserLocation, requestBrowserNotification } from '@/services/browserPermissionService';

export const CookieConsentBanner: React.FC = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Preference switches
  const [prefAnalytics, setPrefAnalytics] = useState(true);
  const [prefMarketing, setPrefMarketing] = useState(true);
  const [prefPersonalization, setPrefPersonalization] = useState(true);

  useEffect(() => {
    setHasMounted(true);

    const savedConsent = localStorage.getItem('veuz_cookie_consent');
    if (!savedConsent) {
      setIsOpen(true);
      // Auto-trigger browser permission prompts on first visit
      requestBrowserLocation().catch(() => {});
      if ('Notification' in window && Notification.permission === 'default') {
        requestBrowserNotification().catch(() => {});
      }
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('veuz_cookie_consent', 'accepted');
    localStorage.setItem(
      'veuz_cookie_preferences',
      JSON.stringify({ necessary: true, analytics: true, marketing: true, personalization: true })
    );
    setIsOpen(false);
    setIsSettingsOpen(false);

    // Prompt native browser Location and Notification dialogs
    requestBrowserLocation().catch(() => {});
    requestBrowserNotification().catch(() => {});
  };

  const handleSavePreferences = () => {
    localStorage.setItem('veuz_cookie_consent', 'custom');
    localStorage.setItem(
      'veuz_cookie_preferences',
      JSON.stringify({
        necessary: true,
        analytics: prefAnalytics,
        marketing: prefMarketing,
        personalization: prefPersonalization,
      })
    );
    setIsOpen(false);
    setIsSettingsOpen(false);

    if (prefPersonalization) {
      requestBrowserLocation().catch(() => {});
    }
  };

  if (!hasMounted) return null;

  return (
    <>
      {/* 1. Main Bottom Consent Banner (Matching Screenshot 1) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Consent to Cookies and Data processing"
          className="cookie-banner-container"
        >
          <div className="cookie-banner-inner">
            {/* Left: Content Text */}
            <div style={{ flex: '1 1 650px', minWidth: '280px' }}>
              <h5
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '8px',
                  letterSpacing: '-0.2px',
                }}
              >
                Consent to Cookies &amp; Data processing
              </h5>
              <p
                style={{
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  color: '#475569',
                  margin: 0,
                }}
              >
                On this website we use cookies and similar functions to process end device information and personal
                data. The processing is used for purposes such as to integrate content, external services and elements
                from third parties, statistical analysis/measurement, personalized advertising and the integration of
                social media. This consent is voluntary, not required for the use of our website and can be revoked at
                any time using the icon on the bottom left.
              </p>

              {/* Language code indicator matching image */}
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                EN
              </div>
            </div>

            {/* Right: Action Buttons and Footer Links */}
            <div className="cookie-banner-actions">
              <div className="cookie-banner-btn-row">
                <button
                  type="button"
                  className="cookie-btn-settings"
                  onClick={() => setIsSettingsOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '1.5px solid #0f172a',
                    borderRadius: '6px',
                    padding: '9px 20px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f172a';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                >
                  Settings
                </button>

                <button
                  type="button"
                  className="cookie-btn-accept"
                  onClick={handleAcceptAll}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 22px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f172a';
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Accept all
                </button>
              </div>

              {/* Bottom links */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  fontSize: '11px',
                  color: '#64748b',
                  flexWrap: 'wrap',
                }}
              >
                <Link
                  href="/privacy-policy"
                  style={{ color: '#64748b', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Privacy notice
                </Link>
                <span>|</span>
                <Link
                  href="/terms"
                  style={{ color: '#64748b', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  T&amp;C
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Revoke / Reopen Floating Icon on Bottom Left */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          title="Privacy & Cookie Settings"
          aria-label="Revoke or update cookie consent"
          style={{
            position: 'fixed',
            bottom: '18px',
            left: '18px',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: '2px solid #ffffff',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999990,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.backgroundColor = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#0f172a';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </button>
      )}

      {/* 3. Detailed Cookie & Consent Settings Modal */}
      {isSettingsOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              padding: '26px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h5 style={{ fontWeight: '700', fontSize: '17px', color: '#0f172a', margin: 0 }}>
                Cookie &amp; Privacy Preferences
              </h5>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
              Customize your privacy settings. You can enable or disable different types of data processing at any time.
            </p>

            {/* Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {/* Essential */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>
                    Strictly Necessary &amp; Security
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                    Always Active
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Required for user authentication, shopping cart session persistence, checkout, and CSRF protection.
                </p>
              </div>

              {/* Personalization & Location */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>
                    Real-Time Location &amp; Region
                  </span>
                  <input
                    type="checkbox"
                    checked={prefPersonalization}
                    onChange={(e) => setPrefPersonalization(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Used to detect real-time delivery estimates and city-specific stock availability via device location.
                </p>
              </div>

              {/* Analytics */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>
                    Performance &amp; Analytics
                  </span>
                  <input
                    type="checkbox"
                    checked={prefAnalytics}
                    onChange={(e) => setPrefAnalytics(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Helps us understand how visitors interact with the site to continuously improve site speed and usability.
                </p>
              </div>

              {/* Marketing */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>
                    Marketing &amp; Alerts
                  </span>
                  <input
                    type="checkbox"
                    checked={prefMarketing}
                    onChange={(e) => setPrefMarketing(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Delivers instant push notifications for safety equipment offers, order tracking updates, and OTPs.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="cookie-modal-actions">
              <button
                type="button"
                className="cookie-modal-btn-save"
                onClick={handleSavePreferences}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Save Preferences
              </button>
              <button
                type="button"
                className="cookie-modal-btn-accept"
                onClick={handleAcceptAll}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0f172a';
                }}
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS for Mobile Side-by-Side Buttons */}
      <style jsx global>{`
        .cookie-banner-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #ffffff;
          border-top: 1px solid #cbd5e1;
          box-shadow: 0 -6px 25px rgba(0, 0, 0, 0.1);
          z-index: 999998;
          padding: 22px 28px 18px 28px;
          font-family: inherit;
          animation: fadeInUp 0.3s ease-out;
        }

        .cookie-banner-inner {
          max-width: 1360px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
          flex-wrap: wrap;
        }

        .cookie-banner-actions {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
          min-width: 200px;
        }

        .cookie-banner-btn-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .cookie-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        @media (max-width: 768px) {
          .cookie-banner-container {
            padding: 16px 14px 12px 14px !important;
          }

          .cookie-banner-inner {
            gap: 12px !important;
          }

          .cookie-banner-actions {
            width: 100% !important;
            min-width: 100% !important;
            margin-top: 4px !important;
          }

          .cookie-banner-btn-row {
            flex-direction: row !important;
            gap: 10px !important;
            width: 100% !important;
            align-items: center !important;
            justify-content: space-between !important;
          }

          .cookie-btn-settings {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            padding: 10px 8px !important;
            text-align: center !important;
            justify-content: center !important;
            font-size: 13px !important;
          }

          .cookie-btn-accept {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            padding: 10px 8px !important;
            text-align: center !important;
            justify-content: center !important;
            font-size: 13px !important;
          }

          .cookie-modal-actions {
            flex-direction: row !important;
            gap: 10px !important;
            width: 100% !important;
            justify-content: space-between !important;
          }

          .cookie-modal-btn-save,
          .cookie-modal-btn-accept {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            padding: 10px 8px !important;
            text-align: center !important;
            justify-content: center !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </>
  );
};
