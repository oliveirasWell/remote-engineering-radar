import Link from 'next/link';
import type { ReportCompanyCard } from '@/lib/report/types';
import { COMPANY_CARD_COPY } from '../constants';

type CompanyCardProps = {
  company: ReportCompanyCard;
};

export const CompanyCard = ({ company }: CompanyCardProps) => {
  return (
    <article className="border-b border-border py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight">{company.name}</h3>
        <p className="text-sm text-muted">
          {COMPANY_CARD_COPY.hiringSignalLabel}: {company.summary}
        </p>
      </div>
      <p className="mt-2 text-sm text-muted">
        {company.openEngineeringJobs} {COMPANY_CARD_COPY.openRolesSuffix}
      </p>
      {company.signalDescriptions.length > 0 ? (
        <div className="mt-3">
          <p className="text-sm font-medium">
            {COMPANY_CARD_COPY.signalsLabel}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
            {company.signalDescriptions.map((description) => (
              <li key={description}>{description}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="mt-3">
        {company.websiteUrl ? (
          <a
            href={company.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent underline-offset-2 hover:underline"
          >
            {COMPANY_CARD_COPY.viewCompany}
          </a>
        ) : (
          <Link
            href="/companies"
            className="text-sm text-accent underline-offset-2 hover:underline"
          >
            {COMPANY_CARD_COPY.viewCompany}
          </Link>
        )}
      </p>
    </article>
  );
};
