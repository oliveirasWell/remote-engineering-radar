import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { asFetch } from '@/test/http';

import jobPostings from './fixtures/job-postings.json';
import malformedAndOnsite from './fixtures/malformed-and-onsite.json';
import {
  YCOMBINATOR_LISTING_PATHS,
  YCOMBINATOR_SITE_ORIGIN,
  YCOMBINATOR_SOURCE_NAME,
} from './constants';
import {
  normalizeYCombinatorJob,
  type YCombinatorJobRecord,
} from './normalize-ycombinator-job';
import {
  createYCombinatorAdapter,
  parseYCombinatorListingHtml,
} from './ycombinator-adapter';

const fixturesDirectory = dirname(fileURLToPath(import.meta.url));
const listingsPageHtml = readFileSync(
  join(fixturesDirectory, 'fixtures/listings-page.html'),
  'utf8',
);

const [firstJob] = jobPostings as YCombinatorJobRecord[];

describe('normalizeYCombinatorJob', () => {
  it('normalizes a remote engineering posting', () => {
    expect(normalizeYCombinatorJob(firstJob)).toEqual({
      source: YCOMBINATOR_SOURCE_NAME,
      sourceJobId: String(firstJob.id),
      company: {
        name: firstJob.companyName,
        websiteUrl: `${YCOMBINATOR_SITE_ORIGIN}${firstJob.companyUrl}`,
      },
      title: firstJob.title,
      url: `${YCOMBINATOR_SITE_ORIGIN}${firstJob.url}`,
      location: firstJob.location,
      remotePolicy: 'remote',
      technologies: firstJob.skills,
      seniority: firstJob.minExperience,
    });
  });

  it('discards malformed, onsite, and non-engineering records', () => {
    for (const record of malformedAndOnsite as YCombinatorJobRecord[]) {
      expect(normalizeYCombinatorJob(record)).toBeNull();
    }
  });
});

describe('parseYCombinatorListingHtml', () => {
  it('reads jobPostings from the Inertia data-page attribute', () => {
    expect(parseYCombinatorListingHtml(listingsPageHtml)).toEqual(jobPostings);
  });

  it('throws when the data-page payload is missing', () => {
    expect(() => parseYCombinatorListingHtml('<html></html>')).toThrow(
      /data-page/,
    );
  });
});

describe('createYCombinatorAdapter', () => {
  it('fetches listing pages and returns unique remote engineering jobs', async () => {
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrls.push(String(input));
      return new Response(listingsPageHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    });
    const adapter = createYCombinatorAdapter({ fetch: asFetch(fetchMock) });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(false);
    expect(adapter.name).toBe(YCOMBINATOR_SOURCE_NAME);
    expect(requestedUrls).toEqual(
      YCOMBINATOR_LISTING_PATHS.map(
        (path) => `${YCOMBINATOR_SITE_ORIGIN}${path}`,
      ),
    );
    expect(jobs.map((job) => job.sourceJobId)).toEqual(
      jobPostings.map((job) => String(job.id)),
    );
  });

  it('throws when a listing request fails', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 500 }));
    const adapter = createYCombinatorAdapter({
      fetch: asFetch(fetchMock),
      listingPaths: ['/jobs/role/software-engineer/remote'],
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(/500/);
  });
});
