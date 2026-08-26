import type { JobSource, NormalizedJob } from '../types';
import {
  GREENHOUSE_API_BASE_URL,
  GREENHOUSE_JOBS_PER_PAGE,
  GREENHOUSE_SOURCE_NAME,
} from './constants';
import {
  normalizeGreenhouseJob,
  type GreenhouseJobRecord,
  type GreenhouseJobsPage,
} from './normalize-greenhouse-job';

export type GreenhouseAdapterOptions = {
  boardTokens: string[];
  fetch?: typeof fetch;
  jobsPerPage?: number;
};

const isJobRecord = (value: unknown): value is GreenhouseJobRecord =>
  Boolean(value) && typeof value === 'object';

const readTotal = (page: GreenhouseJobsPage): number | undefined => {
  const total = page.meta?.total;
  return typeof total === 'number' && Number.isFinite(total)
    ? total
    : undefined;
};

const buildJobsUrl = (
  boardToken: string,
  page: number,
  jobsPerPage: number,
): string => {
  const url = new URL(
    `${GREENHOUSE_API_BASE_URL}/${encodeURIComponent(boardToken)}/jobs`,
  );
  url.searchParams.set('content', 'true');
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(jobsPerPage));
  return url.toString();
};

const fetchJobsPage = async (
  boardToken: string,
  page: number,
  jobsPerPage: number,
  fetchImpl: typeof fetch,
): Promise<GreenhouseJobsPage> => {
  const response = await fetchImpl(buildJobsUrl(boardToken, page, jobsPerPage));

  if (!response.ok) {
    throw new Error(
      `Greenhouse request failed for board "${boardToken}" (page ${page}): ${response.status}`,
    );
  }

  return (await response.json()) as GreenhouseJobsPage;
};

const fetchBoardJobs = async (
  boardToken: string,
  jobsPerPage: number,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const normalized: NormalizedJob[] = [];
  let page = 1;

  while (page <= 50) {
    const payload = await fetchJobsPage(
      boardToken,
      page,
      jobsPerPage,
      fetchImpl,
    );
    const records = Array.isArray(payload.jobs) ? payload.jobs : [];

    if (records.length === 0) {
      break;
    }

    for (const record of records) {
      if (!isJobRecord(record)) {
        continue;
      }

      const job = normalizeGreenhouseJob(record, boardToken);
      if (job) {
        normalized.push(job);
      }
    }

    const total = readTotal(payload);
    if (total !== undefined && normalized.length >= total) {
      break;
    }

    if (records.length < jobsPerPage) {
      break;
    }

    page += 1;
  }

  return normalized;
};

export const createGreenhouseAdapter = (
  options: GreenhouseAdapterOptions,
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const jobsPerPage = options.jobsPerPage ?? GREENHOUSE_JOBS_PER_PAGE;

  return {
    name: GREENHOUSE_SOURCE_NAME,
    fetchJobs: async () => {
      const jobs: NormalizedJob[] = [];

      for (const boardToken of options.boardTokens) {
        const boardJobs = await fetchBoardJobs(
          boardToken,
          jobsPerPage,
          fetchImpl,
        );
        jobs.push(...boardJobs);
      }

      return jobs;
    },
  };
};
