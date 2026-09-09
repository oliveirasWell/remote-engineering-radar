import { coalescedPostedAt } from './posted-at-filter';
import { createTestDb } from '../test/create-test-db';
import { jobs } from '../schema/jobs';

describe('coalescedPostedAt', () => {
  it('binds the cutoff as a string, never as a Date', async () => {
    // postgres-js cannot serialize a bare Date bound inside a raw `sql`
    // template, while the PGlite driver these tests run on accepts it. So the
    // guard has to be on the generated parameters, not on query results.
    const db = await createTestDb();
    const cutoff = new Date('2026-08-31T12:00:00.000Z');

    const { params } = db
      .select()
      .from(jobs)
      .where(coalescedPostedAt('>=', cutoff))
      .toSQL();

    expect(params).toContain(cutoff.toISOString());
    expect(params.some((param) => param instanceof Date)).toBe(false);
  });
});
