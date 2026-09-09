import { asFetch, jsonResponse } from '@/test/http';

import page1 from './fixtures/jobs-page-1.json';
import { GETONBRD_SOURCE_NAME } from './constants';
import { createGetOnBrdAdapter } from './getonbrd-adapter';
import { normalizeGetOnBrdJob } from './normalize-getonbrd-job';

describe('normalizeGetOnBrdJob', () => {
  it('normalizes a fully remote programming job', () => {
    const job = normalizeGetOnBrdJob(page1.data[0]);

    expect(job).toEqual({
      source: GETONBRD_SOURCE_NAME,
      sourceJobId: 'senior-react-engineer-acme-remote',
      company: {
        name: 'Acme Latam',
        websiteUrl: 'https://acme.example',
      },
      title: 'Senior React Engineer',
      url: 'https://www.getonbrd.com/jobs/senior-react-engineer-acme-remote',
      location: 'Brazil',
      remotePolicy: 'remote',
      description:
        'Build with React\n\nReact and TypeScript required.\n\nShip frontend features.',
      technologies: [],
      countries: ['Brazil'],
      postedAt: new Date(1788204027 * 1000),
    });
  });

  it('returns null for hybrid jobs', () => {
    expect(normalizeGetOnBrdJob(page1.data[1])).toBeNull();
  });
});

describe('createGetOnBrdAdapter', () => {
  it('fetches and normalizes remote programming jobs', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(page1));
    const adapter = createGetOnBrdAdapter({ fetch: asFetch(fetchMock) });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(true);
    expect(adapter.name).toBe(GETONBRD_SOURCE_NAME);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.title).toBe('Senior React Engineer');
  });

  it('marks a capped category listing incomplete', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ...page1,
        meta: { ...page1.meta, total_pages: 2 },
      }),
    );
    const adapter = createGetOnBrdAdapter({
      fetch: asFetch(fetchMock),
      maxPages: 1,
    });

    const result = await adapter.fetchJobs();

    expect(result.complete).toBe(false);
    expect(result.jobs).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('follows total_pages even when a page is shorter than requested', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ...page1,
        meta: { ...page1.meta, total_pages: 2 },
      }),
    );
    const adapter = createGetOnBrdAdapter({ fetch: asFetch(fetchMock) });

    const result = await adapter.fetchJobs();

    expect(result.complete).toBe(true);
    expect(result.jobs).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not declare an unexpectedly empty page complete', async () => {
    const adapter = createGetOnBrdAdapter({
      fetch: asFetch(async () =>
        jsonResponse({
          data: [],
          meta: { total_pages: 2 },
        }),
      ),
    });

    await expect(adapter.fetchJobs()).resolves.toEqual({
      jobs: [],
      complete: false,
    });
  });
});
