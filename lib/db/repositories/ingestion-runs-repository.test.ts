import { createIngestionRunsRepository } from './ingestion-runs-repository';
import { createTestDb } from '../test/create-test-db';

describe('createIngestionRunsRepository', () => {
  it('records a run and returns the latest completedAt', async () => {
    const db = await createTestDb();
    const repository = createIngestionRunsRepository(db);
    const firstCompletedAt = new Date('2026-08-30T10:00:00.000Z');

    await repository.record({
      completedAt: firstCompletedAt,
      persistedJobs: 10,
      companiesUpdated: 3,
    });

    expect(await repository.getLatestCompletedAt()).toEqual(firstCompletedAt);

    const secondCompletedAt = new Date('2026-08-31T12:00:00.000Z');
    await repository.record({
      completedAt: secondCompletedAt,
      persistedJobs: 12,
      companiesUpdated: 4,
    });

    expect(await repository.getLatestCompletedAt()).toEqual(secondCompletedAt);
  });
});
