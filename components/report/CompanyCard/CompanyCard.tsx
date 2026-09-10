'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import type { ReportCompanyCard } from '@/lib/report/types';
import { isSafeExternalUrl } from '@/lib/urls/external-url';

type CompanyCardProps = {
  company: ReportCompanyCard;
};

/**
 * The expanded detail for a company. Name, kind and open-role count are the
 * closed state's job, so this deliberately starts at the hiring evidence.
 */
export const CompanyCard = ({ company }: CompanyCardProps) => {
  const {
    messages: { companyCard },
  } = useI18n();
  const summary =
    new Map(Object.entries(companyCard.summaries)).get(company.summary) ??
    company.summary;

  return (
    <article className="pt-1 pb-4">
      <p className="text-sm text-muted-foreground">
        {companyCard.hiringSignalLabel}: {summary}
      </p>
      {company.signalDescriptions.length > 0 ? (
        <div className="mt-3">
          <p className="text-sm font-medium">{companyCard.signalsLabel}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {company.signalDescriptions.map((description) => (
              <li key={description}>{description}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {isSafeExternalUrl(company.websiteUrl) ? (
        <p className="mt-3">
          <a
            href={company.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-2"
          >
            {companyCard.viewCompany}
          </a>
        </p>
      ) : null}
    </article>
  );
};
