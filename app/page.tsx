import { Suspense } from 'react';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import { CompaniesReport, HomeHeading } from './home-presentation';

type HomeProps = {
  searchParams: Promise<{ country?: string | string[] }>;
};

/** Streams request-dependent data while the header prerenders. */
const CompaniesSection = async ({ searchParams }: HomeProps) => {
  const params = await searchParams;
  const data = await getCompaniesPageData({ country: params.country });
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
