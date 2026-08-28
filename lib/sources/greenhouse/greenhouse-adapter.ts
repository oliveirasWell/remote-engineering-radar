import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
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

const isJobRecord = (value: unknown): value is GreenhouseJobRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as GreenhouseJobRecord;
  return (
    (typeof record.id === 'string' || typeof record.id === 'number') &&
    typeof record.title === 'string' &&
    typeof record.absolute_url === 'string'
  );
};

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
): Promise<GreenhouseJobsPage & { jobs: unknown[] }> => {
  const response = await fetchWithRetry(
    buildJobsUrl(boardToken, page, jobsPerPage),
    fetchImpl,
  );

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(
      `Greenhouse request failed (page ${page}): ${response.status}`,
    );
  }

  const payload = await readJsonResponse<unknown>(response);
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as GreenhouseJobsPage).jobs)
  ) {
    throw new Error(
      `Greenhouse response has an unexpected shape (page ${page})`,
    );
  }

  return payload as GreenhouseJobsPage & { jobs: unknown[] };
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
    const records = payload.jobs;

    if (records.length === 0) {
      break;
    }

    const validRecords = records.filter(isJobRecord);
    if (validRecords.length === 0) {
      throw new Error(
        `Greenhouse response has no valid job records (page ${page})`,
      );
    }

    for (const record of validRecords) {
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

  if (page > 50) {
    throw new Error('Greenhouse pagination limit reached');
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
