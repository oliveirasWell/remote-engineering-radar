import Link from 'next/link';
import { Suspense } from 'react';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { getJobDetailData } from '@/lib/report/get-jobs-page-data';
import { JOBS_PAGE_COPY } from '../constants';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Reads the route param, so it streams in behind the static shell. */
const JobDetail = async ({ params }: JobDetailPageProps) => {
  const { id } = await params;
  const data = await getJobDetailData(id);

  if (data.errorMessage) {
    return (
      <p className="text-sm text-accent" role="alert">
        {data.errorMessage}
      </p>
    );
  }

  if (!data.job) {
    return <p className="text-sm text-muted">{JOBS_PAGE_COPY.notFound}</p>;
  }

  return (
    <>
      <PageTitle as="h1">{data.job.title}</PageTitle>
      <JobCard job={data.job} />
      {data.job.reasons.length > 0 ? (
        <div>
          <p className="text-sm font-medium">{JOBS_PAGE_COPY.whyRelevant}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {data.job.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};

const JobDetailPage = ({ params }: JobDetailPageProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-16">
    <p className="text-sm text-muted">
      <Link href="/jobs" className="hover:text-accent">
        {JOBS_PAGE_COPY.backToJobs}
      </Link>
    </p>
    <Suspense
      fallback={<p className="text-sm text-muted">{JOBS_PAGE_COPY.loading}</p>}
    >
      <JobDetail params={params} />
    </Suspense>
  </main>
);

export default JobDetailPage;
