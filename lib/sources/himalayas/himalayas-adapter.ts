import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import {
  HIMALAYAS_API_BASE_URL,
  HIMALAYAS_MAX_PAGES,
  HIMALAYAS_PAGE_SIZE,
  HIMALAYAS_SOURCE_NAME,
} from './constants';
import {
  normalizeHimalayasJob,
  type HimalayasJobRecord,
  type HimalayasJobsPage,
} from './normalize-himalayas-job';

export type HimalayasAdapterOptions = {
  fetch?: typeof fetch;
  pageSize?: number;
  maxPages?: number;
};

const isJobRecord = (value: unknown): value is HimalayasJobRecord =>
  Boolean(value && typeof value === 'object');

const buildJobsUrl = (pageSize: number, cursor: string | undefined): string => {
  const url = new URL(HIMALAYAS_API_BASE_URL);
  url.searchParams.set('limit', String(pageSize));
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return url.toString();
};

const fetchJobsPage = async (
  page: number,
  pageSize: number,
  cursor: string | undefined,
  fetchImpl: typeof fetch,
): Promise<HimalayasJobsPage & { jobs: unknown[] }> => {
  const response = await fetchWithRetry(
    buildJobsUrl(pageSize, cursor),
    fetchImpl,
  );

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(
      `Himalayas request failed (page ${page}): ${response.status}`,
    );
  }

  const payload = await readJsonResponse<unknown>(response);
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as HimalayasJobsPage).jobs)
  ) {
    throw new Error(
      `Himalayas response has an unexpected shape (page ${page})`,
    );
  }

  return payload as HimalayasJobsPage & { jobs: unknown[] };
};

const fetchAllJobs = async (
  pageSize: number,
  maxPages: number,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const normalized: NormalizedJob[] = [];
  let cursor: string | undefined;

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchJobsPage(page, pageSize, cursor, fetchImpl);
    const records = payload.jobs.filter(isJobRecord);

    if (records.length === 0) {
      break;
    }

    for (const record of records) {
      const job = normalizeHimalayasJob(record);
      if (job) {
        normalized.push(job);
      }
    }

    cursor =
      typeof payload.nextCursor === 'string' && payload.nextCursor.length > 0
        ? payload.nextCursor
        : undefined;
    if (!cursor) {
      break;
    }
  }

  return normalized;
};

export const createHimalayasAdapter = (
  options: HimalayasAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const pageSize = options.pageSize ?? HIMALAYAS_PAGE_SIZE;
  const maxPages = options.maxPages ?? HIMALAYAS_MAX_PAGES;

  return {
    name: HIMALAYAS_SOURCE_NAME,
    fetchJobs: async () => fetchAllJobs(pageSize, maxPages, fetchImpl),
  };
};
