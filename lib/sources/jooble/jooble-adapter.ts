import { classifyJob } from '../../classification/classify-job';
import { RECRUITING_ROLE_FOCUS } from '../../classification/constants';
import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import type { JobSource, NormalizedJob } from '../types';
import { uniqueBySourceJobId } from '../unique-by-source-job-id';
import {
  JOOBLE_API_BASE_URL,
  JOOBLE_LOCATION,
  JOOBLE_LOOKBACK_MS,
  JOOBLE_MAX_PAGES,
  JOOBLE_QUERIES,
  JOOBLE_RESULTS_PER_PAGE,
  JOOBLE_SOURCE_NAME,
} from './constants';
import {
  normalizeJoobleJob,
  type JoobleJobRecord,
} from './normalize-jooble-job';

export type JoobleAdapterOptions = {
  apiKey: string;
  fetch?: typeof fetch;
  now?: () => Date;
};

type JooblePage = { jobs?: unknown };

const PAGES = Array.from({ length: JOOBLE_MAX_PAGES }, (_, index) => index + 1);

const isRecord = (value: unknown): value is JoobleJobRecord =>
  Boolean(value && typeof value === 'object');

const isRecruitingRole = (job: NormalizedJob): boolean =>
  classifyJob({ title: job.title, location: job.location }).roleFocus.includes(
    RECRUITING_ROLE_FOCUS,
  );

/**
 * The key is part of the URL, so a raw network error could carry it into
 * logs and Sentry. Every failure is rethrown with a fixed message.
 */
const postPage = async (
  url: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<unknown[]> => {
  const response = await fetchWithRetry(url, fetchImpl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new Error('Jooble request failed: network');
  });
  if (!response.ok) {
    await discardResponse(response);
    throw new Error(`Jooble request failed: ${response.status}`);
  }
  const payload = await readJsonResponse<JooblePage>(response);
  if (!payload || !Array.isArray(payload.jobs)) {
    throw new Error('Jooble response has an unexpected shape');
  }
  return payload.jobs;
};

export const createJoobleAdapter = ({
  apiKey,
  fetch: fetchImpl = fetch,
  now = () => new Date(),
}: JoobleAdapterOptions): JobSource => ({
  name: JOOBLE_SOURCE_NAME,
  // A search feed, not every open job: never complete.
  fetchJobs: async () => {
    const url = `${JOOBLE_API_BASE_URL}${apiKey}`;
    const datecreatedfrom = new Date(now().getTime() - JOOBLE_LOOKBACK_MS)
      .toISOString()
      .slice(0, 10);
    const jobs: NormalizedJob[] = [];
    // Sequential on purpose: one key, a few small requests a day.
    for (const keywords of JOOBLE_QUERIES) {
      for (const page of PAGES) {
        const records = await postPage(
          url,
          {
            keywords,
            location: JOOBLE_LOCATION,
            page,
            ResultOnPage: JOOBLE_RESULTS_PER_PAGE,
            datecreatedfrom,
          },
          fetchImpl,
        );
        jobs.push(
          ...records
            .filter(isRecord)
            .flatMap((record) => normalizeJoobleJob(record) ?? [])
            .filter(isRecruitingRole),
        );
        if (records.length < JOOBLE_RESULTS_PER_PAGE) {
          break;
        }
      }
    }
    return { jobs: uniqueBySourceJobId(jobs), complete: false };
  },
});
