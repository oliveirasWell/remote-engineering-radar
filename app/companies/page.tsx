import type { Metadata } from 'next';
import Link from 'next/link';
import { CompanyCard } from '@/components/report/CompanyCard/CompanyCard';
import { JobCard } from '@/components/report/JobCard/JobCard';
import { PageTitle } from '@/components/ui/PageTitle/PageTitle';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { COMPANIES_PAGE_COPY } from './constants';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: COMPANIES_PAGE_COPY.title,
};

const CompaniesPage = async () => {
  const data = await getCompaniesPageData();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-accent">
            {COMPANIES_PAGE_COPY.backHome}
          </Link>
        </p>
        <PageTitle as="h1">{COMPANIES_PAGE_COPY.title}</PageTitle>
        {data.errorMessage ? (
          <p className="text-sm text-accent" role="alert">
            {data.errorMessage}
          </p>
        ) : null}
      </header>

      {data.companies.length === 0 ? (
        <p className="text-sm text-muted">{COMPANIES_PAGE_COPY.empty}</p>
      ) : (
        data.companies.map((company) => (
          <section
            key={company.id}
            aria-labelledby={`company-${company.id}`}
            className="border-b border-border pb-8"
          >
            <h2 id={`company-${company.id}`} className="sr-only">
              {company.name}
            </h2>
            <CompanyCard company={company} />
            {company.signalSourceUrls.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium">
                  {COMPANIES_PAGE_COPY.evidence}
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
                  {COMPANIES_PAGE_COPY.relevantJobs}
                </p>
                {company.jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
};

export default CompaniesPage;
