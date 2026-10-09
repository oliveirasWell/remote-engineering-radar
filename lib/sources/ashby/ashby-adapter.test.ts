import { asFetch, jsonResponse } from '@/test/http';

import page1 from './fixtures/jobs-page-1.json';
import page2 from './fixtures/jobs-page-2.json';
import malformed from './fixtures/jobs-malformed.json';
import { ASHBY_SOURCE_NAME } from './constants';
import { createAshbyAdapter } from './ashby-adapter';
import { normalizeAshbyJob } from './normalize-ashby-job';

const BOARD_NAME = 'acme';

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
      fetch: asFetch(fetchMock),
    });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(true);
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

  it('uses a verified company name instead of the board slug', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      companyNamesByBoard: { [BOARD_NAME]: 'Acme Robotics' },
      fetch: asFetch(async () => jsonResponse(page2)),
    });

    expect((await adapter.fetchJobs()).jobs[0]?.company.name).toBe(
      'Acme Robotics',
    );
  });

  it('skips malformed and unlisted records', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(async () => jsonResponse(malformed)),
    });

    const { jobs } = await adapter.fetchJobs();

    expect(jobs.map((job) => job.sourceJobId)).toEqual(['valid-1', 'valid-2']);
    expect(jobs[1]?.url).toBe(
      'https://jobs.ashbyhq.com/acme/valid-2/application',
    );
  });

  it('accepts an empty jobs array', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(async () => jsonResponse({ jobs: [] })),
    });

    await expect(adapter.fetchJobs()).resolves.toEqual({
      jobs: [],
      complete: true,
    });
  });

  it('rejects a successful response with an unexpected shape', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(async () => jsonResponse({ message: 'not a jobs page' })),
    });

    await expect(adapter.fetchJobs()).resolves.toMatchObject({
      complete: false,
    });
  });

  it('rejects a non-empty page containing no valid jobs', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(async () => jsonResponse({ jobs: [{}] })),
    });

    await expect(adapter.fetchJobs()).resolves.toMatchObject({
      complete: false,
    });
  });

  it('surfaces HTTP failures for a board', async () => {
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(async () => jsonResponse({ error: 'nope' }, 503)),
    });

    await expect(adapter.fetchJobs()).resolves.toMatchObject({
      complete: false,
      failedBoards: [{ board: BOARD_NAME, status: 503 }],
    });
  });

  it('rejects a repeated cursor instead of declaring a complete snapshot', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(page1));
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(fetchMock),
    });

    await expect(adapter.fetchJobs()).resolves.toMatchObject({
      complete: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails rather than treating the cursor cap as exhaustion', async () => {
    let page = 0;
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ...page1,
        nextCursor: `${page1.nextCursor}-${++page}`,
      }),
    );
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME],
      fetch: asFetch(fetchMock),
    });

    await expect(adapter.fetchJobs()).resolves.toMatchObject({
      complete: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(50);
  });

  it('returns healthy boards and identifies a failed board without completing the snapshot', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(page2))
      .mockResolvedValueOnce(jsonResponse({}, 400))
      .mockResolvedValueOnce(jsonResponse(page2));
    const adapter = createAshbyAdapter({
      boardNames: [BOARD_NAME, `${BOARD_NAME}-other`, `${BOARD_NAME}-third`],
      fetch: asFetch(fetchMock),
    });

    const result = await adapter.fetchJobs();
    expect(result).toMatchObject({
      complete: false,
      jobs: expect.arrayContaining([
        expect.objectContaining({ sourceJobId: page2.jobs[0].id }),
      ]),
      failedBoards: [{ board: `${BOARD_NAME}-other`, status: 400 }],
    });
    expect(result.jobs).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
