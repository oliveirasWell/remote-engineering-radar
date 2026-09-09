import { createTestDb } from '@/lib/db/test/create-test-db';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { JOB_RETENTION_MS } from '@/lib/jobs/constants';
import { scoreJob } from '@/lib/scoring/score-job';
import { HACKER_NEWS_SOURCE_NAME } from '@/lib/sources/hackernews/constants';
import { createJobicyAdapter } from '@/lib/sources/jobicy/jobicy-adapter';
import {
  JOBICY_COUNT,
  JOBICY_SOURCE_NAME,
} from '@/lib/sources/jobicy/constants';
import jobicyPage from '@/lib/sources/jobicy/fixtures/jobs-page-1.json';
import type { JobSource, NormalizedJob } from '@/lib/sources/types';
import { asFetch, jsonResponse } from '@/test/http';
import { Prisma } from '@prisma/client';
import { INGESTION_TRANSACTION_TIMEOUT_MS } from './constants';
import { runIngestion } from './run-ingestion';

vi.mock(
  '@/lib/db/repositories/companies-repository',
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import('@/lib/db/repositories/companies-repository')
      >();
    return {
      ...original,
      createCompaniesRepository: vi.fn(
        (db: Parameters<typeof original.createCompaniesRepository>[0]) => {
          const repository = original.createCompaniesRepository(db);
          return {
            ...repository,
            upsertBySlug: vi.fn(repository.upsertBySlug),
          };
        },
      ),
    };
  },
);

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
  it('uses an ingestion-only ten-minute transaction timeout without overriding maxWait', async () => {
    const db = await createTestDb();
    const transaction = vi.spyOn(db, '$transaction');

    try {
      await runIngestion({ db, sources: [] });

      expect(INGESTION_TRANSACTION_TIMEOUT_MS).toBe(600_000);
      expect(transaction).toHaveBeenCalledExactlyOnceWith(
        expect.any(Function),
        { timeout: INGESTION_TRANSACTION_TIMEOUT_MS },
      );
      expect(
        await createIngestionRunsRepository(db).getLatestCompletedAt(),
      ).toBeInstanceOf(Date);
    } finally {
      transaction.mockRestore();
    }
  });

  it.each([
    {
      scenario: 'last supplied safe website for a new company',
      existingWebsiteUrl: undefined,
      websiteUrls: [
        'https://first.example',
        'https://last.example',
        undefined,
        'javascript:alert(1)',
      ],
      expectedWebsiteUrl: 'https://last.example',
    },
    {
      scenario: 'last supplied safe website replacing a stored website',
      existingWebsiteUrl: 'https://stored.example',
      websiteUrls: [
        'https://first.example',
        'https://last.example',
        undefined,
        'javascript:alert(1)',
      ],
      expectedWebsiteUrl: 'https://last.example',
    },
    {
      scenario:
        'stored website when all supplied websites are missing or unsafe',
      existingWebsiteUrl: 'https://stored.example',
      websiteUrls: [
        undefined,
        'javascript:alert(1)',
        'http://unsafe.example',
        undefined,
      ],
      expectedWebsiteUrl: 'https://stored.example',
    },
    {
      scenario:
        'null website for a new company without a supplied safe website',
      existingWebsiteUrl: undefined,
      websiteUrls: [
        undefined,
        'javascript:alert(1)',
        'http://unsafe.example',
        undefined,
      ],
      expectedWebsiteUrl: null,
    },
  ])(
    'upserts once per normalized slug with last-job metadata and $scenario',
    async ({ existingWebsiteUrl, websiteUrls, expectedWebsiteUrl }) => {
      const db = await createTestDb();
      const companiesRepository = createCompaniesRepository(db);
      if (existingWebsiteUrl) {
        await companiesRepository.create({
          name: 'Old Acme Robotics',
          slug: 'acme-robotics',
          source: 'old-source',
          websiteUrl: existingWebsiteUrl,
        });
      }
      const jobs = websiteUrls.map((websiteUrl, index) =>
        makeJob({
          source: index === websiteUrls.length - 1 ? 'ashby' : 'greenhouse',
          sourceJobId: String(index),
          title: `Senior React Engineer ${index}`,
          url: `https://example.com/jobs/${index}`,
          company: {
            name: [
              'Acme Robotics',
              'ACME-ROBOTICS',
              'acme robotics',
              ' Acme / Robotics ',
            ][index]!,
            websiteUrl,
          },
        }),
      );
      jobs.push(
        makeJob({
          source: 'ashby',
          sourceJobId: 'consultancy',
          title: 'Senior Frontend Engineer',
          url: 'https://example.com/jobs/consultancy',
          company: { name: 'BairesDev' },
        }),
      );
      vi.mocked(createCompaniesRepository).mockClear();

      const result = await runIngestion({
        db,
        sources: ['greenhouse', 'ashby'].map((name) => ({
          name,
          fetchJobs: async () => ({
            jobs: jobs.filter((job) => job.source === name),
            complete: true,
          }),
        })),
      });

      expect(createCompaniesRepository).toHaveBeenCalledOnce();
      expect(vi.mocked(createCompaniesRepository).mock.calls[0]![0]).not.toBe(
        db,
      );
      const transactionRepository = vi.mocked(createCompaniesRepository).mock
        .results[0]!.value;
      expect.soft(transactionRepository.upsertBySlug).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({
        persistedJobs: jobs.length,
        companiesUpdated: 2,
      });
      const acme = await companiesRepository.findBySlug('acme-robotics');
      expect(acme).toMatchObject({
        id: expect.any(String),
        name: ' Acme / Robotics ',
        source: 'ashby',
        websiteUrl: expectedWebsiteUrl,
        kind: 'product',
      });
      const consultancy = await companiesRepository.findBySlug('bairesdev');
      expect(consultancy).toMatchObject({
        id: expect.any(String),
        kind: 'consultancy',
      });
      const jobsRepository = createJobsRepository(db);
      for (const job of jobs) {
        await expect(
          jobsRepository.findBySourceJobId(job.source, job.sourceJobId),
        ).resolves.toMatchObject({
          companyId:
            job.sourceJobId === 'consultancy' ? consultancy!.id : acme!.id,
          isActive: true,
        });
      }
    },
  );

  it('continues when one source fails and persists successful jobs', async () => {
    const db = await createTestDb();
    const logs: string[] = [];

    const healthy: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => ({
        complete: true,
        jobs: [
          makeJob({
            source: 'greenhouse',
            sourceJobId: '1',
            title: 'Senior Frontend Engineer',
            url: 'https://example.com/jobs/1',
          }),
        ],
      }),
    };

    const broken: JobSource = {
      name: 'ashby',
      fetchJobs: async () => {
        throw new Error('ashby unavailable');
      },
    };

    const existing = makeJob({
      source: broken.name,
      sourceJobId: 'existing',
      title: 'Senior React Engineer',
      url: 'https://example.com/jobs/existing',
    });
    await runIngestion({
      db,
      sources: [
        {
          name: broken.name,
          fetchJobs: async () => ({ jobs: [existing], complete: true }),
        },
      ],
    });
    const jobsRepository = createJobsRepository(db);
    const before = await jobsRepository.findBySourceJobId(
      existing.source,
      existing.sourceJobId,
    );

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
    await expect(jobsRepository.findById(before!.id)).resolves.toEqual(before);
  });

  it('records the ingestion completion time', async () => {
    const db = await createTestDb();
    const completedAt = new Date('2026-08-31T15:15:09.000Z');
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => ({
        complete: true,
        jobs: [
          makeJob({
            source: 'greenhouse',
            sourceJobId: '1',
            title: 'Senior Frontend Engineer',
            url: 'https://example.com/jobs/1',
          }),
        ],
      }),
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
      fetchJobs: async () => ({
        complete: true,
        jobs: [
          makeJob({
            source: 'greenhouse',
            sourceJobId: '42',
            title: 'Senior React Engineer',
            url: 'https://example.com/jobs/42',
          }),
        ],
      }),
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
      fetchJobs: async () => ({ jobs: [job], complete: true }),
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

  it('preserves a still-valid job beyond the rolling feed limit', async () => {
    const db = await createTestDb();
    const now = new Date('2026-09-09T12:00:00.000Z');
    const records = Array.from({ length: JOBICY_COUNT + 1 }, (_, index) => ({
      ...jobicyPage.jobs[0],
      id: jobicyPage.jobs[0].id + index,
      url: `${jobicyPage.jobs[0].url}/${index}`,
      jobTitle: `Senior Frontend Engineer ${index}`,
      jobDescription: 'React TypeScript GraphQL Senior Remote LATAM',
      pubDate: now.toISOString(),
    }));
    let offset = 0;
    const source = createJobicyAdapter({
      fetch: asFetch(async () =>
        jsonResponse({ jobs: records.slice(offset, offset + JOBICY_COUNT) }),
      ),
    });

    await runIngestion({ db, sources: [source], now: () => now });
    const jobsRepository = createJobsRepository(db);
    const before = await jobsRepository.findBySourceJobId(
      JOBICY_SOURCE_NAME,
      String(records[0]!.id),
    );
    expect(before).toMatchObject({ isActive: true });

    offset = 1;
    const result = await runIngestion({
      db,
      sources: [source],
      now: () => now,
    });

    expect(result.persistedJobs).toBe(JOBICY_COUNT);
    await expect(jobsRepository.findById(before!.id)).resolves.toEqual(before);
    await expect(jobsRepository.listActiveByScore()).resolves.toHaveLength(
      JOBICY_COUNT + 1,
    );

    offset = records.length;
    await runIngestion({ db, sources: [source], now: () => now });
    await expect(jobsRepository.findById(before!.id)).resolves.toEqual(before);
    await expect(jobsRepository.listActiveByScore()).resolves.toHaveLength(
      JOBICY_COUNT + 1,
    );
  });

  it('deactivates jobs missing from a complete source snapshot', async () => {
    const db = await createTestDb();
    let includeOldJob = true;
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => ({
        complete: true,
        jobs: [
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
      }),
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

    await runIngestion({
      db,
      sources: [
        {
          name: source.name,
          fetchJobs: async () => ({ jobs: [], complete: true }),
        },
      ],
    });
    await expect(
      createJobsRepository(db).listActiveByScore(),
    ).resolves.toHaveLength(0);
  });

  it.each([
    { reason: 'onsite', change: { remotePolicy: 'onsite' } },
    { reason: 'unrelated', change: { title: 'Sales Representative' } },
    {
      reason: 'old',
      change: { postedAt: new Date('2026-08-01T12:00:00.000Z') },
    },
    { reason: 'unsafe URL', change: { url: 'javascript:alert(1)' } },
  ])(
    'retires explicitly observed $reason jobs from a partial feed but preserves absent jobs',
    async ({ change }) => {
      const db = await createTestDb();
      const now = new Date('2026-09-09T12:00:00.000Z');
      const observedJob = makeJob({
        source: HACKER_NEWS_SOURCE_NAME,
        sourceJobId: 'observed',
        title: 'Senior Frontend Engineer',
        url: 'https://example.com/jobs/observed',
        postedAt: now,
      });
      const absentJob = makeJob({
        source: observedJob.source,
        sourceJobId: 'absent',
        title: 'Senior React Engineer',
        url: 'https://example.com/jobs/absent',
        postedAt: now,
      });
      let jobs = [observedJob, absentJob];
      const source: JobSource = {
        name: observedJob.source,
        fetchJobs: async () => ({ jobs, complete: false }),
      };

      await runIngestion({ db, sources: [source], now: () => now });
      const jobsRepository = createJobsRepository(db);
      const observed = await jobsRepository.findBySourceJobId(
        observedJob.source,
        observedJob.sourceJobId,
      );
      const absent = await jobsRepository.findBySourceJobId(
        absentJob.source,
        absentJob.sourceJobId,
      );
      expect(observed).toMatchObject({ isActive: true });
      expect(absent).toMatchObject({ isActive: true });

      jobs = [{ ...observedJob, ...change }];
      const result = await runIngestion({
        db,
        sources: [source],
        now: () => now,
      });

      await expect(
        jobsRepository.findById(observed!.id),
      ).resolves.toMatchObject({
        isActive: false,
      });
      await expect(jobsRepository.findById(absent!.id)).resolves.toEqual(
        absent,
      );
      await expect(jobsRepository.listSitemapJobs(now)).resolves.toEqual([
        { id: absent!.id },
      ]);
      expect(result).toMatchObject({ persistedJobs: 0, companiesUpdated: 1 });
    },
  );

  it.each([true, false])(
    'deactivates a fetched duplicate when source completeness is %s',
    async (complete) => {
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
      const absentJob = makeJob({
        source: ashbyJob.source,
        sourceJobId: 'absent',
        title: 'Senior React Engineer',
        url: 'https://example.com/jobs/absent',
      });

      await runIngestion({
        db,
        sources: [
          {
            name: 'ashby',
            fetchJobs: async () => ({ jobs: [ashbyJob, absentJob], complete }),
          },
        ],
      });
      await runIngestion({
        db,
        sources: [
          {
            name: 'greenhouse',
            fetchJobs: async () => ({
              complete,
              jobs: [
                makeJob({
                  ...shared,
                  source: 'greenhouse',
                  sourceJobId: 'greenhouse-1',
                }),
              ],
            }),
          },
          {
            name: 'ashby',
            fetchJobs: async () => ({ jobs: [ashbyJob], complete }),
          },
        ],
      });

      const jobsRepository = createJobsRepository(db);
      await expect(
        jobsRepository.findBySourceJobId('ashby', 'ashby-1'),
      ).resolves.toMatchObject({ isActive: false });
      await expect(
        jobsRepository.findBySourceJobId('greenhouse', 'greenhouse-1'),
      ).resolves.toMatchObject({ isActive: true });
      await expect(
        jobsRepository.findBySourceJobId(
          absentJob.source,
          absentJob.sourceJobId,
        ),
      ).resolves.toMatchObject({ isActive: !complete });
    },
  );

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
      sources: [
        {
          name: 'greenhouse',
          fetchJobs: async () => ({ jobs, complete: true }),
        },
      ],
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
      fetchJobs: async () => ({
        complete: true,
        jobs: Array.from({ length: generation === 'old' ? 3 : 7 }, (_, index) =>
          makeJob({
            source: 'greenhouse',
            sourceJobId: `${generation}-${index + 1}`,
            title: `Senior React Engineer ${index + 1}`,
            url: `https://example.com/jobs/${generation}-${index + 1}`,
          }),
        ),
      }),
    };

    await runIngestion({ db, sources: [source] });
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const signalsRepository = createHiringSignalsRepository(db);
    const companyBefore = await companiesRepository.findBySlug('acme-robotics');
    const signalsBefore = await signalsRepository.listByCompanyId(
      companyBefore!.id,
    );

    await db.$executeRaw(Prisma.sql`
      create function reject_hiring_score() returns trigger as $$
      begin
        raise exception 'injected company score failure';
      end;
      $$ language plpgsql
    `);
    await db.$executeRaw(Prisma.sql`
      create trigger reject_hiring_score_update
      before update of hiring_score on companies
      for each row
      when (new.hiring_score <> old.hiring_score)
      execute function reject_hiring_score()
    `);
    generation = 'new';

    await expect(runIngestion({ db, sources: [source] })).rejects.toThrow(
      'injected company score failure',
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

  it('skips non-remote jobs', async () => {
    const db = await createTestDb();
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => ({
        complete: true,
        jobs: [
          makeJob({
            source: 'greenhouse',
            sourceJobId: 'hybrid-1',
            title: 'Senior Frontend Engineer',
            url: 'https://example.com/jobs/hybrid-1',
            remotePolicy: 'hybrid',
          }),
          makeJob({
            source: 'greenhouse',
            sourceJobId: 'remote-1',
            title: 'Senior React Engineer',
            url: 'https://example.com/jobs/remote-1',
            remotePolicy: 'remote',
          }),
        ],
      }),
    };

    const result = await runIngestion({ db, sources: [source] });

    expect(result.persistedJobs).toBe(1);
    expect(result.sources).toEqual([
      { name: 'greenhouse', fetched: 2, persisted: 1 },
    ]);
    await expect(
      createJobsRepository(db).findBySourceJobId('greenhouse', 'hybrid-1'),
    ).resolves.toBeNull();
    await expect(
      createJobsRepository(db).findBySourceJobId('greenhouse', 'remote-1'),
    ).resolves.toMatchObject({ isActive: true, remotePolicy: 'remote' });
  });

  it('skips Sales Representative and other unrelated roles', async () => {
    const db = await createTestDb();
    const source: JobSource = {
      name: 'greenhouse',
      fetchJobs: async () => ({
        complete: true,
        jobs: [
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
      }),
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

  it('purges inactive jobs past the retention window', async () => {
    const db = await createTestDb();
    const now = new Date('2026-08-31T12:00:00.000Z');
    const jobsRepository = createJobsRepository(db);
    const company = await createCompaniesRepository(db).create({
      name: 'Acme Robotics',
      slug: 'acme-robotics',
      source: 'greenhouse',
    });

    const expired = await jobsRepository.create({
      companyId: company.id,
      source: 'greenhouse',
      sourceJobId: 'expired',
      title: 'Senior Frontend Engineer',
      url: 'https://example.com/jobs/expired',
      technologies: ['React'],
      score: 50,
      postedAt: new Date(now.getTime() - JOB_RETENTION_MS - 1),
      isActive: false,
    });

    await runIngestion({
      db,
      now: () => now,
      sources: [
        {
          name: expired.source,
          fetchJobs: async () => ({ jobs: [], complete: false }),
        },
      ],
    });

    await expect(jobsRepository.findById(expired.id)).resolves.toBeNull();
  });

  it.each([true, false])(
    'expires aged jobs during a partial fetch with postedAt present: %s',
    async (hasPostedAt) => {
      const db = await createTestDb();
      const now = new Date('2026-08-31T12:00:00.000Z');
      const jobsRepository = createJobsRepository(db);

      await runIngestion({
        db,
        now: () => now,
        sources: [
          {
            name: 'greenhouse',
            fetchJobs: async () => ({
              complete: false,
              jobs: [
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
            }),
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
        postedAt: hasPostedAt
          ? new Date('2026-07-20T12:00:00.000Z')
          : undefined,
        firstSeenAt: new Date('2026-07-20T12:00:00.000Z'),
        isActive: true,
      });

      await runIngestion({
        db,
        now: () => now,
        sources: [
          {
            name: 'greenhouse',
            fetchJobs: async () => ({
              complete: false,
              jobs: [
                makeJob({
                  source: 'greenhouse',
                  sourceJobId: 'fresh',
                  title: 'Senior React Engineer',
                  url: 'https://example.com/jobs/fresh',
                  postedAt: new Date('2026-08-20T12:00:00.000Z'),
                }),
              ],
            }),
          },
        ],
      });

      await expect(
        jobsRepository.findBySourceJobId('greenhouse', 'aging'),
      ).resolves.toMatchObject({ isActive: false });
    },
  );

  it('labels known consultancies on upsert', async () => {
    const db = await createTestDb();

    await runIngestion({
      db,
      sources: [
        {
          name: 'greenhouse',
          fetchJobs: async () => ({
            complete: true,
            jobs: [
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
          }),
        },
      ],
    });

    await expect(
      createCompaniesRepository(db).findBySlug('bairesdev'),
    ).resolves.toMatchObject({ kind: 'consultancy' });
  });
});
