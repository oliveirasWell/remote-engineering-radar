/** Max age for jobs shown in reports and kept active after ingest. */
export { RECENT_HIRING_WINDOW_MS as JOB_MAX_AGE_MS } from '@/lib/hiring-signals/constants';

export const COMPANY_MARKET_FILTERS = {
  brazil: 'brazil',
  all: 'all',
} as const;

export type CompanyMarketFilter =
  (typeof COMPANY_MARKET_FILTERS)[keyof typeof COMPANY_MARKET_FILTERS];

export const DEFAULT_COMPANY_MARKET_FILTER: CompanyMarketFilter =
  COMPANY_MARKET_FILTERS.brazil;
