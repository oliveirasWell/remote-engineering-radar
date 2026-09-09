import { getCompaniesPageData } from './get-companies-page-data';
import type { HomeReport } from './types';

/** Home is the remote companies watchlist. */
export const getHomeReport = async (options?: {
  country?: string | string[];
}): Promise<HomeReport> => {
  const data = await getCompaniesPageData(options);
  return {
    updatedAt: data.updatedAt,
    companies: data.companies,
    errorMessage: data.errorMessage,
  };
};
