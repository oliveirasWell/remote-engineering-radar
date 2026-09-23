import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { reclassifyActiveJobs } from './reclassify-active-jobs';

const SALES_TITLE = 'Sales Representative';

describe('reclassifyActiveJobs', () => {
  it('rewrites roleFocus and deactivates jobs the classifier rejects', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobsRepository = createJobsRepository(db);
    const kept = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'keep',
      title: TEST_JOB.title,
      technologies: [...TEST_JOB.technologies],
    });
    const dropped = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'drop',
      title: SALES_TITLE,
      technologies: [...TEST_JOB.technologies],
    });

    const result = await reclassifyActiveJobs(db);

    expect(result.reclassified).toBe(2);
    expect(result.deactivated).toEqual([`${dropped.id} | ${SALES_TITLE}`]);
    await expect(jobsRepository.findById(kept.id)).resolves.toMatchObject({
      isActive: true,
      roleFocus: expect.arrayContaining(['frontend', 'software']),
    });
    await expect(
      db.job.findUnique({ where: { id: dropped.id } }),
    ).resolves.toMatchObject({ isActive: false });
  });

  it('does not write on dry-run', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobsRepository = createJobsRepository(db);
    const dropped = await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'drop',
      title: SALES_TITLE,
      technologies: [...TEST_JOB.technologies],
    });

    const result = await reclassifyActiveJobs(db, { dryRun: true });

    expect(result.deactivated).toEqual([`${dropped.id} | ${SALES_TITLE}`]);
    await expect(
      db.job.findUnique({ where: { id: dropped.id } }),
    ).resolves.toMatchObject({ isActive: true });
  });
});
