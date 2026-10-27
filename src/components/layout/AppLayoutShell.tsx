'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { StoreProvider } from '@/context/StoreContext';
import { StorefrontStyles } from '@/components/layout/StorefrontStyles';
import { ScrollRevealInit } from '@/components/common/ScrollRevealInit';
import { ScrollToTopButton } from '@/components/common/ScrollToTopButton';
import { CookieConsentBanner } from '@/components/common/CookieConsentBanner';

interface AppLayoutShellProps {
  children: React.ReactNode;
}

export const AppLayoutShell: React.FC<AppLayoutShellProps> = ({ children }) => {
  const pathname = usePathname();

  // Guarantee that every page (storefront website and dashboard) starts from the very top (0, 0)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const pageContent = document.querySelector('.page-content');
      if (pageContent) pageContent.scrollTop = 0;

      const wrapper = document.querySelector('.wrapper');
      if (wrapper) wrapper.scrollTop = 0;
    };

    // Immediate scroll reset
    scrollToTop();

    // Next animation frame
    const rId = requestAnimationFrame(scrollToTop);

    // Short timeouts to counter any async hydration or element size adjustments
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    const t3 = setTimeout(scrollToTop, 300);

    return () => {
      cancelAnimationFrame(rId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  // Pages that must NOT have the storefront Header and Footer (isolated dashboard & auth)
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password';

  return (
    <AuthProvider>
      <ToastProvider>
        <StoreProvider>
          {isDashboardRoute || isAuthRoute ? (
            // Clean isolated render for Dashboard & Auth pages - zero storefront headers, footers, or leaky styles
            <div key={pathname} className="veuz-page-transition" style={{ minHeight: '100vh', width: '100%' }}>
              {children}
            </div>
          ) : (
            // Complete Storefront Website Layout
            <>
              <StorefrontStyles />
              <ScrollRevealInit />
              <Header />
              <div key={pathname} className="veuz-page-transition" style={{ minHeight: 'calc(100vh - 160px)', width: '100%', backgroundColor: '#ffffff', position: 'relative', zIndex: 1 }}>
                {children}
              </div>
              <Footer />
              <ScrollToTopButton />
              <CookieConsentBanner />
            </>
          )}
        </StoreProvider>
      </ToastProvider>
    </AuthProvider>
  );
};
