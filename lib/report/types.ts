import type { CompanyKind } from '@/lib/companies/constants';

export type ReportJobCard = {
  id: string;
  title: string;
  companyName: string | null;
  companyId: string;
  technologies: string[];
  location: string | null;
  remotePolicy: string | null;
  score: number;
  postedAt: Date | null;
  url: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
};

/** The detail page is the only view that explains why a job scored. */
export type ReportJobDetail = ReportJobCard & {
  reasons: string[];
};

export type ReportCompanyCard = {
  id: string;
  name: string;
  slug: string;
  hiringScore: number;
  kind: CompanyKind;
  summary: string;
  signalDescriptions: string[];
  websiteUrl: string | null;
  openEngineeringJobs: number;
};
