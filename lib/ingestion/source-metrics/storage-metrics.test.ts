import { createTestDb } from '@/lib/db/test/create-test-db';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { readStorageMetrics } from './storage-metrics';

describe('readStorageMetrics', () => {
  it('reports the database size and active jobs per work model', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobs = createJobsRepository(db);
    for (const [sourceJobId, remotePolicy] of [
      ['remote-1', 'remote'],
      ['remote-2', 'remote'],
      ['hybrid-1', 'hybrid'],
    ] as const) {
      await jobs.create({
        ...TEST_JOB,
        technologies: [...TEST_JOB.technologies],
        companyId: company.id,
        sourceJobId,
        remotePolicy,
      });
    }

    const metrics = await readStorageMetrics(db);

    expect(metrics.databaseBytes).toBeGreaterThan(0);
    expect(metrics.activeJobsByWorkModel).toEqual({ hybrid: 1, remote: 2 });
  });
});
