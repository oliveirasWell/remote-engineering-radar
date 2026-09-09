import { asFetch, jsonResponse } from '@/test/http';

import malformedPage from './fixtures/jobs-malformed.json';
import page1 from './fixtures/jobs-page-1.json';
import { JOBICY_INDUSTRY, JOBICY_SOURCE_NAME } from './constants';
import { createJobicyAdapter } from './jobicy-adapter';
import { normalizeJobicyJob } from './normalize-jobicy-job';

const [monzoJob, vonageJob, grafanaJob] = page1.jobs;

describe('normalizeJobicyJob', () => {
  it('normalizes a remote job with a geography', () => {
    const job = normalizeJobicyJob(monzoJob);

    expect(job).toEqual({
      source: JOBICY_SOURCE_NAME,
      sourceJobId: String(monzoJob.id),
      company: { name: monzoJob.companyName },
      title: monzoJob.jobTitle,
      url: monzoJob.url,
      location: monzoJob.jobGeo,
      remotePolicy: 'remote',
      description:
        "We're on a mission to make money work for everyone. We're waving goodbye to the complicated and confusing ways of traditional banking.",
      technologies: [],
      countries: [monzoJob.jobGeo],
      seniority: undefined,
      postedAt: new Date(monzoJob.pubDate),
    });
  });

  it('splits a multi-country geography', () => {
    expect(normalizeJobicyJob(grafanaJob)).toMatchObject({
      location: grafanaJob.jobGeo,
      countries: ['Germany', 'Ireland', 'Spain', 'Sweden', 'UK'],
    });
  });

  it('keeps an unrestricted geography out of the countries', () => {
    expect(normalizeJobicyJob(vonageJob)).toMatchObject({
      location: vonageJob.jobGeo,
      countries: [],
      seniority: vonageJob.jobLevel,
    });
  });

  it('discards records missing required fields or with an insecure url', () => {
    for (const record of malformedPage.jobs) {
      expect(normalizeJobicyJob(record)).toBeNull();
    }
  });
});

describe('createJobicyAdapter', () => {
  it('fetches engineering jobs in a single request', async () => {
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrls.push(String(input));
      return jsonResponse(page1);
    });
    const adapter = createJobicyAdapter({ fetch: asFetch(fetchMock) });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(false);
    expect(adapter.name).toBe(JOBICY_SOURCE_NAME);
    expect(requestedUrls).toHaveLength(1);
    expect(requestedUrls[0]).toContain(`industry=${JOBICY_INDUSTRY}`);
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      String(monzoJob.id),
      String(vonageJob.id),
      String(grafanaJob.id),
    ]);
  });

  it('drops malformed records without failing the run', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(malformedPage));
    const adapter = createJobicyAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).resolves.toEqual({
      jobs: [],
      complete: false,
    });
  });

  it('throws when the response is not ok', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 500));
    const adapter = createJobicyAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).rejects.toThrow(/500/);
  });

  it('throws when the payload has an unexpected shape', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ jobs: null }));
    const adapter = createJobicyAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).rejects.toThrow(/shape/);
  });
});
