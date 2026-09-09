import { JOB_MAX_AGE_MS, REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { createTestDb } from '../test/create-test-db';
import { createCompaniesRepository } from './companies-repository';
import { createJobsRepository } from './jobs-repository';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

describe('createCompaniesRepository country filter', () => {
  it('lists only companies with recent remote jobs in the selected country', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date('2026-08-31T12:00:00.000Z');

    const brazilCompany = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'brazil-co',
      name: 'Brazil Co',
      hiringScore: 20,
    });
    const chileCompany = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'chile-co',
      name: 'Chile Co',
      hiringScore: 30,
    });

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: brazilCompany.id,
      sourceJobId: 'br-1',
      technologies: [...TEST_JOB.technologies],
      countries: ['brazil'],
      remotePolicy: REMOTE_POLICY_REMOTE,
      postedAt: new Date('2026-08-20T12:00:00.000Z'),
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: chileCompany.id,
      sourceJobId: 'cl-1',
      technologies: [...TEST_JOB.technologies],
      countries: ['chile'],
      remotePolicy: REMOTE_POLICY_REMOTE,
      postedAt: new Date('2026-08-20T12:00:00.000Z'),
    });

    const brazilOnly = await companiesRepository.listByHiringScore({
      country: 'brazil',
      maxJobAgeMs: JOB_MAX_AGE_MS,
      now,
    });
    const allCompanies = await companiesRepository.listByHiringScore({
      maxJobAgeMs: JOB_MAX_AGE_MS,
      now,
    });

    expect(brazilOnly.map((company) => company.slug)).toEqual(['brazil-co']);
    expect(allCompanies.map((company) => company.slug)).toEqual([
      'chile-co',
      'brazil-co',
    ]);
  });

  it('excludes companies without remote jobs', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const company = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'onsite-co',
      name: 'Onsite Co',
      hiringScore: 20,
    });

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'onsite-1',
      technologies: [...TEST_JOB.technologies],
      countries: ['brazil'],
      remotePolicy: 'onsite',
      postedAt: new Date('2026-08-20T12:00:00.000Z'),
    });

    await expect(companiesRepository.listByHiringScore()).resolves.toEqual([]);
  });

  it('excludes companies whose jobs are all stale', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date('2026-08-31T12:00:00.000Z');

    const company = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'stale-co',
      name: 'Stale Co',
      hiringScore: 20,
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'stale-1',
      technologies: [...TEST_JOB.technologies],
      countries: ['brazil'],
      remotePolicy: REMOTE_POLICY_REMOTE,
      postedAt: new Date(now.getTime() - JOB_MAX_AGE_MS - 1),
    });

    await expect(
      companiesRepository.listByHiringScore({
        maxJobAgeMs: JOB_MAX_AGE_MS,
        now,
      }),
    ).resolves.toEqual([]);
  });
});
