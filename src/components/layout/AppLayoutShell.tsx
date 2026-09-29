'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { StorefrontStyles } from '@/components/layout/StorefrontStyles';

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
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  return (
    <AuthProvider>
      {isDashboardRoute ? (
        // Clean isolated render for Dashboard - zero storefront headers, footers, or styles
        <>{children}</>
      ) : isAuthRoute ? (
        // Auth pages (login, register, forgot-password) with storefront styles but without full header/footer
        <>
          <StorefrontStyles />
          {children}
        </>
      ) : (
        // Complete Storefront Website Layout
        <>
          <StorefrontStyles />
          <Header />
          {children}
          <Footer />
        </>
      )}
    </AuthProvider>
  );
};
