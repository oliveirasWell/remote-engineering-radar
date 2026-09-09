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

    const jobs = await adapter.fetchJobs();

    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.sourceJobId).toBe(
      `${BOARD_SLUG}:08e78476-f995-4946-921d-27c3c22b1c6d`,
    );
  });
});
