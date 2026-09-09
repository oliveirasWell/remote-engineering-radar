import * as Sentry from '@sentry/nextjs';

// `NEXT_PUBLIC_*` is inlined at build time, so a rotated DSN would not
// reach this runtime until the next deploy. A private var wins when set.
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.1,
  });
}
