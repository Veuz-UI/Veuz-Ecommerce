import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Veuz - Ecommerce',
  description: 'Veuz E-Commerce Store',
  icons: {
    icon: '/assets/imgs/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="no-js">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/assets/css/vendors/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/plugins/animate.min.css" />
        <link rel="stylesheet" href="/assets/fonts/uicons/uicons-solid-straight.css" />
        <link rel="stylesheet" href="/assets/css/vendors/uicons-regular-straight.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <script src="https://kit.fontawesome.com/16b0815225.js" crossOrigin="anonymous" async></script>
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
