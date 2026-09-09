'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { COMPANY_KINDS } from '@/lib/companies/constants';
import type { ReportCompanyCard } from '@/lib/report/types';

type CompanySummaryProps = {
  company: ReportCompanyCard;
};

/**
 * The closed state of a company row. One line per company, so the list stays
 * scannable when a single company has dozens of open roles.
 */
export const CompanySummary = ({ company }: CompanySummaryProps) => {
  const { messages } = useI18n();
  const kindLabel =
    company.kind !== COMPANY_KINDS.product
      ? messages.companyCard.kindLabels[company.kind]
      : null;

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-lg font-semibold tracking-tight">
        {company.name}
      </span>
      {kindLabel ? (
        <span className="text-sm text-muted-foreground">{kindLabel}</span>
      ) : null}
      <span className="text-sm text-muted-foreground">
        {messages.home.openRoles(company.openEngineeringJobs)}
      </span>
    </div>
  );
};
