import type { NormalizedJob } from '../types';
import { isSafeExternalUrl } from '../../urls/external-url';
import { GETONBRD_SOURCE_NAME } from './constants';

export type GetOnBrdCompanyRecord = {
  data?: {
    attributes?: {
      name?: unknown;
      web?: unknown;
    };
  };
};

export type GetOnBrdJobRecord = {
  id?: unknown;
  attributes?: {
    title?: unknown;
    description?: unknown;
    description_headline?: unknown;
    functions?: unknown;
    remote?: unknown;
    remote_modality?: unknown;
    countries?: unknown;
    published_at?: unknown;
    company?: GetOnBrdCompanyRecord;
  };
  links?: {
    public_url?: unknown;
  };
};

export type GetOnBrdJobsPage = {
  data?: unknown;
  meta?: {
    page?: unknown;
    per_page?: unknown;
    total_pages?: unknown;
  };
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readCountries = (value: unknown): string[] => {
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

const readDescription = (
  record: NonNullable<GetOnBrdJobRecord['attributes']>,
): string | undefined => {
  const parts = [
    asString(record.description_headline),
    asString(record.description),
    asString(record.functions),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join('\n\n') : undefined;
};

const isFullyRemote = (
  record: NonNullable<GetOnBrdJobRecord['attributes']>,
): boolean => {
  if (record.remote !== true) {
    return false;
  }

  const modality = asString(record.remote_modality)?.toLowerCase();
  return modality !== 'hybrid' && modality !== 'onsite';
};

export const normalizeGetOnBrdJob = (
  record: GetOnBrdJobRecord,
): NormalizedJob | null => {
  const attributes = record.attributes;
  if (!attributes || !isFullyRemote(attributes)) {
    return null;
  }

  const sourceJobId = asString(record.id);
  const title = asString(attributes.title);
  const url = asString(record.links?.public_url);
  const companyName = asString(attributes.company?.data?.attributes?.name);

  if (
    !sourceJobId ||
    !title ||
    !url ||
    !companyName ||
    !isSafeExternalUrl(url)
  ) {
    return null;
  }

  const countries = readCountries(attributes.countries);
  const location = countries.length > 0 ? countries.join(', ') : 'Remote';

  return {
    source: GETONBRD_SOURCE_NAME,
    sourceJobId,
    company: {
      name: companyName,
      websiteUrl: asString(attributes.company?.data?.attributes?.web),
    },
    title,
    url,
    location,
    remotePolicy: 'remote',
    description: readDescription(attributes),
    technologies: [],
    countries,
    postedAt: readPostedAt(attributes.published_at),
  };
};
