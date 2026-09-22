import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import type { JobCountrySlug, JobFocusSlug } from '@/lib/jobs/constants';
import { searchMetadata } from '@/lib/seo/search-metadata/search-metadata';
import { parseCountryFilter } from '@/lib/report/parse-country-filter';
import { parseFocusFilter } from '@/lib/report/parse-focus-filter';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import { CompaniesReport, HomeHeading } from './home-presentation';

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
}: HomeProps): Promise<Metadata> => {
  const params = await searchParams;
  const country = parseCountryFilter(params.country);
  const focus = parseFocusFilter(params.focus);
  await readCompanies(country, focus);
  return searchMetadata('companies', '/', { country, focus });
};

const CompaniesSection = async ({ searchParams }: HomeProps) => {
  const params = await searchParams;
  const data = await readCompanies(
    parseCountryFilter(params.country),
    parseFocusFilter(params.focus),
  );

  return <CompaniesReport data={data} />;
};

const Home = ({ searchParams }: HomeProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
    <HomeHeading />
    <Suspense fallback={<ReportLoading report="home" />}>
      <CompaniesSection searchParams={searchParams} />
    </Suspense>
  </main>
);

export default Home;
