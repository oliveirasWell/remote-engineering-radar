import Link from 'next/link';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import {
  JOBS_PAGE_COPY,
  JOBS_PAGE_LIMIT,
  MAX_JOB_FILTER_LENGTH,
} from './constants';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

type JobsPageProps = {
  searchParams: Promise<{
    technology?: string;
    seniority?: string;
    remote?: string;
    location?: string;
    minimumScore?: string;
  }>;
};

const JobsPage = async ({ searchParams }: JobsPageProps) => {
  const params = await searchParams;
  const readFilter = (value: string | undefined): string | undefined => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length <= MAX_JOB_FILTER_LENGTH
      ? trimmed
      : undefined;
  };
  const minimumScoreValue = params.minimumScore?.trim();
  const minimumScore =
    minimumScoreValue && /^\d{1,3}$/.test(minimumScoreValue)
      ? Number(minimumScoreValue)
      : undefined;

  const data = await getJobsPageData({
    technology: readFilter(params.technology),
    seniority: readFilter(params.seniority),
    remote: readFilter(params.remote),
    location: readFilter(params.location),
    minimumScore:
      minimumScore !== undefined && minimumScore <= 100
        ? minimumScore
        : undefined,
    limit: JOBS_PAGE_LIMIT,
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            Remote Engineering Radar
          </Link>
        </p>
        <PageTitle as="h1">{JOBS_PAGE_COPY.title}</PageTitle>
        {data.errorMessage ? (
          <p className="text-sm text-accent" role="alert">
            {data.errorMessage}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="job-filters">
        <h2 id="job-filters" className="sr-only">
          {JOBS_PAGE_COPY.filtersHeading}
        </h2>
        <form className="grid gap-3 sm:grid-cols-2" method="get">
          <label className="flex flex-col gap-1 text-sm">
            <span>{JOBS_PAGE_COPY.technology}</span>
            <input
              name="technology"
              defaultValue={readFilter(params.technology) ?? ''}
              className="rounded border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{JOBS_PAGE_COPY.seniority}</span>
            <input
              name="seniority"
              defaultValue={readFilter(params.seniority) ?? ''}
              className="rounded border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{JOBS_PAGE_COPY.remote}</span>
            <input
              name="remote"
              defaultValue={readFilter(params.remote) ?? ''}
              className="rounded border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{JOBS_PAGE_COPY.location}</span>
            <input
              name="location"
              defaultValue={readFilter(params.location) ?? ''}
              className="rounded border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{JOBS_PAGE_COPY.minimumScore}</span>
            <input
              name="minimumScore"
              type="number"
              min={0}
              max={100}
              defaultValue={
                minimumScore !== undefined ? String(minimumScore) : ''
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
    </main>
  );
};

export default JobsPage;
