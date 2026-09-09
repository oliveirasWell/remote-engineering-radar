import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import type { JobCountrySlug } from '@/lib/jobs/constants';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { parseCountryFilter } from '@/lib/report/parse-country-filter';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import { CompaniesReport, HomeHeading } from './home-presentation';

type HomeProps = {
  searchParams: Promise<{ country?: string | string[] }>;
};

const readCompanies = cache((country: JobCountrySlug | undefined) =>
  getCompaniesPageData({ country }),
);

export const generateMetadata = async ({
  searchParams,
}: HomeProps): Promise<Metadata> => {
  const country = parseCountryFilter((await searchParams).country);
  await readCompanies(country);
  return canonicalMetadata('/', { country });
};

const CompaniesSection = async ({ searchParams }: HomeProps) => {
  const params = await searchParams;
  const country = parseCountryFilter(params.country);
  const data = await readCompanies(country);

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
