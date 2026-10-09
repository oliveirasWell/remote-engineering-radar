import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { JOB_CLICK_ERRORS } from '@/lib/jobs/constants';
import { recordJobClick } from './record-job-click';

const INVALID_JOB_ID = 'not-a-job';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

describe('recordJobClick', () => {
  it('rejects an id that is not a job uuid', async () => {
    await expect(recordJobClick(INVALID_JOB_ID)).resolves.toEqual({
      ok: false,
      error: JOB_CLICK_ERRORS.invalid,
    });
    expect(getDb).not.toHaveBeenCalled();
  });

  it('increments the stored count and reports a missing job', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db);
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const created = await createJobsRepository(db).create({
      ...TEST_JOB,
      companyId: company.id,
      technologies: [...TEST_JOB.technologies],
    });
    const missingJobId = '00000000-0000-4000-8000-000000000001';

    await expect(recordJobClick(created.id)).resolves.toEqual({
      ok: true,
      clickCount: 1,
    });
    await expect(recordJobClick(missingJobId)).resolves.toEqual({
      ok: false,
      error: JOB_CLICK_ERRORS.missing,
    });
  });
});
