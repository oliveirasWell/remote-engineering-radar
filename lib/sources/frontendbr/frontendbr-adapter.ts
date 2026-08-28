import type { JobSource, NormalizedJob } from '../types';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import {
  FRONTENDBR_ISSUES_PER_PAGE,
  FRONTENDBR_ISSUES_URL,
  FRONTENDBR_MAX_PAGES,
  FRONTENDBR_REQUEST_HEADERS,
  FRONTENDBR_SOURCE_NAME,
} from './constants';
import {
  normalizeFrontendBrIssue,
  type FrontendBrIssue,
} from './normalize-frontendbr-issue';

export type FrontendBrAdapterOptions = {
  fetch?: typeof fetch;
  perPage?: number;
  token?: string;
};

const isIssue = (value: unknown): value is FrontendBrIssue =>
  Boolean(value) && typeof value === 'object';

/**
 * Only open issues are requested: the repository closes an issue once the
 * vacancy is filled, so `deactivateMissingBySource` retires it on the next run.
 */
const buildIssuesRequest = (
  page: number,
  perPage: number,
  headers: Headers,
): Request => {
  const url = new URL(FRONTENDBR_ISSUES_URL);
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
      `${FRONTENDBR_SOURCE_NAME} request failed (page ${page}): ${response.status}`,
    );
  }

  const payload = await readJsonResponse<unknown>(response);
  if (!Array.isArray(payload)) {
    throw new Error(
      `${FRONTENDBR_SOURCE_NAME} response has an unexpected shape (page ${page})`,
    );
  }

  return payload;
};

export const createFrontendBrAdapter = (
  options: FrontendBrAdapterOptions = {},
): JobSource => {
  const fetchImpl = options.fetch ?? fetch;
  const perPage = options.perPage ?? FRONTENDBR_ISSUES_PER_PAGE;
  const headers = new Headers(FRONTENDBR_REQUEST_HEADERS);
  const token = options.token?.trim();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return {
    name: FRONTENDBR_SOURCE_NAME,
    fetchJobs: async () => {
      const normalized: NormalizedJob[] = [];
      let page = 1;

      while (page <= FRONTENDBR_MAX_PAGES) {
        const records = await fetchIssuesPage(
          page,
          perPage,
          fetchImpl,
          headers,
        );

        for (const record of records) {
          if (!isIssue(record)) {
            continue;
          }

          const job = normalizeFrontendBrIssue(record);
          if (job) {
            normalized.push(job);
          }
        }

        if (records.length < perPage) {
          return normalized;
        }

        page += 1;
      }

      throw new Error(`${FRONTENDBR_SOURCE_NAME} pagination limit reached`);
    },
  };
};
