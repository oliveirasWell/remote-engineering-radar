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
    expect(second.companyId).toBe(secondCompany.id);
    expect(second.title).toBe('Updated Engineer');
    await expect(jobsRepository.listActiveByScore()).resolves.toHaveLength(1);
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
});
