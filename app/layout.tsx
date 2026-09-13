import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@/components/observability/GoogleAnalytics/GoogleAnalytics';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { SiteHeader } from '@/components/site/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter/SiteFooter';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';
import { APP_DESCRIPTION, APP_NAME } from './constants';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: siteOrigin(),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  // Title and description are intentionally omitted here so Next inherits each
  // route's own values, and images come from the opengraph-image file convention.
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <GoogleAnalytics />
        <I18nProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
};

export default RootLayout;
