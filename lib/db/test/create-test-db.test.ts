import { sql } from 'drizzle-orm';
import { createTestDb } from './create-test-db';

describe('createTestDb', () => {
  it('applies migrations and creates the canonical tables', async () => {
    const db = await createTestDb();

    const result = await db.execute<{ table_name: string }>(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('companies', 'jobs', 'hiring_signals')
      order by table_name
    `);

    const rows = Array.isArray(result) ? result : result.rows;
    const tableNames = rows.map((row) => row.table_name);
    expect(tableNames).toEqual(['companies', 'hiring_signals', 'jobs']);
  });
});
