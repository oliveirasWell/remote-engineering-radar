import { asFetch, jsonResponse } from '@/test/http';

import malformedPage from './fixtures/jobs-malformed.json';
import page1 from './fixtures/jobs-page-1.json';
import page2 from './fixtures/jobs-page-2.json';
import { HIMALAYAS_SOURCE_NAME } from './constants';
import { createHimalayasAdapter } from './himalayas-adapter';
import { normalizeHimalayasJob } from './normalize-himalayas-job';

const [doordashJob, deeterJob] = page1.jobs;
const [trueMlJob] = page2.jobs;

describe('normalizeHimalayasJob', () => {
  it('normalizes a remote job with a location restriction', () => {
    const job = normalizeHimalayasJob(doordashJob);

    expect(job).toEqual({
      source: HIMALAYAS_SOURCE_NAME,
      sourceJobId: doordashJob.guid,
      company: { name: doordashJob.companyName },
      title: doordashJob.title,
      url: doordashJob.applicationLink,
      location: 'United States',
      remotePolicy: 'remote',
      description:
        "About the Team Global Cyber Defense & Detection builds the industry's most scalable delivery network.",
      technologies: [],
      countries: ['United States'],
      seniority: 'Senior',
      postedAt: new Date(doordashJob.pubDate * 1000),
    });
  });

  it('joins multiple location restrictions', () => {
    expect(normalizeHimalayasJob(trueMlJob)).toMatchObject({
      location: 'Costa Rica, Dominican Republic, Mexico',
      countries: trueMlJob.locationRestrictions,
      seniority: 'Entry-level',
    });
  });

  it('falls back to a remote location when unrestricted', () => {
    expect(normalizeHimalayasJob(deeterJob)).toMatchObject({
      location: 'Remote',
      countries: [],
    });
  });

  it('discards records missing required fields or with an insecure link', () => {
    for (const record of malformedPage.jobs) {
      expect(normalizeHimalayasJob(record)).toBeNull();
    }
  });
});

describe('createHimalayasAdapter', () => {
  it('follows the cursor until the last page', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      jsonResponse(String(input).includes('cursor=') ? page2 : page1),
    );
    const adapter = createHimalayasAdapter({ fetch: asFetch(fetchMock) });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(false);
    expect(adapter.name).toBe(HIMALAYAS_SOURCE_NAME);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      `cursor=${page1.nextCursor}`,
    );
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      doordashJob.guid,
      deeterJob.guid,
      trueMlJob.guid,
    ]);
  });

  it('marks a capped cursor feed incomplete', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(page1));
    const adapter = createHimalayasAdapter({
      fetch: asFetch(fetchMock),
      maxPages: 1,
    });

    const result = await adapter.fetchJobs();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ complete: false });
    expect(result.jobs).toHaveLength(page1.jobs.length);
  });

  it('drops malformed records without failing the run', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(malformedPage));
    const adapter = createHimalayasAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).resolves.toEqual({
      jobs: [],
      complete: false,
    });
  });

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 500));
    const adapter = createHimalayasAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).rejects.toThrow(/500/);
  });

  it('throws when the payload has an unexpected shape', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ jobs: null }));
    const adapter = createHimalayasAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).rejects.toThrow(/shape/);
  });
});
