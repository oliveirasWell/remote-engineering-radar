import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import { getCompaniesPageData } from './get-companies-page-data';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

/** Counts query builders created, so an N+1 shows up as growth. */
const countingDb = (db: Awaited<ReturnType<typeof createTestDb>>) => {
  const counter = { selects: 0 };
  const proxy = new Proxy(db, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (property === 'select' && typeof value === 'function') {
        return (...args: unknown[]) => {
          counter.selects += 1;
          return value.apply(target, args);
        };
      }
      return value;
    },
  });
  return { proxy, counter };
};

const seedCompanies = async (
  db: Awaited<ReturnType<typeof createTestDb>>,
  count: number,
) => {
  const companiesRepository = createCompaniesRepository(db);
  const jobsRepository = createJobsRepository(db);

  for (let index = 0; index < count; index += 1) {
    const company = await companiesRepository.create({
      ...TEST_COMPANY,
      name: `Company ${index}`,
      slug: `company-${index}`,
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: `job-${index}`,
      postedAt: new Date(),
      technologies: [...TEST_JOB.technologies],
    });
  }
};

describe('getCompaniesPageData', () => {
  it('returns only recent remote jobs, grouped under their company', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db);
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobsRepository = createJobsRepository(db);

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'visible',
      postedAt: new Date(),
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'too-old',
      postedAt: new Date(Date.now() - JOB_MAX_AGE_MS - 1),
      technologies: [...TEST_JOB.technologies],
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'hybrid',
      remotePolicy: 'hybrid',
      postedAt: new Date(),
      technologies: [...TEST_JOB.technologies],
    });

    const data = await getCompaniesPageData();

    expect(data.companies).toHaveLength(1);
    expect(data.companies[0]?.openEngineeringJobs).toBe(1);
    expect(data.companies[0]?.jobs.map((job) => job.title)).toEqual([
      TEST_JOB.title,
    ]);
  });

  it('does not issue more queries as the number of companies grows', async () => {
    const fewDb = await createTestDb();
    await seedCompanies(fewDb, 2);
    const few = countingDb(fewDb);
    vi.mocked(getDb).mockReturnValue(few.proxy);
    await getCompaniesPageData();

    const manyDb = await createTestDb();
    await seedCompanies(manyDb, 8);
    const many = countingDb(manyDb);
    vi.mocked(getDb).mockReturnValue(many.proxy);
    const data = await getCompaniesPageData();

    expect(data.companies).toHaveLength(8);
    // Non-zero guards against a vacuous pass; equality is the N+1 guard.
    expect(few.counter.selects).toBeGreaterThan(0);
    expect(many.counter.selects).toBe(few.counter.selects);
  });
});
