'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { CompanyRow } from '@/components/report/CompanyRow/CompanyRow';
import {
  JOB_COUNTRY_FILTER_OPTIONS,
  JOB_FOCUS_FILTER_OPTIONS,
  type JobCountrySlug,
  type JobFocusSlug,
} from '@/lib/jobs/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import type { CompaniesPageData } from '@/lib/report/get-companies-page-data';
import { GUIDE_PATH } from '@/lib/seo/constants';
import { COMPANY_SORTS, type CompanySort } from './home-constants';
import Link from 'next/link';

const ACTIVE_TAB =
  'inline-flex min-h-[44px] items-center font-semibold text-foreground shadow-[inset_0_-2px_0_var(--primary)]';
const INACTIVE_TAB =
  'inline-flex min-h-[44px] items-center text-muted-foreground underline underline-offset-2';

/** Each tab row keeps the other row's selection. */
const homeHref = (
  country: JobCountrySlug | undefined,
  focus: JobFocusSlug | undefined,
) => {
  const params = new URLSearchParams();
  if (country) {
    params.set('country', country);
  }
  if (focus) {
    params.set('focus', focus);
  }
  const query = params.toString();
  return query ? `/?${query}` : '/';
};

/** Every job of one company on /jobs, under the same country and focus. */
const companyJobsHref = (
  company: string,
  country: JobCountrySlug | undefined,
  focus: JobFocusSlug | undefined,
) => {
  const params = new URLSearchParams({ company });
  if (country) {
    params.set('country', country);
  }
  if (focus) {
    params.set('focus', focus);
  }
  return `/jobs?${params.toString()}`;
};

export const CompaniesReport = ({ data }: { data: CompaniesPageData }) => {
  const { locale, messages } = useI18n();
  const [sort, setSort] = useState<CompanySort>('default');
  const companies = [...data.companies].sort(COMPANY_SORTS[sort]);
  const scope = [
    data.focus ? messages.focus[data.focus] : null,
    data.country ? messages.countries[data.country] : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

  return (
    <>
      {scope ? (
        <p className="text-sm text-muted-foreground">
          {messages.home.filteredScope(scope)}
        </p>
      ) : null}
      <nav
        aria-label={messages.jobs.focusLabel}
        className="flex flex-wrap gap-3 text-sm"
      >
        <Link
          href={localizedPath(locale, homeHref(data.country, undefined))}
          className={data.focus ? INACTIVE_TAB : ACTIVE_TAB}
        >
          {messages.jobs.focusAll}
        </Link>
        {JOB_FOCUS_FILTER_OPTIONS.map((option) => (
          <Link
            key={option.slug}
            href={localizedPath(locale, homeHref(data.country, option.slug))}
            className={data.focus === option.slug ? ACTIVE_TAB : INACTIVE_TAB}
          >
            {messages.focus[option.slug]}
          </Link>
        ))}
      </nav>
      <nav
        aria-label={messages.home.countryFilterLabel}
        className="flex flex-wrap gap-3 text-sm"
      >
        <Link
          href={localizedPath(locale, homeHref(undefined, data.focus))}
          className={data.country ? INACTIVE_TAB : ACTIVE_TAB}
        >
          {messages.home.countryAll}
        </Link>
        {JOB_COUNTRY_FILTER_OPTIONS.map((option) => (
          <Link
            key={option.slug}
            href={localizedPath(locale, homeHref(option.slug, data.focus))}
            className={data.country === option.slug ? ACTIVE_TAB : INACTIVE_TAB}
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
              <CompanyRow
                key={JSON.stringify([
                  company.id,
                  data.country,
                  data.focus,
                  data.updatedAt,
                ])}
                company={company}
                country={data.country}
                focus={data.focus}
                updatedAt={data.updatedAt}
                allJobsHref={localizedPath(
                  locale,
                  companyJobsHref(company.slug, data.country, data.focus),
                )}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export const HomeHeading = () => {
  const { locale, messages } = useI18n();
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {messages.home.subtitle}
      </h1>
      <p className="text-muted-foreground">{messages.home.overview}</p>
      <Link
        href={localizedPath(locale, GUIDE_PATH)}
        className="text-muted-foreground underline underline-offset-2"
      >
        {messages.navigation.guide}
      </Link>
    </header>
  );
};
