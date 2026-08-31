import { CompanyCard } from '@/components/report/CompanyCard/CompanyCard';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { COMPANY_MARKET_FILTERS } from '@/lib/jobs/constants';
import { EMPTY_COMPANIES_MESSAGE } from '@/lib/report/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import Link from 'next/link';
import { APP_NAME } from './constants';
import { HOME_SECTIONS } from './home-constants';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

type HomeProps = {
  searchParams: Promise<{
    market?: string | string[];
  }>;
};

const Home = async ({ searchParams }: HomeProps) => {
  const params = await searchParams;
  const data = await getCompaniesPageData({ market: params.market });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <PageTitle as="h1" className="text-4xl tracking-tight">
          {APP_NAME}
        </PageTitle>
        <p className="text-lg text-muted">{HOME_SECTIONS.subtitle}</p>
        <p className="text-muted">{formatUpdatedLabel(data.updatedAt)}</p>
        <nav className="flex flex-wrap gap-4 text-sm">
          <span className="font-medium text-foreground">Companies</span>
          <Link
            href="/jobs"
            className="text-accent underline-offset-2 hover:underline"
          >
            Jobs
          </Link>
        </nav>
        <nav
          aria-label="Market filter"
          className="flex flex-wrap gap-3 text-sm"
        >
          <Link
            href={`/?market=${COMPANY_MARKET_FILTERS.brazil}`}
            className={
              data.market === COMPANY_MARKET_FILTERS.brazil
                ? 'font-medium text-foreground'
                : 'text-accent underline-offset-2 hover:underline'
            }
          >
            {HOME_SECTIONS.marketBrazil}
          </Link>
          <Link
            href={`/?market=${COMPANY_MARKET_FILTERS.all}`}
            className={
              data.market === COMPANY_MARKET_FILTERS.all
                ? 'font-medium text-foreground'
                : 'text-accent underline-offset-2 hover:underline'
            }
          >
            {HOME_SECTIONS.marketAll}
          </Link>
        </nav>
        {data.errorMessage ? (
          <p className="text-sm text-accent" role="alert">
            {data.errorMessage}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="companies-to-watch">
        <h2 id="companies-to-watch" className="text-xl font-semibold">
          {HOME_SECTIONS.companiesToWatch}
        </h2>
        {data.companies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{EMPTY_COMPANIES_MESSAGE}</p>
        ) : (
          <div className="mt-2 flex flex-col gap-8">
            {data.companies.map((company) => (
              <section
                key={company.id}
                aria-labelledby={`company-${company.id}`}
                className="border-b border-border pb-8"
              >
                <h3 id={`company-${company.id}`} className="sr-only">
                  {company.name}
                </h3>
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
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;
