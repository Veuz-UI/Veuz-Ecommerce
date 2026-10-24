'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  fetchFooterSetup,
  getCachedFooterSetup,
  FOOTER_SETUP_EVENT,
  DEFAULT_FOOTER_SETUP,
  FooterSetupData,
} from '@/services/footerSetupService';
import {
  fetchShopSettings,
  getCachedShopSettings,
  SHOP_SETTINGS_EVENT,
} from '@/services/shopSettingsService';
import type { ShopSettingsData, ShopCategory, MainMenuItem } from '@/data/defaultShopSettings';

export const Footer: React.FC = () => {
  const [footerSetup, setFooterSetup] = useState<FooterSetupData>(DEFAULT_FOOTER_SETUP);
  const [shopSettings, setShopSettings] = useState<ShopSettingsData>(() => getCachedShopSettings());

  useEffect(() => {
    // 0. Fetch live shop settings for dynamic categories & menu
    fetchShopSettings().then((data) => {
      if (data) setShopSettings(data);
    });

    const handleShopUpdate = (e: any) => {
      if (e.detail) {
        setShopSettings(e.detail);
      } else {
        fetchShopSettings().then((data) => {
          if (data) setShopSettings(data);
        });
      }
    };
    window.addEventListener(SHOP_SETTINGS_EVENT, handleShopUpdate);

    // 1. Immediately update from cache on client mount
    const cached = getCachedFooterSetup();
    if (cached) {
      setFooterSetup(cached);
    }

    // 2. Fetch fresh data from API
    fetchFooterSetup().then((data) => {
      if (data) setFooterSetup(data);
    });

    // 3. Listen to live updates triggered from the dashboard (same tab)
    const handleFooterUpdate = (e: any) => {
      if (e.detail) {
        setFooterSetup(e.detail);
      } else {
        fetchFooterSetup().then((data) => {
          if (data) setFooterSetup(data);
        });
      }
    };

    // 4. Cross-tab synchronization via localStorage storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'veuz_footer_setup_cache' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setFooterSetup(parsed);
        } catch (err) {}
      }
    };

    // 5. Re-check on tab focus
    const handleFocus = () => {
      const fresh = getCachedFooterSetup();
      if (fresh) setFooterSetup(fresh);
    };

    window.addEventListener(FOOTER_SETUP_EVENT, handleFooterUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener(SHOP_SETTINGS_EVENT, handleShopUpdate);
      window.removeEventListener(FOOTER_SETUP_EVENT, handleFooterUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const renderFeatureIcon = (icon: string) => {
    switch (icon) {
      case 'pickup':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
            <path d="M21 9c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3" />
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
            <path d="M10 21v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
          </svg>
        );
      case 'shipping':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        );
      case 'payment':
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="13" rx="2.5" />
            <circle cx="12" cy="12.5" r="2.5" />
            <path d="M6 10h.01M18 15h.01" />
          </svg>
        );
      case 'help':
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a10 10 0 0 1 20 0v6a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
          </svg>
        );
    }
  };

  const featuresSection = footerSetup.features || DEFAULT_FOOTER_SETUP.features;
  const activeFeatures = (featuresSection?.items || []).filter((item) => item.isVisible);
  const isFeaturesVisible = featuresSection?.isVisible !== false && activeFeatures.length > 0;

  // 1. Column 1: Main Pages / Navigation Links (Main store links only; product categories belong in Column 2)
  const displayNavLinks: { name: string; link: string }[] = [
    { name: 'Home', link: '/' },
    { name: 'All Products', link: '/products' },
    { name: 'New Arrivals', link: '/new-arrival-products' },
    { name: 'Hot Sales', link: '/offer-products' },
    { name: 'Limited Offers', link: '/limited-offers' },
    { name: 'Most Searched', link: '/most-searched-products' },
  ];

  // 2. All Active Categories from Store Settings (or default safety categories fallback)
  const activeCategories: ShopCategory[] = (shopSettings.categories || []).filter((c: ShopCategory) => c.isActive !== false);
  const allCategoryItems: { name: string; link: string }[] = activeCategories.length > 0
    ? activeCategories.map((c: ShopCategory) => ({
        name: c.name,
        link: c.link || `/products?category=${encodeURIComponent(c.name)}`,
      }))
    : [
        { name: 'Safety Helmet', link: '/products?category=Helmet' },
        { name: 'Safety Shoes', link: '/products?category=Safety%20Shoes' },
        { name: 'Cut Gloves', link: '/products?category=Cut%20Gloves' },
        { name: 'Safety Goggles', link: '/products?category=Safety%20Goggles' },
        { name: 'Ear Protection', link: '/products?category=Ear%20Protection' },
        { name: 'Respirators', link: '/products?category=Respirators' },
        { name: 'Fall Harness', link: '/products?category=Fall%20Harness' },
        { name: 'PPE KIT', link: '/products?category=PPE%20KIT' },
        { name: 'Safety Bags', link: '/products?category=Bags' },
      ];

  // Divide categories across two columns: Column 2 completes exactly 6 items, then balance moves to Column 3
  const splitIndex = 6;
  const col2CategoryLinks = allCategoryItems.slice(0, splitIndex);
  const col3CategoryBalance: { name: string; link: string; isViewAll?: boolean }[] = [
    ...allCategoryItems.slice(splitIndex),
    { name: 'View all categories', link: '/products', isViewAll: true },
  ];

  // 4. Column 4: Support & Services
  const supportServiceLinks = [
    { name: 'Contact Us', link: '/contact' },
    { name: 'Returns & Exchanges', link: '/terms#returns' },
    { name: 'Shipping & Delivery', link: '/contact?topic=shipping' },
    { name: 'Help Center', link: '/contact' },
    { name: 'Privacy Policy', link: '/privacy-policy' },
    { name: 'Terms of Service', link: '/terms' },
  ];

  const col1Config = footerSetup.linkColumns?.columns?.find((c) => c.type === 'navigation' || c.id === 'col-navigation');
  const col2Config = footerSetup.linkColumns?.columns?.find((c) => c.type === 'categories' || c.id === 'col-categories');
  const col3Config = footerSetup.linkColumns?.columns?.find((c) => c.type === 'common' || c.id === 'col-common');
  const col4Config = footerSetup.linkColumns?.columns?.find((c) => c.type === 'support' || c.id === 'col-support');

  const col1Title = col1Config?.title || 'Main Pages';
  const col2Title = col2Config?.title || 'Popular Categories';
  const col4Title = col4Config?.title || 'Support & Services';

  const isCol1Visible = col1Config?.isVisible !== false;
  const isCol2Visible = col2Config?.isVisible !== false;
  const isCol3Visible = col3Config?.isVisible !== false;
  const isCol4Visible = col4Config?.isVisible !== false;

  return (
    <footer className="ref-footer">
      <div className="container">
        
        {/* 1. Top Feature Highlights (Dynamic 1 to 4 Cards with automatic space division) */}
        {isFeaturesVisible && (
          <div className={`ref-footer-features-grid cols-${activeFeatures.length}`}>
            {activeFeatures.map((item) => (
              <div key={item.id} className="ref-feature-card">
                <div className="ref-feature-icon">
                  {renderFeatureIcon(item.icon)}
                </div>
                <div>
                  <h5 className="ref-feature-title">{item.title}</h5>
                  <p className="ref-feature-sub">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Main 4-Column Links Grid */}
        <div className="ref-footer-links-grid">
          
          {/* Column 1: Main Pages / Navigation Links */}
          {isCol1Visible && (
            <div>
              <h5 className="ref-footer-col-title">{col1Title}</h5>
              <ul className="ref-footer-list">
                {displayNavLinks.map((item, idx) => (
                  <li key={idx}>
                    <Link href={item.link}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 2: Popular Categories (Part 1) */}
          {isCol2Visible && (
            <div>
              <h5 className="ref-footer-col-title">{col2Title}</h5>
              <ul className="ref-footer-list">
                {col2CategoryLinks.map((cat, idx) => (
                  <li key={idx}>
                    <Link href={cat.link}>{cat.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 3: Categories Balance / Part 2 (No heading, aligns with Column 2, ends with "View all categories") */}
          {isCol3Visible && (
            <div>
              {/* Desktop spacer to align items with Column 2 where heading exists */}
              <div className="d-none d-md-block" style={{ height: '39px' }} aria-hidden="true" />
              <ul className="ref-footer-list">
                {col3CategoryBalance.map((cat, idx) => (
                  <li key={idx}>
                    <Link
                      href={cat.link}
                      style={cat.isViewAll ? { fontWeight: 600, color: '#0284c7' } : undefined}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 4: Support & Services + Region Country */}
          {isCol4Visible && (
            <div>
              <h5 className="ref-footer-col-title">{col4Title}</h5>
              <ul className="ref-footer-list">
                {supportServiceLinks.map((svc, idx) => (
                  <li key={idx}>
                    <Link href={svc.link}>{svc.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* 3. Lower Row (Download App, Payment, Stay Connected) */}
        <div className="ref-footer-lower-row">
          
          {/* Download App */}
          {footerSetup.appDownload.isVisible && (
            <div className="ref-lower-col-app">
              <h5 className="ref-lower-title">{footerSetup.appDownload.sectionTitle || 'Download Our App'}</h5>
              <div className="ref-app-badges">
                {footerSetup.appDownload.apps
                  .filter((app) => app.isVisible)
                  .map((app) => {
                    const isApple =
                      app.id === 'app-store' ||
                      app.id.toLowerCase().includes('apple') ||
                      app.name.toLowerCase().includes('apple') ||
                      app.name.toLowerCase().includes('app store');
                    const isGoogle =
                      app.id === 'google-play' ||
                      app.id.toLowerCase().includes('google') ||
                      app.id.toLowerCase().includes('play') ||
                      app.name.toLowerCase().includes('google') ||
                      app.name.toLowerCase().includes('play');

                    if (isApple) {
                      return (
                        <a
                          key={app.id}
                          href={app.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="store-badge-apple"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                            <path d="M8.8086 14.9194l6.1107-11.0368c.0837-.1513.1682-.302.2437-.4584.0685-.142.1267-.2854.1646-.4403.0803-.3259.0588-.6656-.066-.9767-.1238-.3095-.3417-.5678-.6201-.7355a1.4175 1.4175 0 0 0-.921-.1924c-.3207.043-.6135.1935-.8443.4288-.1094.1118-.1996.2361-.2832.369-.092.1463-.175.2979-.259.4492l-.3864.6979-.3865-.6979c-.0837-.1515-.1667-.303-.2587-.4492-.0837-.1329-.1739-.2572-.2835-.369-.2305-.2353-.5233-.3857-.844-.429a1.4181 1.4181 0 0 0-.921.1926c-.2784.1677-.4964.426-.6203.7355-.1246.311-.1461.6508-.066.9767.038.155.0962.2984.1648.4403.0753.1564.1598.307.2437.4584l1.248 2.2543-4.8625 8.7825H2.0295c-.1676 0-.3351-.0007-.5026.0092-.1522.009-.3004.0284-.448.0714-.3108.0906-.5822.2798-.7783.548-.195.2665-.3006.5929-.3006.9279 0 .3352.1057.6612.3006.9277.196.2683.4675.4575.7782.548.1477.043.296.0623.4481.0715.1675.01.335.009.5026.009h13.0974c.0171-.0357.059-.1294.1-.2697.415-1.4151-.6156-2.843-2.0347-2.843zM3.113 18.5418l-.7922 1.5008c-.0818.1553-.1644.31-.2384.4705-.067.1458-.124.293-.1611.452-.0785.3346-.0576.6834.0645 1.0029.1212.3175.3346.583.607.7549.2727.172.5891.2416.9013.1975.3139-.044.6005-.1986.8263-.4402.1072-.1148.1954-.2424.2772-.3787.0902-.1503.1714-.3059.2535-.4612L6 19.4636c-.0896-.149-.9473-1.4704-2.887-.9218m20.5861-3.0056a1.4707 1.4707 0 0 0-.779-.5407c-.1476-.0425-.2961-.0616-.4483-.0705-.1678-.0099-.3352-.0091-.503-.0091H18.648l-4.3891-7.817c-.6655.7005-.9632 1.485-1.0773 2.1976-.1655 1.0333.0367 2.0934.546 3.0004l5.2741 9.3933c.084.1494.167.299.2591.4435.0837.131.1739.2537.2836.364.231.2323.5238.3809.8449.4232.3192.0424.643-.0244.9217-.1899.2784-.1653.4968-.4204.621-.7257.1246-.3072.146-.6425.0658-.9641-.0381-.1529-.0962-.2945-.165-.4346-.0753-.1543-.1598-.303-.2438-.4524l-1.216-2.1662h1.596c.1677 0 .3351.0009.5029-.009.1522-.009.3007-.028.4483-.0705a1.4707 1.4707 0 0 0 .779-.5407A1.5386 1.5386 0 0 0 24 16.452a1.539 1.539 0 0 0-.3009-.9158Z" />
                          </svg>
                          <div className="store-badge-text">
                            <span className="store-badge-sub">{app.subText || 'Download on the'}</span>
                            <span className="store-badge-title">{app.name}</span>
                          </div>
                        </a>
                      );
                    }

                    if (isGoogle) {
                      return (
                        <a
                          key={app.id}
                          href={app.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="store-badge-google"
                        >
                          <svg width="20" height="22" viewBox="0 0 512 512">
                            <path fill="#4285F4" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                            <path fill="#34A853" d="M47 37.6C44.1 43.1 42.5 49.8 42.5 57.3v397.4c0 7.5 1.6 14.2 4.5 19.7L252.7 268.7 47 37.6z" />
                            <path fill="#FBBC04" d="M425.2 216.5l-40 23-59.9-5.2-60-60 159.9 42.2z" />
                            <path fill="#EA4335" d="M325.3 277.7l60.1 60.1-280.8 161.2 220.7-221.3z" />
                            <path fill="#FBBC04" d="M465.1 239.5l-39.9-23-40.4 40.4 40.4 40.4 40.9-23.5c14.2-8.2 14.2-26.1-1-34.3z" />
                          </svg>
                          <div className="store-badge-text">
                            <span className="store-badge-sub">{app.subText || 'GET IT ON'}</span>
                            <span className="store-badge-title">{app.name}</span>
                          </div>
                        </a>
                      );
                    }

                    // Custom Mobile Store
                    return (
                      <a
                        key={app.id}
                        href={app.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="store-badge-apple"
                        style={{ minWidth: '135px' }}
                      >
                        <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                        <div className="store-badge-text">
                          <span className="store-badge-sub">{app.subText || 'EXPLORE ON'}</span>
                          <span className="store-badge-title">{app.name}</span>
                        </div>
                      </a>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          {footerSetup.paymentMethods.isVisible && (
            <div className="ref-lower-col-payment">
              <h5 className="ref-lower-title">{footerSetup.paymentMethods.sectionTitle || 'Payment Method'}</h5>
              <div className="ref-payment-badges">
                {footerSetup.paymentMethods.methods
                  .filter((method) => method.isVisible)
                  .map((method) => {
                    const wrapLink = (badgeContent: React.ReactNode) => {
                      if (method.linkUrl && method.linkUrl !== '#' && method.linkUrl.trim() !== '') {
                        return (
                          <a
                            key={method.id}
                            href={method.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            {badgeContent}
                          </a>
                        );
                      }
                      return <React.Fragment key={method.id}>{badgeContent}</React.Fragment>;
                    };

                    const code = (method.code || '').toLowerCase();

                    if (code === 'tabby') {
                      return wrapLink(<span className="pay-badge tabby-badge">{method.name || 'tabby'}</span>);
                    }
                    if (code === 'tamara') {
                      return wrapLink(<span className="pay-badge tamara-badge">{method.name || 'tamara'}</span>);
                    }
                    if (code === 'visa') {
                      return wrapLink(<span className="pay-badge visa-badge">{method.name || 'VISA'}</span>);
                    }
                    if (code === 'mc' || code === 'mastercard') {
                      return wrapLink(
                        <span className="pay-badge mc-badge" title={method.name || 'Mastercard'}>
                          <svg width="28" height="18" viewBox="0 0 36 24">
                            <circle cx="13" cy="12" r="10" fill="#EB001B" />
                            <circle cx="23" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
                          </svg>
                        </span>
                      );
                    }
                    if (code === 'apple-pay' || code === 'applepay') {
                      return wrapLink(
                        <span className="pay-badge apple-pay-badge" title="Apple Pay">
                          <svg width="34" height="16" viewBox="4.5 7.8 17.5 9" fill="#000000" style={{ display: 'block' }}>
                            <path d="M8.86 8.018c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955z M11.067 8.438v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979z M7.913 9.457c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002z M16.117 9.854c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z M18.057 9.926l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26z" />
                          </svg>
                        </span>
                      );
                    }
                    if (code === 'g-pay' || code === 'google-pay' || code === 'googlepay') {
                      return wrapLink(
                        <span className="pay-badge g-pay-badge">
                          <span style={{ color: '#4285F4', fontWeight: '900', marginRight: '2px' }}>G</span> Pay
                        </span>
                      );
                    }
                    if (code === 'amex') {
                      return wrapLink(<span className="pay-badge amex-badge">{method.name || 'AMEX'}</span>);
                    }

                    // Custom Payment Badge
                    return wrapLink(
                      <span
                        className="pay-badge"
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          fontWeight: 700,
                        }}
                      >
                        {method.name}
                      </span>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Stay Connected */}
          {footerSetup.socialLinks.isVisible && (
            <div className="ref-lower-col-social">
              <h5 className="ref-lower-title">{footerSetup.socialLinks.sectionTitle || 'Stay Connected'}</h5>
              <div className="ref-social-btns">
                {footerSetup.socialLinks.links
                  .filter((link) => link.isVisible)
                  .map((link) => {
                    const platform = (link.platform || '').toLowerCase();

                    const renderSocialIcon = () => {
                      switch (platform) {
                        case 'facebook':
                          return (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          );
                        case 'x':
                        case 'twitter':
                          return (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          );
                        case 'instagram':
                          return (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                          );
                        case 'linkedin':
                          return (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          );
                        case 'tiktok':
                          return (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.83c0 1.93-.61 3.86-1.83 5.33-1.44 1.75-3.6 2.82-5.85 2.82-2.07 0-4.11-.87-5.55-2.38-1.72-1.8-2.5-4.39-2.07-6.84.45-2.58 2.33-4.75 4.85-5.59.83-.28 1.7-.42 2.58-.42.27 0 .54.02.81.05v4.11c-.34-.08-.69-.12-1.04-.12-1.14 0-2.25.56-2.91 1.51-.78 1.13-.78 2.69-.02 3.84.69 1.05 1.95 1.66 3.2 1.51 1.25-.15 2.32-1.07 2.64-2.29.11-.42.17-.86.17-1.3V.02z" />
                            </svg>
                          );
                        case 'youtube':
                          return (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          );
                        case 'whatsapp':
                          return (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.031 0C5.396 0 .016 5.378.016 12.012c0 2.118.552 4.186 1.6 6.009L0 24l6.166-1.616a11.96 11.96 0 0 0 5.865 1.528h.005c6.634 0 12.014-5.378 12.014-12.013 0-3.208-1.25-6.223-3.518-8.494C18.261 1.253 15.242 0 12.031 0zm0 22.014c-1.8 0-3.564-.484-5.1-1.399l-.366-.217-3.791.994 1.012-3.693-.238-.38a9.98 9.98 0 0 1-1.543-5.306c0-5.524 4.495-10.018 10.027-10.018 2.677 0 5.193 1.043 7.086 2.937a9.96 9.96 0 0 1 2.937 7.086c0 5.525-4.494 10.02-10.024 10.02z"/>
                            </svg>
                          );
                        case 'pinterest':
                          return (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.98-.12-2.48.02-3.55.13-.96.86-6.42.86-6.42s-.22-.44-.22-1.08c0-1.01.59-1.77 1.32-1.77.62 0 .92.47.92 1.03 0 .63-.4 1.56-.6 2.43-.17.73.37 1.33 1.09 1.33 1.31 0 2.32-1.38 2.32-3.37 0-1.76-1.27-2.99-3.08-2.99-2.25 0-3.57 1.69-3.57 3.43 0 .68.26 1.41.59 1.81.06.08.07.15.05.23-.06.24-.19.77-.22.88-.04.14-.12.17-.28.1-1.05-.49-1.71-2.02-1.71-3.25 0-2.65 1.93-5.08 5.55-5.08 2.91 0 5.18 2.08 5.18 4.86 0 2.9-1.83 5.23-4.37 5.23-.85 0-1.66-.44-1.93-.97l-.53 2.01c-.19.74-.71 1.66-1.06 2.22A12.01 12.01 0 1 0 12 0z"/>
                            </svg>
                          );
                        default:
                          return (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                          );
                      }
                    };

                    return (
                      <a
                        key={link.id}
                        href={link.url || '#'}
                        className="social-circle-btn"
                        aria-label={link.name}
                        title={link.name}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {renderSocialIcon()}
                      </a>
                    );
                  })}
              </div>
            </div>
          )}

        </div>

        {/* 4. Bottom Copyright & Policy Links Bar */}
        <div className="ref-footer-bottom-bar">
          <div>© Emox All Rights Reserved.</div>
          <div className="ref-policy-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/terms">Warranty Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
