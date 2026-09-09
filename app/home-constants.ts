import { EN_MESSAGES } from '@/lib/i18n/messages';
import type { ReportCompanyCard } from '@/lib/report/types';

export const HOME_SECTIONS = EN_MESSAGES.home;

/** `default` keeps the hiring-score order the query already returns. */
export const COMPANY_SORTS: Record<
  keyof typeof EN_MESSAGES.home.sortOptions,
  (a: ReportCompanyCard, b: ReportCompanyCard) => number
> = {
  default: () => 0,
  jobs: (a, b) => b.openEngineeringJobs - a.openEngineeringJobs,
  name: (a, b) => a.name.localeCompare(b.name),
};

export type CompanySort = keyof typeof COMPANY_SORTS;
