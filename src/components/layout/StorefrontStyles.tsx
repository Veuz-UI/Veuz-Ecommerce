'use client';

import React, { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * StorefrontStyles Component
 * 
 * Exclusively loads storefront styles (Nest eCommerce theme: bootstrap, animate, uicons, style.css)
 * for the public website and profile pages.
 * 
 * Safely manages stylesheet isolation without toggling or disabling active stylesheets on re-render.
 */
export const StorefrontStyles: React.FC = () => {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    if (isDashboard) {
      // If on dashboard, ensure storefront stylesheets are disabled
      const sfLinks = document.querySelectorAll<HTMLLinkElement>('link[data-origin="storefront"]');
      sfLinks.forEach((link) => {
        if (!link.disabled) link.disabled = true;
      });
      return;
    }

    // 1. Only re-enable storefront links if they were previously disabled (e.g. returning from dashboard)
    const sfLinks = document.querySelectorAll<HTMLLinkElement>('link[data-origin="storefront"]');
    sfLinks.forEach((link) => {
      if (link.disabled) {
        link.disabled = false;
      }
    });

    // 2. Actively disable any dashboard links that might have leaked into the DOM
    const dashLinks = document.querySelectorAll<HTMLLinkElement>('link[href*="/dashboard-assets/"]');
    dashLinks.forEach((link) => {
      if (!link.disabled) {
        link.disabled = true;
      }
    });

    // 3. Remove dashboard attributes from <html> so storefront layout is 100% clean
    const html = document.documentElement;
    if (html.hasAttribute('data-bs-theme')) html.removeAttribute('data-bs-theme');
    if (html.hasAttribute('data-topbar-color')) html.removeAttribute('data-topbar-color');
    if (html.hasAttribute('data-menu-color')) html.removeAttribute('data-menu-color');
    if (html.hasAttribute('data-menu-size')) html.removeAttribute('data-menu-size');
    if (html.classList.contains('sidebar-enable')) html.classList.remove('sidebar-enable');
  }, [pathname, isDashboard]);

  if (isDashboard) {
    return null;
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        data-origin="storefront"
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <link data-origin="storefront" rel="stylesheet" href="/assets/css/vendors/bootstrap.min.css" />
      <link data-origin="storefront" rel="stylesheet" href="/assets/css/plugins/animate.min.css" />
      <link data-origin="storefront" rel="stylesheet" href="/assets/fonts/uicons/uicons-solid-straight.css" />
      <link data-origin="storefront" rel="stylesheet" href="/assets/css/vendors/uicons-regular-straight.css" />
      <link data-origin="storefront" rel="stylesheet" href="/assets/css/style.css" />
      <script src="https://kit.fontawesome.com/16b0815225.js" crossOrigin="anonymous" async></script>
    </>
  );
};
