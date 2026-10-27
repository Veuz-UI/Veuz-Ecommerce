import type { Metadata } from 'next';
import './globals.css';
import { AppLayoutShell } from '@/components/layout/AppLayoutShell';

export const metadata: Metadata = {
  title: 'Veuz - Ecommerce',
  description: 'Veuz E-Commerce Store',
  icons: {
    icon: '/assets/imgs/favicon.ico',
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="no-js" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="style" href="/assets/css/vendors/bootstrap.min.css" />
        <link rel="preload" as="style" href="/assets/css/style.css" />
      </head>
      <body suppressHydrationWarning>
        <AppLayoutShell>{children}</AppLayoutShell>
      </body>
    </html>
  );
}
