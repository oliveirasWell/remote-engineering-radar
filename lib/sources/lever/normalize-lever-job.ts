import type { NormalizedJob } from '../types';
import { isSafeExternalUrl } from '../../urls/external-url';
import { LEVER_SOURCE_NAME } from './constants';

export type LeverJobRecord = {
  id?: unknown;
  text?: unknown;
  hostedUrl?: unknown;
  applyUrl?: unknown;
  workplaceType?: unknown;
  country?: unknown;
  categories?: {
    location?: unknown;
    allLocations?: unknown;
  };
  descriptionPlain?: unknown;
  createdAt?: unknown;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readCountries = (record: LeverJobRecord): string[] => {
  const countries = new Set<string>();
  const topLevel = asString(record.country);
  if (topLevel) {
    countries.add(topLevel);
  }

  const location = asString(record.categories?.location);
  if (location) {
    countries.add(location);
  }

  if (Array.isArray(record.categories?.allLocations)) {
    for (const entry of record.categories.allLocations) {
      const name = asString(entry);
      if (name) {
        countries.add(name);
      }
    }
  }

  return [...countries];
};

const readPostedAt = (value: unknown): Date | undefined => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return new Date(value);
};

export const normalizeLeverJob = (
  record: LeverJobRecord,
  boardSlug: string,
): NormalizedJob | null => {
  if (asString(record.workplaceType)?.toLowerCase() !== 'remote') {
    return null;
  }

  const sourceJobId = asString(record.id);
  const title = asString(record.text);
  const url = asString(record.hostedUrl) ?? asString(record.applyUrl);
  const countries = readCountries(record);

  if (!sourceJobId || !title || !url || !isSafeExternalUrl(url)) {
    return null;
  }

  return {
    source: LEVER_SOURCE_NAME,
    sourceJobId: `${boardSlug}:${sourceJobId}`,
    company: {
      name: boardSlug,
    },
    title,
    url,
    location: countries.length > 0 ? countries.join(', ') : 'Remote',
    remotePolicy: 'remote',
    description: asString(record.descriptionPlain),
    technologies: [],
    countries,
    postedAt: readPostedAt(record.createdAt),
  };
};
