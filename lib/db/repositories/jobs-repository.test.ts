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
    await expect(
      jobsRepository.updateScore(created.id, 10),
    ).resolves.toBeNull();
    await expect(jobsRepository.deactivate(created.id)).resolves.toBeNull();
    await expect(jobsRepository.deleteById(created.id)).resolves.toBe(false);
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
    expect(second.companyId).toBe(secondCompany.id);
    expect(second.title).toBe('Updated Engineer');
    await expect(jobsRepository.listActiveByScore()).resolves.toHaveLength(1);
  });

  it('preserves score, postedAt, and firstSeenAt while refreshing lastSeenAt', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);
    const firstSeenAt = new Date('2025-01-01T00:00:00.000Z');
    const lastSeenAt = new Date('2025-01-02T00:00:00.000Z');
    const postedAt = new Date('2024-12-20T00:00:00.000Z');

    const first = await jobsRepository.upsertBySourceJobId({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
      firstSeenAt,
      lastSeenAt,
      postedAt,
    });
    const second = await jobsRepository.upsertBySourceJobId({
      companyId: company.id,
      source: TEST_JOB.source,
      sourceJobId: TEST_JOB.sourceJobId,
      title: 'Updated title',
      url: TEST_JOB.url,
    });

    expect(second).toMatchObject({
      id: first.id,
      score: TEST_JOB.score,
      postedAt,
      firstSeenAt,
    });
    expect(second.lastSeenAt.getTime()).toBeGreaterThan(lastSeenAt.getTime());
  });

  it('applies score, JSON, enum-like, and literal case-insensitive filters', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      location: 'Remote 100% LATAM',
      score: 88,
      technologies: ['React', 'TypeScript'],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'filter-decoy',
      location: 'Remote 100X LATAM',
      technologies: ['TypeScript'],
    });

    const filtered = await jobsRepository.listActiveByScore({
      minimumScore: 88,
      technology: 'React',
      seniority: 'senior',
      remotePolicy: 'remote',
      location: '100% latam',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.sourceJobId).toBe(TEST_JOB.sourceJobId);
  });

  it('rejects JSON values that do not satisfy the domain string-array type', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const row = await db.job.create({
      data: {
        ...TEST_JOB,
        companyId: company.id,
        technologies: { React: true },
      },
    });

    await expect(createJobsRepository(db).findById(row.id)).rejects.toThrow(
      'expected an array of strings',
    );
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

    expect(deactivated).toHaveLength(1);
    expect(deactivated[0]?.sourceJobId).toBe('missing-job');
    await expect(
      jobsRepository.findBySourceJobId(TEST_JOB.source, 'present-job'),
    ).resolves.toMatchObject({ isActive: true });
  });

  it('deactivates every active source job for an empty snapshot', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobsRepository = createJobsRepository(db);
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      source: 'ashby',
      sourceJobId: 'other-source',
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
    });

    const deactivated = await jobsRepository.deactivateMissingBySource(
      TEST_JOB.source,
      [],
    );
    expect(deactivated).toHaveLength(1);
    await expect(
      jobsRepository.findBySourceJobId('ashby', 'other-source'),
    ).resolves.toMatchObject({ isActive: true });
  });
});
