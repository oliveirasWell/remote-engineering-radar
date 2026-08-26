import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const hiringSignals = pgTable('hiring_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id),
  type: text('type').notNull(),
  description: text('description').notNull(),
  sourceUrl: text('source_url'),
  score: integer('score').notNull().default(0),
  detectedAt: timestamp('detected_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
