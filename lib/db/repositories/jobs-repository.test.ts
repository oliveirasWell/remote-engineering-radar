import { JOB_MAX_AGE_MS, JOB_RETENTION_MS } from '@/lib/jobs/constants';
import { createCompaniesRepository } from './companies-repository';
import { createJobsRepository } from './jobs-repository';
import { createTestDb } from '../test/create-test-db';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

describe('createJobsRepository', () => {
  it('supports create, read, update, deactivate, and delete', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);

    const created = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
    });

    expect(created).toMatchObject({
      companyId: company.id,
      source: TEST_JOB.source,
      sourceJobId: TEST_JOB.sourceJobId,
      title: TEST_JOB.title,
      url: TEST_JOB.url,
      location: TEST_JOB.location,
      remotePolicy: TEST_JOB.remotePolicy,
      technologies: [...TEST_JOB.technologies],
      seniority: TEST_JOB.seniority,
      score: TEST_JOB.score,
      isActive: true,
    });

    await expect(jobsRepository.findById(created.id)).resolves.toEqual(created);
    await expect(
      jobsRepository.findBySourceJobId(TEST_JOB.source, TEST_JOB.sourceJobId),
    ).resolves.toEqual(created);
    await expect(jobsRepository.listByCompanyId(company.id)).resolves.toEqual([
      created,
    ]);

    const scored = await jobsRepository.updateScore(created.id, 95);
    expect(scored?.score).toBe(95);

    const deactivated = await jobsRepository.deactivate(created.id);
    expect(deactivated?.isActive).toBe(false);

    await expect(jobsRepository.deleteById(created.id)).resolves.toBe(true);
    await expect(jobsRepository.findById(created.id)).resolves.toBeNull();
  });

  it('rejects duplicate source + sourceJobId pairs', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
    });

    await expect(
      jobsRepository.create({
        ...TEST_JOB,
        companyId: company.id,
        technologies: [...TEST_JOB.technologies],
      }),
    ).rejects.toThrow();
  });

  it('atomically upserts a job and updates its company', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const firstCompany = await companiesRepository.create(TEST_COMPANY);
    const secondCompany = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'other-company',
      name: 'Other Company',
    });

    const first = await jobsRepository.upsertBySourceJobId({
      ...TEST_JOB,
      companyId: firstCompany.id,
      technologies: [...TEST_JOB.technologies],
    });
    const second = await jobsRepository.upsertBySourceJobId({
      ...TEST_JOB,
      companyId: secondCompany.id,
      title: 'Updated Engineer',
      technologies: [...TEST_JOB.technologies],
    });

    expect(second.id).toBe(first.id);
    await expect(jobsRepository.findById(second.id)).resolves.toMatchObject({
      companyId: secondCompany.id,
      title: 'Updated Engineer',
    });
    await expect(jobsRepository.listActiveByScore()).resolves.toHaveLength(1);
  });

  it('filters active jobs older than maxAgeMs', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);
    const now = new Date('2026-08-31T12:00:00.000Z');

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'recent',
      technologies: [...TEST_JOB.technologies],
      postedAt: new Date('2026-08-20T12:00:00.000Z'),
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'old',
      technologies: [...TEST_JOB.technologies],
      postedAt: new Date('2026-03-01T12:00:00.000Z'),
    });

    const recent = await jobsRepository.listActiveByScore({
      maxAgeMs: 1000 * 60 * 60 * 24 * 30,
      now,
    });

    expect(recent).toHaveLength(1);
    expect(recent[0]?.sourceJobId).toBe('recent');
  });

  it('deactivates only jobs missing from a successful source snapshot', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'missing-job',
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'present-job',
      technologies: [...TEST_JOB.technologies],
    });

    const deactivated = await jobsRepository.deactivateMissingBySource(
      TEST_JOB.source,
      ['present-job'],
    );

    expect(deactivated).toEqual([{ companyId: company.id }]);
    await expect(
      jobsRepository.findBySourceJobId(TEST_JOB.source, 'missing-job'),
    ).resolves.toMatchObject({ isActive: false });
    await expect(
      jobsRepository.findBySourceJobId(TEST_JOB.source, 'present-job'),
    ).resolves.toMatchObject({ isActive: true });
  });
  it('lists recent card rows for many companies without shipping descriptions', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date('2026-09-08T00:00:00Z');
    const first = await companiesRepository.create(TEST_COMPANY);
    const second = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'globex',
      name: 'Globex',
    });

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: first.id,
      sourceJobId: 'recent-remote',
      postedAt: now,
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: second.id,
      sourceJobId: 'other-company',
      postedAt: now,
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: first.id,
      sourceJobId: 'too-old',
      postedAt: new Date(now.getTime() - JOB_MAX_AGE_MS - 1),
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: first.id,
      sourceJobId: 'not-remote',
      remotePolicy: 'hybrid',
      postedAt: now,
      technologies: [...TEST_JOB.technologies],
    });
    const inactive = await jobsRepository.create({
      ...TEST_JOB,
      companyId: first.id,
      sourceJobId: 'inactive',
      postedAt: now,
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.deactivate(inactive.id);

    const cards = await jobsRepository.listCardsByCompanyIds(
      [first.id, second.id],
      { maxAgeMs: JOB_MAX_AGE_MS, now },
    );

    expect(cards.map((card) => card.sourceJobId).sort()).toEqual([
      'other-company',
      'recent-remote',
    ]);
    for (const card of cards) {
      expect(card).not.toHaveProperty('description');
    }
  });

  it('deletes inactive jobs past the retention window and keeps the rest', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date('2026-09-08T00:00:00Z');
    const company = await companiesRepository.create(TEST_COMPANY);

    const stale = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'stale',
      postedAt: new Date(now.getTime() - JOB_RETENTION_MS - 1),
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.deactivate(stale.id);

    const recentInactive = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'recent-inactive',
      postedAt: now,
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.deactivate(recentInactive.id);

    const active = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'still-active',
      postedAt: new Date(now.getTime() - JOB_RETENTION_MS - 1),
      technologies: [...TEST_JOB.technologies],
    });

    const deleted = await jobsRepository.deleteInactiveOlderThan(
      JOB_RETENTION_MS,
      now,
    );

    expect(deleted).toBe(1);
    await expect(jobsRepository.findById(stale.id)).resolves.toBeNull();
    await expect(
      jobsRepository.findById(recentInactive.id),
    ).resolves.not.toBeNull();
    await expect(jobsRepository.findById(active.id)).resolves.not.toBeNull();
  });
});
