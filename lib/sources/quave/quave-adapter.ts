import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import {
  QUAVE_ISSUES_PER_PAGE,
  QUAVE_ISSUES_URL,
  QUAVE_MAX_PAGES,
  QUAVE_REQUEST_HEADERS,
  QUAVE_SOURCE_NAME,
} from './constants';
import { normalizeQuaveIssue, type QuaveIssue } from './normalize-quave-issue';

export type QuaveAdapterOptions = {
  fetch?: typeof fetch;
  perPage?: number;
  token?: string;
};

const isIssue = (value: unknown): value is QuaveIssue =>
  Boolean(value) && typeof value === 'object';

/**
 * Only open issues are requested: the repository closes an issue once the
 * vacancy is filled, so an exhaustive fetch can retire missing jobs.
 */
const buildIssuesRequest = (
  page: number,
  perPage: number,
  headers: Headers,
): Request => {
  const url = new URL(QUAVE_ISSUES_URL);
  url.searchParams.set('state', 'open');
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));

  return new Request(url, { headers });
};

const fetchIssuesPage = async (
  page: number,
  perPage: number,
  fetchImpl: typeof fetch,
  headers: Headers,
): Promise<unknown[]> => {
  const response = await fetchWithRetry(
    buildIssuesRequest(page, perPage, headers),
    fetchImpl,
  );

  if (!response.ok) {
    await discardResponse(response);
    throw new Error(
      `${QUAVE_SOURCE_NAME} request failed (page ${page}): ${response.status}`,
    );
  }

  const payload = await readJsonResponse<unknown>(response);
  if (!Array.isArray(payload)) {
    throw new Error(
      `${QUAVE_SOURCE_NAME} response has an unexpected shape (page ${page})`,
    );
  }

  return payload;
};

export const createQuaveAdapter = (
  options: QuaveAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const perPage = options.perPage ?? QUAVE_ISSUES_PER_PAGE;
  const headers = new Headers(QUAVE_REQUEST_HEADERS);
  const token = options.token?.trim();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchFrom = async (page: number): Promise<NormalizedJob[]> => {
    if (page > QUAVE_MAX_PAGES) {
      throw new Error(`${QUAVE_SOURCE_NAME} pagination limit reached`);
    }

    const records = await fetchIssuesPage(page, perPage, fetchImpl, headers);
    const jobs = records
      .filter(isIssue)
      .flatMap((record) => normalizeQuaveIssue(record) ?? []);

    return records.length < perPage
      ? jobs
      : [...jobs, ...(await fetchFrom(page + 1))];
  };

  return {
    name: QUAVE_SOURCE_NAME,
    fetchJobs: async () => ({ jobs: await fetchFrom(1), complete: true }),
  };
};
