import { deduplicateJobs } from './deduplicate-jobs';
import type { NormalizedJob } from '../sources/types';

const job = (
  overrides: Partial<NormalizedJob> &
    Pick<NormalizedJob, 'source' | 'sourceJobId' | 'title' | 'url'>,
): NormalizedJob => ({
  company: { name: 'Acme Robotics' },
  technologies: [],
  ...overrides,
});

describe('deduplicateJobs', () => {
  it('merges exact source + sourceJobId duplicates and keeps a canonical URL', () => {
    const result = deduplicateJobs([
      job({
        source: 'greenhouse',
        sourceJobId: '100',
        title: 'Senior Frontend Engineer',
        url: 'http://boards.greenhouse.io/acme/jobs/100',
      }),
      job({
        source: 'greenhouse',
        sourceJobId: '100',
        title: 'Senior Frontend Engineer',
        url: 'https://boards.greenhouse.io/acme/jobs/100',
      }),
    ]);

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]?.url).toBe(
      'https://boards.greenhouse.io/acme/jobs/100',
    );
  });

  it('merges strong cross-source duplicates with the same company, title, and URL', () => {
    const sharedUrl = 'https://jobs.example.com/senior-frontend';
    const result = deduplicateJobs([
      job({
        source: 'greenhouse',
        sourceJobId: 'gh-1',
        title: 'Senior Frontend Engineer',
        url: sharedUrl,
        company: { name: 'Acme Robotics', websiteUrl: 'https://acme.example' },
      }),
      job({
        source: 'ashby',
        sourceJobId: 'as-1',
        title: 'Senior Frontend Engineer',
        url: sharedUrl,
        company: { name: 'Acme Robotics', websiteUrl: 'https://acme.example' },
      }),
    ]);

    expect(result.jobs).toHaveLength(1);
    expect(result.groups[0]?.duplicates).toHaveLength(1);
    expect(result.groups[0]?.mergeReason).toBe('strong-cross-source-match');
  });

  it('does not merge unrelated jobs', () => {
    const result = deduplicateJobs([
      job({
        source: 'greenhouse',
        sourceJobId: '1',
        title: 'Senior Frontend Engineer',
        url: 'https://jobs.example.com/frontend',
        company: { name: 'Acme Robotics' },
      }),
      job({
        source: 'ashby',
        sourceJobId: '2',
        title: 'Senior Backend Engineer',
        url: 'https://jobs.example.com/backend',
        company: { name: 'Acme Robotics' },
      }),
      job({
        source: 'hackernews',
        sourceJobId: '3',
        title: 'Senior Frontend Engineer',
        url: 'https://other.example.com/frontend',
        company: { name: 'Orbit Labs' },
      }),
    ]);

    expect(result.jobs).toHaveLength(3);
  });

  it('preserves uncertain same-title company matches without shared URLs', () => {
    const result = deduplicateJobs([
      job({
        source: 'greenhouse',
        sourceJobId: '1',
        title: 'Senior Frontend Engineer',
        url: 'https://boards.greenhouse.io/acme/jobs/1',
        company: { name: 'Acme Robotics' },
      }),
      job({
        source: 'ashby',
        sourceJobId: '2',
        title: 'Senior Frontend Engineer',
        url: 'https://jobs.ashbyhq.com/acme/abc',
        company: { name: 'Acme Robotics' },
      }),
    ]);

    expect(result.jobs).toHaveLength(2);
  });
});
