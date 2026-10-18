'use client';

import type { JobCountrySlug, JobFocusSlug } from '@/lib/jobs/constants';
import type { CompaniesPageItem } from '@/lib/report/get-companies-page-data';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { CompanyCard } from '../CompanyCard/CompanyCard';
import { CompanyJobs } from '../CompanyJobs/CompanyJobs';
import { CompanySummary } from '../CompanySummary/CompanySummary';
import { useCompanyDetails } from './use-company-details';

export const CompanyRow = ({
  company,
  country,
  focus,
  updatedAt,
  allJobsHref,
}: {
  company: CompaniesPageItem;
  country?: JobCountrySlug;
  focus?: JobFocusSlug;
  updatedAt: Date | null;
  allJobsHref: string;
}) => {
  const { messages } = useI18n();
  const details = useCompanyDetails({ company, country, focus, updatedAt });

  return (
    <details
      className="group border-b border-border pb-4"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          details.open();
        }
      }}
    >
      <summary
        className="-mx-3 cursor-pointer list-none px-3 py-3 marker:content-none hover:bg-muted/40"
        onPointerEnter={details.prefetch}
        onPointerLeave={details.cancelPrefetch}
        onFocus={details.prefetch}
        onBlur={details.cancelPrefetch}
      >
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
      {details.ready && (
        <>
          <CompanyCard company={details.company} />
          {details.company.signalSourceUrls.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium">{messages.home.evidence}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {details.company.signalSourceUrls
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
          {details.company.jobs.length > 0 ? (
            <CompanyJobs
              jobs={details.company.jobs}
              totalJobs={company.openEngineeringJobs}
              allJobsHref={allJobsHref}
            />
          ) : null}
        </>
      )}
      {!details.ready && details.failed && (
        <div role="alert" className="py-3 text-sm">
          {messages.report.detailsError}{' '}
          <button type="button" onClick={details.retry} className="underline">
            {messages.globalError.retry}
          </button>
        </div>
      )}
      {!details.ready && !details.failed && details.loading && (
        <p role="status" className="py-3 text-sm">
          {messages.report.detailsLoading}
        </p>
      )}
    </details>
  );
};
