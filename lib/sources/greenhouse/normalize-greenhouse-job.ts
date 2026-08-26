import type { NormalizedJob } from '../types';
import { GREENHOUSE_SOURCE_NAME } from './constants';

export type GreenhouseJobRecord = {
  id?: unknown;
  title?: unknown;
  absolute_url?: unknown;
  company_name?: unknown;
  location?: unknown;
  content?: unknown;
  first_published?: unknown;
  updated_at?: unknown;
};

export type GreenhouseJobsPage = {
  jobs?: unknown;
  meta?: {
    total?: unknown;
  };
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumberId = (value: unknown): string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
};

const decodeBasicEntities = (value: string): string =>
  value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"');

export const stripHtml = (value: string): string =>
  decodeBasicEntities(value)
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();

const readLocation = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  return asString((value as { name?: unknown }).name);
};

const readPostedAt = (record: GreenhouseJobRecord): Date | undefined => {
  const raw = asString(record.first_published) ?? asString(record.updated_at);
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const normalizeGreenhouseJob = (
  record: GreenhouseJobRecord,
  boardToken: string,
): NormalizedJob | null => {
  const sourceJobId = asNumberId(record.id);
  const title = asString(record.title);
  const url = asString(record.absolute_url);

  if (!sourceJobId || !title || !url) {
    return null;
  }

  const companyName =
    asString(record.company_name) ?? boardToken.replaceAll('-', ' ');
  const descriptionRaw = asString(record.content);
  const description = descriptionRaw ? stripHtml(descriptionRaw) : undefined;

  return {
    source: GREENHOUSE_SOURCE_NAME,
    sourceJobId,
    company: {
      name: companyName,
    },
    title,
    url,
    location: readLocation(record.location),
    description,
    technologies: [],
    postedAt: readPostedAt(record),
  };
};
