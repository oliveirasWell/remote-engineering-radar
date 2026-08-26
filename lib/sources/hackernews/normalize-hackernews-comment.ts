import { stripHtml } from '../strip-html';
import type { NormalizedJob } from '../types';
import { HACKER_NEWS_SOURCE_NAME } from './constants';

export type HackerNewsComment = {
  objectID?: unknown;
  comment_text?: unknown;
  parent_id?: unknown;
  created_at?: unknown;
  story_id?: unknown;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const decodeHnEntities = (value: string): string =>
  value
    .replaceAll('&#x2F;', '/')
    .replaceAll('&#x27;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const extractUrl = (html: string): string | undefined => {
  const hrefMatch = html.match(/href="(https?:\/\/[^"]+)"/i);
  if (hrefMatch?.[1]) {
    return hrefMatch[1];
  }

  const plainMatch = html.match(/https?:\/\/[^\s<]+/i);
  return plainMatch?.[0]?.replace(/[),.;]+$/, '');
};

const detectRemotePolicy = (
  header: string,
  body: string,
): string | undefined => {
  const haystack = `${header} ${body}`.toLowerCase();
  if (/\bremote\b/.test(haystack)) {
    return 'remote';
  }
  if (/\bonsite\b|\bon-site\b/.test(haystack)) {
    return 'onsite';
  }
  if (/\bhybrid\b/.test(haystack)) {
    return 'hybrid';
  }
  return undefined;
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
 * HN hiring posts typically start with:
 * Company | Role | Location | REMOTE | ...
 */
export const normalizeHackerNewsComment = (
  comment: HackerNewsComment,
): NormalizedJob | null => {
  const sourceJobId = asString(comment.objectID);
  const rawHtml = asString(comment.comment_text);
  if (!sourceJobId || !rawHtml) {
    return null;
  }

  const decodedHtml = decodeHnEntities(rawHtml);
  const plain = stripHtml(decodedHtml);
  if (!plain) {
    return null;
  }

  const header = plain.split(/\s{2,}|\n/)[0]?.trim() ?? plain;
  const segments = header
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const companyName = segments[0];
  const title = segments[1];
  const location = segments.slice(2).find((segment) => {
    const lower = segment.toLowerCase();
    return (
      !lower.startsWith('$') &&
      !lower.includes('full-time') &&
      !lower.includes('visa')
    );
  });

  if (!companyName || !title) {
    return null;
  }

  const url =
    extractUrl(decodedHtml) ??
    `https://news.ycombinator.com/item?id=${sourceJobId}`;

  return {
    source: HACKER_NEWS_SOURCE_NAME,
    sourceJobId,
    company: {
      name: companyName,
    },
    title,
    url,
    location,
    remotePolicy: detectRemotePolicy(header, plain),
    description: plain,
    technologies: [],
    postedAt: readPostedAt(comment.created_at),
  };
};
