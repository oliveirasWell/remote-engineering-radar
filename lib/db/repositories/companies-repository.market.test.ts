import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import { createTestDb } from '../test/create-test-db';
import { createCompaniesRepository } from './companies-repository';
import { createJobsRepository } from './jobs-repository';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

describe('createCompaniesRepository market filter', () => {
  it('excludes companies whose jobs are all stale, in every market', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date('2026-08-31T12:00:00.000Z');

    const company = await companiesRepository.create({
      ...TEST_COMPANY,
      hiringScore: 20,
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
      geographies: ['worldwide'],
      postedAt: new Date(now.getTime() - JOB_MAX_AGE_MS - 1),
    });

    await expect(
      companiesRepository.listByHiringScore({
        market: 'all',
        maxJobAgeMs: JOB_MAX_AGE_MS,
        now,
      }),
    ).resolves.toEqual([]);
  });
});
