import { Prisma } from '@prisma/client';
import { createTestDb, disconnectTestDb } from './create-test-db';

describe('createTestDb', () => {
  it('applies migrations and creates the canonical tables', async () => {
    const db = await createTestDb();

    const rows = await db.$queryRaw<{ table_name: string }[]>(Prisma.sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('companies', 'jobs', 'hiring_signals')
      order by table_name
    `);

    const tableNames = rows.map((row) => row.table_name);
    expect(tableNames).toEqual(['companies', 'hiring_signals', 'jobs']);
  });

  it('supports explicit idempotent test-client disconnect', async () => {
    const db = await createTestDb();

    await expect(disconnectTestDb(db)).resolves.toBeUndefined();
    await expect(disconnectTestDb(db)).resolves.toBeUndefined();
  });
});
