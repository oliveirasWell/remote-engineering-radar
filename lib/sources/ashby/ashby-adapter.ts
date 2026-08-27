import type { JobSource, NormalizedJob } from '../types';
import { fetchWithRetry, readJsonResponse } from '../fetch-json';
import { ASHBY_API_BASE_URL, ASHBY_SOURCE_NAME } from './constants';
import {
  normalizeAshbyJob,
  type AshbyJobRecord,
  type AshbyJobsPage,
} from './normalize-ashby-job';

export type AshbyAdapterOptions = {
  boardNames: string[];
  fetch?: typeof fetch;
};

const isJobRecord = (value: unknown): value is AshbyJobRecord =>
  Boolean(value) && typeof value === 'object';

const asCursor = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildBoardUrl = (boardName: string, cursor?: string): string => {
  const url = new URL(`${ASHBY_API_BASE_URL}/${encodeURIComponent(boardName)}`);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  return url.toString();
};

const fetchJobsPage = async (
  boardName: string,
  cursor: string | undefined,
  fetchImpl: typeof fetch,
): Promise<AshbyJobsPage> => {
  const response = await fetchWithRetry(
    buildBoardUrl(boardName, cursor),
    fetchImpl,
  );

  if (!response.ok) {
    throw new Error(`Ashby request failed: ${response.status}`);
  }

  return readJsonResponse<AshbyJobsPage>(response);
};

const fetchBoardJobs = async (
  boardName: string,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const normalized: NormalizedJob[] = [];
  let cursor: string | undefined;
  let pageCount = 0;

  while (pageCount < 50) {
    const payload = await fetchJobsPage(boardName, cursor, fetchImpl);
    const records = Array.isArray(payload.jobs) ? payload.jobs : [];

    for (const record of records) {
      if (!isJobRecord(record)) {
        continue;
      }

      const job = normalizeAshbyJob(record, boardName);
      if (job) {
        normalized.push(job);
      }
    }

    const nextCursor = asCursor(payload.nextCursor);
    if (!nextCursor || nextCursor === cursor) {
      break;
    }

    cursor = nextCursor;
    pageCount += 1;
  }

  if (pageCount === 50) {
    throw new Error('Ashby pagination limit reached');
  }

  return normalized;
};

export const createAshbyAdapter = (options: AshbyAdapterOptions): JobSource => {
  const fetchImpl = options.fetch ?? fetch;

  return {
    name: ASHBY_SOURCE_NAME,
    fetchJobs: async () => {
      const jobs: NormalizedJob[] = [];

      for (const boardName of options.boardNames) {
        const boardJobs = await fetchBoardJobs(boardName, fetchImpl);
        jobs.push(...boardJobs);
      }

      return jobs;
    },
  };
};
