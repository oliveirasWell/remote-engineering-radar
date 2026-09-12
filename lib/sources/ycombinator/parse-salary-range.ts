import {
  DEFAULT_SALARY_PERIOD,
  SALARY_THOUSANDS_MULTIPLIER,
} from '../salary/constants';
import { readSalaryCurrency } from '../salary/normalize-salary';
import type { JobSalary } from '../types';

const SALARY_RANGE_PATTERN =
  /^\$(\d{1,3}(?:,\d{3})+|\d+)(K)?\s*[-–]\s*\$(\d{1,3}(?:,\d{3})+|\d+)(K)?(?:\s+([A-Za-z]{3}))?$/i;

const parseBound = (raw: string, thousandsSuffix?: string): number | null => {
  const amount = Number.parseInt(raw.replaceAll(',', ''), 10);
  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  return thousandsSuffix ? amount * SALARY_THOUSANDS_MULTIPLIER : amount;
};

export const parseSalaryRange = (raw: string): JobSalary | null => {
  const match = SALARY_RANGE_PATTERN.exec(raw.trim());
  if (!match) {
    return null;
  }

  const min = parseBound(match[1] ?? '', match[2]);
  const max = parseBound(match[3] ?? '', match[4]);
  if (min === null || max === null || min > max) {
    return null;
  }

  const currency = match[5] ? readSalaryCurrency(match[5]) : 'USD';
  if (currency === null) {
    return null;
  }

  return {
    min,
    max,
    currency,
    period: DEFAULT_SALARY_PERIOD,
  };
};
