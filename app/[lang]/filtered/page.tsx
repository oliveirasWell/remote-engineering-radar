import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { cache, Suspense } from 'react';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import type { CompaniesPageOptions } from '@/lib/report/get-companies-page-data';
import { REPORT_CACHE_LIFE } from '@/lib/report/constants';
import type { JobCountrySlug, JobFocusSlug } from '@/lib/jobs/constants';
import { routeLocale } from '@/lib/i18n/route-locale/route-locale';
import { searchMetadata } from '@/lib/seo/search-metadata/search-metadata';
import { parseCountryFilter } from '@/lib/report/parse-country-filter';
import { parseFocusFilter } from '@/lib/report/parse-focus-filter';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import { CompaniesReport } from '../home-presentation';
import { renderHomeContent } from '../home-content';

type HomeProps = {
  searchParams: Promise<{
    country?: string | string[];
    focus?: string | string[];
  }>;
};

const readCompanies = cache(
  (country: JobCountrySlug | undefined, focus: JobFocusSlug | undefined) =>
    getCompaniesPageData({ country, focus }),
);

export const generateMetadata = async ({
  searchParams,
  params,
}: HomeProps & { params: Promise<{ lang: string }> }): Promise<Metadata> => {
  const query = await searchParams;
  const country = parseCountryFilter(query.country);
  const focus = parseFocusFilter(query.focus);
  await readCompanies(country, focus);
  return searchMetadata(
    'companies',
    '/',
    { country, focus },
    await routeLocale(params),
  );
};

const renderCompaniesSection = async ({
  country,
  focus,
}: CompaniesPageOptions) => {
  'use cache';
  cacheLife(REPORT_CACHE_LIFE);
  const data = await readCompanies(country, focus);

  return <CompaniesReport data={data} />;
};

const CompaniesSection = async ({ searchParams }: HomeProps) => {
  const params = await searchParams;
  return renderCompaniesSection({
    country: parseCountryFilter(params.country),
    focus: parseFocusFilter(params.focus),
  });
};

const Home = ({ searchParams }: HomeProps) =>
  renderHomeContent(
    <Suspense fallback={<ReportLoading report="home" />}>
      <CompaniesSection searchParams={searchParams} />
    </Suspense>,
  );

export default Home;
