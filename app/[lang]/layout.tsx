import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@/components/observability/GoogleAnalytics/GoogleAnalytics';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { SiteHeader } from '@/components/site/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter/SiteFooter';
import { isLocale, LOCALES, messagesFor } from '@/lib/i18n/messages';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';
import { OPEN_GRAPH_LOCALES } from './constants';
import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

type LangParams = { params: Promise<{ lang: string }> };

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export const generateMetadata = async ({
  params,
}: LangParams): Promise<Metadata> => {
  const locale = await routeLocale(params);
  const { app } = messagesFor(locale);
  return {
    metadataBase: siteOrigin(),
    title: {
      default: app.name,
      template: `%s | ${app.name}`,
    },
    description: app.description,
    // Title and description are intentionally omitted here so Next inherits each
    // route's own values, and images come from the opengraph-image file convention.
    openGraph: {
      type: 'website',
      siteName: app.name,
      locale: OPEN_GRAPH_LOCALES[locale],
    },
    twitter: { card: 'summary_large_image' },
  };
};

const RootLayout = async ({
  children,
  params,
}: LangParams & { children: ReactNode }) => {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }

  return (
    <html lang={lang} className={inter.variable}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <GoogleAnalytics />
        <I18nProvider locale={lang}>
          <SiteHeader />
          {children}
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
};

export default RootLayout;
