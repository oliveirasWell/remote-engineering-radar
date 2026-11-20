import { foldText } from '../../text/fold-text/fold-text';
import { isSafeExternalUrl } from '../../urls/external-url';
import { stripHtml } from '../strip-html';
import type { NormalizedJob } from '../types';
import { JOOBLE_SOURCE_NAME } from './constants';

export type JoobleJobRecord = {
  id?: unknown;
  title?: unknown;
  location?: unknown;
  snippet?: unknown;
  company?: unknown;
  link?: unknown;
  updated?: unknown;
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

/** Remote only when the title or location says so; a snippet perk does not. */
const REMOTE_PATTERN =
  /\bremot[oa]s?\b|\bremote\b|\bhome office\b|\bteletrabalho\b/;
const COUNTRY_ONLY = new Set(['brasil', 'brazil']);
const BRAZIL = 'Brazil';

/** `updated` has no zone ("2026-11-19T10:00:00.0000000"); Jooble means UTC. */
const readUpdated = (value: unknown): Date | undefined => {
  const raw = asString(value);
  if (!raw) {
    return undefined;
  }
  const date = new Date(/(?:[zZ]|[+-]\d\d:?\d\d)$/.test(raw) ? raw : `${raw}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const normalizeJoobleJob = (
  record: JoobleJobRecord,
): NormalizedJob | null => {
  const sourceJobId = asString(record.id);
  const title = asString(record.title);
  const url = asString(record.link);
  const companyName = asString(record.company);
  if (
    !sourceJobId ||
    !title ||
    !url ||
    !companyName ||
    !isSafeExternalUrl(url)
  ) {
    return null;
  }

  const location = asString(record.location);
  const remote = REMOTE_PATTERN.test(foldText(`${title} ${location ?? ''}`));
  // "Brasil" alone names no office and no work model: skip rather than guess.
  if (!remote && (!location || COUNTRY_ONLY.has(foldText(location)))) {
    return null;
  }

  const snippet = asString(record.snippet);
  return {
    source: JOOBLE_SOURCE_NAME,
    sourceJobId,
    company: { name: companyName },
    title,
    url,
    location,
    ...(remote ? { remotePolicy: 'remote' } : {}),
    description: snippet ? stripHtml(snippet) : undefined,
    technologies: [],
    // br.jooble.org only lists Brazilian roles; locations often omit the
    // country ("Joinville, SC"), so the source names it.
    countries: [BRAZIL],
    postedAt: readUpdated(record.updated),
  };
};
