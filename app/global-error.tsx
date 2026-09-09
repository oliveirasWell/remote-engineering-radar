'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { GLOBAL_ERROR_COPY } from './constants';
import './globals.css';

/** Replaces the root layout, so it must carry its own styling and a way out. */
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
        <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-start gap-4 px-6 py-16">
          <h1 className="text-2xl font-semibold">{GLOBAL_ERROR_COPY.title}</h1>
          <p className="text-muted">{GLOBAL_ERROR_COPY.description}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            {GLOBAL_ERROR_COPY.retry}
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
