import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist } from 'next/font/google';
import { GoogleAnalytics } from '@/components/observability/GoogleAnalytics/GoogleAnalytics';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { SiteHeader } from '@/components/site/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter/SiteFooter';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';
import { APP_DESCRIPTION, APP_NAME } from './constants';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: siteOrigin(),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className={geistSans.variable}>
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
