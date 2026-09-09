import { CompanyCard } from '@/components/report/CompanyCard/CompanyCard';
import { CompanySummary } from '@/components/report/CompanySummary/CompanySummary';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { EMPTY_COMPANIES_MESSAGE } from '@/lib/report/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import Link from 'next/link';
import { Suspense } from 'react';
import { APP_NAME } from './constants';
import { HOME_SECTIONS } from './home-constants';

type HomeProps = {
  searchParams: Promise<{
    country?: string | string[];
  }>;
};

/**
 * Everything below depends on `searchParams`, so it streams in while the
 * header above prerenders as the static shell.
 */
const CompaniesSection = async ({
  searchParams,
}: {
  searchParams: HomeProps['searchParams'];
}) => {
  const params = await searchParams;
  const data = await getCompaniesPageData({ country: params.country });

  return (
    <>
      <p className="text-muted">{formatUpdatedLabel(data.updatedAt)}</p>
      <nav
        aria-label={HOME_SECTIONS.countryFilterLabel}
        className="flex flex-wrap gap-3 text-sm"
      >
        <Link
          href="/"
          className={
            !data.country
              ? 'font-medium text-foreground'
              : 'text-accent underline-offset-2 hover:underline'
          }
        >
          {HOME_SECTIONS.countryAll}
        </Link>
        {JOB_COUNTRY_FILTER_OPTIONS.map((option) => (
          <Link
            key={option.slug}
            href={`/?country=${option.slug}`}
            className={
              data.country === option.slug
                ? 'font-medium text-foreground'
                : 'text-accent underline-offset-2 hover:underline'
            }
          >
            {option.label}
          </Link>
        ))}
      </nav>
      {data.errorMessage ? (
        <p className="text-sm text-accent" role="alert">
          {data.errorMessage}
        </p>
      ) : null}

      <section aria-labelledby="companies-to-watch">
        <h2 id="companies-to-watch" className="text-xl font-semibold">
          {HOME_SECTIONS.companiesToWatch}
        </h2>
        {data.companies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{EMPTY_COMPANIES_MESSAGE}</p>
        ) : (
          <div className="mt-2 flex flex-col">
            {data.companies.map((company) => (
              <details
                key={company.id}
                className="group border-b border-border pb-4"
              >
                <summary className="cursor-pointer list-none py-2 marker:content-none">
                  <div className="flex items-baseline justify-between gap-3">
                    <CompanySummary company={company} />
                    <span
                      aria-hidden
                      className="text-sm text-muted transition-transform group-open:rotate-90"
                    >
                      &rsaquo;
                    </span>
                  </div>
                </summary>
                <CompanyCard company={company} />
                {company.signalSourceUrls.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium">
                      {HOME_SECTIONS.evidence}
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {company.signalSourceUrls
                        .filter(isSafeExternalUrl)
                        .map((url) => (
                          <li key={url}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline-offset-2 hover:underline"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
                {company.jobs.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium">
                      {HOME_SECTIONS.relevantJobs}
                    </p>
                    {company.jobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

const Home = ({ searchParams }: HomeProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
    <header className="flex flex-col gap-2">
      <PageTitle as="h1" className="text-4xl tracking-tight">
        {APP_NAME}
      </PageTitle>
      <p className="text-lg text-muted">{HOME_SECTIONS.subtitle}</p>
      <nav className="flex flex-wrap gap-4 text-sm">
        <span className="font-medium text-foreground">Companies</span>
        <Link
          href="/jobs"
          className="text-accent underline-offset-2 hover:underline"
        >
          Jobs
        </Link>
      </nav>
    </header>
    <Suspense
      fallback={<p className="text-sm text-muted">{HOME_SECTIONS.loading}</p>}
    >
      <CompaniesSection searchParams={searchParams} />
    </Suspense>
  </main>
);

export default Home;
