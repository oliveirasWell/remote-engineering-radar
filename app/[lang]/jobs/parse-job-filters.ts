import {
  JOB_REMOTE_POLICIES,
  JOB_SENIORITY_LEVELS,
  TECHNOLOGY_NAMES,
} from '@/lib/classification/constants';
import type { JobFilters } from '@/lib/report/get-jobs-page-data';
import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { parseCountryFilter } from '@/lib/report/parse-country-filter';
import { parseFocusFilter } from '@/lib/report/parse-focus-filter';
import { JOBS_PAGE_LIMIT } from './constants';

export type JobsSearchParams = {
  technology?: string | string[];
  seniority?: string | string[];
  remote?: string | string[];
  country?: string | string[];
  focus?: string | string[];
  company?: string | string[];
  minimumScore?: string | string[];
};

const MAX_SCORE = 100;

const COMPANY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_COMPANY_SLUG_LENGTH = 80;

/** Slug-shaped only; an unknown company yields an empty list, not an error. */
const readCompany = (
  value: string | string[] | undefined,
): string | undefined => {
  const raw =
    typeof value === 'string' ? value.trim().toLowerCase() : undefined;
  return raw &&
    raw.length <= MAX_COMPANY_SLUG_LENGTH &&
    COMPANY_SLUG_PATTERN.test(raw)
    ? raw
    : undefined;
};

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

const readMinimumScore = (
  value: string | string[] | undefined,
): number | undefined => {
  const raw = typeof value === 'string' ? value.trim() : undefined;
  if (!raw || !/^\d{1,3}$/.test(raw)) {
    return undefined;
  }
  const parsed = Number(raw);
  return parsed > 0 && parsed <= MAX_SCORE ? parsed : undefined;
};

export const parseJobFilters = (params: JobsSearchParams): JobFilters => ({
  technology: matchOption(TECHNOLOGY_NAMES, params.technology),
  seniority: matchOption(JOB_SENIORITY_LEVELS, params.seniority),
  remote: matchOption(
    JOB_REMOTE_POLICIES.filter((policy) => policy !== REMOTE_POLICY_REMOTE),
    params.remote,
  ),
  country: parseCountryFilter(params.country),
  focus: parseFocusFilter(params.focus),
  company: readCompany(params.company),
  minimumScore: readMinimumScore(params.minimumScore),
  limit: JOBS_PAGE_LIMIT,
});
