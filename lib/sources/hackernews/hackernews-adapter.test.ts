import story from './fixtures/who-is-hiring-story.json';
import commentsPage0 from './fixtures/comments-page-0.json';
import commentsPage1 from './fixtures/comments-page-1.json';
import malformed from './fixtures/comments-malformed.json';
import { HACKER_NEWS_SOURCE_NAME } from './constants';
import { createHackerNewsAdapter } from './hackernews-adapter';
import { normalizeHackerNewsComment } from './normalize-hackernews-comment';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('normalizeHackerNewsComment', () => {
  it('extracts company, role, location, remote, url, and description', () => {
    const job = normalizeHackerNewsComment(commentsPage0.hits[0]);

    expect(job).toMatchObject({
      source: HACKER_NEWS_SOURCE_NAME,
      sourceJobId: '49336502',
      company: { name: 'Acme Robotics' },
      title: 'Senior Frontend Engineer',
      url: 'https://acme.example/jobs/frontend',
      location: 'REMOTE (LATAM)',
      remotePolicy: 'remote',
    });
    expect(job?.description).toContain('React and TypeScript');
    expect(job?.postedAt).toEqual(new Date('2026-08-15T12:00:00Z'));
  });

  it('falls back to the HN item URL when no link is present', () => {
    const job = normalizeHackerNewsComment(commentsPage0.hits[1]);
    expect(job?.url).toBe('https://news.ycombinator.com/item?id=49336503');
  });

  it('returns null for comments without the hiring header format', () => {
    expect(
      normalizeHackerNewsComment({
        objectID: '9',
        comment_text: 'Thanks for posting!',
      }),
    ).toBeNull();
  });
});

describe('createHackerNewsAdapter', () => {
  it('loads the latest thread, paginates comments, and normalizes jobs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const tags = url.searchParams.get('tags') ?? '';
      if (tags.includes('author_whoishiring')) {
        return jsonResponse(story);
      }
      const page = url.searchParams.get('page');
      if (page === '0') {
        return jsonResponse(commentsPage0);
      }
      if (page === '1') {
        return jsonResponse(commentsPage1);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const adapter = createHackerNewsAdapter({
      hitsPerPage: 2,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const jobs = await adapter.fetchJobs();

    expect(adapter.name).toBe(HACKER_NEWS_SOURCE_NAME);
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      '49336502',
      '49336503',
      '49336504',
    ]);
    expect(jobs[2]?.remotePolicy).toBe('onsite');
  });

  it('skips malformed comments', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      const tags = url.searchParams.get('tags') ?? '';
      if (tags.includes('author_whoishiring')) {
        return jsonResponse(story);
      }
      return jsonResponse(malformed);
    });

    const adapter = createHackerNewsAdapter({
      fetch: fetchMock as unknown as typeof fetch,
    });

    const jobs = await adapter.fetchJobs();
    expect(jobs.map((job) => job.sourceJobId)).toEqual(['2']);
    expect(jobs[0]?.company.name).toBe('GoodCo');
  });

  it('surfaces HTTP failures', async () => {
    const adapter = createHackerNewsAdapter({
      fetch: (async () =>
        jsonResponse({ message: 'error' }, 500)) as unknown as typeof fetch,
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /Hacker News request failed/,
    );
  });
});
