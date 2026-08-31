import {
  COMPANY_MARKET_FILTERS,
  type CompanyMarketFilter,
} from '@/lib/jobs/constants';

export const parseCompanyMarketFilter = (
  value: string | string[] | undefined,
): CompanyMarketFilter | undefined => {
  const raw = typeof value === 'string' ? value.trim() : undefined;
  if (raw === COMPANY_MARKET_FILTERS.brazil) {
    return COMPANY_MARKET_FILTERS.brazil;
  }
  if (raw === COMPANY_MARKET_FILTERS.all) {
    return COMPANY_MARKET_FILTERS.all;
  }
  return undefined;
};
