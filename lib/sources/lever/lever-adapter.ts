import type { JobSource, NormalizedJob } from '../types';
import { boardFailure } from '../board-failure';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import { LEVER_API_BASE_URL, LEVER_SOURCE_NAME } from './constants';
import { normalizeLeverJob, type LeverJobRecord } from './normalize-lever-job';

export type LeverAdapterOptions = {
  boardSlugs: string[];
  companyNamesByBoard?: Readonly<Record<string, string>>;
  logFailures?: boolean;
  fetch?: typeof fetch;
};

const isJobRecord = (value: unknown): value is LeverJobRecord =>
  Boolean(value && typeof value === 'object' && 'id' in value);

const buildBoardUrl = (boardSlug: string): string =>
  `${LEVER_API_BASE_URL}/${encodeURIComponent(boardSlug)}?mode=json`;

const fetchBoardJobs = async (
  boardSlug: string,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const response = await fetchWithRetry(buildBoardUrl(boardSlug), fetchImpl);

  if (!response.ok) {
    await discardResponse(response);
    throw Object.assign(
      new Error(`Lever request failed for ${boardSlug}: ${response.status}`),
      {
        status: response.status,
      },
    );
  }

  const payload = await readJsonResponse<unknown>(response);
  if (!Array.isArray(payload)) {
    throw new Error(`Lever response has an unexpected shape for ${boardSlug}`);
  }

  const records = payload.filter(isJobRecord);
  if (payload.length > 0 && records.length === 0) {
    throw new Error(`Lever response has no valid job records for ${boardSlug}`);
  }

  return records.flatMap(
    (record) => normalizeLeverJob(record, boardSlug) ?? [],
  );
};

export const createLeverAdapter = (options: LeverAdapterOptions): JobSource => {
  const fetchImpl = options.fetch ?? fetch;

  return {
    name: LEVER_SOURCE_NAME,
    fetchJobs: async () => {
      const jobs: NormalizedJob[] = [];
      const failedBoards = [];

      for (const boardSlug of options.boardSlugs) {
        try {
          jobs.push(
            ...(await fetchBoardJobs(boardSlug, fetchImpl)).map((job) => ({
              ...job,
              company: {
                ...job.company,
                name:
                  options.companyNamesByBoard?.[boardSlug] ?? job.company.name,
              },
            })),
          );
        } catch (error) {
          const failure = boardFailure(boardSlug, error);
          failedBoards.push(failure);
          if (options.logFailures !== false) {
            console.error(
              `Source ${LEVER_SOURCE_NAME} board ${boardSlug} failed: ${failure.status ?? failure.error}`,
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
