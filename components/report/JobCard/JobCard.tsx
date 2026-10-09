'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { JOB_CLICK_PATH } from '@/lib/jobs/constants';
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
  const [clickCount, setClickCount] = useState(job.clickCount);
  const remotePolicy =
    new Map(Object.entries(remote)).get(job.remotePolicy ?? '') ??
    job.remotePolicy;
  const meta = [remotePolicy, job.location].filter(Boolean).join(' · ');

  const handleHide = () => {
    if (window.confirm(jobCard.hideConfirmation)) {
      hiddenJobsStore.hide(job.id);
    }
  };

  const revertClick = () => {
    setClickCount((count) => Math.max(0, count - 1));
  };

  const handleViewOriginal = () => {
    setClickCount((count) => count + 1);
    void fetch(JOB_CLICK_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) {
          revertClick();
          return;
        }
        const payload: unknown = await response.json();
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'clickCount' in payload &&
          typeof payload.clickCount === 'number'
        ) {
          setClickCount(payload.clickCount);
        }
      })
      .catch(revertClick);
  };

  if (isHidden) {
    return null;
  }

  return (
    <article className="border-b border-border py-5">
      <h3 className="text-lg font-semibold tracking-tight">
        <Link
          href={localizedPath(locale, `/jobs/${job.id}`)}
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
            onClick={handleViewOriginal}
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
      {clickCount > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
          {jobCard.clickedCount(clickCount)}
        </p>
      ) : null}
    </article>
  );
};
