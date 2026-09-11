'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { CompanyCard } from '@/components/report/CompanyCard/CompanyCard';
import { CompanySummary } from '@/components/report/CompanySummary/CompanySummary';
import { CompanyJobs } from '@/components/report/CompanyJobs/CompanyJobs';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import type { CompaniesPageData } from '@/lib/report/get-companies-page-data';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { COMPANY_SORTS, type CompanySort } from './home-constants';
import Link from 'next/link';

export const CompaniesReport = ({ data }: { data: CompaniesPageData }) => {
  const { locale, messages } = useI18n();
  const [sort, setSort] = useState<CompanySort>('default');
  const companies = [...data.companies].sort(COMPANY_SORTS[sort]);

  return (
    <>
      <nav
        aria-label={messages.home.countryFilterLabel}
        className="flex flex-wrap gap-3 text-sm"
      >
        <Link
          href="/"
          className={
            !data.country
              ? 'inline-flex min-h-[44px] items-center font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]'
              : 'inline-flex min-h-[44px] items-center text-muted-foreground underline underline-offset-2'
          }
        >
          {messages.home.countryAll}
        </Link>
        {JOB_COUNTRY_FILTER_OPTIONS.map((option) => (
          <Link
            key={option.slug}
            href={`/?country=${option.slug}`}
            className={
              data.country === option.slug
                ? 'inline-flex min-h-[44px] items-center font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]'
                : 'inline-flex min-h-[44px] items-center text-muted-foreground underline underline-offset-2'
            }
          >
            {messages.countries[option.slug]}
          </Link>
        ))}
      </nav>
      <section aria-labelledby="companies-to-watch">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="companies-to-watch" className="text-xl font-semibold">
            {messages.home.companiesToWatch}
          </h2>
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            {messages.home.sortLabel}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CompanySort)}
              className="rounded border border-border bg-card px-2 py-1 text-sm text-foreground"
            >
              {Object.keys(COMPANY_SORTS).map((key) => (
                <option key={key} value={key}>
                  {messages.home.sortOptions[key as CompanySort]}
                </option>
              ))}
            </select>
          </label>
          {data.updatedAt ? (
            <time
              dateTime={data.updatedAt.toISOString()}
              className="text-xs text-muted-foreground tabular-nums"
            >
              {formatUpdatedLabel(data.updatedAt, locale)}
            </time>
          ) : (
            <span className="text-xs text-muted-foreground">
              {formatUpdatedLabel(null, locale)}
            </span>
          )}
        </header>
        {companies.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {messages.report.emptyCompanies}
          </p>
        ) : (
          <div className="mt-2 flex flex-col">
            {companies.map((company) => (
              <details
                key={company.id}
                className="group border-b border-border pb-4"
              >
                <summary className="-mx-3 cursor-pointer list-none px-3 py-3 marker:content-none hover:bg-muted/40">
                  <div className="flex items-baseline justify-between gap-3">
                    <CompanySummary company={company} />
                    <span
                      aria-hidden
                      className="text-sm text-muted-foreground opacity-70 transition-transform group-open:rotate-90 hover:opacity-100"
                    >
                      &rsaquo;
                    </span>
                  </div>
                </summary>
                <CompanyCard company={company} />
                {company.signalSourceUrls.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium">
                      {messages.home.evidence}
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
                              className="text-muted-foreground underline underline-offset-2"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
                {company.jobs.length > 0 ? (
                  <CompanyJobs jobs={company.jobs} />
                ) : null}
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export const HomeHeading = () => {
  const { messages } = useI18n();
  return (
    <h1 className="text-2xl font-semibold tracking-tight text-balance">
      {messages.home.subtitle}
    </h1>
  );
};
