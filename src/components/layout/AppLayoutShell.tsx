'use client';

import React from 'react';
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
