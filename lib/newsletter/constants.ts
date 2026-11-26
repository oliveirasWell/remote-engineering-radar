export const RESEND_API_KEY_ENV = 'RESEND_API_KEY';
export const RESEND_FROM_ENV = 'RESEND_FROM';
export const RESEND_SEGMENT_ID_ENV = 'RESEND_SEGMENT_ID';

const NEWSLETTER_REQUIRES_PREFIX = 'Newsletter requires ';

export const newsletterRequiresMessage = (missing: readonly string[]) =>
  `${NEWSLETTER_REQUIRES_PREFIX}${missing.join(', ')}`;
