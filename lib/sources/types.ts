export type SalaryPeriod = 'year' | 'month' | 'hour';

export type JobSalary = {
  min: number | null;
  max: number | null;
  /** ISO 4217, uppercase. Null when the source does not state one. */
  currency: string | null;
  period: SalaryPeriod;
};

export type NormalizedJob = {
  source: string;
  sourceJobId: string;
  company: {
    name: string;
    websiteUrl?: string;
  };
  title: string;
  url: string;
  location?: string;
  remotePolicy?: string;
  description?: string;
  technologies: string[];
  countries?: string[];
  seniority?: string;
  postedAt?: Date;
  salary?: JobSalary;
};

export type JobSource = {
  name: string;
  fetchJobs: () => Promise<{
    jobs: NormalizedJob[];
    /** Only exhaustive snapshots may retire jobs absent from this fetch. */
    complete: boolean;
  }>;
};
