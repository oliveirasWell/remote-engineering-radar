import { asFetch, jsonResponse } from '@/test/http';

import issues from './fixtures/issues.json';
import { QUAVE_SOURCE_NAME } from './constants';
import { createQuaveAdapter } from './quave-adapter';
import { normalizeQuaveIssue } from './normalize-quave-issue';

const issueByNumber = (number: number) => {
  const issue = issues.find((candidate) => candidate.number === number);
  if (!issue) {
    throw new Error(`Missing Quave fixture #${number}`);
  }

  return issue;
};

describe('normalizeQuaveIssue', () => {
  it('parses the Senior Full-Stack Engineer posting', () => {
    const job = normalizeQuaveIssue(issueByNumber(31));

    expect(job).toMatchObject({
      source: QUAVE_SOURCE_NAME,
      sourceJobId: '31',
      company: { name: 'Quave', websiteUrl: 'https://quave.dev' },
      title: 'Senior Full-Stack Engineer',
      url: 'https://github.com/quavedev/join/issues/31',
      location: 'Remote',
      remotePolicy: 'remote',
      seniority: 'senior',
    });
    expect(job?.postedAt).toEqual(new Date('2026-09-15T21:25:55Z'));
  });

  it('maps Tech Lead to staff seniority', () => {
    const job = normalizeQuaveIssue(issueByNumber(30));

    expect(job).toMatchObject({
      sourceJobId: '30',
      company: { name: 'Quave' },
      title: 'Tech Lead',
      seniority: 'staff',
    });
  });

  it('maps Dev Expert to staff seniority', () => {
    const job = normalizeQuaveIssue(issueByNumber(32));

    expect(job).toMatchObject({
      sourceJobId: '32',
      title: 'Dev Expert',
      seniority: 'staff',
    });
  });

  it('carries the issue body as the description', () => {
    expect(normalizeQuaveIssue(issueByNumber(31))?.description).toContain(
      'Node.js/TypeScript/React',
    );
  });

  it('returns null when the title does not mention Quave', () => {
    expect(
      normalizeQuaveIssue({
        number: 99,
        title: 'Senior Engineer at OtherCo - Fully Remote',
        html_url: 'https://github.com/quavedev/join/issues/99',
      }),
    ).toBeNull();
  });

  it('returns null for pull requests and untitled issues', () => {
    expect(
      normalizeQuaveIssue({
        number: 100,
        title: 'Dev Expert at Quave - Fully Remote',
        html_url: 'https://github.com/quavedev/join/issues/100',
        pull_request: {
          url: 'https://api.github.com/repos/quavedev/join/pulls/100',
        },
      }),
    ).toBeNull();
    expect(
      normalizeQuaveIssue({
        number: 101,
        html_url: 'https://github.com/quavedev/join/issues/101',
      }),
    ).toBeNull();
  });
});

describe('createQuaveAdapter', () => {
  it('requests only open issues and paginates until a short page', async () => {
    const requested: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requested.push(url.searchParams.get('page') ?? '');
      return jsonResponse(url.searchParams.get('page') === '1' ? issues : []);
    });

    const adapter = createQuaveAdapter({
      perPage: 3,
      fetch: asFetch(fetchMock),
    });

    const { jobs, complete } = await adapter.fetchJobs();

    expect(complete).toBe(true);
    expect(adapter.name).toBe(QUAVE_SOURCE_NAME);
    expect(requested).toEqual(['1', '2']);
    expect(jobs.map((job) => job.sourceJobId)).toEqual(['32', '31', '30']);

    const firstUrl = new URL((fetchMock.mock.calls[0]?.[0] as Request).url);
    expect(firstUrl.pathname).toBe('/repos/quavedev/join/issues');
    expect(firstUrl.searchParams.get('state')).toBe('open');
    expect(
      (fetchMock.mock.calls[0]?.[0] as Request).headers.has('Authorization'),
    ).toBe(false);
  });

  it('authenticates GitHub requests when a token is configured', async () => {
    const requests: Request[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requests.push(input as Request);
      return jsonResponse([]);
    });
    const adapter = createQuaveAdapter({
      fetch: asFetch(fetchMock),
      token: ' test-token ',
    });

    await adapter.fetchJobs();

    expect(requests[0]?.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('skips pull requests and unparseable issues', async () => {
    const adapter = createQuaveAdapter({
      fetch: asFetch(async () =>
        jsonResponse([
          {
            number: 200,
            title: 'Senior Engineer at Quave - Fully Remote',
            html_url: 'https://github.com/quavedev/join/issues/200',
            body: 'React and TypeScript role.',
          },
          {
            number: 201,
            title: 'Random discussion without a company separator',
            html_url: 'https://github.com/quavedev/join/issues/201',
          },
        ]),
      ),
    });

    const { jobs } = await adapter.fetchJobs();

    expect(jobs.map((job) => job.sourceJobId)).toEqual(['200']);
    expect(jobs[0]?.company.name).toBe('Quave');
  });

  it('surfaces HTTP failures', async () => {
    const adapter = createQuaveAdapter({
      fetch: asFetch(async () => jsonResponse({ message: 'error' }, 500)),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(/quave request failed/i);
  });

  it('rejects a successful response with an unexpected shape', async () => {
    const adapter = createQuaveAdapter({
      fetch: asFetch(async () =>
        jsonResponse({
          message: 'unexpected shape',
        }),
      ),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /quave response has an unexpected shape/i,
    );
  });

  it('fails rather than treating the page cap as exhaustion', async () => {
    const adapter = createQuaveAdapter({
      perPage: issues.length,
      fetch: asFetch(async () => jsonResponse(issues)),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(/pagination limit/);
  });
});
