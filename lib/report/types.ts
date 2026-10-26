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
  clickCount: number;
};

export type CompanyDetails = {
  signalDescriptions: string[];
  signalSourceUrls: string[];
  jobs: ReportJobCard[];
};

/** The detail page quotes the listing and explains why the job scored. */
export type ReportJobDetail = ReportJobCard & {
  reasons: string[];
  description: string | null;
  source: string;
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

export type LatestIngest = {
  newJobs: number;
  completedAt: Date;
};
