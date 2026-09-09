import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import { JOB_FILTER_FIELDS, JOBS_PAGE_COPY } from './constants';
import { parseJobFilters, type JobsSearchParams } from './parse-job-filters';

export const metadata: Metadata = {
  title: JOBS_PAGE_COPY.metaTitle,
  description: JOBS_PAGE_COPY.subtitle,
};

type JobsPageProps = {
  searchParams: Promise<JobsSearchParams>;
};

/**
 * Filters and results both derive from `searchParams`, so they stream in while
 * the header above prerenders as the static shell.
 */
const JobsResults = async ({
  searchParams,
}: {
  searchParams: JobsPageProps['searchParams'];
}) => {
  const params = await searchParams;
  const filters = parseJobFilters(params);
  const data = await getJobsPageData(filters);

  return (
    <>
      {data.errorMessage ? (
        <p className="text-sm text-accent" role="alert">
          {data.errorMessage}
        </p>
      ) : null}

      <section aria-labelledby="job-filters">
        <h2 id="job-filters" className="sr-only">
          {JOBS_PAGE_COPY.filtersHeading}
        </h2>
        <form className="grid gap-3 sm:grid-cols-2" method="get">
          {JOB_FILTER_FIELDS.map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              <span>{field.label}</span>
              <select
                name={field.name}
                defaultValue={filters[field.name] ?? ''}
                className="rounded border border-border bg-surface px-3 py-2"
              >
                <option value="">{JOBS_PAGE_COPY.anyOption}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="flex flex-col gap-1 text-sm">
            <span>{JOBS_PAGE_COPY.minimumScore}</span>
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
              className="rounded border border-border bg-surface px-3 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-background"
            >
              {JOBS_PAGE_COPY.apply}
            </button>
          </div>
        </form>
      </section>

      <section>
        {data.jobs.length === 0 ? (
          <p className="text-sm text-muted">{JOBS_PAGE_COPY.empty}</p>
        ) : (
          data.jobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </section>
    </>
  );
};

const JobsPage = ({ searchParams }: JobsPageProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
    <header className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Remote Engineering Radar
        </Link>
      </p>
      <PageTitle as="h1">{JOBS_PAGE_COPY.title}</PageTitle>
      <p className="text-lg text-muted">{JOBS_PAGE_COPY.subtitle}</p>
    </header>
    <Suspense
      fallback={<p className="text-sm text-muted">{JOBS_PAGE_COPY.loading}</p>}
    >
      <JobsResults searchParams={searchParams} />
    </Suspense>
  </main>
);

export default JobsPage;
