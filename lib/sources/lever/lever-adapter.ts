import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import { LEVER_API_BASE_URL, LEVER_SOURCE_NAME } from './constants';
import { normalizeLeverJob, type LeverJobRecord } from './normalize-lever-job';

export type LeverAdapterOptions = {
  boardSlugs: string[];
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
    throw new Error(
      `Lever request failed for ${boardSlug}: ${response.status}`,
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

  const normalized: NormalizedJob[] = [];
  for (const record of records) {
    const job = normalizeLeverJob(record, boardSlug);
    if (job) {
      normalized.push(job);
    }
  }

  return normalized;
};

export const createLeverAdapter = (options: LeverAdapterOptions): JobSource => {
  const fetchImpl = options.fetch ?? fetch;

  return {
    name: LEVER_SOURCE_NAME,
    fetchJobs: async () => {
      const jobs: NormalizedJob[] = [];

      for (const boardSlug of options.boardSlugs) {
        const boardJobs = await fetchBoardJobs(boardSlug, fetchImpl);
        jobs.push(...boardJobs);
      }

      return { jobs, complete: true };
    },
  };
};
