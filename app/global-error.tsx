'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import {
  I18nProvider,
  useI18n,
} from '@/components/i18n/I18nProvider/I18nProvider';
import { SiteHeader } from '@/components/site/SiteHeader/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter/SiteFooter';
import './globals.css';

const ErrorContent = ({ reset }: { reset: () => void }) => {
  const { messages } = useI18n();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">{messages.globalError.title}</h1>
      <p className="text-muted-foreground">
        {messages.globalError.description}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {messages.globalError.retry}
      </button>
    </main>
  );
};

/** Replaces the root layout, including its locale provider. */
const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <I18nProvider>
          <SiteHeader />
          <ErrorContent reset={reset} />
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
};

export default GlobalError;
