'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  const [footerLang, setFooterLang] = React.useState('English');
  const [footerLangOpen, setFooterLangOpen] = React.useState(false);

  return (
    <footer className="ref-footer">
      <div className="container">
        
        {/* 1. Top Feature Highlights (4 Cards) */}
        <div className="ref-footer-features-grid">
          
          {/* Card 1: Free in-store pick up */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
                <path d="M21 9c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3" />
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                <path d="M10 21v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
              </svg>
            </div>
            <div>
              <h5 className="ref-feature-title">Free in-store pick up</h5>
              <p className="ref-feature-sub">24/7 Amazing services</p>
            </div>
          </div>

          {/* Card 2: Free Shipping */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div>
              <h5 className="ref-feature-title">Free Shipping</h5>
              <p className="ref-feature-sub">24/7 Amazing services</p>
            </div>
          </div>

          {/* Card 3: Flexible Payment */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="13" rx="2.5" />
                <circle cx="12" cy="12.5" r="2.5" />
                <path d="M6 10h.01M18 15h.01" />
              </svg>
            </div>
            <div>
              <h5 className="ref-feature-title">Flexible Payment</h5>
              <p className="ref-feature-sub">24/7 Amazing services</p>
            </div>
          </div>

          {/* Card 4: Convenient help */}
          <div className="ref-feature-card">
            <div className="ref-feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a10 10 0 0 1 20 0v6a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
              </svg>
            </div>
            <div>
              <h5 className="ref-feature-title">Convenient help</h5>
              <p className="ref-feature-sub">24/7 Amazing services</p>
            </div>
          </div>

        </div>

        {/* 2. Main 4-Column Links Grid */}
        <div className="ref-footer-links-grid">
          
          {/* Column 1: About Emox */}
          <div>
            <h5 className="ref-footer-col-title">About Emox</h5>
            <ul className="ref-footer-list">
              <li><Link href="#">Company info</Link></li>
              <li><Link href="#">News</Link></li>
              <li><Link href="#">Investors</Link></li>
              <li><Link href="#">Careers</Link></li>
              <li><Link href="#">Diversity & Inclusion</Link></li>
              <li><Link href="#">Advertise with us</Link></li>
              <li><Link href="#">Policies</Link></li>
              <li><Link href="#">Verified Rights Owner (VeRO) Program</Link></li>
              <li><Link href="#">eCI Licenses</Link></li>
            </ul>
          </div>

          {/* Column 2: Order & Purchases */}
          <div>
            <h5 className="ref-footer-col-title">Order & Purchases</h5>
            <ul className="ref-footer-list">
              <li><Link href="#">Check order Status</Link></li>
              <li><Link href="#">Shipping, Delivery & Pickup</Link></li>
              <li><Link href="#">Returns & Exchanges</Link></li>
              <li><Link href="#">Price Match Guarantee</Link></li>
              <li><Link href="#">Product Recalls</Link></li>
              <li><Link href="#">Trade In Program</Link></li>
              <li><Link href="#">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Column 3: Popular Categories */}
          <div>
            <h5 className="ref-footer-col-title">Popular Categories</h5>
            <ul className="ref-footer-list">
              <li><Link href="#">Check order Status</Link></li>
              <li><Link href="#">Shipping, Delivery & Pickup</Link></li>
              <li><Link href="#">Returns & Exchanges</Link></li>
              <li><Link href="#">Price Match Guarantee</Link></li>
              <li><Link href="#">Product Recalls</Link></li>
              <li><Link href="#">Trade In Program</Link></li>
              <li><Link href="#">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Column 4: Support & Services + Region Country */}
          <div>
            <h5 className="ref-footer-col-title">Support & Services</h5>
            <ul className="ref-footer-list">
              <li><Link href="#">Seller Center</Link></li>
              <li><Link href="#">Contact Us</Link></li>
              <li><Link href="#">eBay Returns</Link></li>
              <li><Link href="#">eBay Money Back Guarantee</Link></li>
            </ul>

            <div className="ref-lang-wrap">
              <h5 className="ref-lang-title">Language</h5>
              <div
                className="ref-lang-pill"
                onClick={() => setFooterLangOpen(!footerLangOpen)}
                title="Change Language"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>{footerLang}</span>
                <span style={{ fontSize: '10px', color: '#64748b', transition: 'transform 0.2s', transform: footerLangOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </div>

              {footerLangOpen && (
                <div className="ref-lang-dropdown">
                  <div
                    className={"ref-lang-option " + (footerLang === 'English' ? 'active' : '')}
                    onClick={() => { setFooterLang('English'); setFooterLangOpen(false); }}
                  >
                    <span>English</span>
                    {footerLang === 'English' && <span>✓</span>}
                  </div>
                  <div
                    className={"ref-lang-option " + (footerLang === 'العربية' ? 'active' : '')}
                    onClick={() => { setFooterLang('العربية'); setFooterLangOpen(false); }}
                  >
                    <span>العربية</span>
                    {footerLang === 'العربية' && <span>✓</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 3. Lower Row (Download App, Payment, Stay Connected) */}
        <div className="ref-footer-lower-row">
          
          {/* Download App */}
          <div>
            <h5 className="ref-lower-title">Download Our App</h5>
            <div className="ref-app-badges">
              <a href="#" className="store-badge-apple">
                <svg width="18" height="22" viewBox="0 0 170 170" fill="#ffffff">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.72-13.98-5.74-8.8-10.27-18.7-13.58-29.7-3.32-11-4.98-21.72-4.98-32.17 0-14.88 3.73-26.78 11.19-35.7 7.46-8.91 16.7-13.43 27.72-13.55 4.36 0 9.29 1.14 14.78 3.42 5.49 2.28 9.25 3.47 11.28 3.58 1.63 0 5.65-1.29 12.06-3.87 6.41-2.58 11.77-3.73 16.08-3.46 11.97.86 21.6 5.48 28.89 13.85-10.45 6.33-15.62 14.94-15.51 25.84.12 8.7 3.41 16.14 9.87 22.32 6.46 6.18 14.15 9.77 23.07 10.77-2.06 6.33-4.59 12.82-7.59 19.46zM119.22 31.86c0-7.39 2.66-14.28 7.98-20.67 5.32-6.39 11.83-10.47 19.53-12.24.22 1.3.33 2.5.33 3.6 0 7.39-2.82 14.44-8.47 21.15-5.65 6.71-12.38 10.66-20.19 11.84-.22-1.19-.34-2.42-.34-3.68z" />
                </svg>
                <div className="store-badge-text">
                  <span className="store-badge-sub">Download on the</span>
                  <span className="store-badge-title">App Store</span>
                </div>
              </a>

              <a href="#" className="store-badge-google">
                <svg width="20" height="22" viewBox="0 0 512 512">
                  <path fill="#4285F4" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
                  <path fill="#34A853" d="M47 37.6C44.1 43.1 42.5 49.8 42.5 57.3v397.4c0 7.5 1.6 14.2 4.5 19.7L252.7 268.7 47 37.6z" />
                  <path fill="#FBBC04" d="M425.2 216.5l-40 23-59.9-5.2-60-60 159.9 42.2z" />
                  <path fill="#EA4335" d="M325.3 277.7l60.1 60.1-280.8 161.2 220.7-221.3z" />
                  <path fill="#FBBC04" d="M465.1 239.5l-39.9-23-40.4 40.4 40.4 40.4 40.9-23.5c14.2-8.2 14.2-26.1-1-34.3z" />
                </svg>
                <div className="store-badge-text">
                  <span className="store-badge-sub">GET IT ON</span>
                  <span className="store-badge-title">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h5 className="ref-lower-title">Payment Method</h5>
            <div className="ref-payment-badges">
              <span className="pay-badge tabby-badge">tabby</span>
              <span className="pay-badge tamara-badge">tamara</span>
              <span className="pay-badge visa-badge">VISA</span>
              <span className="pay-badge mc-badge">
                <svg width="28" height="18" viewBox="0 0 36 24">
                  <circle cx="13" cy="12" r="10" fill="#EB001B" />
                  <circle cx="23" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
                </svg>
              </span>
              <span className="pay-badge apple-pay-badge">
                <svg width="13" height="15" viewBox="0 0 170 170" fill="#000" style={{ marginRight: '3px' }}>
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.72-13.98-5.74-8.8-10.27-18.7-13.58-29.7-3.32-11-4.98-21.72-4.98-32.17 0-14.88 3.73-26.78 11.19-35.7 7.46-8.91 16.7-13.43 27.72-13.55 4.36 0 9.29 1.14 14.78 3.42 5.49 2.28 9.25 3.47 11.28 3.58 1.63 0 5.65-1.29 12.06-3.87 6.41-2.58 11.77-3.73 16.08-3.46 11.97.86 21.6 5.48 28.89 13.85-10.45 6.33-15.62 14.94-15.51 25.84.12 8.7 3.41 16.14 9.87 22.32 6.46 6.18 14.15 9.77 23.07 10.77-2.06 6.33-4.59 12.82-7.59 19.46zM119.22 31.86c0-7.39 2.66-14.28 7.98-20.67 5.32-6.39 11.83-10.47 19.53-12.24.22 1.3.33 2.5.33 3.6 0 7.39-2.82 14.44-8.47 21.15-5.65 6.71-12.38 10.66-20.19 11.84-.22-1.19-.34-2.42-.34-3.68z" />
                </svg>
                Pay
              </span>
              <span className="pay-badge g-pay-badge">
                <span style={{ color: '#4285F4', fontWeight: '900', marginRight: '2px' }}>G</span> Pay
              </span>
              <span className="pay-badge amex-badge">AMEX</span>
            </div>
          </div>

          {/* Stay Connected */}
          <div>
            <h5 className="ref-lower-title">Stay Connected</h5>
            <div className="ref-social-btns">
              <a href="#" className="social-circle-btn" aria-label="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="social-circle-btn" aria-label="X">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="social-circle-btn" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="social-circle-btn" aria-label="LinkedIn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" className="social-circle-btn" aria-label="TikTok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.83c0 1.93-.61 3.86-1.83 5.33-1.44 1.75-3.6 2.82-5.85 2.82-2.07 0-4.11-.87-5.55-2.38-1.72-1.8-2.5-4.39-2.07-6.84.45-2.58 2.33-4.75 4.85-5.59.83-.28 1.7-.42 2.58-.42.27 0 .54.02.81.05v4.11c-.34-.08-.69-.12-1.04-.12-1.14 0-2.25.56-2.91 1.51-.78 1.13-.78 2.69-.02 3.84.69 1.05 1.95 1.66 3.2 1.51 1.25-.15 2.32-1.07 2.64-2.29.11-.42.17-.86.17-1.3V.02z" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* 4. Bottom Copyright & Policy Links Bar */}
        <div className="ref-footer-bottom-bar">
          <div>© Emox All Rights Reserved.</div>
          <div className="ref-policy-links">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Use</Link>
            <Link href="#">Warranty Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
