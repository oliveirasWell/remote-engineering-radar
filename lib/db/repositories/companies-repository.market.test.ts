import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import { createTestDb } from '../test/create-test-db';
import { createCompaniesRepository } from './companies-repository';
import { createJobsRepository } from './jobs-repository';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

describe('createCompaniesRepository market filter', () => {
  it('lists only companies with recent Brazil or LATAM jobs when market is brazil', async () => {
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
    const usCompany = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'us-co',
      name: 'US Co',
      hiringScore: 30,
    });

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: brazilCompany.id,
      sourceJobId: 'br-1',
      technologies: [...TEST_JOB.technologies],
      geographies: ['brazil'],
      postedAt: new Date('2026-08-20T12:00:00.000Z'),
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: usCompany.id,
      sourceJobId: 'us-1',
      technologies: [...TEST_JOB.technologies],
      geographies: ['americas'],
      postedAt: new Date('2026-08-20T12:00:00.000Z'),
    });

    const brazilMarket = await companiesRepository.listByHiringScore({
      market: 'brazil',
      maxJobAgeMs: JOB_MAX_AGE_MS,
      now,
    });
    const allMarket = await companiesRepository.listByHiringScore({
      market: 'all',
    });

    expect(brazilMarket.map((company) => company.slug)).toEqual(['brazil-co']);
    expect(allMarket.map((company) => company.slug)).toEqual([
      'us-co',
      'brazil-co',
    ]);
  });
});
