import {
  JOB_REMOTE_POLICIES,
  JOB_SENIORITY_LEVELS,
  TECHNOLOGY_NAMES,
} from '@/lib/classification/constants';
import type { JobFilters } from '@/lib/report/get-jobs-page-data';
import { parseCountryFilter } from '@/lib/report/parse-country-filter';
import { JOBS_PAGE_LIMIT } from './constants';

export type JobsSearchParams = {
  technology?: string | string[];
  seniority?: string | string[];
  remote?: string | string[];
  country?: string | string[];
  minimumScore?: string | string[];
};

const MAX_SCORE = 100;

/**
 * Each distinct filter value is its own `use cache` key and therefore its own
 * database read, so a value is only accepted when it names a known option.
 */
const matchOption = <T extends string>(
  options: readonly T[],
  value: string | string[] | undefined,
): T | undefined => {
  const raw =
    typeof value === 'string' ? value.trim().toLowerCase() : undefined;
  return raw
    ? options.find((option) => option.toLowerCase() === raw)
    : undefined;
};

export const readMinimumScore = (
  value: string | string[] | undefined,
): number | undefined => {
  const raw = typeof value === 'string' ? value.trim() : undefined;
  if (!raw || !/^\d{1,3}$/.test(raw)) {
    return undefined;
  }
  const parsed = Number(raw);
  return parsed <= MAX_SCORE ? parsed : undefined;
};

export const parseJobFilters = (params: JobsSearchParams): JobFilters => ({
  technology: matchOption(TECHNOLOGY_NAMES, params.technology),
  seniority: matchOption(JOB_SENIORITY_LEVELS, params.seniority),
  remote: matchOption(JOB_REMOTE_POLICIES, params.remote),
  country: parseCountryFilter(params.country),
  minimumScore: readMinimumScore(params.minimumScore),
  limit: JOBS_PAGE_LIMIT,
});
