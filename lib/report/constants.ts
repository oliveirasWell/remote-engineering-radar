export const COMPANIES_PAGE_LIMIT = 100;

/**
 * Ingest writes once a day from GitHub Actions, which cannot reach the Next
 * runtime to revalidate, so this window is what bounds staleness.
 */
export const REPORT_CACHE_LIFE = {
  stale: 300,
  revalidate: 3600,
  expire: 86_400,
} as const;
export const EMPTY_COMPANIES_MESSAGE = 'No companies to watch yet.';
export const REPORT_ERROR_MESSAGE =
  'The report could not be loaded from the database.';
