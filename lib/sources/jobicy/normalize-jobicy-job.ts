import type { NormalizedJob } from '../types';
import { stripHtml } from '../strip-html';
import { isSafeExternalUrl } from '../../urls/external-url';
import {
  JOBICY_ANY_LEVEL,
  JOBICY_ANYWHERE_GEO,
  JOBICY_SOURCE_NAME,
} from './constants';

export type JobicyJobRecord = {
  id?: unknown;
  jobTitle?: unknown;
  companyName?: unknown;
  url?: unknown;
  jobDescription?: unknown;
  jobGeo?: unknown;
  jobLevel?: unknown;
  pubDate?: unknown;
};

export type JobicyJobsPage = {
  jobs?: unknown;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readPostedAt = (value: unknown): Date | undefined => {
  const raw = asString(value);
  if (!raw) {
    return undefined;
  }

  const postedAt = new Date(raw);
  return Number.isNaN(postedAt.getTime()) ? undefined : postedAt;
};

const readDescription = (value: unknown): string | undefined => {
  const html = asString(value);
  return html ? stripHtml(html) : undefined;
};

/** `jobGeo` holds a comma-separated list, e.g. "Germany,  Ireland,  UK". */
const readCountries = (geo: string | undefined): string[] => {
  if (!geo || geo === JOBICY_ANYWHERE_GEO) {
    return [];
  }

  return geo
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry !== JOBICY_ANYWHERE_GEO);
};

export const normalizeJobicyJob = (
  record: JobicyJobRecord,
): NormalizedJob | null => {
  const sourceJobId = asString(record.id);
  const title = asString(record.jobTitle);
  const url = asString(record.url);
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

  const geo = asString(record.jobGeo);
  const level = asString(record.jobLevel);

  return {
    source: JOBICY_SOURCE_NAME,
    sourceJobId,
    company: { name: companyName },
    title,
    url,
    location: geo,
    remotePolicy: 'remote',
    description: readDescription(record.jobDescription),
    technologies: [],
    countries: readCountries(geo),
    seniority: level === JOBICY_ANY_LEVEL ? undefined : level,
    postedAt: readPostedAt(record.pubDate),
  };
};
