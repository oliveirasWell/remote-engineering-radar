import type { NormalizedJob } from '../types';
import {
  QUAVE_COMPANY_NAME,
  QUAVE_COMPANY_WEBSITE_URL,
  QUAVE_SOURCE_NAME,
} from './constants';

export type QuaveIssue = {
  number?: unknown;
  title?: unknown;
  html_url?: unknown;
  created_at?: unknown;
  labels?: unknown;
  body?: unknown;
  pull_request?: unknown;
};

const asString = (value: unknown): string | undefined => {
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

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * quavedev/join titles follow `<Role> at Quave - <details>`.
 * The company is always Quave; the role is everything before the first
 * " at ". Issues that do not mention Quave after the separator are skipped
 * rather than guessed, so deduplication never invents a company.
 */
const splitTitle = (rawTitle: string): { title: string } | null => {
  const index = rawTitle.toLowerCase().indexOf(' at ');
  if (index <= 0) {
    return null;
  }

  const title = asString(rawTitle.slice(0, index));
  const remainder = asString(rawTitle.slice(index + 4));
  return !title || !remainder || !/quave/i.test(remainder) ? null : { title };
};

const readSeniority = (title: string): string | undefined => {
  if (/\bsenior\b|\bsr\.?\b/i.test(title)) {
    return 'senior';
  }

  return /\b(tech lead|lead|expert|staff|principal)\b/i.test(title)
    ? 'staff'
    : undefined;
};

export const normalizeQuaveIssue = (
  issue: QuaveIssue,
): NormalizedJob | null => {
  if (issue.pull_request) {
    return null;
  }

  const sourceJobId =
    typeof issue.number === 'number' && Number.isFinite(issue.number)
      ? String(issue.number)
      : undefined;
  const rawTitle = asString(issue.title);
  const url = asString(issue.html_url);
  if (!sourceJobId || !rawTitle || !url) {
    return null;
  }

  const parts = splitTitle(rawTitle);
  if (!parts) {
    return null;
  }

  return {
    source: QUAVE_SOURCE_NAME,
    sourceJobId,
    company: {
      name: QUAVE_COMPANY_NAME,
      websiteUrl: QUAVE_COMPANY_WEBSITE_URL,
    },
    title: parts.title,
    url,
    // Canonical "Remote": resolveJobCountries drops it instead of minting a
    // "fully-remote" country facet, and ingestion requires a remote policy.
    location: 'Remote',
    remotePolicy: 'remote',
    description: asString(issue.body),
    technologies: [],
    seniority: readSeniority(parts.title),
    postedAt: readPostedAt(issue.created_at),
  };
};
