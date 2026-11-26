/** Resend's default API limit is 2 requests/second on the Free plan. */
export const RESEND_MIN_INTERVAL_MS = 600;

/** How far back the first digest looks when no earlier send is recorded. */
export const DIGEST_LOOKBACK_MS = 86_400_000;

export const DIGEST_JOB_LIMIT = 8;

export const RESEND_API_KEY_ENV = 'RESEND_API_KEY';
export const RESEND_FROM_ENV = 'RESEND_FROM';
export const RESEND_SEGMENT_ID_ENV = 'RESEND_SEGMENT_ID';

const NEWSLETTER_REQUIRES_PREFIX = 'Newsletter requires ';

export const newsletterRequiresMessage = (missing: readonly string[]) =>
  `${NEWSLETTER_REQUIRES_PREFIX}${missing.join(', ')}`;
