import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import type { JobCountrySlug, JobFocusSlug } from '@/lib/jobs/constants';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { JOBS_PAGE_COPY, JOBS_PAGE_LIMIT } from './constants';
import { parseJobFilters, type JobsSearchParams } from './parse-job-filters';
import { JobsHeading, JobsReport } from './jobs-presentation';

type JobsPageProps = {
  searchParams: Promise<JobsSearchParams>;
};

// Request memoization uses normalized primitives, outside the persistent reader.
const readJobs = cache(
  (
    technology: string | undefined,
    seniority: string | undefined,
    remote: string | undefined,
    country: JobCountrySlug | undefined,
    focus: JobFocusSlug | undefined,
    minimumScore: number | undefined,
  ) =>
    getJobsPageData({
      technology,
      seniority,
      remote,
      country,
      focus,
      minimumScore,
      limit: JOBS_PAGE_LIMIT,
    }),
);

const readResults = async (params: JobsSearchParams) => {
  const filters = parseJobFilters(params);
  const data = await readJobs(
    filters.technology,
    filters.seniority,
    filters.remote,
    filters.country,
    filters.focus,
    filters.minimumScore,
  );
  return { filters, data };
};

export const generateMetadata = async ({
  searchParams,
}: JobsPageProps): Promise<Metadata> => {
  const { filters } = await readResults(await searchParams);
  return {
    title: JOBS_PAGE_COPY.metaTitle,
    description: JOBS_PAGE_COPY.subtitle,
    ...canonicalMetadata('/jobs', {
      technology: filters.technology,
      seniority: filters.seniority,
      remote: filters.remote,
      country: filters.country,
      focus: filters.focus,
      minimumScore: filters.minimumScore,
    }),
  };
};

const JobsResults = async ({ searchParams }: JobsPageProps) => {
  const { filters, data } = await readResults(await searchParams);
  return <JobsReport data={data} filters={filters} />;
};

const JobsPage = ({ searchParams }: JobsPageProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
    <JobsHeading />
    <Suspense fallback={<ReportLoading report="jobs" />}>
      <JobsResults searchParams={searchParams} />
    </Suspense>
  </main>
);

export default JobsPage;
