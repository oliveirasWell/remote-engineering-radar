import { asFetch, jsonResponse } from '@/test/http';

import issuesPage1 from './fixtures/issues-page-1.json';
import issuesPage2 from './fixtures/issues-page-2.json';
import malformed from './fixtures/issues-malformed.json';
import { FRONTENDBR_SOURCE_NAME } from './constants';
import { createFrontendBrAdapter } from './frontendbr-adapter';
import { normalizeFrontendBrIssue } from './normalize-frontendbr-issue';

const issueByNumber = (number: number) => {
  const issue = issuesPage1.find((candidate) => candidate.number === number);
  if (!issue) {
    throw new Error(`Missing FrontendBR fixture #${number}`);
  }

  return issue;
};

const issue8542 = issueByNumber(8542);
const issue8554 = issueByNumber(8554);
const issue8548 = issueByNumber(8548);
const issue8550 = issueByNumber(8550);
const issue8545 = issueByNumber(8545);

describe('normalizeFrontendBrIssue', () => {
  it('splits company from the title on the " na " convention', () => {
    const job = normalizeFrontendBrIssue(issue8542);

    expect(job).toMatchObject({
      source: FRONTENDBR_SOURCE_NAME,
      sourceJobId: '8542',
      company: { name: 'Sylision' },
      title: 'React Front-End Developer Sênior',
      url: 'https://github.com/frontendbr/vagas/issues/8542',
      location: 'Remoto',
      remotePolicy: 'remote',
      seniority: 'senior',
    });
    expect(job?.postedAt).toEqual(new Date('2026-08-27T18:11:02Z'));
  });

  it('splits company on a trailing dash and trims the location bracket', () => {
    const job = normalizeFrontendBrIssue(issue8554);

    expect(job).toMatchObject({
      sourceJobId: '8554',
      company: { name: 'Strider' },
      title: 'Full-stack Engineer (HealthTech, EHR/EMR, Terraform, React) USD',
      location: 'Remoto',
    });
  });

  it('splits company from a trailing parenthesis', () => {
    const job = normalizeFrontendBrIssue(issue8548);

    expect(job).toMatchObject({
      sourceJobId: '8548',
      company: { name: 'Jcal Consultoria' },
      title: 'Senior Front-end Developer Engineer',
    });
  });

  it('keeps the most senior label when seniority labels conflict', () => {
    // #8550 carries both "Estágio" and "Sênior".
    expect(normalizeFrontendBrIssue(issue8550)?.seniority).toBe('senior');
    // #8548 carries both "Especialista" and "Sênior".
    expect(normalizeFrontendBrIssue(issue8548)?.seniority).toBe('staff');
  });

  it('prefers an explicit title modality when labels conflict', () => {
    // #8548 and #8545 say "Híbrido" in the title but carry both labels.
    expect(normalizeFrontendBrIssue(issue8548)?.remotePolicy).toBe('hybrid');
    expect(normalizeFrontendBrIssue(issue8545)?.remotePolicy).toBe('hybrid');
  });

  it('uses modality labels when the title bracket is only geographic', () => {
    const job = normalizeFrontendBrIssue({
      number: 8700,
      title: '[Brasil] Front-End Developer at Example Inc',
      html_url: 'https://github.com/frontendbr/vagas/issues/8700',
      labels: [{ name: 'Híbrido' }, { name: 'Remoto' }],
    });

    expect(job).toMatchObject({
      company: { name: 'Example Inc' },
      title: 'Front-End Developer',
      location: 'Brasil',
      remotePolicy: 'remote',
    });
  });

  it('recognizes an English company separator and remote location', () => {
    const job = normalizeFrontendBrIssue({
      number: 8701,
      title: '[FULLY REMOTE] Senior React Engineer at Jobsity',
      html_url: 'https://github.com/frontendbr/vagas/issues/8701',
      labels: [],
    });

    expect(job).toMatchObject({
      company: { name: 'Jobsity' },
      title: 'Senior React Engineer',
      location: 'FULLY REMOTE',
      remotePolicy: 'remote',
    });
  });

  it('maps "Pleno" to mid seniority', () => {
    expect(normalizeFrontendBrIssue(issue8545)?.seniority).toBe('mid');
  });

  it('carries the issue body as the description', () => {
    expect(normalizeFrontendBrIssue(issue8542)?.description).toContain(
      'TypeScript',
    );
  });

  it('returns null when the title has no company separator', () => {
    expect(normalizeFrontendBrIssue(malformed[1])).toBeNull();
  });

  it('returns null for pull requests and untitled issues', () => {
    expect(normalizeFrontendBrIssue(malformed[2])).toBeNull();
    expect(normalizeFrontendBrIssue(malformed[3])).toBeNull();
  });
});

describe('createFrontendBrAdapter', () => {
  it('requests only open issues and paginates until a short page', async () => {
    const requested: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requested.push(url.searchParams.get('page') ?? '');
      return jsonResponse(
        url.searchParams.get('page') === '1' ? issuesPage1 : issuesPage2,
      );
    });

    const adapter = createFrontendBrAdapter({
      perPage: 5,
      fetch: asFetch(fetchMock),
    });

    const jobs = await adapter.fetchJobs();

    expect(adapter.name).toBe(FRONTENDBR_SOURCE_NAME);
    expect(requested).toEqual(['1', '2']);
    expect(jobs.map((job) => job.sourceJobId)).toEqual([
      '8542',
      '8554',
      '8548',
      '8550',
      '8545',
      '8531',
    ]);

    const firstUrl = new URL((fetchMock.mock.calls[0]?.[0] as Request).url);
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
    const adapter = createFrontendBrAdapter({
      fetch: asFetch(fetchMock),
      token: ' test-token ',
    });

    await adapter.fetchJobs();

    expect(requests[0]?.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('skips pull requests and unparseable issues', async () => {
    const adapter = createFrontendBrAdapter({
      fetch: asFetch(async () => jsonResponse(malformed)),
    });

    const jobs = await adapter.fetchJobs();

    expect(jobs.map((job) => job.sourceJobId)).toEqual(['8600']);
    expect(jobs[0]?.company.name).toBe('GoodCo');
  });

  it('surfaces HTTP failures', async () => {
    const adapter = createFrontendBrAdapter({
      fetch: asFetch(async () => jsonResponse({ message: 'error' }, 500)),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /frontendbr request failed/i,
    );
  });

  it('rejects a successful response with an unexpected shape', async () => {
    const adapter = createFrontendBrAdapter({
      fetch: asFetch(async () =>
        jsonResponse({
          message: 'unexpected shape',
        }),
      ),
    });

    await expect(adapter.fetchJobs()).rejects.toThrow(
      /frontendbr response has an unexpected shape/i,
    );
  });
});
