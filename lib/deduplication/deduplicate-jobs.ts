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

  if (
    currentHttps === candidateHttps &&
    candidate.url.length > current.url.length
  ) {
    return { ...current, url: candidate.url };
  }

  return current;
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

  if (job.company.websiteUrl) {
    return `site:${company}|${title}|${normalizeUrl(job.company.websiteUrl)}`;
  }

  return undefined;
};

export const deduplicateJobs = (
  jobs: NormalizedJob[],
): DeduplicateJobsResult => {
  // Pass 1: exact source + sourceJobId merges.
  const byIdentity = new Map<string, NormalizedJob>();
  const identityOrder: string[] = [];

  for (const job of jobs) {
    const key = identityKey(job);
    const existing = byIdentity.get(key);
    if (!existing) {
      byIdentity.set(key, job);
      identityOrder.push(key);
      continue;
    }
    byIdentity.set(key, preferCanonical(existing, job));
  }

  // Pass 2: strong cross-source merges only.
  const parent = new Map<string, string>();
  const find = (key: string): string => {
    const current = parent.get(key) ?? key;
    if (current !== key) {
      const root = find(current);
      parent.set(key, root);
      return root;
    }
    return current;
  };
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  };

  for (const key of identityOrder) {
    parent.set(key, key);
  }

  const byCrossKey = new Map<string, string[]>();
  for (const key of identityOrder) {
    const job = byIdentity.get(key);
    if (!job) {
      continue;
    }
    const crossKey = strongCrossSourceKey(job);
    if (!crossKey) {
      continue;
    }
    const bucket = byCrossKey.get(crossKey) ?? [];
    bucket.push(key);
    byCrossKey.set(crossKey, bucket);
  }

  for (const bucket of byCrossKey.values()) {
    for (let index = 1; index < bucket.length; index += 1) {
      union(bucket[0]!, bucket[index]!);
    }
  }

  const clusters = new Map<string, string[]>();
  for (const key of identityOrder) {
    const root = find(key);
    const cluster = clusters.get(root) ?? [];
    cluster.push(key);
    clusters.set(root, cluster);
  }

  const groups: DeduplicatedJobGroup[] = [];
  const resultJobs: NormalizedJob[] = [];

  for (const key of identityOrder) {
    const root = find(key);
    if (root !== key) {
      continue;
    }

    const clusterKeys = clusters.get(root) ?? [key];
    const clusterJobs = clusterKeys.map((clusterKey) =>
      byIdentity.get(clusterKey)!,
    );
    let canonical = clusterJobs[0]!;
    for (const candidate of clusterJobs.slice(1)) {
      canonical = preferCanonical(canonical, candidate);
    }

    const duplicates = clusterJobs.slice(1);
    groups.push({
      canonical,
      duplicates,
      mergeReason:
        duplicates.length > 0 ? 'strong-cross-source-match' : undefined,
    });
    resultJobs.push(canonical);
  }

  return { jobs: resultJobs, groups };
};
