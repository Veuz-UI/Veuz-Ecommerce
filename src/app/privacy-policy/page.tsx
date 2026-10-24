'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchSupportManagement,
  getCachedSupportManagement,
  SUPPORT_MANAGEMENT_EVENT,
  SupportManagementData,
  DEFAULT_SUPPORT_MANAGEMENT,
} from '@/services/supportManagementService';

export default function PrivacyPolicyPage() {
  const [data, setData] = useState<SupportManagementData>(DEFAULT_SUPPORT_MANAGEMENT);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setData(getCachedSupportManagement());

    fetchSupportManagement().then((res) => {
      if (res && res.privacyPolicy) {
        setData(res);
      }
    });

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setData(e.detail);
      }
    };
    window.addEventListener(SUPPORT_MANAGEMENT_EVENT, handleUpdate);

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener(SUPPORT_MANAGEMENT_EVENT, handleUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const privacy = data.privacyPolicy;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-content py-4 py-lg-5 veuz-page-transition position-relative" style={{ backgroundColor: '#ffffff', minHeight: '85vh' }}>
      <div className="container">
        {/* Breadcrumb with fade-in-down */}
        <div className="mb-4 anim-fade-in-down">
          <nav className="d-flex align-items-center gap-2 text-muted fs-13">
            <Link
              href="/"
              className="text-muted text-decoration-none hover-primary"
              style={{ transition: 'color 0.25s ease, transform 0.25s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#3BB77E')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              Home
            </Link>
            <span>/</span>
            <span className="fw-semibold text-dark">{privacy.title || 'Privacy Policy'}</span>
          </nav>
        </div>

        {/* ========================================================
            HERO HEADER: Title & Subtitle (Left) + Contact Card (Right)
           ======================================================== */}
        <div className="row align-items-center g-4 pb-4 pb-lg-5">
          {/* Left Column: Heading & Description */}
          <div className="col-lg-7 col-md-7 anim-fade-in-left">
            <h1
              className="fw-bold text-dark mb-3"
              style={{
                fontSize: 'clamp(34px, 4.5vw, 48px)',
                lineHeight: '1.14',
                letterSpacing: '-0.025em',
                transition: 'letter-spacing 0.3s ease',
              }}
            >
              {privacy.title || 'Privacy Policy'}
            </h1>

            <p
              className="text-muted mb-0"
              style={{
                fontSize: '16px',
                lineHeight: '1.65',
                color: '#64748b',
                transition: 'color 0.3s ease',
              }}
            >
              {privacy.subtitle || 'Our code of conduct, data protection commitments, and privacy pledge for our customers and platform members.'}
            </p>
          </div>

          {/* Right Column: Contact Callout Card with hover lift */}
          <div className="col-lg-5 col-md-5 anim-fade-in-right anim-delay-1">
            <div
              className="p-3.5 p-sm-4 rounded-3 border hover-lift"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
                cursor: 'pointer',
              }}
            >
              <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <div>
                  <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '15px' }}>
                    Have questions about your data or rights?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: '13px', lineHeight: '1.45' }}>
                    Our Data Protection Officer and customer care team are always ready to assist you.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="btn btn-sm flex-shrink-0 interactive-btn"
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: '8px',
                    padding: '8px 18px',
                    border: 'none',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f172a';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.2)';
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Divider matching clean editorial layout */}
        <div
          className="anim-fade-in-up anim-delay-1"
          style={{ height: '1px', backgroundColor: '#f1f5f9', marginBottom: '40px' }}
        />

        {/* ========================================================
            EDITORIAL CONTENT SECTIONS: Full Width Typography with Staggered Fade-in
           ======================================================== */}
        <div className="w-100">
          {privacy.sections && privacy.sections.length > 0 ? (
            privacy.sections.map((section, idx) => (
              <div
                key={section.id || idx}
                className="mb-5 anim-fade-in-up"
                style={{
                  animationDelay: `${Math.min(idx * 0.07, 0.5)}s`,
                }}
              >
                {/* Section Title in Bold Black */}
                <h2
                  className="fw-bold text-dark mb-3"
                  style={{
                    fontSize: '22px',
                    letterSpacing: '-0.015em',
                    color: '#0f172a',
                  }}
                >
                  {section.title}
                </h2>

                {/* Section Content with generous paragraph spacing & readability */}
                <div style={{ color: '#334155' }}>
                  {section.content.split('\n\n').map((paragraph, pIdx) => {
                    const cleanP = paragraph.trim();
                    if (!cleanP) return null;

                    // If first line of a paragraph is formatted as a subheader
                    const lines = cleanP.split('\n');
                    if (lines.length > 1 && lines[0].length < 80 && !lines[0].endsWith('.')) {
                      return (
                        <div key={pIdx} className="mb-4">
                          <h4 className="fw-bold text-dark fs-16 mb-2">{lines[0]}</h4>
                          <p
                            style={{
                              fontSize: '15.5px',
                              lineHeight: '1.78',
                              color: '#334155',
                              marginBottom: 0,
                            }}
                          >
                            {lines.slice(1).join(' ')}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <p
                        key={pIdx}
                        style={{
                          fontSize: '15.5px',
                          lineHeight: '1.78',
                          color: '#334155',
                          marginBottom: '16px',
                        }}
                      >
                        {cleanP}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No privacy policy sections available at this time.</p>
          )}
        </div>
      </div>

      {/* Floating Smooth Scroll to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="btn position-fixed shadow-lg d-flex align-items-center justify-content-center anim-scale-in"
          style={{
            bottom: '32px',
            right: '32px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            zIndex: 1040,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0f172a';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
          aria-label="Scroll to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
