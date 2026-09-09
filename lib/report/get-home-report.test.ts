import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { getHomeReport } from './get-home-report';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

describe('getHomeReport', () => {
  it('uses the latest ingestion run for updatedAt', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db as ReturnType<typeof getDb>);
    const ingestionCompletedAt = new Date('2026-08-31T15:15:09.000Z');
    const company = await createCompaniesRepository(db).create({
      name: 'Acme Robotics',
      slug: 'acme-robotics',
      source: 'frontendbr',
    });
    await createJobsRepository(db).create({
      companyId: company.id,
      source: 'frontendbr',
      sourceJobId: '8542',
      title: 'Desenvolvedor Frontend',
      url: 'https://github.com/frontendbr/vagas/issues/8542',
      technologies: ['React', 'TypeScript'],
      seniority: 'senior',
      score: 50,
      postedAt: new Date('2026-08-28T01:46:54.000Z'),
    });
    await createIngestionRunsRepository(db).record({
      completedAt: ingestionCompletedAt,
      persistedJobs: 1,
      companiesUpdated: 1,
    });

    const report = await getHomeReport();

    expect(report.updatedAt).toEqual(ingestionCompletedAt);
  });
});
