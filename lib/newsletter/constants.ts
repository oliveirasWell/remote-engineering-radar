/** Resend's default API limit is 2 requests/second on the Free plan. */
export const RESEND_MIN_INTERVAL_MS = 600;

/** How far back the first digest looks when no earlier send is recorded. */
export const DIGEST_LOOKBACK_MS = 86_400_000;

export const DIGEST_JOB_LIMIT = 8;
