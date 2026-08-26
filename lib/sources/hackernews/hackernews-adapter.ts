import type { JobSource, NormalizedJob } from '../types';
import {
  HACKER_NEWS_SOURCE_NAME,
  HN_ALGOLIA_API_BASE_URL,
  HN_COMMENTS_PER_PAGE,
  HN_WHO_IS_HIRING_QUERY,
} from './constants';
import {
  normalizeHackerNewsComment,
  type HackerNewsComment,
} from './normalize-hackernews-comment';

export type HackerNewsAdapterOptions = {
  fetch?: typeof fetch;
  hitsPerPage?: number;
};

type AlgoliaSearchResponse = {
  hits?: unknown;
  nbPages?: unknown;
  hitsPerPage?: unknown;
  page?: unknown;
};

const isComment = (value: unknown): value is HackerNewsComment =>
  Boolean(value) && typeof value === 'object';

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const fetchJson = async (
  url: string,
  fetchImpl: typeof fetch,
): Promise<AlgoliaSearchResponse> => {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Hacker News request failed: ${response.status}`);
  }
  return (await response.json()) as AlgoliaSearchResponse;
};

const findLatestWhoIsHiringStoryId = async (
  fetchImpl: typeof fetch,
): Promise<string> => {
  const url = new URL(`${HN_ALGOLIA_API_BASE_URL}/search_by_date`);
  url.searchParams.set('tags', 'story,author_whoishiring');
  url.searchParams.set('query', HN_WHO_IS_HIRING_QUERY);
  url.searchParams.set('hitsPerPage', '1');

  const payload = await fetchJson(url.toString(), fetchImpl);
  const hits = Array.isArray(payload.hits) ? payload.hits : [];
  const first = hits[0];
  if (!first || typeof first !== 'object') {
    throw new Error('No Who Is Hiring thread found');
  }

  const objectID = (first as { objectID?: unknown }).objectID;
  if (typeof objectID !== 'string' || objectID.trim().length === 0) {
    throw new Error('Who Is Hiring thread is missing an objectID');
  }

  return objectID;
};

const fetchStoryComments = async (
  storyId: string,
  hitsPerPage: number,
  fetchImpl: typeof fetch,
): Promise<NormalizedJob[]> => {
  const normalized: NormalizedJob[] = [];
  let page = 0;
  let nbPages = 1;

  while (page < nbPages && page < 50) {
    const url = new URL(`${HN_ALGOLIA_API_BASE_URL}/search_by_date`);
    url.searchParams.set('tags', `comment,story_${storyId}`);
    url.searchParams.set('numericFilters', `parent_id=${storyId}`);
    url.searchParams.set('hitsPerPage', String(hitsPerPage));
    url.searchParams.set('page', String(page));

    const payload = await fetchJson(url.toString(), fetchImpl);
    nbPages = asNumber(payload.nbPages) ?? 1;
    const hits = Array.isArray(payload.hits) ? payload.hits : [];

    if (hits.length === 0) {
      break;
    }

    for (const hit of hits) {
      if (!isComment(hit)) {
        continue;
      }
      const job = normalizeHackerNewsComment(hit);
      if (job) {
        normalized.push(job);
      }
    }

    page += 1;
  }

  return normalized;
};

export const createHackerNewsAdapter = (
  options: HackerNewsAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const hitsPerPage = options.hitsPerPage ?? HN_COMMENTS_PER_PAGE;

  return {
    name: HACKER_NEWS_SOURCE_NAME,
    fetchJobs: async () => {
      const storyId = await findLatestWhoIsHiringStoryId(fetchImpl);
      return fetchStoryComments(storyId, hitsPerPage, fetchImpl);
    },
  };
};
