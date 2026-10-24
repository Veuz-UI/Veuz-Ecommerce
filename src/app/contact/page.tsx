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
import { fetchPartners, PARTNERS_EVENT } from '@/services/partnersService';
import { DEFAULT_PARTNERS_DATA, PartnerItem } from '@/data/defaultPartners';

interface FAQItem {
  icon: string;
  question: string;
  answer: string;
}

const CONTACT_FAQS: FAQItem[] = [
  {
    icon: 'smile',
    question: 'Is there a free trial or sample evaluation available?',
    answer:
      "Yes, we provide corporate clients and safety managers with sample kits for PPE evaluation and site wear trials. Contact our team to request a sample pack and schedule an onboarding review.",
  },
  {
    icon: 'layers',
    question: 'Can I change my plan or bulk order schedule later?',
    answer:
      'Yes, you can easily modify your delivery frequency, amend bulk quantities, or pause standing orders at any time through your corporate dashboard or by notifying your dedicated account manager.',
  },
  {
    icon: 'card',
    question: 'What is your cancellation and returns policy?',
    answer:
      'We provide a 14-day hassle-free return and exchange guarantee on all unworn equipment in original packaging with safety tags intact. For sizing exchanges on safety footwear or gloves, we arrange complimentary courier pickup.',
  },
  {
    icon: 'pencil',
    question: 'Can customized corporate billing and PO info be added to invoices?',
    answer:
      'Yes, we issue ZATCA-compliant e-invoices with your company VAT registration number, purchase order (PO) reference, project code, and specific billing address.',
  },
  {
    icon: 'truck',
    question: 'How fast do you deliver industrial safety gear across Saudi Arabia?',
    answer:
      'Standard delivery across the Eastern Province (Khobar, Dammam, Jubail) takes 1-2 business days. Central (Riyadh) and Western (Jeddah, Yanbu) regions take 2-4 business days. Same-day emergency courier is available for urgent site compliance.',
  },
  {
    icon: 'shield',
    question: 'Are all helmets, shoes, and gear certified to international safety standards?',
    answer:
      'Absolutely. Every PPE product is certified under OSHA, EN, CE, or ANSI/ISEA standards. Mill test reports and compliance certificates are available upon request for corporate site safety audits.',
  },
];

export default function ContactUsPage() {
  const [supportData, setSupportData] = useState<SupportManagementData>(DEFAULT_SUPPORT_MANAGEMENT);
  const [partners, setPartners] = useState<PartnerItem[]>(DEFAULT_PARTNERS_DATA.partners);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 1. Load support data & listen to live updates from dashboard
  useEffect(() => {
    const cached = getCachedSupportManagement();
    setSupportData(cached);

    fetchSupportManagement().then((res) => {
      if (res && res.contact) {
        setSupportData(res);
      }
    });

    const handleSupportUpdate = (e: any) => {
      if (e.detail) {
        setSupportData(e.detail);
      }
    };
    window.addEventListener(SUPPORT_MANAGEMENT_EVENT, handleSupportUpdate);
    return () => {
      window.removeEventListener(SUPPORT_MANAGEMENT_EVENT, handleSupportUpdate);
    };
  }, []);

  // 2. Load partners & listen to real-time updates
  useEffect(() => {
    fetchPartners().then((res) => {
      if (res && Array.isArray(res.partners)) {
        const active = res.partners.filter((p) => p.isActive !== false);
        setPartners(active.length > 0 ? active : DEFAULT_PARTNERS_DATA.partners);
      }
    });

    const handlePartnersUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail.partners)) {
        const active = e.detail.partners.filter((p: any) => p.isActive !== false);
        setPartners(active.length > 0 ? active : DEFAULT_PARTNERS_DATA.partners);
      }
    };
    window.addEventListener(PARTNERS_EVENT, handlePartnersUpdate);
    return () => {
      window.removeEventListener(PARTNERS_EVENT, handlePartnersUpdate);
    };
  }, []);

  const contact = supportData.contact;

  const salesEmail = contact.salesEmail || (contact.email.includes('@')
    ? `sales@${contact.email.split('@')[1]}`
    : 'sales@veuz-safety.com');

  const faqs = supportData.faqs && supportData.faqs.length > 0 ? supportData.faqs : CONTACT_FAQS;

  const activePartners = partners.filter((p) => p.isActive !== false);
  const basePartners = activePartners.length > 0 ? activePartners : DEFAULT_PARTNERS_DATA.partners;
  // Repeat partners to ensure infinite seamless loop for the full-width marquee
  const marqueePartners = [
    ...basePartners,
    ...basePartners,
    ...basePartners,
    ...basePartners,
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const renderFaqIcon = (type?: string) => {
    switch (type) {
      case 'smile':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        );
      case 'layers':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
      case 'card':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        );
      case 'pencil':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        );
      case 'truck':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        );
      case 'shield':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className="page-content py-4 py-lg-5 veuz-page-transition" style={{ backgroundColor: '#ffffff', minHeight: '85vh', overflowX: 'hidden' }}>
      <div className="container">
        {/* Breadcrumb with subtle fade */}
        <div className="mb-4 anim-fade-in-down">
          <nav className="d-flex align-items-center gap-2 text-muted fs-13">
            <Link
              href="/"
              className="text-muted text-decoration-none hover-primary"
              style={{ transition: 'color 0.25s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              Home
            </Link>
            <span>/</span>
            <span className="fw-semibold text-dark">Contact</span>
          </nav>
        </div>

        {/* ========================================================
            PAGE HEADER: Clean Center Title matching Untitled UI style
           ======================================================== */}
        <div className="text-center mb-5 pb-2 anim-fade-in-up">
          {contact.badge && (
            <div
              className="d-inline-flex align-items-center px-3 py-1 rounded-pill mb-3"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #eaecf0',
                fontSize: '13px',
                fontWeight: 600,
                color: '#344054',
              }}
            >
              <span>{contact.badge}</span>
            </div>
          )}

          <h1
            className="fw-bold text-dark mb-3"
            style={{
              fontSize: 'clamp(32px, 4vw, 44px)',
              lineHeight: '1.2',
              letterSpacing: '-0.025em',
              color: '#101828',
            }}
          >
            {contact.title || "We’d love to hear from you"}
          </h1>

          <p
            className="text-muted mx-auto mb-0"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              maxWidth: '560px',
              color: '#475467',
            }}
          >
            {contact.subtitle || 'Our friendly team is always here to chat and assist you with all your industrial safety needs.'}
          </p>
        </div>

        {/* ========================================================
            4 CONTACT CARDS ROW (Connected to Dashboard State)
           ======================================================== */}
        <div className="row g-4 mb-4">
          {/* Card 1: Chat to sales */}
          <div className="col-xl-3 col-lg-3 col-md-6 col-12 anim-fade-in-up anim-delay-1">
            <div
              className="p-4 rounded-4 border h-100 d-flex flex-column hover-lift"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#eaecf0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
                borderRadius: '16px',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eaecf0',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  borderRadius: '12px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M9 10h.01" />
                  <path d="M15 10h.01" />
                  <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
                </svg>
              </div>

              <h4 className="fw-bold text-dark fs-18 mb-2" style={{ color: '#101828' }}>
                {contact.salesTitle || 'Chat to sales'}
              </h4>

              <p className="text-muted fs-14 mb-3" style={{ color: '#475467', lineHeight: '1.5' }}>
                {contact.salesDescription || 'Speak to our friendly team.'}
              </p>

              <div className="mt-auto pt-2">
                <a
                  href={`mailto:${salesEmail}`}
                  className="fw-semibold fs-14 text-dark text-decoration-underline d-inline-block hover-primary"
                  style={{ color: '#101828', wordBreak: 'break-all', transition: 'color 0.2s ease' }}
                >
                  {salesEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: Chat to support */}
          <div className="col-xl-3 col-lg-3 col-md-6 col-12 anim-fade-in-up anim-delay-2">
            <div
              className="p-4 rounded-4 border h-100 d-flex flex-column hover-lift"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#eaecf0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
                borderRadius: '16px',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eaecf0',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  borderRadius: '12px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                  <path d="M8 12h.01" />
                  <path d="M12 12h.01" />
                  <path d="M16 12h.01" />
                </svg>
              </div>

              <h4 className="fw-bold text-dark fs-18 mb-2" style={{ color: '#101828' }}>
                {contact.supportTitle || 'Chat to support'}
              </h4>

              <p className="text-muted fs-14 mb-3" style={{ color: '#475467', lineHeight: '1.5' }}>
                {contact.emailDescription || "Our friendly team is here to help."}
              </p>

              <div className="mt-auto pt-2">
                <a
                  href={`mailto:${contact.email}`}
                  className="fw-semibold fs-14 text-dark text-decoration-underline d-inline-block hover-primary"
                  style={{ color: '#101828', wordBreak: 'break-all', transition: 'color 0.2s ease' }}
                >
                  {contact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Card 3: Visit us */}
          <div className="col-xl-3 col-lg-3 col-md-6 col-12 anim-fade-in-up anim-delay-3">
            <div
              className="p-4 rounded-4 border h-100 d-flex flex-column hover-lift"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#eaecf0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
                borderRadius: '16px',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eaecf0',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  borderRadius: '12px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>

              <h4 className="fw-bold text-dark fs-18 mb-2" style={{ color: '#101828' }}>
                {contact.visitTitle || 'Visit us'}
              </h4>

              <p className="text-muted fs-14 mb-3" style={{ color: '#475467', lineHeight: '1.5' }}>
                {contact.officeDescription || 'Come say hello at our safety office HQ.'}
              </p>

              <div className="mt-auto pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.office)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-semibold fs-14 text-dark text-decoration-underline d-inline-block hover-primary"
                  style={{ color: '#101828', transition: 'color 0.2s ease' }}
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Card 4: Call us */}
          <div className="col-xl-3 col-lg-3 col-md-6 col-12 anim-fade-in-up anim-delay-4">
            <div
              className="p-4 rounded-4 border h-100 d-flex flex-column hover-lift"
              style={{
                backgroundColor: '#ffffff',
                borderColor: '#eaecf0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
                borderRadius: '16px',
                transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div
                className="d-inline-flex align-items-center justify-content-center mb-4 rounded-3"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eaecf0',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  borderRadius: '12px',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#344054" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>

              <h4 className="fw-bold text-dark fs-18 mb-2" style={{ color: '#101828' }}>
                {contact.callTitle || 'Call us'}
              </h4>

              <p className="text-muted fs-14 mb-3" style={{ color: '#475467', lineHeight: '1.5' }}>
                {contact.phoneDescription || 'Mon-Fri from 8am to 5pm.'}
              </p>

              <div className="mt-auto pt-2">
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="fw-semibold fs-14 text-dark text-decoration-underline d-inline-block hover-primary"
                  style={{ color: '#101828', transition: 'color 0.2s ease' }}
                >
                  {contact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            BORDER BETWEEN 4 CARDS & PARTNER LOGOS
           ======================================================== */}
        <div
          className="my-5 anim-fade-in-up"
          style={{ height: '1px', backgroundColor: '#eaecf0' }}
        />
      </div>

      {/* ========================================================
          FULL-WIDTH AUTO-SLIDE PARTNER LOGOS SECTION (Below 4 Cards)
         ======================================================== */}
      <div className="w-100 py-3 my-2 anim-fade-in-up" style={{ backgroundColor: '#ffffff' }}>
        <p
          className="text-muted fw-medium text-center mb-4"
          style={{
            fontSize: '14px',
            color: '#667085',
            letterSpacing: '0.2px',
          }}
        >
          Trusted by exceptional brands around the world
        </p>

        <div className="contact-marquee-container">
          <div className="contact-marquee-track">
            {marqueePartners.map((partner, idx) => (
              <a
                key={`${partner.id || 'partner'}-${idx}`}
                href={partner.link || '/products'}
                className="contact-partner-logo-item"
                title={partner.name}
              >
                {partner.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector('.partner-fallback-text')) {
                        const span = document.createElement('span');
                        span.className = 'partner-fallback-text fw-bold fs-16 text-muted';
                        span.textContent = partner.name;
                        parent.appendChild(span);
                      }
                    }}
                  />
                ) : (
                  <span className="fw-bold fs-16 text-muted">{partner.name}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {/* ========================================================
            BORDER BETWEEN PARTNER LOGOS & FREQUENTLY ASKED QUESTIONS
           ======================================================== */}
        <div
          className="my-5 anim-fade-in-up"
          style={{ height: '1px', backgroundColor: '#eaecf0' }}
        />

        {/* ========================================================
            FREQUENTLY ASKED QUESTIONS ACCORDION (Untitled UI Reference)
           ======================================================== */}
        <div className="py-2 mb-4 anim-fade-in-up" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <h2
            className="fw-bold text-dark text-center mb-4 pb-2"
            style={{
              fontSize: 'clamp(26px, 3.2vw, 36px)',
              letterSpacing: '-0.025em',
              color: '#101828',
            }}
          >
            Frequently asked questions
          </h2>

          <div className="d-flex flex-column gap-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;

              return (
                <div
                  key={idx}
                  className="border rounded-4 overflow-hidden mb-2"
                  style={{
                    backgroundColor: isOpen ? '#fbfbfd' : '#ffffff',
                    borderColor: isOpen ? '#cbd5e1' : '#eaecf0',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-100 text-start border-0 bg-transparent p-3 p-sm-4 d-flex align-items-center justify-content-between gap-3"
                    style={{ cursor: 'pointer' }}
                    aria-expanded={isOpen}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: '42px',
                          height: '42px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #eaecf0',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                          borderRadius: '10px',
                        }}
                      >
                        {renderFaqIcon(faq.icon)}
                      </div>

                      <span
                        className="fw-bold text-dark fs-16 mb-0"
                        style={{ color: '#101828', lineHeight: '1.4' }}
                      >
                        {faq.question}
                      </span>
                    </div>

                    <div
                      className="flex-shrink-0 text-muted"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      className="px-3 px-sm-4 pb-4 pt-1 anim-fade-in-up"
                      style={{
                        paddingLeft: '68px',
                        color: '#475467',
                        fontSize: '15px',
                        lineHeight: '1.7',
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
