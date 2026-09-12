import { messagesFor, type Locale } from '@/lib/i18n/messages';
import { SALARY_PERIODS } from '@/lib/sources/salary/constants';
import { SALARY_BOUND_SEPARATOR } from './constants';
import type { ReportJobCard } from './types';

export const formatRelativeTime = (
  value: Date | null,
  now = new Date(),
  locale: Locale = 'en',
): string => {
  if (!value) {
    return messagesFor(locale).report.unknownTime;
  }

  const deltaMs = now.getTime() - value.getTime();
  const minutes = Math.max(0, Math.floor(deltaMs / (1000 * 60)));
  const formatter = new Intl.RelativeTimeFormat(locale);
  if (minutes < 60) {
    return formatter.format(-minutes, 'minute');
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return formatter.format(-hours, 'hour');
  }

  const days = Math.floor(hours / 24);
  return formatter.format(-days, 'day');
};

export const formatUpdatedLabel = (
  updatedAt: Date | null,
  locale: Locale = 'en',
): string =>
  messagesFor(locale).report.updated(
    updatedAt
      ? `${updatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC`
      : '—',
  );

const formatSalaryAmount = (
  value: number,
  currency: string | null,
  locale: Locale,
): string => {
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      // Invalid codes throw; ingest already nulls them, but render must not.
    }
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatSalary = (
  {
    salaryMin: min,
    salaryMax: max,
    salaryCurrency: currency,
    salaryPeriod: period,
  }: Pick<
    ReportJobCard,
    'salaryMin' | 'salaryMax' | 'salaryCurrency' | 'salaryPeriod'
  >,
  locale: Locale = 'en',
): string | null => {
  if (min === null && max === null) {
    return null;
  }

  const { jobCard } = messagesFor(locale);
  const amount = (value: number) => formatSalaryAmount(value, currency, locale);
  const range =
    min !== null && max !== null
      ? `${amount(min)} ${SALARY_BOUND_SEPARATOR} ${amount(max)}`
      : min !== null
        ? jobCard.salaryFrom(amount(min))
        : jobCard.salaryUpTo(amount(max!));
  const normalizedPeriod = period ? SALARY_PERIODS[period] : undefined;
  const periodLabel =
    normalizedPeriod === 'month'
      ? jobCard.salaryPeriodMonth
      : normalizedPeriod === 'hour'
        ? jobCard.salaryPeriodHour
        : jobCard.salaryPeriodYear;

  return `${range} ${periodLabel}`;
};
