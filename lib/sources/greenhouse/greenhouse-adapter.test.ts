import { asFetch, jsonResponse } from '@/test/http';

import page1 from './fixtures/jobs-page-1.json';
import page2 from './fixtures/jobs-page-2.json';
import malformed from './fixtures/jobs-malformed.json';
import { GREENHOUSE_SOURCE_NAME } from './constants';
import { createGreenhouseAdapter } from './greenhouse-adapter';
import { normalizeGreenhouseJob, stripHtml } from './normalize-greenhouse-job';

const BOARD_TOKEN = 'acme';

const readPage = (input: RequestInfo | URL): string | null =>
  new URL(String(input)).searchParams.get('page');

describe('normalizeGreenhouseJob', () => {
  it('normalizes a realistic Greenhouse job record', () => {
    const record = page1.jobs[0];
    const job = normalizeGreenhouseJob(record, BOARD_TOKEN);

    expect(job).toEqual({
      source: GREENHOUSE_SOURCE_NAME,
      sourceJobId: '4001',
      company: { name: 'Acme Robotics' },
      title: 'Senior Software Engineer, Frontend',
      url: 'https://boards.greenhouse.io/acme/jobs/4001',
      location: 'Remote - LATAM',
      description: 'Build products with React, TypeScript, and GraphQL.',
      technologies: [],
      postedAt: new Date('2026-08-20T12:00:00-04:00'),
    });
  });

  it('returns null when required fields are missing', () => {
    expect(normalizeGreenhouseJob({ title: 'No id' }, BOARD_TOKEN)).toBeNull();
    expect(
      normalizeGreenhouseJob({ id: 1, title: 'No url' }, BOARD_TOKEN),
    ).toBeNull();
  });

  it('rejects non-HTTPS job URLs', () => {
    expect(
      normalizeGreenhouseJob(
        { id: 1, title: 'Engineer', absolute_url: 'javascript:alert(1)' },
        BOARD_TOKEN,
      ),
    ).toBeNull();
  });

  it('falls back to the board token for company name', () => {
    const job = normalizeGreenhouseJob(
      {
        id: 9,
        title: 'Engineer',
        absolute_url: 'https://boards.greenhouse.io/acme/jobs/9',
      },
      BOARD_TOKEN,
    );

    expect(job?.company.name).toBe('acme');
  });
});

describe('stripHtml', () => {
  it('decodes entities and removes tags', () => {
    expect(stripHtml('&lt;p&gt;React &amp; TypeScript&lt;/p&gt;')).toBe(
      'React & TypeScript',
    );
  });
});

describe('createGreenhouseAdapter', () => {
  it('fetches, paginates, and normalizes jobs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const page = readPage(input);
      if (page === '1') {
        return jsonResponse(page1);
      }
      if (page === '2') {
        return jsonResponse(page2);
      }
      throw new Error(`Unexpected page: ${page}`);
    });

    const adapter = createGreenhouseAdapter({
      boardTokens: [BOARD_TOKEN],
      jobsPerPage: 2,
      fetch: asFetch(fetchMock),
    });

    const jobs = await adapter.fetchJobs();

    expect(adapter.name).toBe(GREENHOUSE_SOURCE_NAME);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      '4001',
      '4002',
      '5001',
    ]);
    expect(jobs[0]?.company.name).toBe('Acme Robotics');
    expect(jobs[0]?.description).toContain('React');
  });

  it('skips malformed records and keeps valid ones', async () => {
    const adapter = createGreenhouseAdapter({
      boardTokens: [BOARD_TOKEN],
      fetch: asFetch(async () => jsonResponse(malformed)),
    });

    const jobs = await adapter.fetchJobs();

    expect(jobs.map((job) => job.sourceJobId)).toEqual(['6001', '6003']);
  });

  it('accepts an empty jobs array', async () => {
    const adapter = createGreenhouseAdapter({
      boardTokens: [BOARD_TOKEN],
      fetch: asFetch(async () => jsonResponse({ jobs: [] })),
    });

    await expect(adapter.fetchJobs()).resolves.toEqual([]);
  });

  it('rejects a successful response with an unexpected shape', async () => {
    const adapter = createGreenhouseAdapter({
      boardTokens: [BOARD_TOKEN],
      fetch: asFetch(async () => jsonResponse({ message: 'not a jobs page' })),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /Greenhouse response has an unexpected shape/,
    );
  });

  it('rejects a non-empty page containing no valid jobs', async () => {
    const adapter = createGreenhouseAdapter({
      boardTokens: [BOARD_TOKEN],
      fetch: asFetch(async () => jsonResponse({ jobs: [{}] })),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /Greenhouse response has no valid job records/,
    );
  });

  it('surfaces HTTP failures for a board', async () => {
    const adapter = createGreenhouseAdapter({
      boardTokens: [BOARD_TOKEN],
      fetch: asFetch(async () => jsonResponse({ error: 'nope' }, 500)),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /Greenhouse request failed/,
    );
  });
});
