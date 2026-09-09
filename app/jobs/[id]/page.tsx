import { Suspense } from 'react';
import { ReportLoading } from '@/components/report/ReportLoading/ReportLoading';
import {
  getJobDetailData,
  type JobDetailData,
} from '@/lib/report/get-jobs-page-data';
import { JobDetailHeading, JobDetailReport } from './job-detail-presentation';
import { parseJobId } from './parse-job-id';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Reads the route param, so it streams in behind the static shell. */
const JobDetail = async ({ params }: JobDetailPageProps) => {
  const { id } = await params;
  const jobId = parseJobId(id);

  if (!jobId) {
    return <JobDetailReport data={{ job: null }} />;
  }

  let data: JobDetailData;
  try {
    data = await getJobDetailData(jobId);
  } catch {
    return <JobDetailReport data={{ job: null }} hasError />;
  }

  return <JobDetailReport data={data} />;
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
