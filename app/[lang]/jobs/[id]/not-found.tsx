import { JobDetailHeading, JobDetailReport } from './job-detail-presentation';

const JobNotFound = () => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-6 py-16">
    <JobDetailHeading />
    <JobDetailReport data={{ job: null }} />
  </main>
);

export default JobNotFound;
