import { EN_MESSAGES } from '@/lib/i18n/messages';

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
export const EMPTY_COMPANIES_MESSAGE = EN_MESSAGES.report.emptyCompanies;
export const REPORT_ERROR_MESSAGE = EN_MESSAGES.report.error;
export const EMPTY_REPORT_SALARY = {
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: null,
  salaryPeriod: null,
} as const;
export const SALARY_BOUND_SEPARATOR = '–';
