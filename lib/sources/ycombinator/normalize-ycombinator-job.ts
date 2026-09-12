import type { NormalizedJob } from '../types';
import { isSafeExternalUrl } from '../../urls/external-url';
import {
  YCOMBINATOR_ENGINEERING_ROLE,
  YCOMBINATOR_SITE_ORIGIN,
  YCOMBINATOR_SOURCE_NAME,
} from './constants';

export type YCombinatorJobRecord = {
  id?: unknown;
  title?: unknown;
  url?: unknown;
  location?: unknown;
  role?: unknown;
  skills?: unknown;
  companyName?: unknown;
  companyUrl?: unknown;
  minExperience?: unknown;
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

const toAbsoluteUrl = (pathOrUrl: string): string | undefined => {
  if (pathOrUrl.startsWith('/')) {
    const absolute = `${YCOMBINATOR_SITE_ORIGIN}${pathOrUrl}`;
    return isSafeExternalUrl(absolute) ? absolute : undefined;
  }

  return isSafeExternalUrl(pathOrUrl) ? pathOrUrl : undefined;
};

const isRemoteLocation = (location: string): boolean =>
  /\bremote\b/i.test(location);

const readSkills = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => Boolean(entry));
};

export const normalizeYCombinatorJob = (
  record: YCombinatorJobRecord,
): NormalizedJob | null => {
  const sourceJobId = asString(record.id);
  const title = asString(record.title);
  const companyName = asString(record.companyName);
  const location = asString(record.location);
  const role = asString(record.role);
  const pathOrUrl = asString(record.url);
  const url = pathOrUrl ? toAbsoluteUrl(pathOrUrl) : undefined;

  if (
    !sourceJobId ||
    !title ||
    !companyName ||
    !url ||
    !location ||
    role !== YCOMBINATOR_ENGINEERING_ROLE ||
    !isRemoteLocation(location)
  ) {
    return null;
  }

  const companyPath = asString(record.companyUrl);
  const websiteUrl = companyPath ? toAbsoluteUrl(companyPath) : undefined;

  return {
    source: YCOMBINATOR_SOURCE_NAME,
    sourceJobId,
    company: {
      name: companyName,
      ...(websiteUrl ? { websiteUrl } : {}),
    },
    title,
    url,
    location,
    remotePolicy: 'remote',
    technologies: readSkills(record.skills),
    seniority: asString(record.minExperience),
  };
};
