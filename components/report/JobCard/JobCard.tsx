'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import type { ReportJobCard } from '@/lib/report/types';
import { formatRelativeTime } from '@/lib/report/format';
import { JOB_CARD_COPY } from '../constants';
import { hiddenJobsStore } from './hidden-jobs-store';

type JobCardProps = {
  job: ReportJobCard;
};

export const JobCard = ({ job }: JobCardProps) => {
  const isHidden = useSyncExternalStore(
    hiddenJobsStore.subscribe,
    () => hiddenJobsStore.has(job.id),
    () => false,
  );
  const meta = [job.remotePolicy, job.location].filter(Boolean).join(' · ');

  const handleHide = () => {
    if (window.confirm(JOB_CARD_COPY.hideConfirmation)) {
      hiddenJobsStore.hide(job.id);
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <article className="border-b border-border py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={`/jobs/${job.id}`} className="hover:text-accent">
            {job.title}
          </Link>
        </h3>
        <p className="text-sm text-muted">
          {JOB_CARD_COPY.scoreLabel}: {job.score}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">{job.companyName}</p>
      {job.technologies.length > 0 ? (
        <p className="mt-2 text-sm">{job.technologies.join(' · ')}</p>
      ) : null}
      {meta ? <p className="mt-1 text-sm text-muted">{meta}</p> : null}
      <p className="mt-1 text-sm text-muted">
        {JOB_CARD_COPY.postedLabel}: {formatRelativeTime(job.postedAt)}
      </p>
      {job.reasons.length > 0 ? (
        <div className="mt-3">
          <p className="text-sm font-medium">{JOB_CARD_COPY.whyRelevant}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {job.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-3 flex items-center gap-4">
        {isSafeExternalUrl(job.url) ? (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent underline-offset-2 hover:underline"
          >
            {JOB_CARD_COPY.viewOriginal}
          </a>
        ) : null}
        <button
          type="button"
          className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          onClick={handleHide}
        >
          {JOB_CARD_COPY.hideAction}
        </button>
      </div>
    </article>
  );
};
