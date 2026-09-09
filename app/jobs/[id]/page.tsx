import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import { getJobDetailData } from '@/lib/report/get-jobs-page-data';
import { canonicalMetadata } from '@/lib/seo/canonical-metadata/canonical-metadata';
import { JobDetailHeading, JobDetailReport } from './job-detail-presentation';
import { parseJobId } from './parse-job-id';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

const readJob = cache(async (jobId: string | undefined) => {
  if (!jobId) {
    notFound();
  }

  const { job } = await getJobDetailData(jobId);
  if (!job) {
    notFound();
  }
  return job;
});

export const generateMetadata = async ({
  params,
}: JobDetailPageProps): Promise<Metadata> => {
  const job = await readJob(parseJobId((await params).id));
  const title = job.companyName
    ? `${job.title} at ${job.companyName}`
    : job.title;
  return {
    title,
    description: `${title}. Remote engineering opportunity${job.location ? ` in ${job.location}` : ''}. View the role and original listing.`,
    ...canonicalMetadata(`/jobs/${job.id}`),
  };
};

const JobDetail = async ({ params }: JobDetailPageProps) => {
  const job = await readJob(parseJobId((await params).id));
  return <JobDetailReport data={{ job }} />;
};

const JobDetailPage = ({ params }: JobDetailPageProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-16">
    <JobDetailHeading />
    <Suspense fallback={<ReportLoading report="jobs" />}>
      <JobDetail params={params} />
    </Suspense>
  </main>
);

export default JobDetailPage;
