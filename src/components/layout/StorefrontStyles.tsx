'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * StorefrontStyles Component
 * 
 * Exclusively loads storefront styles (Nest eCommerce theme: bootstrap, animate, uicons, style.css)
 * for the public website.
 * 
 * When entering /dashboard routes, it actively disables and removes storefront stylesheets
 * so they NEVER leak or override Rasket admin dashboard styles!
 */
export const StorefrontStyles: React.FC = () => {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  useEffect(() => {
    // If we are on storefront, enable any disabled storefront link elements
    const links = document.querySelectorAll<HTMLLinkElement>('link[data-origin="storefront"]');
    links.forEach((link) => {
      link.disabled = false;
    });

    return () => {
      // If unmounting because we navigated to dashboard, disable storefront links
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
        const sfLinks = document.querySelectorAll<HTMLLinkElement>('link[data-origin="storefront"]');
        sfLinks.forEach((link) => {
          link.disabled = true;
        });
      }
    };
  }, [pathname]);

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
