'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import {
  DEFAULT_JOB_SORT,
  JOB_SORT_OPTIONS,
  type JobSort,
} from '@/lib/jobs/constants';
import type { ReportJobCard } from '@/lib/report/types';
import { JobCard } from '../JobCard/JobCard';
import { JOB_COMPARATORS } from './constants';

export const CompanyJobs = ({ jobs }: { jobs: ReportJobCard[] }) => {
  const { messages } = useI18n();
  const [sort, setSort] = useState<JobSort>(DEFAULT_JOB_SORT);
  const sortedJobs = [...jobs].sort(JOB_COMPARATORS[sort]);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{messages.home.relevantJobs}</p>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {messages.jobs.sortLabel}
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as JobSort)}
            className="min-h-[44px] rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
          >
            {JOB_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {messages.jobs.sortOptions[option]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {sortedJobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
};
