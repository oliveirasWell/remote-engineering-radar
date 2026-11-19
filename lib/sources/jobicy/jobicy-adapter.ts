import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import {
  JOBICY_API_BASE_URL,
  JOBICY_COUNT,
  JOBICY_INDUSTRIES,
  JOBICY_SOURCE_NAME,
} from './constants';
import {
  normalizeJobicyJob,
  type JobicyJobRecord,
  type JobicyJobsPage,
} from './normalize-jobicy-job';
import { uniqueBySourceJobId } from '../unique-by-source-job-id';

export type JobicyAdapterOptions = {
  fetch?: typeof fetch;
  count?: number;
};

const isJobRecord = (value: unknown): value is JobicyJobRecord =>
  Boolean(value && typeof value === 'object');

const buildJobsUrl = (count: number, industry: string): string => {
  const url = new URL(JOBICY_API_BASE_URL);
  url.searchParams.set('count', String(count));
  url.searchParams.set('industry', industry);
  return url.toString();
};

const fetchIndustryJobs = async (
  count: number,
  industry: string,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const response = await fetchWithRetry(
    buildJobsUrl(count, industry),
    fetchImpl,
  );

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

  return (payload as JobicyJobsPage & { jobs: unknown[] }).jobs
    .filter(isJobRecord)
    .flatMap((record) => normalizeJobicyJob(record) ?? []);
};

// Sequential on purpose: the feed is small and Jobicy rate-limits bursts.
const fetchAllJobs = async (
  count: number,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const jobs: NormalizedJob[] = [];
  for (const industry of JOBICY_INDUSTRIES) {
    jobs.push(...(await fetchIndustryJobs(count, industry, fetchImpl)));
  }
  return uniqueBySourceJobId(jobs);
};

export const createJobicyAdapter = (
  options: JobicyAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const count = options.count ?? JOBICY_COUNT;

  return {
    name: JOBICY_SOURCE_NAME,
    // The count-limited feed contains recent postings, not every open job.
    fetchJobs: async () => ({
      jobs: await fetchAllJobs(count, fetchImpl),
      complete: false,
    }),
  };
};
