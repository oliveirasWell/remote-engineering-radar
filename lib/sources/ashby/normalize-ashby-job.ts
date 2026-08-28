import { stripHtml } from '../strip-html';
import type { NormalizedJob } from '../types';
import { isSafeExternalUrl } from '../../urls/external-url';
import { ASHBY_SOURCE_NAME } from './constants';

export type AshbyJobRecord = {
  id?: unknown;
  title?: unknown;
  jobUrl?: unknown;
  applyUrl?: unknown;
  location?: unknown;
  isRemote?: unknown;
  workplaceType?: unknown;
  descriptionHtml?: unknown;
  descriptionPlain?: unknown;
  publishedAt?: unknown;
  isListed?: unknown;
};

export type AshbyJobsPage = {
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

const readRemotePolicy = (record: AshbyJobRecord): string | undefined => {
  if (record.isRemote === true) {
    return 'remote';
  }

  const workplaceType = asString(record.workplaceType)?.toLowerCase();
  if (!workplaceType) {
    return undefined;
  }

  if (workplaceType === 'remote') {
    return 'remote';
  }

  if (workplaceType === 'hybrid') {
    return 'hybrid';
  }

  if (workplaceType === 'onsite' || workplaceType === 'office') {
    return 'onsite';
  }

  return workplaceType;
};

const readPostedAt = (record: AshbyJobRecord): Date | undefined => {
  const raw = asString(record.publishedAt);
  if (!raw) {
    return undefined;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const readDescription = (record: AshbyJobRecord): string | undefined => {
  const plain = asString(record.descriptionPlain);
  if (plain) {
    return plain;
  }

  const html = asString(record.descriptionHtml);
  return html ? stripHtml(html) : undefined;
};

export const normalizeAshbyJob = (
  record: AshbyJobRecord,
  boardName: string,
): NormalizedJob | null => {
  if (record.isListed === false) {
    return null;
  }

  const sourceJobId = asString(record.id);
  const title = asString(record.title);
  const url = asString(record.jobUrl) ?? asString(record.applyUrl);

  if (!sourceJobId || !title || !url || !isSafeExternalUrl(url)) {
    return null;
  }

  return {
    source: ASHBY_SOURCE_NAME,
    sourceJobId,
    company: {
      name: boardName,
    },
    title,
    url,
    location: asString(record.location),
    remotePolicy: readRemotePolicy(record),
    description: readDescription(record),
    technologies: [],
    postedAt: readPostedAt(record),
  };
};
