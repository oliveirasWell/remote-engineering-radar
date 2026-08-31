import { getCompaniesPageData } from './get-companies-page-data';
import type { HomeReport } from './types';

/** Home is the companies watchlist (Brazil market by default). */
export const getHomeReport = async (options?: {
  market?: string | string[];
}): Promise<HomeReport> => {
  const data = await getCompaniesPageData(options);
  return {
    updatedAt: data.updatedAt,
    companies: data.companies,
    errorMessage: data.errorMessage,
  };
};
