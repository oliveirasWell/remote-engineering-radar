import { asFetch, jsonResponse } from '@/test/http';

import page1 from './fixtures/postings-page-1.json';
import { LEVER_SOURCE_NAME } from './constants';
import { createLeverAdapter } from './lever-adapter';
import { normalizeLeverJob } from './normalize-lever-job';

const BOARD_SLUG = 'ciandt';

describe('normalizeLeverJob', () => {
  it('normalizes a remote Lever posting', () => {
    const job = normalizeLeverJob(page1[0], BOARD_SLUG);

    expect(job).toEqual({
      source: LEVER_SOURCE_NAME,
      sourceJobId: `${BOARD_SLUG}:08e78476-f995-4946-921d-27c3c22b1c6d`,
      company: { name: BOARD_SLUG },
      title: '[30790] Senior Frontend Engineer, Brazil',
      url: 'https://jobs.lever.co/ciandt/08e78476-f995-4946-921d-27c3c22b1c6d',
      location: 'Brazil',
      remotePolicy: 'remote',
      description: 'Senior React and TypeScript engineer.',
      technologies: [],
      countries: ['Brazil'],
      postedAt: new Date(1785365285283),
    });
  });

  it('returns null for non-remote postings', () => {
    expect(normalizeLeverJob(page1[1], BOARD_SLUG)).toBeNull();
  });
});

describe('createLeverAdapter', () => {
  it('fetches and normalizes remote board postings', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(page1));
    const adapter = createLeverAdapter({
      boardSlugs: [BOARD_SLUG],
      fetch: asFetch(fetchMock),
    });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(true);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.sourceJobId).toBe(
      `${BOARD_SLUG}:08e78476-f995-4946-921d-27c3c22b1c6d`,
    );
  });

  it('uses a verified company name instead of the board slug', async () => {
    const adapter = createLeverAdapter({
      boardSlugs: [BOARD_SLUG],
      companyNamesByBoard: { [BOARD_SLUG]: 'CI&T' },
      fetch: asFetch(async () => jsonResponse(page1)),
    });

    expect((await adapter.fetchJobs()).jobs[0]?.company.name).toBe('CI&T');
  });

  it('returns healthy boards and identifies a failed board without completing the snapshot', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse({}, 400))
      .mockResolvedValueOnce(jsonResponse(page1));
    const adapter = createLeverAdapter({
      boardSlugs: [BOARD_SLUG, `${BOARD_SLUG}-other`, `${BOARD_SLUG}-third`],
      fetch: asFetch(fetchMock),
    });

    const result = await adapter.fetchJobs();
    expect(result).toMatchObject({
      complete: false,
      jobs: expect.arrayContaining([
        expect.objectContaining({ source: LEVER_SOURCE_NAME }),
      ]),
      failedBoards: [{ board: `${BOARD_SLUG}-other`, status: 400 }],
    });
    expect(result.jobs).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
