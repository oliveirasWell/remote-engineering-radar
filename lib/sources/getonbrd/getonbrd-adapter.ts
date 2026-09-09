import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import {
  GETONBRD_API_BASE_URL,
  GETONBRD_JOBS_PER_PAGE,
  GETONBRD_MAX_PAGES,
  GETONBRD_PROGRAMMING_CATEGORY,
  GETONBRD_SOURCE_NAME,
} from './constants';
import {
  normalizeGetOnBrdJob,
  type GetOnBrdJobRecord,
  type GetOnBrdJobsPage,
} from './normalize-getonbrd-job';

export type GetOnBrdAdapterOptions = {
  fetch?: typeof fetch;
  jobsPerPage?: number;
  maxPages?: number;
};

const isJobRecord = (value: unknown): value is GetOnBrdJobRecord =>
  Boolean(value && typeof value === 'object' && 'id' in value);

const buildJobsUrl = (page: number, jobsPerPage: number): string => {
  const url = new URL(
    `${GETONBRD_API_BASE_URL}/categories/${GETONBRD_PROGRAMMING_CATEGORY}/jobs`,
  );
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(jobsPerPage));
  url.searchParams.append('expand[]', 'company');
  return url.toString();
};

const fetchJobsPage = async (
  page: number,
  jobsPerPage: number,
  fetchImpl: typeof fetch,
): Promise<GetOnBrdJobsPage & { data: unknown[] }> => {
  const response = await fetchWithRetry(
    buildJobsUrl(page, jobsPerPage),
    fetchImpl,
  );

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(
      `GetOnBrd request failed (page ${page}): ${response.status}`,
    );
  }

  const payload = await readJsonResponse<unknown>(response);
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as GetOnBrdJobsPage).data)
  ) {
    throw new Error(`GetOnBrd response has an unexpected shape (page ${page})`);
  }

  return payload as GetOnBrdJobsPage & { data: unknown[] };
};

const fetchAllJobs = async (
  jobsPerPage: number,
  maxPages: number,
  fetchImpl: typeof fetch,
): ReturnType<JobSource['fetchJobs']> => {
  const normalized: NormalizedJob[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchJobsPage(page, jobsPerPage, fetchImpl);
    const records = payload.data.filter(isJobRecord);

    for (const record of records) {
      const job = normalizeGetOnBrdJob(record);
      if (job) {
        normalized.push(job);
      }
    }

    const totalPages =
      typeof payload.meta?.total_pages === 'number'
        ? payload.meta.total_pages
        : undefined;
    if (totalPages !== undefined && page >= totalPages) {
      return { jobs: normalized, complete: true };
    }

    if (payload.data.length < jobsPerPage && totalPages === undefined) {
      return { jobs: normalized, complete: true };
    }
    if (payload.data.length === 0) {
      return { jobs: normalized, complete: false };
    }
  }

  return { jobs: normalized, complete: false };
};

export const createGetOnBrdAdapter = (
  options: GetOnBrdAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const jobsPerPage = options.jobsPerPage ?? GETONBRD_JOBS_PER_PAGE;
  const maxPages = options.maxPages ?? GETONBRD_MAX_PAGES;

  return {
    name: GETONBRD_SOURCE_NAME,
    fetchJobs: async () => fetchAllJobs(jobsPerPage, maxPages, fetchImpl),
  };
};
