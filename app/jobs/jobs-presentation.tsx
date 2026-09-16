'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import type { JobFilters, JobsPageData } from '@/lib/report/get-jobs-page-data';
import { TECHNOLOGY_NAMES } from '@/lib/classification/constants';
import {
  JOB_FOCUS_FILTER_OPTIONS,
  type JobFocusSlug,
} from '@/lib/jobs/constants';
import Link from 'next/link';

const CHIP_BASE = 'inline-flex min-h-[44px] items-center';
const ACTIVE_CHIP = `${CHIP_BASE} font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]`;
const INACTIVE_CHIP = `${CHIP_BASE} text-muted-foreground underline underline-offset-2`;

/**
 * Track switching keeps the filters already applied, so a country or seniority
 * choice survives moving between focus areas.
 */
const focusHref = (filters: JobFilters, focus: JobFocusSlug | undefined) => {
  const entries: Array<[string, string | number | undefined]> = [
    ['technology', filters.technology],
    ['seniority', filters.seniority],
    ['remote', filters.remote],
    ['country', filters.country],
    ['minimumScore', filters.minimumScore],
    ['focus', focus],
  ];
  const params = new URLSearchParams(
    entries
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => [name, String(value)]),
  );
  const query = params.toString();
  return query ? `/jobs?${query}` : '/jobs';
};

export const JobsReport = ({
  data,
  filters,
  hasError,
}: {
  data: JobsPageData;
  filters: JobFilters;
  hasError?: boolean;
}) => {
  const { messages } = useI18n();
  const fields = [
    {
      name: 'technology',
      options: TECHNOLOGY_NAMES.map((value) => [value, value]),
    },
    { name: 'seniority', options: Object.entries(messages.seniority) },
    { name: 'remote', options: Object.entries(messages.remote) },
    { name: 'country', options: Object.entries(messages.countries) },
  ] as const;

  return (
    <>
      {hasError ? (
        <p className="text-sm text-destructive" role="alert">
          {messages.report.error}
        </p>
      ) : null}

      <nav
        aria-label={messages.jobs.focusLabel}
        className="flex flex-wrap gap-3 text-sm"
      >
        <Link
          href={focusHref(filters, undefined)}
          className={filters.focus ? INACTIVE_CHIP : ACTIVE_CHIP}
        >
          {messages.jobs.focusAll}
        </Link>
        {JOB_FOCUS_FILTER_OPTIONS.map((option) => (
          <Link
            key={option.slug}
            href={focusHref(filters, option.slug)}
            className={
              filters.focus === option.slug ? ACTIVE_CHIP : INACTIVE_CHIP
            }
          >
            {messages.focus[option.slug]}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="job-filters">
        <h2 id="job-filters" className="sr-only">
          {messages.jobs.filtersHeading}
        </h2>
        <form className="grid gap-3 sm:grid-cols-2" method="get">
          {filters.focus ? (
            <input type="hidden" name="focus" value={filters.focus} />
          ) : null}
          {fields.map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              <span>{messages.jobs[field.name]}</span>
              <select
                name={field.name}
                defaultValue={filters[field.name] ?? ''}
                className="rounded border border-border bg-card px-3 py-2 disabled:opacity-50"
              >
                <option value="">{messages.jobs.anyOption}</option>
                {field.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="flex flex-col gap-1 text-sm">
            <span>{messages.jobs.minimumScore}</span>
            <input
              name="minimumScore"
              type="number"
              min={0}
              max={100}
              defaultValue={
                filters.minimumScore !== undefined
                  ? String(filters.minimumScore)
                  : ''
              }
              className="rounded border border-border bg-card px-3 py-2 disabled:opacity-50"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {messages.jobs.apply}
            </button>
          </div>
        </form>
      </section>

      <section>
        {data.jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{messages.jobs.empty}</p>
        ) : (
          data.jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </section>
    </>
  );
};

export const JobsHeading = () => {
  const { messages } = useI18n();
  return (
    <header className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        <Link
          href="/"
          className="text-muted-foreground underline underline-offset-2"
        >
          {messages.app.name}
        </Link>
      </p>
      <PageTitle as="h1">{messages.jobs.title}</PageTitle>
      <p className="text-lg text-muted-foreground">{messages.jobs.subtitle}</p>
    </header>
  );
};
