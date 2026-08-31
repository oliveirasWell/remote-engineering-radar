'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

const GlobalError = ({ error }: { error: Error & { digest?: string } }) => {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <h1>Something went wrong</h1>
      </body>
    </html>
  );
};

export default GlobalError;
