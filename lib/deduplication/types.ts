export type DeduplicatedJobGroup = {
  canonical: import('../sources/types').NormalizedJob;
  duplicates: import('../sources/types').NormalizedJob[];
  mergeReason?: string;
};

export type DeduplicateJobsResult = {
  jobs: import('../sources/types').NormalizedJob[];
  groups: DeduplicatedJobGroup[];
};
