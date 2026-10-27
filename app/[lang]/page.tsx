import type { Metadata } from 'next';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { reportDatabaseConfigured } from '@/lib/report/report-database-configured';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import { searchMetadata } from '@/lib/seo/search-metadata/search-metadata';
import { CompaniesReport } from './home-presentation';
import { renderHomeContent } from './home-content';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> =>
  searchMetadata('companies', '/', {}, await routeLocale(params));

const Home = async () => {
  const data = reportDatabaseConfigured()
    ? await getCompaniesPageData({ includeDetails: false })
    : { companies: [], updatedAt: null };
  return renderHomeContent(<CompaniesReport data={data} />);
};

export default Home;
