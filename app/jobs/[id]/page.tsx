import Link from 'next/link';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { getJobDetailData } from '@/lib/report/get-jobs-page-data';
import { JOBS_PAGE_COPY } from '../constants';

export const dynamic = 'force-dynamic';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

const JobDetailPage = async ({ params }: JobDetailPageProps) => {
  const { id } = await params;
  const data = await getJobDetailData(id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <p className="text-sm text-muted">
        <Link href="/jobs" className="hover:text-accent">
          {JOBS_PAGE_COPY.backToJobs}
        </Link>
      </p>
      {data.errorMessage ? (
        <p className="text-sm text-accent" role="alert">
          {data.errorMessage}
        </p>
      ) : null}
      {data.job ? (
        <>
          <PageTitle as="h1">{data.job.title}</PageTitle>
          <JobCard job={data.job} />
        </>
      ) : (
        <p className="text-sm text-muted">{JOBS_PAGE_COPY.notFound}</p>
      )}
    </main>
  );
};

export default JobDetailPage;
