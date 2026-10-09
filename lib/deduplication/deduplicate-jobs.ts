import type { NormalizedJob } from '../sources/types';
import {
  normalizeCompanyName,
  normalizeJobTitle,
  normalizeUrl,
} from './normalize';
import type { DeduplicateJobsResult, DeduplicatedJobGroup } from './types';

const identityKey = (job: NormalizedJob): string =>
  `${job.source}::${job.sourceJobId}`;

const preferCanonical = (
  current: NormalizedJob,
  candidate: NormalizedJob,
): NormalizedJob => {
  const currentHttps = current.url.startsWith('https://');
  const candidateHttps = candidate.url.startsWith('https://');

  if (candidateHttps && !currentHttps) {
    return { ...current, url: candidate.url };
  }

  return currentHttps === candidateHttps &&
    candidate.url.length > current.url.length
    ? { ...current, url: candidate.url }
    : current;
};

const strongCrossSourceKey = (job: NormalizedJob): string | undefined => {
  const company = normalizeCompanyName(job.company.name);
  const title = normalizeJobTitle(job.title);
  if (!company || !title) {
    return undefined;
  }

  const applicationUrl = normalizeUrl(job.url);
  if (applicationUrl) {
    return `app:${company}|${title}|${applicationUrl}`;
  }

  return job.company.websiteUrl
    ? `site:${company}|${title}|${normalizeUrl(job.company.websiteUrl)}`
    : undefined;
};

export const deduplicateJobs = (
  jobs: NormalizedJob[],
): DeduplicateJobsResult => {
  // Pass 1: exact source + sourceJobId merges, in first-seen order.
  const byIdentity = jobs.reduce((merged, job) => {
    const key = identityKey(job);
    const existing = merged.get(key);
    return merged.set(key, existing ? preferCanonical(existing, job) : job);
  }, new Map<string, NormalizedJob>());

  // Pass 2: strong cross-source merges only. A job has at most one strong
  // key, so clusters never overlap and need no union-find.
  const clusters = Map.groupBy(
    byIdentity.entries(),
    ([key, job]) => strongCrossSourceKey(job) ?? `identity:${key}`,
  );

  const groups = [...clusters.values()].map((entries): DeduplicatedJobGroup => {
    const clusterJobs = entries.map(([, job]) => job);
    const duplicates = clusterJobs.slice(1);
    return {
      canonical: clusterJobs.reduce(preferCanonical),
      duplicates,
      mergeReason:
        duplicates.length > 0 ? 'strong-cross-source-match' : undefined,
    };
  });

  return { jobs: groups.map((group) => group.canonical), groups };
};
