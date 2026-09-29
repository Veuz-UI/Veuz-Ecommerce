import type { Metadata } from 'next';
import './globals.css';
import { AppLayoutShell } from '@/components/layout/AppLayoutShell';

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
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }
                window.scrollTo(0, 0);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <AppLayoutShell>{children}</AppLayoutShell>
      </body>
    </html>
  );
}
