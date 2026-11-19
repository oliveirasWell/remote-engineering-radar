import type { NormalizedJob } from './types';

/** A feed queried per category can list a job twice; keep the first. */
export const uniqueBySourceJobId = (
  jobs: readonly NormalizedJob[],
): NormalizedJob[] => [
  ...new Map(jobs.map((job) => [job.sourceJobId, job] as const))
    .values()
    .toArray(),
];
