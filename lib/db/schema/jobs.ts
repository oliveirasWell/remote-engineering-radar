import {
  boolean,
  integer,
  jsonb,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    source: text('source').notNull(),
    sourceJobId: text('source_job_id').notNull(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    location: text('location'),
    remotePolicy: text('remote_policy'),
    description: text('description'),
    technologies: jsonb('technologies').$type<string[]>().notNull().default([]),
    geographies: jsonb('geographies').$type<string[]>().notNull().default([]),
    seniority: text('seniority'),
    score: integer('score').notNull().default(0),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('jobs_source_source_job_id_unique').on(
      table.source,
      table.sourceJobId,
    ),
    index('jobs_company_id_idx').on(table.companyId),
    index('jobs_active_score_posted_at_idx').on(
      table.isActive,
      table.score,
      table.postedAt,
    ),
  ],
);
