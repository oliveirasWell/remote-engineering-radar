import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { asFetch, jsonResponse } from '@/test/http';
import {
  VAGAS_REMOTAS_API_URL,
  VAGAS_REMOTAS_FIELDS,
  VAGAS_REMOTAS_PROGRAMMING_CATEGORY_ID,
  VAGAS_REMOTAS_SOURCE_NAME,
  VAGAS_REMOTAS_TOTAL_PAGES_HEADER,
} from './constants';
import {
  EXPECTED_BRAZIL_JOB,
  VAGAS_REMOTAS_HTTP_CASES,
} from './fixtures/expected-jobs';
import invalidRecords from './fixtures/invalid-records.json';
import page1 from './fixtures/jobs-page-1.json';
import page2 from './fixtures/jobs-page-2.json';
import { createVagasRemotasAdapter } from './vagasremotas-adapter';

const pageResponse = (records: unknown[], totalPages?: number): Response => {
  const response = jsonResponse(records);
  if (totalPages !== undefined) {
    response.headers.set(VAGAS_REMOTAS_TOTAL_PAGES_HEADER, String(totalPages));
  }
  return response;
};

describe('createVagasRemotasAdapter', () => {
  it('paginates programming jobs and preserves their locations and listing links', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(pageResponse(page1, 2))
      .mockResolvedValueOnce(pageResponse(page2, 2));
    const adapter = createVagasRemotasAdapter({
      fetch: asFetch(fetchMock),
      pageSize: 2,
    });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [index, [input]] of fetchMock.mock.calls.entries()) {
      const url = new URL(String(input));
      expect(`${url.origin}${url.pathname}`).toBe(VAGAS_REMOTAS_API_URL);
      expect(url.searchParams.get('page')).toBe(String(index + 1));
      expect(url.searchParams.get('per_page')).toBe(String(page1.length));
      expect(url.searchParams.get('job-categories')).toBe(
        String(VAGAS_REMOTAS_PROGRAMMING_CATEGORY_ID),
      );
      expect(url.searchParams.get('_fields')).toBe(VAGAS_REMOTAS_FIELDS);
    }
    expect(complete).toBe(false);
    expect(jobs.map((job) => job.sourceJobId)).toEqual(
      [...page1, ...page2].map((record) => String(record.id)),
    );
    expect(jobs[0]).toEqual({
      source: VAGAS_REMOTAS_SOURCE_NAME,
      sourceJobId: String(page1[0].id),
      company: {
        name: EXPECTED_BRAZIL_JOB.companyName,
        websiteUrl: page1[0].meta._company_website,
      },
      title: EXPECTED_BRAZIL_JOB.title,
      url: page1[0].link,
      location: page1[0].meta._job_location,
      remotePolicy: REMOTE_POLICY_REMOTE,
      description: EXPECTED_BRAZIL_JOB.description,
      technologies: [],
      postedAt: new Date(`${page1[0].date_gmt}Z`),
    });
    expect(jobs[1]).toMatchObject({
      location: page1[1].meta._job_location,
      url: page1[1].link,
    });
    expect(jobs[2]).toMatchObject({ location: page2[0].meta._job_location });
    expect(jobs[2].company.websiteUrl).toBeUndefined();
  });

  it('discards malformed, filled, expired, and nonremote jobs without losing valid records', async () => {
    const fetchMock = vi.fn(async () =>
      pageResponse([...invalidRecords, ...page1], 1),
    );
    const adapter = createVagasRemotasAdapter({ fetch: asFetch(fetchMock) });

    const result = await adapter.fetchJobs();

    expect(result.jobs.map((job) => job.sourceJobId)).toEqual(
      page1.map((record) => String(record.id)),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops at the last page header even when that page is full', async () => {
    const fetchMock = vi.fn(async () => pageResponse(page1, 1));
    const adapter = createVagasRemotasAdapter({
      fetch: asFetch(fetchMock),
      pageSize: page1.length,
    });

    await adapter.fetchJobs();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps a capped discovery feed incomplete', async () => {
    const fetchMock = vi.fn(async () => pageResponse(page1, 10));
    const adapter = createVagasRemotasAdapter({
      fetch: asFetch(fetchMock),
      maxPages: 1,
    });

    const result = await adapter.fetchJobs();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.complete).toBe(false);
    expect(result.jobs).toHaveLength(page1.length);
  });

  it('stops on a short page when pagination headers are absent', async () => {
    const fetchMock = vi.fn(async () => pageResponse(page2));
    const adapter = createVagasRemotasAdapter({ fetch: asFetch(fetchMock) });

    const result = await adapter.fetchJobs();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.jobs).toHaveLength(page2.length);
  });

  it('handles an empty feed', async () => {
    const fetchMock = vi.fn(async () => pageResponse([]));
    const adapter = createVagasRemotasAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).resolves.toEqual({
      jobs: [],
      complete: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an HTTP failure instead of returning a successful empty feed', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({}, VAGAS_REMOTAS_HTTP_CASES.errorStatus),
    );
    const adapter = createVagasRemotasAdapter({ fetch: asFetch(fetchMock) });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      String(VAGAS_REMOTAS_HTTP_CASES.errorStatus),
    );
  });

  it.each(VAGAS_REMOTAS_HTTP_CASES.invalidPayloads)(
    'rejects an unexpected response shape: %j',
    async (payload) => {
      const fetchMock = vi.fn(async () => jsonResponse(payload));
      const adapter = createVagasRemotasAdapter({ fetch: asFetch(fetchMock) });

      await expect(adapter.fetchJobs()).rejects.toThrow();
    },
  );
});
