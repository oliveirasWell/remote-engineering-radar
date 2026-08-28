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
  seniority?: string;
  postedAt?: Date;
};

export type JobSource = {
  name: string;
  fetchJobs: () => Promise<NormalizedJob[]>;
};
