'use client';

import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { SiteHeader } from '@/components/site/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter/SiteFooter';
import PageError from './error';
import './globals.css';

/** Replaces the root layout, including its locale provider. */
const GlobalError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <I18nProvider>
          <SiteHeader />
          <PageError error={error} retry={retry} />
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
};

export default GlobalError;
