import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { getCompaniesPageData } from './get-companies-page-data';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

describe('getCompaniesPageData', () => {
  it('shows companies whose jobs predate the geographies column', async () => {
    // The migration backfills `[]`, so every existing row looks geography-less
    // until a full re-ingest. The default view must still surface them.
    const db = await createTestDb();
    // `getDb` is typed to the postgres-js driver; tests run the PGlite one.
    vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
    const company = await createCompaniesRepository(db).create({
      ...TEST_COMPANY,
      hiringScore: 20,
    });
    await createJobsRepository(db).create({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
      geographies: [],
      postedAt: new Date(),
    });

    const data = await getCompaniesPageData();

    expect(data.companies.map((item) => item.slug)).toEqual([
      TEST_COMPANY.slug,
    ]);
  });
});
