'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';

const PageError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => {
  const { messages } = useI18n();
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">{messages.globalError.title}</h1>
      <p className="text-muted-foreground" role="alert">
        {messages.globalError.description}
      </p>
      <button
        type="button"
        onClick={retry}
        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {messages.globalError.retry}
      </button>
    </main>
  );
};

export default PageError;
