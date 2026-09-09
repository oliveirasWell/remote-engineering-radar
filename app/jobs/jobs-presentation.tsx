'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import Link from 'next/link';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import type { JobFilters, JobsPageData } from '@/lib/report/get-jobs-page-data';
import { TECHNOLOGY_NAMES } from '@/lib/classification/constants';

export const JobsReport = ({
  data,
  filters,
}: {
  data: JobsPageData;
  filters: JobFilters;
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
      {data.errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {messages.report.error}
        </p>
      ) : null}

      <section aria-labelledby="job-filters">
        <h2 id="job-filters" className="sr-only">
          {messages.jobs.filtersHeading}
        </h2>
        <form className="grid gap-3 sm:grid-cols-2" method="get">
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
