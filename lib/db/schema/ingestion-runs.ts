import { index, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

export const ingestionRuns = pgTable(
  'ingestion_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    persistedJobs: integer('persisted_jobs').notNull().default(0),
    companiesUpdated: integer('companies_updated').notNull().default(0),
  },
  (table) => [index('ingestion_runs_completed_at_idx').on(table.completedAt)],
);
