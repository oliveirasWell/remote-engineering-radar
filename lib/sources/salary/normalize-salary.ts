import type { JobSalary, SalaryPeriod } from '../types';
import {
  DEFAULT_SALARY_PERIOD,
  SALARY_CURRENCY_PATTERN,
  SALARY_PERIODS,
} from './constants';

export type SalaryColumns = {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
};

export const toSalaryColumns = (salary?: JobSalary): SalaryColumns => ({
  salaryMin: salary?.min ?? null,
  salaryMax: salary?.max ?? null,
  salaryCurrency: salary?.currency ?? null,
  salaryPeriod: salary?.period ?? null,
});

const readSalaryAmount = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
};

export const readSalaryCurrency = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const currency = value.trim().toUpperCase();
  return SALARY_CURRENCY_PATTERN.test(currency) ? currency : null;
};

export const readSalaryPeriod = (value: unknown): SalaryPeriod => {
  if (typeof value !== 'string') {
    return DEFAULT_SALARY_PERIOD;
  }

  return SALARY_PERIODS[value.trim().toLowerCase()] ?? DEFAULT_SALARY_PERIOD;
};

export const normalizeJobSalary = (input: {
  min?: unknown;
  max?: unknown;
  currency?: unknown;
  period?: unknown;
}): JobSalary | undefined => {
  const min = readSalaryAmount(input.min);
  const max = readSalaryAmount(input.max);

  if (min === null && max === null) {
    return undefined;
  }

  if (min !== null && max !== null && min > max) {
    return undefined;
  }

  return {
    min,
    max,
    currency: readSalaryCurrency(input.currency),
    period: readSalaryPeriod(input.period),
  };
};
