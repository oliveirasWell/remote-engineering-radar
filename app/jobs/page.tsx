import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import {
  getJobsPageData,
  type JobsPageData,
} from '@/lib/report/get-jobs-page-data';
import { JOBS_PAGE_COPY } from './constants';
import { parseJobFilters, type JobsSearchParams } from './parse-job-filters';
import { JobsHeading, JobsReport } from './jobs-presentation';

export const metadata: Metadata = {
  title: JOBS_PAGE_COPY.metaTitle,
  description: JOBS_PAGE_COPY.subtitle,
};

type JobsPageProps = {
  searchParams: Promise<JobsSearchParams>;
};

/** Streams filters and results while the header prerenders. */
const JobsResults = async ({ searchParams }: JobsPageProps) => {
  const params = await searchParams;
  const filters = parseJobFilters(params);
  let data: JobsPageData;

  try {
    data = await getJobsPageData(filters);
  } catch {
    return <JobsReport data={{ jobs: [] }} filters={filters} hasError />;
  }

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
