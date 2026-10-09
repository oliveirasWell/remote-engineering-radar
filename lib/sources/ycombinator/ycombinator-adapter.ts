import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readTextResponse,
} from '../fetch-json';
import {
  YCOMBINATOR_LISTING_PATHS,
  YCOMBINATOR_REQUEST_USER_AGENT,
  YCOMBINATOR_SITE_ORIGIN,
  YCOMBINATOR_SOURCE_NAME,
} from './constants';
import {
  normalizeYCombinatorJob,
  type YCombinatorJobRecord,
} from './normalize-ycombinator-job';

export type YCombinatorAdapterOptions = {
  fetch?: typeof fetch;
  listingPaths?: readonly string[];
};

const DATA_PAGE_PATTERN = /data-page=(["'])([\s\S]*?)\1/;

const decodeHtmlEntities = (value: string): string =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');

const isJobRecord = (value: unknown): value is YCombinatorJobRecord =>
  Boolean(value && typeof value === 'object');

const parseDataPage = (encoded: string): unknown => {
  try {
    return JSON.parse(decodeHtmlEntities(encoded));
  } catch {
    throw new Error('Y Combinator listing page has invalid data-page JSON');
  }
};

export const parseYCombinatorListingHtml = (
  html: string,
): YCombinatorJobRecord[] => {
  const match = DATA_PAGE_PATTERN.exec(html);
  if (!match?.[2]) {
    throw new Error('Y Combinator listing page is missing data-page payload');
  }

  const payload = parseDataPage(match[2]);

  const jobPostings =
    payload &&
    typeof payload === 'object' &&
    (payload as { props?: { jobPostings?: unknown } }).props &&
    typeof (payload as { props: unknown }).props === 'object'
      ? (payload as { props: { jobPostings?: unknown } }).props.jobPostings
      : undefined;

  if (!Array.isArray(jobPostings)) {
    throw new Error('Y Combinator listing page has an unexpected shape');
  }

  return jobPostings.filter(isJobRecord);
};

const fetchListingJobs = async (
  path: string,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const response = await fetchWithRetry(
    `${YCOMBINATOR_SITE_ORIGIN}${path}`,
    fetchImpl,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': YCOMBINATOR_REQUEST_USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(
      `Y Combinator request failed (${path}): ${response.status}`,
    );
  }

  const html = await readTextResponse(response);
  return parseYCombinatorListingHtml(html).flatMap(
    (record) => normalizeYCombinatorJob(record) ?? [],
  );
};

const fetchAllJobs = async (
  listingPaths: readonly string[],
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const byId = new Map<string, NormalizedJob>();

  for (const path of listingPaths) {
    for (const job of await fetchListingJobs(path, fetchImpl)) {
      byId.set(job.sourceJobId, job);
    }
  }

  return [...byId.values()];
};

export const createYCombinatorAdapter = (
  options: YCombinatorAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const listingPaths = options.listingPaths ?? YCOMBINATOR_LISTING_PATHS;

  return {
    name: YCOMBINATOR_SOURCE_NAME,
    // Listing pages expose a capped public snapshot, not every open role.
    fetchJobs: async () => ({
      jobs: await fetchAllJobs(listingPaths, fetchImpl),
      complete: false,
    }),
  };
};
