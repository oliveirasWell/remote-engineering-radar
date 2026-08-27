import { createTestDb } from '@/lib/db/test/create-test-db';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import type { JobSource, NormalizedJob } from '@/lib/sources/types';
import { runIngestion } from './run-ingestion';

const makeJob = (
  overrides: Partial<NormalizedJob> &
    Pick<NormalizedJob, 'source' | 'sourceJobId' | 'title' | 'url'>,
): NormalizedJob => ({
  company: { name: 'Acme Robotics', websiteUrl: 'https://acme.example' },
  technologies: [],
  description: 'React TypeScript GraphQL Senior Remote LATAM',
  location: 'Remote LATAM',
  remotePolicy: 'remote',
  ...overrides,
});

describe('runIngestion', () => {
  it('continues when one source fails and persists successful jobs', async () => {
    const db = await createTestDb();
    const logs: string[] = [];

    const healthy: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => [
        makeJob({
          source: 'greenhouse',
          sourceJobId: '1',
          title: 'Senior Frontend Engineer',
          url: 'https://example.com/jobs/1',
        }),
      ],
    };

    const broken: JobSource = {
      name: 'ashby',
      fetchJobs: async () => {
        throw new Error('ashby unavailable');
      },
    };

    const result = await runIngestion({
      db,
      sources: [broken, healthy],
      logger: {
        info: (message) => logs.push(message),
        error: (message) => logs.push(message),
      },
    });

    expect(result.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'ashby', error: 'ashby unavailable' }),
        expect.objectContaining({ name: 'greenhouse', fetched: 1 }),
      ]),
    );
    expect(result.persistedJobs).toBe(1);
    expect(logs.some((line) => line.includes('ashby failed'))).toBe(true);
  });

  it('is idempotent across duplicate executions', async () => {
    const db = await createTestDb();
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => [
        makeJob({
          source: 'greenhouse',
          sourceJobId: '42',
          title: 'Senior React Engineer',
          url: 'https://example.com/jobs/42',
        }),
      ],
    };

    await runIngestion({ db, sources: [source] });
    await runIngestion({ db, sources: [source] });

    const jobs = await createJobsRepository(db).listActiveByScore();
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.sourceJobId).toBe('42');
  });

  it('deactivates jobs missing from a successful source fetch', async () => {
    const db = await createTestDb();
    let includeOldJob = true;
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => [
        makeJob({
          source: 'greenhouse',
          sourceJobId: 'current',
          title: 'Senior React Engineer',
          url: 'https://example.com/jobs/current',
        }),
        ...(includeOldJob
          ? [
              makeJob({
                source: 'greenhouse',
                sourceJobId: 'old',
                title: 'Frontend Engineer',
                url: 'https://example.com/jobs/old',
              }),
            ]
          : []),
      ],
    };

    await runIngestion({ db, sources: [source] });
    includeOldJob = false;
    await runIngestion({ db, sources: [source] });

    const jobs = await createJobsRepository(db).listByCompanyId(
      (await createJobsRepository(db).findBySourceJobId(
        'greenhouse',
        'current',
      ))!.companyId,
    );
    expect(jobs.find((job) => job.sourceJobId === 'old')?.isActive).toBe(false);
    expect(jobs.find((job) => job.sourceJobId === 'current')?.isActive).toBe(
      true,
    );
  });
});
