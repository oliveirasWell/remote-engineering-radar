import { createTestDb } from '@/lib/db/test/create-test-db';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { buildSourceMetricsReport } from './source-metrics-report';

const NOW = new Date('2026-11-19T12:00:00.000Z');
const DAY_MS = 86_400_000;

describe('buildSourceMetricsReport', () => {
  it('averages recent runs per source and counts active jobs also on Himalayas', async () => {
    const db = await createTestDb();
    const runs = createIngestionRunsRepository(db);
    const jobs = createJobsRepository(db);
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const job = (source: string, sourceJobId: string, title: string) => ({
      ...TEST_JOB,
      technologies: [...TEST_JOB.technologies],
      companyId: company.id,
      source,
      sourceJobId,
      title,
    });

    for (const [completedAt, greenhouseNew] of [
      [new Date(NOW.getTime() - DAY_MS), 4],
      [NOW, 2],
      [new Date(NOW.getTime() - 30 * DAY_MS), 100],
    ] as const) {
      await runs.record({
        completedAt,
        persistedJobs: 0,
        companiesUpdated: 0,
        sources: [
          {
            source: 'greenhouse',
            fetched: 10,
            eligible: 6,
            persisted: 5,
            newJobs: greenhouseNew,
            medianAgeHours: 12,
          },
          {
            source: 'himalayas',
            fetched: 2000,
            eligible: 300,
            persisted: 250,
            newJobs: 40,
            medianAgeHours: 96,
          },
        ],
      });
    }
    await jobs.create(job('greenhouse', 'gh-1', 'Senior Frontend Engineer'));
    await jobs.create(job('greenhouse', 'gh-2', 'Staff Backend Engineer'));
    await jobs.create(job('himalayas', 'hm-1', 'senior frontend engineer'));

    const report = await buildSourceMetricsReport(db, { now: NOW, days: 7 });

    expect(report).toEqual([
      {
        source: 'greenhouse',
        runs: 2,
        fetched: 10,
        eligible: 6,
        persisted: 5,
        newJobs: 3,
        medianAgeHours: 12,
        activeJobs: 2,
        alsoOnHimalayas: 1,
      },
      {
        source: 'himalayas',
        runs: 2,
        fetched: 2000,
        eligible: 300,
        persisted: 250,
        newJobs: 40,
        medianAgeHours: 96,
        activeJobs: 1,
        alsoOnHimalayas: 0,
      },
    ]);
  });
});
