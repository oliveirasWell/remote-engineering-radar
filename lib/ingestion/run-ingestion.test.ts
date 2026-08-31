import { createTestDb } from '@/lib/db/test/create-test-db';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { scoreJob } from '@/lib/scoring/score-job';
import type { JobSource, NormalizedJob } from '@/lib/sources/types';
import { sql } from 'drizzle-orm';
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

  it('records the ingestion completion time', async () => {
    const db = await createTestDb();
    const completedAt = new Date('2026-08-31T15:15:09.000Z');
    const source: JobSource = {
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

    await runIngestion({
      db,
      sources: [source],
      completedAt: () => completedAt,
    });

    expect(
      await createIngestionRunsRepository(db).getLatestCompletedAt(),
    ).toEqual(completedAt);
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

  it('applies adapter-provided seniority before scoring', async () => {
    const db = await createTestDb();
    const job = makeJob({
      source: 'frontendbr',
      sourceJobId: '8542',
      title: 'Desenvolvedor Frontend',
      url: 'https://github.com/frontendbr/vagas/issues/8542',
      description: 'React e TypeScript',
      location: 'Remoto',
      seniority: 'senior',
    });
    const source: JobSource = {
      name: 'frontendbr',
      fetchJobs: async () => [job],
    };

    await runIngestion({ db, sources: [source] });

    const persisted = await createJobsRepository(db).findBySourceJobId(
      'frontendbr',
      '8542',
    );
    expect(persisted).toMatchObject({ seniority: 'senior' });
    expect(persisted?.score).toBe(scoreJob(job).score);
    expect(persisted!.score).toBeGreaterThan(
      scoreJob({
        title: job.title,
        description: job.description,
        location: job.location,
        remotePolicy: job.remotePolicy,
        technologies: job.technologies,
      }).score,
    );
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

  it('deactivates a fetched source row when another source is canonical', async () => {
    const db = await createTestDb();
    const shared = {
      title: 'Senior Frontend Engineer',
      url: 'https://example.com/jobs/shared',
    };
    const ashbyJob = makeJob({
      ...shared,
      source: 'ashby',
      sourceJobId: 'ashby-1',
    });

    await runIngestion({
      db,
      sources: [{ name: 'ashby', fetchJobs: async () => [ashbyJob] }],
    });
    await runIngestion({
      db,
      sources: [
        {
          name: 'greenhouse',
          fetchJobs: async () => [
            makeJob({
              ...shared,
              source: 'greenhouse',
              sourceJobId: 'greenhouse-1',
            }),
          ],
        },
        { name: 'ashby', fetchJobs: async () => [ashbyJob] },
      ],
    });

    const jobsRepository = createJobsRepository(db);
    await expect(
      jobsRepository.findBySourceJobId('ashby', 'ashby-1'),
    ).resolves.toMatchObject({ isActive: false });
    await expect(
      jobsRepository.findBySourceJobId('greenhouse', 'greenhouse-1'),
    ).resolves.toMatchObject({ isActive: true });
  });

  it('stores active job URL evidence on generated hiring signals', async () => {
    const db = await createTestDb();
    const jobs = ['1', '2', '3'].map((sourceJobId) =>
      makeJob({
        source: 'greenhouse',
        sourceJobId,
        title: `Senior React Engineer ${sourceJobId}`,
        url: `https://example.com/jobs/${sourceJobId}`,
      }),
    );

    await runIngestion({
      db,
      sources: [{ name: 'greenhouse', fetchJobs: async () => jobs }],
    });

    const company =
      await createCompaniesRepository(db).findBySlug('acme-robotics');
    const signals = await createHiringSignalsRepository(db).listByCompanyId(
      company!.id,
    );
    expect(signals.length).toBeGreaterThan(0);
    const signalsWithEvidence = signals.filter((signal) => signal.sourceUrl);
    expect(signalsWithEvidence.length).toBeGreaterThan(0);
    expect(
      signalsWithEvidence.every((signal) =>
        jobs.some((job) => job.url === signal.sourceUrl),
      ),
    ).toBe(true);
  });

  it('rolls back all persistence when signal replacement fails', async () => {
    const db = await createTestDb();
    let generation = 'old';
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () =>
        Array.from({ length: generation === 'old' ? 3 : 7 }, (_, index) =>
          makeJob({
            source: 'greenhouse',
            sourceJobId: `${generation}-${index + 1}`,
            title: `Senior React Engineer ${index + 1}`,
            url: `https://example.com/jobs/${generation}-${index + 1}`,
          }),
        ),
    };

    await runIngestion({ db, sources: [source] });
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const signalsRepository = createHiringSignalsRepository(db);
    const companyBefore = await companiesRepository.findBySlug('acme-robotics');
    const signalsBefore = await signalsRepository.listByCompanyId(
      companyBefore!.id,
    );

    await db.execute(sql`
      create function reject_hiring_score() returns trigger as $$
      begin
        raise exception 'injected company score failure';
      end;
      $$ language plpgsql
    `);
    await db.execute(sql`
      create trigger reject_hiring_score_update
      before update of hiring_score on companies
      for each row
      when (new.hiring_score <> old.hiring_score)
      execute function reject_hiring_score()
    `);
    generation = 'new';

    await expect(runIngestion({ db, sources: [source] })).rejects.toThrow(
      'Failed query: update "companies"',
    );

    await expect(
      jobsRepository.findBySourceJobId('greenhouse', 'new-1'),
    ).resolves.toBeNull();
    await expect(
      jobsRepository.findBySourceJobId('greenhouse', 'old-1'),
    ).resolves.toMatchObject({ isActive: true });
    await expect(
      companiesRepository.findBySlug('acme-robotics'),
    ).resolves.toMatchObject({ hiringScore: companyBefore!.hiringScore });
    await expect(
      signalsRepository.listByCompanyId(companyBefore!.id),
    ).resolves.toEqual(signalsBefore);
  });

  it('skips Sales Representative and other unrelated roles', async () => {
    const db = await createTestDb();
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => [
        makeJob({
          source: 'greenhouse',
          sourceJobId: 'sales-1',
          title: 'Sales Representative',
          url: 'https://example.com/jobs/sales-1',
          description: 'Sell our React product',
        }),
        makeJob({
          source: 'greenhouse',
          sourceJobId: 'eng-1',
          title: 'Senior Frontend Engineer',
          url: 'https://example.com/jobs/eng-1',
        }),
      ],
    };

    const result = await runIngestion({ db, sources: [source] });

    expect(result.persistedJobs).toBe(1);
    await expect(
      createJobsRepository(db).findBySourceJobId('greenhouse', 'sales-1'),
    ).resolves.toBeNull();
    await expect(
      createJobsRepository(db).findBySourceJobId('greenhouse', 'eng-1'),
    ).resolves.toMatchObject({ isActive: true, geographies: ['latam'] });
  });

  it('skips jobs posted more than 30 days ago and deactivates aged open jobs', async () => {
    const db = await createTestDb();
    const now = new Date('2026-08-31T12:00:00.000Z');
    const jobsRepository = createJobsRepository(db);

    await runIngestion({
      db,
      now: () => now,
      sources: [
        {
          name: 'greenhouse',
          fetchJobs: async () => [
            makeJob({
              source: 'greenhouse',
              sourceJobId: 'stale',
              title: 'Senior Frontend Engineer',
              url: 'https://example.com/jobs/stale',
              postedAt: new Date('2026-03-01T12:00:00.000Z'),
            }),
            makeJob({
              source: 'greenhouse',
              sourceJobId: 'fresh',
              title: 'Senior React Engineer',
              url: 'https://example.com/jobs/fresh',
              postedAt: new Date('2026-08-20T12:00:00.000Z'),
            }),
          ],
        },
      ],
    });

    await expect(
      jobsRepository.findBySourceJobId('greenhouse', 'stale'),
    ).resolves.toBeNull();
    await expect(
      jobsRepository.findBySourceJobId('greenhouse', 'fresh'),
    ).resolves.toMatchObject({ isActive: true });

    const company =
      await createCompaniesRepository(db).findBySlug('acme-robotics');
    await jobsRepository.create({
      companyId: company!.id,
      source: 'greenhouse',
      sourceJobId: 'aging',
      title: 'Senior Frontend Engineer',
      url: 'https://example.com/jobs/aging',
      technologies: ['React'],
      geographies: ['latam'],
      score: 50,
      postedAt: new Date('2026-07-01T12:00:00.000Z'),
      isActive: true,
    });

    await runIngestion({
      db,
      now: () => now,
      sources: [
        {
          name: 'greenhouse',
          fetchJobs: async () => [
            makeJob({
              source: 'greenhouse',
              sourceJobId: 'fresh',
              title: 'Senior React Engineer',
              url: 'https://example.com/jobs/fresh',
              postedAt: new Date('2026-08-20T12:00:00.000Z'),
            }),
          ],
        },
      ],
    });

    await expect(
      jobsRepository.findBySourceJobId('greenhouse', 'aging'),
    ).resolves.toMatchObject({ isActive: false });
  });

  it('labels known consultancies on upsert', async () => {
    const db = await createTestDb();

    await runIngestion({
      db,
      sources: [
        {
          name: 'greenhouse',
          fetchJobs: async () => [
            makeJob({
              source: 'greenhouse',
              sourceJobId: '1',
              title: 'Senior Frontend Engineer',
              url: 'https://example.com/jobs/1',
              company: {
                name: 'BairesDev',
                websiteUrl: 'https://bairesdev.example',
              },
            }),
          ],
        },
      ],
    });

    await expect(
      createCompaniesRepository(db).findBySlug('bairesdev'),
    ).resolves.toMatchObject({ kind: 'consultancy' });
  });
});
