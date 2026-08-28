import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
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

const isJobRecord = (value: unknown): value is AshbyJobRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as AshbyJobRecord;
  return (
    record.isListed === false ||
    (typeof record.id === 'string' &&
      typeof record.title === 'string' &&
      (typeof record.jobUrl === 'string' ||
        typeof record.applyUrl === 'string'))
  );
};

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
): Promise<AshbyJobsPage & { jobs: unknown[] }> => {
  const response = await fetchWithRetry(
    buildBoardUrl(boardName, cursor),
    fetchImpl,
  );

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(`Ashby request failed: ${response.status}`);
  }

  const payload = await readJsonResponse<unknown>(response);
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray((payload as AshbyJobsPage).jobs)
  ) {
    throw new Error('Ashby response has an unexpected shape');
  }

  return payload as AshbyJobsPage & { jobs: unknown[] };
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
    const records = payload.jobs;
    const validRecords = records.filter(isJobRecord);
    if (records.length > 0 && validRecords.length === 0) {
      throw new Error('Ashby response has no valid job records');
    }

    for (const record of validRecords) {
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
