import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { getJobDetailData, getJobsPageData } from './get-jobs-page-data';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

describe('getJobsPageData', () => {
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
