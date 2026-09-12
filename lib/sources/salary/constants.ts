import type { SalaryPeriod } from '../types';

export const SALARY_PERIODS: Readonly<Record<string, SalaryPeriod>> = {
  annual: 'year',
  yearly: 'year',
  year: 'year',
  monthly: 'month',
  month: 'month',
  hourly: 'hour',
  hour: 'hour',
};

export const DEFAULT_SALARY_PERIOD: SalaryPeriod = 'year';
export const SALARY_CURRENCY_PATTERN = /^[A-Z]{3}$/;
export const SALARY_THOUSANDS_MULTIPLIER = 1000;
