import { createTestDb } from '@/lib/db/test/create-test-db';
import { LANE_STRATEGIES_DATA_MIGRATION } from './constants';
import { DATA_MIGRATIONS } from './registry';
import { runPendingDataMigrations } from './run-data-migrations';

const FIRST_MIGRATION = 'test-first';
const SECOND_MIGRATION = 'test-second';

describe('runPendingDataMigrations', () => {
  it('registers the lane-strategies backfill that ships with the classifier', () => {
    expect(DATA_MIGRATIONS.map((migration) => migration.name)).toContain(
      LANE_STRATEGIES_DATA_MIGRATION,
    );
  });

  it('runs an unapplied migration once and skips it the next time', async () => {
    const db = await createTestDb();
    const ran: string[] = [];
    const migrations = [
      {
        name: FIRST_MIGRATION,
        up: async () => {
          ran.push(FIRST_MIGRATION);
        },
      },
      {
        name: SECOND_MIGRATION,
        up: async () => {
          ran.push(SECOND_MIGRATION);
        },
      },
    ];

    await expect(runPendingDataMigrations(db, migrations)).resolves.toEqual([
      FIRST_MIGRATION,
      SECOND_MIGRATION,
    ]);
    await expect(runPendingDataMigrations(db, migrations)).resolves.toEqual([]);
    expect(ran).toEqual([FIRST_MIGRATION, SECOND_MIGRATION]);
  });
});
