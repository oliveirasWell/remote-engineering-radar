import { sql, type SQL } from 'drizzle-orm';
import { jobs } from '../schema/jobs';

/**
 * `coalesce(posted_at, first_seen_at) <operator> cutoff`.
 *
 * The cutoff is bound as an ISO string with an explicit cast. Inside a raw
 * `sql` template drizzle has no column to infer a type from, and postgres-js
 * then refuses to serialize a bare `Date` ("The 'string' argument must be of
 * type string ... Received an instance of Date"). PGlite accepts the Date, so
 * the repository tests cannot catch this on their own.
 */
export const coalescedPostedAt = (operator: '>=' | '<', cutoff: Date): SQL =>
  sql`coalesce(${jobs.postedAt}, ${jobs.firstSeenAt}) ${sql.raw(operator)} ${cutoff.toISOString()}::timestamptz`;
