import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { createTestDb } from '@/lib/db/test/create-test-db';
import type { Job } from '@/lib/jobs/types';
import { getJobDetailData, getJobsPageData } from './get-jobs-page-data';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock(
  '@/lib/db/repositories/companies-repository',
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import('@/lib/db/repositories/companies-repository')
      >();
    return {
      ...original,
      createCompaniesRepository: vi.fn(original.createCompaniesRepository),
    };
  },
);

const MISSING_COMPANY_JOB = {
  source: 'frontendbr',
  sourceJobId: 'missing-company',
  title: 'Senior Frontend Engineer',
  url: 'https://example.com/jobs/missing-company',
  remotePolicy: 'remote',
};
const FALLBACK_NAMED_COMPANY = {
  name: 'Unknown company',
  slug: 'unknown-company',
  source: 'frontendbr',
};

const SORTING_CASES = [
  { ageMs: 7 * 24 * 60 * 60 * 1000, score: 95 },
  { ageMs: 0, score: 20 },
  { ageMs: null, score: 100 },
  { ageMs: 0, score: 60 },
];

describe('getJobsPageData', () => {
  it('orders by newest publication before limiting results and leaves undated jobs last', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db);
    const company = await createCompaniesRepository(db).create(
      FALLBACK_NAMED_COMPANY,
    );
    const jobsRepository = createJobsRepository(db);
    const now = Date.now();
    const savedJobs: Job[] = [];
    for (const [index, { ageMs, score }] of SORTING_CASES.entries()) {
      savedJobs.push(
        await jobsRepository.create({
          ...MISSING_COMPANY_JOB,
          sourceJobId: `${MISSING_COMPANY_JOB.sourceJobId}-${index}`,
          companyId: company.id,
          score,
          postedAt: ageMs === null ? undefined : new Date(now - ageMs),
        }),
      );
    }

    const newestIds = [3, 1, 0, 2].map((index) => savedJobs[index].id);
    expect((await getJobsPageData()).jobs.map((job) => job.id)).toEqual(
      newestIds,
    );
    expect(
      (await getJobsPageData({ limit: 2 })).jobs.map((job) => job.id),
    ).toEqual(newestIds.slice(0, 2));
  });

  it('distinguishes missing company names from actual names matching the fallback', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db as ReturnType<typeof getDb>);
    const companies = createCompaniesRepository(db);
    const company = await companies.create(FALLBACK_NAMED_COMPANY);
    const job = await createJobsRepository(db).create({
      ...MISSING_COMPANY_JOB,
      companyId: company.id,
    });

    expect((await getJobsPageData()).jobs[0]?.companyName).toBe(
      FALLBACK_NAMED_COMPANY.name,
    );
    expect((await getJobDetailData(job.id)).job?.companyName).toBe(
      FALLBACK_NAMED_COMPANY.name,
    );

    vi.mocked(createCompaniesRepository).mockReturnValue({
      ...companies,
      listByIds: vi.fn(async () => []),
      findById: vi.fn(async () => null),
    });
    try {
      expect((await getJobsPageData()).jobs[0]?.companyName).toBeNull();
      expect((await getJobDetailData(job.id)).job?.companyName).toBeNull();
    } finally {
      vi.mocked(createCompaniesRepository).mockReset();
    }
  });

  it('uses stored seniority when generating detail reasons', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db as ReturnType<typeof getDb>);
    const company = await createCompaniesRepository(db).create({
      name: 'Acme Robotics',
      slug: 'acme-robotics',
      source: 'frontendbr',
    });
    const job = await createJobsRepository(db).create({
      companyId: company.id,
      source: 'frontendbr',
      sourceJobId: '8542',
      title: 'Desenvolvedor Frontend',
      url: 'https://github.com/frontendbr/vagas/issues/8542',
      technologies: ['React', 'TypeScript'],
      seniority: 'senior',
      remotePolicy: 'remote',
      score: 50,
    });

    const report = await getJobsPageData();
    expect(report.jobs[0]?.id).toBe(job.id);

    const detail = await getJobDetailData(job.id);
    expect(detail.job?.reasons).toContain('Senior');
  });
});
