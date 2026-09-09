'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import type { JobDetailData } from '@/lib/report/get-jobs-page-data';

export const JobDetailReport = ({ data }: { data: JobDetailData }) => {
  const { messages } = useI18n();

  if (data.errorMessage) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {messages.report.error}
      </p>
    );
  }

  if (!data.job) {
    return (
      <p className="text-sm text-muted-foreground">{messages.jobs.notFound}</p>
    );
  }

  const reasons = new Map(Object.entries(messages.jobReasons));

  return (
    <>
      <PageTitle as="h1">{data.job.title}</PageTitle>
      <JobCard job={data.job} />
      {data.job.reasons.length > 0 ? (
        <div>
          <p className="text-sm font-medium">{messages.jobs.whyRelevant}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {data.job.reasons.map((reason) => (
              <li key={reason}>{reasons.get(reason) ?? reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};

export const JobDetailHeading = () => {
  const { messages } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">
      <Link
        href="/jobs"
        className="text-muted-foreground underline underline-offset-2"
      >
        {messages.jobs.backToJobs}
      </Link>
    </p>
  );
};
