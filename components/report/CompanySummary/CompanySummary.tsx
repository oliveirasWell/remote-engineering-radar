import { HOME_SECTIONS } from '@/app/home-constants';
import { COMPANY_KINDS } from '@/lib/companies/constants';
import type { ReportCompanyCard } from '@/lib/report/types';
import { COMPANY_CARD_COPY } from '../constants';

type CompanySummaryProps = {
  company: ReportCompanyCard;
};

/**
 * The closed state of a company row. One line per company, so the list stays
 * scannable when a single company has dozens of open roles.
 */
export const CompanySummary = ({ company }: CompanySummaryProps) => {
  const kindLabel =
    company.kind !== COMPANY_KINDS.product
      ? COMPANY_CARD_COPY.kindLabels[company.kind]
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
        {HOME_SECTIONS.openRoles(company.openEngineeringJobs)}
      </span>
    </div>
  );
};
