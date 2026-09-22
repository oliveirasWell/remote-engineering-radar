'use client';

import { usePathname } from 'next/navigation';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { SiteHeader } from '@/components/site/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter/SiteFooter';
import { localeFromPath } from '@/lib/i18n/localized-path/localized-path';
import PageError from './[lang]/error';
import './globals.css';

/** Replaces the root layout, so it reads the locale from the failing URL. */
const GlobalError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  const locale = localeFromPath(usePathname() ?? '/');
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <I18nProvider locale={locale}>
          <SiteHeader />
          <PageError error={error} retry={retry} />
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
};

export default GlobalError;
