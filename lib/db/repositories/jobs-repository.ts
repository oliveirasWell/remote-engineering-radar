import { and, desc, eq, gte, inArray, notInArray, sql } from 'drizzle-orm';
import type { JobGeography } from '@/lib/classification/types';
import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import type { Job, JobCard, NewJob } from '@/lib/jobs/types';
import type { Db } from '../client';
import { coalescedPostedAt } from './posted-at-filter';
import { jobs } from '../schema/jobs';

const toGeographies = (value: string[]): JobGeography[] =>
  value.filter(
    (entry): entry is JobGeography =>
      entry === 'brazil' ||
      entry === 'latam' ||
      entry === 'americas' ||
      entry === 'worldwide',
  );

const toJob = (row: typeof jobs.$inferSelect): Job => ({
  id: row.id,
  companyId: row.companyId,
  source: row.source,
  sourceJobId: row.sourceJobId,
  title: row.title,
  url: row.url,
  location: row.location,
  remotePolicy: row.remotePolicy,
  description: row.description,
  technologies: row.technologies,
  geographies: toGeographies(row.geographies),
  countries: row.countries,
  seniority: row.seniority,
  score: row.score,
  postedAt: row.postedAt,
  firstSeenAt: row.firstSeenAt,
  lastSeenAt: row.lastSeenAt,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/** Every column a list view renders — notably not `description`. */
const jobCardColumns = {
  id: jobs.id,
  companyId: jobs.companyId,
  source: jobs.source,
  sourceJobId: jobs.sourceJobId,
  title: jobs.title,
  url: jobs.url,
  location: jobs.location,
  remotePolicy: jobs.remotePolicy,
  technologies: jobs.technologies,
  geographies: jobs.geographies,
  countries: jobs.countries,
  seniority: jobs.seniority,
  score: jobs.score,
  postedAt: jobs.postedAt,
  firstSeenAt: jobs.firstSeenAt,
  isActive: jobs.isActive,
} as const;

type JobCardRow = {
  [K in keyof typeof jobCardColumns]: (typeof jobs.$inferSelect)[K];
};

const toJobCard = (row: JobCardRow): JobCard => ({
  ...row,
  geographies: toGeographies(row.geographies),
});

export const createJobsRepository = (db: Db) => {
  const repository = {
    create: async (input: NewJob): Promise<Job> => {
      const now = new Date();
      const [row] = await db
        .insert(jobs)
        .values({
          companyId: input.companyId,
          source: input.source,
          sourceJobId: input.sourceJobId,
          title: input.title,
          url: input.url,
          location: input.location ?? null,
          remotePolicy: input.remotePolicy ?? null,
          description: input.description ?? null,
          technologies: input.technologies ?? [],
          geographies: input.geographies ?? [],
          countries: input.countries ?? [],
          seniority: input.seniority ?? null,
          score: input.score ?? 0,
          postedAt: input.postedAt ?? null,
          firstSeenAt: input.firstSeenAt ?? now,
          lastSeenAt: input.lastSeenAt ?? now,
          isActive: input.isActive ?? true,
        })
        .returning();

      if (!row) {
        throw new Error('Failed to create job');
      }

      return toJob(row);
    },

    findById: async (id: string): Promise<Job | null> => {
      const [row] = await db.select().from(jobs).where(eq(jobs.id, id));
      return row ? toJob(row) : null;
    },

    findBySourceJobId: async (
      source: string,
      sourceJobId: string,
    ): Promise<Job | null> => {
      const [row] = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.source, source), eq(jobs.sourceJobId, sourceJobId)));
      return row ? toJob(row) : null;
    },

    listByCompanyId: async (companyId: string): Promise<Job[]> => {
      const rows = await db
        .select()
        .from(jobs)
        .where(eq(jobs.companyId, companyId));
      return rows.map(toJob);
    },

    listCardsByCompanyIds: async (
      companyIds: string[],
      options?: { maxAgeMs?: number; now?: Date; activeOnly?: boolean },
    ): Promise<JobCard[]> => {
      if (companyIds.length === 0) {
        return [];
      }

      const filters = [inArray(jobs.companyId, companyIds)];

      if (options?.maxAgeMs !== undefined) {
        const now = options.now ?? new Date();
        const cutoff = new Date(now.getTime() - options.maxAgeMs);
        filters.push(
          eq(jobs.isActive, true),
          eq(jobs.remotePolicy, REMOTE_POLICY_REMOTE),
          coalescedPostedAt('>=', cutoff),
        );
      } else if (options?.activeOnly) {
        filters.push(eq(jobs.isActive, true));
      }

      const rows = await db
        .select(jobCardColumns)
        .from(jobs)
        .where(and(...filters))
        .orderBy(desc(jobs.score), desc(jobs.postedAt));
      return rows.map(toJobCard);
    },

    listActiveByScore: async (options?: {
      limit?: number;
      minimumScore?: number;
      technology?: string;
      seniority?: string;
      remotePolicy?: string;
      country?: string;
      location?: string;
      maxAgeMs?: number;
      now?: Date;
    }): Promise<JobCard[]> => {
      const filters = [eq(jobs.isActive, true)];

      if (options?.minimumScore !== undefined) {
        filters.push(gte(jobs.score, options.minimumScore));
      }
      if (options?.seniority) {
        filters.push(eq(jobs.seniority, options.seniority));
      }
      filters.push(
        eq(jobs.remotePolicy, options?.remotePolicy ?? REMOTE_POLICY_REMOTE),
      );
      if (options?.country) {
        filters.push(
          sql`${jobs.countries} @> ${JSON.stringify([options.country])}::jsonb`,
        );
      }
      if (options?.location) {
        filters.push(sql`${jobs.location} ilike ${`%${options.location}%`}`);
      }
      if (options?.technology) {
        filters.push(
          sql`${jobs.technologies} @> ${JSON.stringify([options.technology])}::jsonb`,
        );
      }
      if (options?.maxAgeMs !== undefined) {
        const now = options.now ?? new Date();
        const cutoff = new Date(now.getTime() - options.maxAgeMs);
        filters.push(coalescedPostedAt('>=', cutoff));
      }

      const query = db
        .select(jobCardColumns)
        .from(jobs)
        .where(and(...filters))
        .orderBy(desc(jobs.score), desc(jobs.postedAt));

      const rows =
        options?.limit !== undefined
          ? await query.limit(options.limit)
          : await query;
      return rows.map(toJobCard);
    },

    updateScore: async (id: string, score: number): Promise<Job | null> => {
      const [row] = await db
        .update(jobs)
        .set({ score, updatedAt: new Date() })
        .where(eq(jobs.id, id))
        .returning();
      return row ? toJob(row) : null;
    },

    upsertBySourceJobId: async (input: NewJob): Promise<{ id: string }> => {
      const now = new Date();
      const [row] = await db
        .insert(jobs)
        .values({
          companyId: input.companyId,
          source: input.source,
          sourceJobId: input.sourceJobId,
          title: input.title,
          url: input.url,
          location: input.location ?? null,
          remotePolicy: input.remotePolicy ?? null,
          description: input.description ?? null,
          technologies: input.technologies ?? [],
          geographies: input.geographies ?? [],
          countries: input.countries ?? [],
          seniority: input.seniority ?? null,
          score: input.score ?? 0,
          postedAt: input.postedAt ?? null,
          firstSeenAt: input.firstSeenAt ?? now,
          lastSeenAt: input.lastSeenAt ?? now,
          isActive: input.isActive ?? true,
        })
        .onConflictDoUpdate({
          target: [jobs.source, jobs.sourceJobId],
          set: {
            companyId: input.companyId,
            title: input.title,
            url: input.url,
            location: input.location ?? null,
            remotePolicy: input.remotePolicy ?? null,
            description: input.description ?? null,
            technologies: input.technologies ?? [],
            geographies: input.geographies ?? [],
            countries: input.countries ?? [],
            seniority: input.seniority ?? null,
            ...(input.score === undefined ? {} : { score: input.score }),
            ...(input.postedAt === undefined
              ? {}
              : { postedAt: input.postedAt }),
            lastSeenAt: now,
            isActive: input.isActive ?? true,
            updatedAt: now,
          },
        })
        .returning({ id: jobs.id });

      if (!row) {
        throw new Error('Failed to upsert job');
      }

      return row;
    },

    deactivateMissingBySource: async (
      source: string,
      sourceJobIds: string[],
    ): Promise<{ companyId: string }[]> => {
      const conditions = [eq(jobs.source, source), eq(jobs.isActive, true)];
      if (sourceJobIds.length > 0) {
        conditions.push(notInArray(jobs.sourceJobId, sourceJobIds));
      }

      return db
        .update(jobs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(...conditions))
        .returning({ companyId: jobs.companyId });
    },

    deactivateOlderThan: async (
      maxAgeMs: number,
      now: Date = new Date(),
    ): Promise<{ companyId: string }[]> => {
      const cutoff = new Date(now.getTime() - maxAgeMs);
      return db
        .update(jobs)
        .set({ isActive: false, updatedAt: now })
        .where(and(eq(jobs.isActive, true), coalescedPostedAt('<', cutoff)))
        .returning({ companyId: jobs.companyId });
    },

    /** Rows are only ever deactivated, so without this the table grows forever. */
    deleteInactiveOlderThan: async (
      retentionMs: number,
      now: Date = new Date(),
    ): Promise<number> => {
      const cutoff = new Date(now.getTime() - retentionMs);
      const deleted = await db
        .delete(jobs)
        .where(and(eq(jobs.isActive, false), coalescedPostedAt('<', cutoff)))
        .returning({ id: jobs.id });
      return deleted.length;
    },

    deactivate: async (id: string): Promise<Job | null> => {
      const [row] = await db
        .update(jobs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(jobs.id, id))
        .returning();
      return row ? toJob(row) : null;
    },

    deleteById: async (id: string): Promise<boolean> => {
      const deleted = await db.delete(jobs).where(eq(jobs.id, id)).returning();
      return deleted.length > 0;
    },
  };

  return repository;
};
