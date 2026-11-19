export const JOBICY_SOURCE_NAME = 'jobicy';
export const JOBICY_API_BASE_URL = 'https://jobicy.com/api/v2/remote-jobs';
export const JOBICY_COUNT = 50;
/**
 * Server-side filters, one request each: engineering roles, and HR for the
 * recruiting lane (radar SPEC-035).
 */
export const JOBICY_INDUSTRIES = ['engineering', 'hr'] as const;
/** Geography value meaning the role has no country restriction. */
export const JOBICY_ANYWHERE_GEO = 'Anywhere';
/** Seniority value meaning the role has no declared level. */
export const JOBICY_ANY_LEVEL = 'Any';
