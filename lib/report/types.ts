export type ReportJobCard = {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
  technologies: string[];
  location: string | null;
  remotePolicy: string | null;
  score: number;
  reasons: string[];
  postedAt: Date | null;
  url: string;
};

export type ReportCompanyCard = {
  id: string;
  name: string;
  slug: string;
  hiringScore: number;
  summary: string;
  signalDescriptions: string[];
  websiteUrl: string | null;
  openEngineeringJobs: number;
};

export type HomeReport = {
  updatedAt: Date | null;
  jobs: ReportJobCard[];
  companies: ReportCompanyCard[];
  errorMessage?: string;
};
