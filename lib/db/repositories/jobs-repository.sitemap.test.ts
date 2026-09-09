import { JOB_MAX_AGE_MS, REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { createTestDb } from '../test/create-test-db';
import { createJobsRepository } from './jobs-repository';
import { createCompaniesRepository } from './companies-repository';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

const NOW = new Date('2026-09-09T12:00:00Z');
const CUTOFF = new Date(NOW.getTime() - JOB_MAX_AGE_MS);
const EXPIRED = new Date(CUTOFF.getTime() - 1);

describe('sitemap jobs query', () => {
  it('includes every public job at the age boundary but excludes inactive, expired, and nonremote rows', async () => {
    // Isolated PGlite fixture only; never connects to the application database.
    const db = await createTestDb();
    const repository = createJobsRepository(db);
    expect(repository).toHaveProperty('listSitemapJobs', expect.any(Function));
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const inputs = [
      ...Array.from({ length: 105 }, () => ({ postedAt: NOW })),
      { postedAt: CUTOFF },
      { postedAt: null, firstSeenAt: CUTOFF },
      { postedAt: EXPIRED, firstSeenAt: NOW },
      { postedAt: null, firstSeenAt: EXPIRED },
      { postedAt: NOW, isActive: false },
      { postedAt: NOW, remotePolicy: 'hybrid' },
      { postedAt: NOW, remotePolicy: 'onsite' },
      { postedAt: NOW, remotePolicy: undefined },
    ];
    const created = await Promise.all(
      inputs.map((input, index) =>
        repository.create({
          ...TEST_JOB,
          companyId: company.id,
          sourceJobId: `${TEST_JOB.sourceJobId}-${index}`,
          technologies: [...TEST_JOB.technologies],
          remotePolicy: REMOTE_POLICY_REMOTE,
          ...input,
        }),
      ),
    );
    const result = await repository.listSitemapJobs(NOW);
    expect(result).toStrictEqual(
      created
        .slice(0, 107)
        .map(({ id }) => ({ id }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    );
  });
});
