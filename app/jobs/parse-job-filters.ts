import type { JobFilters } from '@/lib/report/get-jobs-page-data';
import { JOBS_PAGE_LIMIT, MAX_JOB_FILTER_LENGTH } from './constants';

export type JobsSearchParams = {
  technology?: string | string[];
  seniority?: string | string[];
  remote?: string | string[];
  location?: string | string[];
  minimumScore?: string | string[];
};

const MAX_SCORE = 100;

/** A repeated query parameter is ambiguous, so it is dropped rather than guessed. */
export const readFilter = (
  value: string | string[] | undefined,
): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : undefined;
  return trimmed && trimmed.length <= MAX_JOB_FILTER_LENGTH
    ? trimmed
    : undefined;
};

export const readMinimumScore = (
  value: string | string[] | undefined,
): number | undefined => {
  const raw = readFilter(value);
  if (!raw || !/^\d{1,3}$/.test(raw)) {
    return undefined;
  }
  const parsed = Number(raw);
  return parsed <= MAX_SCORE ? parsed : undefined;
};

export const parseJobFilters = (params: JobsSearchParams): JobFilters => ({
  technology: readFilter(params.technology),
  seniority: readFilter(params.seniority),
  remote: readFilter(params.remote),
  location: readFilter(params.location),
  minimumScore: readMinimumScore(params.minimumScore),
  limit: JOBS_PAGE_LIMIT,
});
