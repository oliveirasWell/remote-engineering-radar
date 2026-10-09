import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { INGEST_NEW_JOBS_LOOKBACK_MS } from './constants';
import { readLatestIngestNewJobs } from './read-latest-ingest-new-jobs';

const PREVIOUS_COMPLETED_AT = new Date('2026-10-01T00:00:00.000Z');
const LATEST_COMPLETED_AT = new Date('2026-10-02T00:00:00.000Z');
const NEW_JOB_FIRST_SEEN_AT = new Date('2026-10-01T12:00:00.000Z');
const BOUNDARY_JOB_FIRST_SEEN_AT = LATEST_COMPLETED_AT;
const OLD_JOB_FIRST_SEEN_AT = PREVIOUS_COMPLETED_AT;
const AFTER_RUN_FIRST_SEEN_AT = new Date('2026-10-02T00:00:01.000Z');
const HYBRID_REMOTE_POLICY = 'hybrid';

describe('readLatestIngestNewJobs', () => {
  it('returns null when no ingest has completed', async () => {
    const db = await createTestDb();

    await expect(readLatestIngestNewJobs(db)).resolves.toBeNull();
  });

  it('counts active remote jobs first seen during the latest ingest window', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobsRepository = createJobsRepository(db);
    const runs = createIngestionRunsRepository(db);
    const openings = [
      {
        sourceJobId: 'new',
        firstSeenAt: NEW_JOB_FIRST_SEEN_AT,
        isActive: true,
      },
      {
        sourceJobId: 'boundary',
        firstSeenAt: BOUNDARY_JOB_FIRST_SEEN_AT,
        isActive: true,
      },
      {
        sourceJobId: 'old',
        firstSeenAt: OLD_JOB_FIRST_SEEN_AT,
        isActive: true,
      },
      {
        sourceJobId: 'after',
        firstSeenAt: AFTER_RUN_FIRST_SEEN_AT,
        isActive: true,
      },
      {
        sourceJobId: 'inactive',
        firstSeenAt: NEW_JOB_FIRST_SEEN_AT,
        isActive: false,
      },
      {
        sourceJobId: 'hybrid',
        firstSeenAt: NEW_JOB_FIRST_SEEN_AT,
        isActive: true,
        remotePolicy: HYBRID_REMOTE_POLICY,
      },
    ];

    for (const opening of openings) {
      await jobsRepository.create({
        ...TEST_JOB,
        ...opening,
        companyId: company.id,
        technologies: [...TEST_JOB.technologies],
        remotePolicy: opening.remotePolicy ?? REMOTE_POLICY_REMOTE,
      });
    }
    await runs.record({
      completedAt: PREVIOUS_COMPLETED_AT,
      persistedJobs: 1,
      companiesUpdated: 1,
    });
    await runs.record({
      completedAt: LATEST_COMPLETED_AT,
      persistedJobs: 2,
      companiesUpdated: 1,
    });

    await expect(readLatestIngestNewJobs(db)).resolves.toBe(2);
  });

  it('looks back one day when only one ingest exists', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const jobsRepository = createJobsRepository(db);
    const completedAt = LATEST_COMPLETED_AT;
    const inside = new Date(
      completedAt.getTime() - INGEST_NEW_JOBS_LOOKBACK_MS + 1,
    );
    const outside = new Date(
      completedAt.getTime() - INGEST_NEW_JOBS_LOOKBACK_MS,
    );

    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'inside',
      technologies: [...TEST_JOB.technologies],
      firstSeenAt: inside,
    });
    await jobsRepository.create({
      ...TEST_JOB,
      companyId: company.id,
      sourceJobId: 'outside',
      technologies: [...TEST_JOB.technologies],
      firstSeenAt: outside,
    });
    await createIngestionRunsRepository(db).record({
      completedAt,
      persistedJobs: 2,
      companiesUpdated: 1,
    });

    await expect(readLatestIngestNewJobs(db)).resolves.toBe(1);
  });
});
