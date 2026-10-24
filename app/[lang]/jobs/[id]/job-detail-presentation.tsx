'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { jobSourceLabel } from '@/lib/jobs/source-labels/source-labels';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { explanationForReason } from '@/lib/report/explanation-for-reason/explanation-for-reason';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { GUIDE_PATH } from '@/lib/seo/constants';
import type { JobDetailData } from '@/lib/report/get-jobs-page-data';

const TEXT_LINK = 'text-muted-foreground underline underline-offset-2';

export const JobDetailReport = ({
  data,
  hasError,
}: {
  data: JobDetailData;
  hasError?: boolean;
}) => {
  const { locale, messages } = useI18n();

  if (hasError) {
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

  const { jobDetail } = messages;
  const reasons = new Map(Object.entries(messages.jobReasons));
  const listing = data.job.description?.trim() ?? '';

  return (
    <>
      <PageTitle as="h1">{data.job.title}</PageTitle>
      <p className="text-sm text-foreground">
        {jobDetail.score(data.job.score)}
      </p>
      <JobCard job={data.job} />
      {data.job.reasons.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{jobDetail.reasonsTitle}</h2>
          <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
            {data.job.reasons.map((reason) => (
              <li key={reason}>
                <span className="font-medium text-foreground">
                  {reasons.get(reason) ?? reason}
                </span>
                <span className="mt-1 block">
                  {explanationForReason(
                    reason,
                    jobDetail.reasonText,
                    jobDetail.technology,
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p>{jobDetail.verify}</p>
          <Link href={localizedPath(locale, GUIDE_PATH)} className={TEXT_LINK}>
            {messages.navigation.guide}
          </Link>
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{jobDetail.listingTitle}</h2>
        {listing ? (
          <>
            <p className="text-sm text-muted-foreground">
              {jobDetail.listingAttribution(jobSourceLabel(data.job.source))}
            </p>
            <p className="text-sm leading-6 whitespace-pre-line text-foreground">
              {listing}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {jobDetail.listingMissing}
          </p>
        )}
      </section>
    </>
  );
};

export const JobDetailHeading = () => {
  const { locale, messages } = useI18n();
  return (
    <p className="text-sm text-muted-foreground">
      <Link href={localizedPath(locale, '/jobs')} className={TEXT_LINK}>
        {messages.jobs.backToJobs}
      </Link>
    </p>
  );
};
