import type { NormalizedJob } from '../types';
import { stripHtml } from '../strip-html';
import { isSafeExternalUrl } from '../../urls/external-url';
import { normalizeJobSalary } from '../salary/normalize-salary';
import { HIMALAYAS_SOURCE_NAME } from './constants';

export type HimalayasJobRecord = {
  guid?: unknown;
  title?: unknown;
  companyName?: unknown;
  applicationLink?: unknown;
  description?: unknown;
  locationRestrictions?: unknown;
  seniority?: unknown;
  pubDate?: unknown;
  minSalary?: unknown;
  maxSalary?: unknown;
  salaryPeriod?: unknown;
  currency?: unknown;
};

export type HimalayasJobsPage = {
  jobs?: unknown;
  nextCursor?: unknown;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readStrings = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));
};

const readPostedAt = (value: unknown): Date | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return new Date(value * 1000);
};

const readDescription = (value: unknown): string | undefined => {
  const html = asString(value);
  return html ? stripHtml(html) : undefined;
};

export const normalizeHimalayasJob = (
  record: HimalayasJobRecord,
): NormalizedJob | null => {
  const sourceJobId = asString(record.guid);
  const title = asString(record.title);
  const url = asString(record.applicationLink);
  const companyName = asString(record.companyName);

  if (
    !sourceJobId ||
    !title ||
    !url ||
    !companyName ||
    !isSafeExternalUrl(url)
  ) {
    return null;
  }

  const countries = readStrings(record.locationRestrictions);
  const salary = normalizeJobSalary({
    min: record.minSalary,
    max: record.maxSalary,
    currency: record.currency,
    period: record.salaryPeriod,
  });

  return {
    source: HIMALAYAS_SOURCE_NAME,
    sourceJobId,
    company: { name: companyName },
    title,
    url,
    location: countries.length > 0 ? countries.join(', ') : 'Remote',
    remotePolicy: 'remote',
    description: readDescription(record.description),
    technologies: [],
    countries,
    seniority: readStrings(record.seniority)[0],
    postedAt: readPostedAt(record.pubDate),
    ...(salary ? { salary } : {}),
  };
};
