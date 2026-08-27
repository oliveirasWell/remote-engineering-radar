import page1 from './fixtures/jobs-page-1.json';
import page2 from './fixtures/jobs-page-2.json';
import malformed from './fixtures/jobs-malformed.json';
import { ASHBY_SOURCE_NAME } from './constants';
import { createAshbyAdapter } from './ashby-adapter';
import { normalizeAshbyJob } from './normalize-ashby-job';

const BOARD_NAME = 'acme';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('normalizeAshbyJob', () => {
  it('normalizes a realistic Ashby job record', () => {
    const job = normalizeAshbyJob(page1.jobs[0], BOARD_NAME);

    expect(job).toEqual({
      source: ASHBY_SOURCE_NAME,
      sourceJobId: 'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',
      company: { name: BOARD_NAME },
      title: 'Senior Frontend Engineer',
      url: 'https://jobs.ashbyhq.com/acme/aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',
      location: 'Remote - LATAM',
      remotePolicy: 'remote',
      description: 'Build with React and TypeScript.',
      technologies: [],
      postedAt: new Date('2026-08-20T12:00:00.000+00:00'),
    });
  });

  it('returns null for missing required fields or unlisted jobs', () => {
    expect(normalizeAshbyJob({ title: 'No id' }, BOARD_NAME)).toBeNull();
    expect(
      normalizeAshbyJob(
        {
          id: 'x',
          title: 'Hidden',
          jobUrl: 'https://jobs.ashbyhq.com/acme/x',
          isListed: false,
        },
        BOARD_NAME,
      ),
    ).toBeNull();
  });

  it('rejects non-HTTPS job URLs', () => {
    expect(
      normalizeAshbyJob(
        { id: 'unsafe', title: 'Engineer', jobUrl: 'javascript:alert(1)' },
        BOARD_NAME,
      ),
    ).toBeNull();
  });
});

describe('createAshbyAdapter', () => {
  it('fetches, follows nextCursor pagination, and normalizes jobs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const cursor = url.searchParams.get('cursor');
      if (!cursor) {
        return jsonResponse(page1);
      }
      if (cursor === 'page-2') {
        return jsonResponse(page2);
      }
      throw new Error(`Unexpected cursor: ${cursor}`);
    });

    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: fetchMock as unknown as typeof fetch,
    });

    const jobs = await adapter.fetchJobs();

    expect(adapter.name).toBe(ASHBY_SOURCE_NAME);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',
      'cccccccc-1111-2222-3333-dddddddddddd',
    ]);
    expect(jobs[1]?.description).toBe(
      'Expo and React Native experience required.',
    );
  });

  it('skips malformed and unlisted records', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: (async () => jsonResponse(malformed)) as unknown as typeof fetch,
    });

    const jobs = await adapter.fetchJobs();

    expect(jobs.map((job) => job.sourceJobId)).toEqual(['valid-1', 'valid-2']);
    expect(jobs[1]?.url).toBe(
      'https://jobs.ashbyhq.com/acme/valid-2/application',
    );
  });

  it('surfaces HTTP failures for a board', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: (async () =>
        jsonResponse({ error: 'nope' }, 503)) as unknown as typeof fetch,
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(/Ashby request failed/);
  });
});
