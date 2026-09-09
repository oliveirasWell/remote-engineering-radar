'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import type { ReportJobCard } from '@/lib/report/types';
import { formatRelativeTime } from '@/lib/report/format';
import { hiddenJobsStore } from './hidden-jobs-store';

type JobCardProps = {
  job: ReportJobCard;
};

export const JobCard = ({ job }: JobCardProps) => {
  const {
    locale,
    messages: { jobCard, remote },
  } = useI18n();
  const isHidden = useSyncExternalStore(
    hiddenJobsStore.subscribe,
    () => hiddenJobsStore.has(job.id),
    () => false,
  );
  const remotePolicy =
    new Map(Object.entries(remote)).get(job.remotePolicy ?? '') ??
    job.remotePolicy;
  const meta = [remotePolicy, job.location].filter(Boolean).join(' · ');

  const handleHide = () => {
    if (window.confirm(jobCard.hideConfirmation)) {
      hiddenJobsStore.hide(job.id);
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <article className="border-b border-border py-5">
      <h3 className="text-lg font-semibold tracking-tight">
        <Link
          href={`/jobs/${job.id}`}
          className="text-muted-foreground underline underline-offset-2"
        >
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {job.companyName ?? jobCard.unknownCompany}
      </p>
      {job.technologies.length > 0 ? (
        <p className="mt-2 text-sm">{job.technologies.join(' · ')}</p>
      ) : null}
      {meta ? (
        <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
      ) : null}
      <p className="mt-1 text-sm text-muted-foreground">
        {jobCard.postedLabel}:{' '}
        {formatRelativeTime(job.postedAt, undefined, locale)}
      </p>
      <div className="mt-3 flex items-center gap-4">
        {isSafeExternalUrl(job.url) ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            {jobCard.viewOriginal}
          </a>
        ) : null}
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
          onClick={handleHide}
        >
          {jobCard.hideAction}
        </button>
      </div>
    </article>
  );
};
