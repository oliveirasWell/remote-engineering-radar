import type { JobSource, NormalizedJob } from '../types';
import { boardFailure } from '../board-failure';
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
  companyNamesByBoard?: Readonly<Record<string, string>>;
  logFailures?: boolean;
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
    throw Object.assign(new Error(`Ashby request failed: ${response.status}`), {
      status: response.status,
    });
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

/** One page per call, recursing on the cursor the page hands back. */
const fetchBoardJobs = async (
  boardName: string,
  fetchImpl: typeof fetch,
  cursor?: string,
  pageCount = 0,
): Promise<NormalizedJob[]> => {
  if (pageCount === 50) {
    throw new Error('Ashby pagination limit reached');
  }

  const payload = await fetchJobsPage(boardName, cursor, fetchImpl);
  const records = payload.jobs;
  const validRecords = records.filter(isJobRecord);
  if (records.length > 0 && validRecords.length === 0) {
    throw new Error('Ashby response has no valid job records');
  }

  const jobs = validRecords.flatMap(
    (record) => normalizeAshbyJob(record, boardName) ?? [],
  );

  const nextCursor = asCursor(payload.nextCursor);
  if (!nextCursor) {
    return jobs;
  }
  if (nextCursor === cursor) {
    throw new Error('Ashby pagination limit reached');
  }

  return [
    ...jobs,
    ...(await fetchBoardJobs(boardName, fetchImpl, nextCursor, pageCount + 1)),
  ];
};

export const createAshbyAdapter = (options: AshbyAdapterOptions): JobSource => {
  const fetchImpl = options.fetch ?? fetch;

  return {
    name: ASHBY_SOURCE_NAME,
    fetchJobs: async () => {
      const jobs: NormalizedJob[] = [];
      const failedBoards = [];

      for (const boardName of options.boardNames) {
        try {
          jobs.push(
            ...(await fetchBoardJobs(boardName, fetchImpl)).map((job) => ({
              ...job,
              company: {
                ...job.company,
                name:
                  options.companyNamesByBoard?.[boardName] ?? job.company.name,
              },
            })),
          );
        } catch (error) {
          const failure = boardFailure(boardName, error);
          failedBoards.push(failure);
          if (options.logFailures !== false) {
            console.error(
              `Source ${ASHBY_SOURCE_NAME} board ${boardName} failed: ${failure.status ?? failure.error}`,
            );
          }
        }
      }

      return {
        jobs,
        complete: failedBoards.length === 0,
        ...(failedBoards.length > 0 ? { failedBoards } : {}),
      };
    },
  };
};
