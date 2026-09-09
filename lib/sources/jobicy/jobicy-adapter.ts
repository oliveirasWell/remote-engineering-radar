import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import {
  JOBICY_API_BASE_URL,
  JOBICY_COUNT,
  JOBICY_INDUSTRY,
  JOBICY_SOURCE_NAME,
} from './constants';
import {
  normalizeJobicyJob,
  type JobicyJobRecord,
  type JobicyJobsPage,
} from './normalize-jobicy-job';

export type JobicyAdapterOptions = {
  fetch?: typeof fetch;
  count?: number;
};

const isJobRecord = (value: unknown): value is JobicyJobRecord =>
  Boolean(value && typeof value === 'object');

const buildJobsUrl = (count: number): string => {
  const url = new URL(JOBICY_API_BASE_URL);
  url.searchParams.set('count', String(count));
  url.searchParams.set('industry', JOBICY_INDUSTRY);
  return url.toString();
};

const fetchAllJobs = async (
  count: number,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const response = await fetchWithRetry(buildJobsUrl(count), fetchImpl);

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(`Jobicy request failed: ${response.status}`);
  }

  const payload = await readJsonResponse<unknown>(response);
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as JobicyJobsPage).jobs)
  ) {
    throw new Error('Jobicy response has an unexpected shape');
  }

  const normalized: NormalizedJob[] = [];
  for (const record of (payload as JobicyJobsPage & { jobs: unknown[] }).jobs) {
    const job = isJobRecord(record) ? normalizeJobicyJob(record) : null;
    if (job) {
      normalized.push(job);
    }
  }

  return normalized;
};

export const createJobicyAdapter = (
  options: JobicyAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const count = options.count ?? JOBICY_COUNT;

  return {
    name: JOBICY_SOURCE_NAME,
    fetchJobs: async () => fetchAllJobs(count, fetchImpl),
  };
};
