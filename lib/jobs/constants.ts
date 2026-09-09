/**
 * Max age for jobs shown in reports and kept active after ingest. Starts equal
 * to the hiring-signal window but is a separate policy: retuning how far back a
 * signal looks must not silently change what the site serves.
 */
export const JOB_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export const COMPANY_MARKET_FILTERS = {
  brazil: 'brazil',
  all: 'all',
} as const;

export type CompanyMarketFilter =
  (typeof COMPANY_MARKET_FILTERS)[keyof typeof COMPANY_MARKET_FILTERS];

/**
 * `geographies` is backfilled empty and only fills in as jobs are re-ingested,
 * so defaulting to the Brazil filter would blank the home page after deploy.
 */
export const DEFAULT_COMPANY_MARKET_FILTER: CompanyMarketFilter =
  COMPANY_MARKET_FILTERS.all;
