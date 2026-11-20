import { asFetch, jsonResponse } from '@/test/http';

import page1 from './fixtures/jobs-page-1.json';
import {
  JOOBLE_LOCATION,
  JOOBLE_LOOKBACK_MS,
  JOOBLE_QUERIES,
  JOOBLE_RESULTS_PER_PAGE,
  JOOBLE_SOURCE_NAME,
} from './constants';
import { createJoobleAdapter } from './jooble-adapter';
import { normalizeJoobleJob } from './normalize-jooble-job';

const API_KEY = 'test-jooble-key';
const NOW = new Date('2026-11-20T12:00:00.000Z');
const [cityJob, remoteJob, countryOnlyJob] = page1.jobs;

describe('normalizeJoobleJob', () => {
  it('normalizes a city-located role and keeps the Jooble link', () => {
    expect(normalizeJoobleJob(cityJob)).toEqual({
      source: JOOBLE_SOURCE_NAME,
      sourceJobId: '1001',
      company: { name: 'Acme Tecnologia' },
      title: 'Tech Recruiter Sênior',
      url: 'https://br.jooble.org/desc/1001',
      location: 'São Paulo, SP',
      description: 'Atuar com recrutamento de perfis de tecnologia.',
      technologies: [],
      countries: ['Brazil'],
      postedAt: new Date('2026-11-19T10:00:00.000Z'),
    });
  });

  it('tags every role as Brazilian, since the feed is Brazil only', () => {
    // "Joinville, SC" is not on the Brazilian city list the location
    // resolver knows, so the source has to say the country.
    expect(
      normalizeJoobleJob({ ...cityJob, location: 'Joinville, SC' })?.countries,
    ).toEqual(['Brazil']);
  });

  it('reads remote from the title, never from the snippet', () => {
    expect(normalizeJoobleJob(remoteJob)?.remotePolicy).toBe('remote');
  });

  it('drops a country-only location with no remote signal in the title', () => {
    // "Auxílio home office" is a benefit, not a work model.
    expect(normalizeJoobleJob(countryOnlyJob)).toBeNull();
  });

  it.each([
    { case: 'no company', record: { ...cityJob, company: '' } },
    {
      case: 'an unsafe link',
      record: { ...cityJob, link: 'http://br.jooble.org/desc/1' },
    },
    { case: 'no id', record: { ...cityJob, id: undefined } },
  ])('drops a record with $case', ({ record }) => {
    expect(normalizeJoobleJob(record)).toBeNull();
  });
});

describe('createJoobleAdapter', () => {
  it('asks for recent results per query and keeps only recruiting roles', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const urls: string[] = [];
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        urls.push(String(input));
        bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        return jsonResponse(page1);
      },
    );
    const adapter = createJoobleAdapter({
      apiKey: API_KEY,
      fetch: asFetch(fetchMock),
      now: () => NOW,
    });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(false);
    expect(adapter.name).toBe(JOOBLE_SOURCE_NAME);
    // The page holds fewer jobs than a full page, so each query stops at one.
    expect(bodies).toEqual(
      JOOBLE_QUERIES.map((keywords) => ({
        keywords,
        location: JOOBLE_LOCATION,
        page: 1,
        ResultOnPage: JOOBLE_RESULTS_PER_PAGE,
        datecreatedfrom: new Date(NOW.getTime() - JOOBLE_LOOKBACK_MS)
          .toISOString()
          .slice(0, 10),
      })),
    );
    expect(new Set(urls)).toEqual(
      new Set([`https://br.jooble.org/api/${API_KEY}`]),
    );
    // The administrative role and the client "recruiter" are not recruiting
    // roles; the country-only role has no work model; duplicates are kept once.
    expect(jobs.map((job) => job.sourceJobId)).toEqual(['1001', '1002']);
  });

  it('fails with a message that never carries the key', async () => {
    const adapter = createJoobleAdapter({
      apiKey: API_KEY,
      fetch: asFetch(async () => new Response('denied', { status: 403 })),
      now: () => NOW,
    });

    const failure = await adapter.fetchJobs().catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe('Jooble request failed: 403');
    expect((failure as Error).message).not.toContain(API_KEY);
  });

  it('never leaks the key from a network error', async () => {
    const adapter = createJoobleAdapter({
      apiKey: API_KEY,
      fetch: asFetch(async () => {
        throw new TypeError(
          `fetch failed for https://br.jooble.org/api/${API_KEY}`,
        );
      }),
      now: () => NOW,
    });

    const failure = await adapter.fetchJobs().catch((error: unknown) => error);
    expect((failure as Error).message).toBe('Jooble request failed: network');
  });
});
