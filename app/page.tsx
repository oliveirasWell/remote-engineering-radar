import { CompanyCard } from '@/components/report/CompanyCard/CompanyCard';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import {
  EMPTY_COMPANIES_MESSAGE,
  EMPTY_JOBS_MESSAGE,
} from '@/lib/report/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import { getHomeReport } from '@/lib/report/get-home-report';
import Link from 'next/link';
import { APP_NAME } from './constants';
import { HOME_SECTIONS } from './home-constants';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const Home = async () => {
  const report = await getHomeReport();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <PageTitle as="h1" className="text-4xl tracking-tight">
          {APP_NAME}
        </PageTitle>
        <p className="text-lg text-muted">{HOME_SECTIONS.subtitle}</p>
        <p className="text-muted">{formatUpdatedLabel(report.updatedAt)}</p>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/jobs"
            className="text-accent underline-offset-2 hover:underline"
          >
            Jobs
          </Link>
          <Link
            href="/companies"
            className="text-accent underline-offset-2 hover:underline"
          >
            Companies
          </Link>
        </nav>
        {report.errorMessage ? (
          <p className="text-sm text-accent" role="alert">
            {report.errorMessage}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="new-opportunities">
        <h2 id="new-opportunities" className="text-xl font-semibold">
          {HOME_SECTIONS.newOpportunities}
        </h2>
        {report.jobs.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{EMPTY_JOBS_MESSAGE}</p>
        ) : (
          <div className="mt-2">
            {report.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="companies-to-watch">
        <h2 id="companies-to-watch" className="text-xl font-semibold">
          {HOME_SECTIONS.companiesToWatch}
        </h2>
        {report.companies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{EMPTY_COMPANIES_MESSAGE}</p>
        ) : (
          <div className="mt-2">
            {report.companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;
