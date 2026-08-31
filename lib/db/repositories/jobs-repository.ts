import { and, desc, eq, gte, notInArray, sql } from 'drizzle-orm';
import type { JobGeography } from '@/lib/classification/types';
import type { Job, NewJob } from '@/lib/jobs/types';
import type { Db } from '../client';
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
  seniority: row.seniority,
  score: row.score,
  postedAt: row.postedAt,
  firstSeenAt: row.firstSeenAt,
  lastSeenAt: row.lastSeenAt,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
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

    listActiveByScore: async (options?: {
      limit?: number;
      minimumScore?: number;
      technology?: string;
      seniority?: string;
      remotePolicy?: string;
      location?: string;
      maxAgeMs?: number;
      now?: Date;
    }): Promise<Job[]> => {
      const filters = [eq(jobs.isActive, true)];

      if (options?.minimumScore !== undefined) {
        filters.push(gte(jobs.score, options.minimumScore));
      }
      if (options?.seniority) {
        filters.push(eq(jobs.seniority, options.seniority));
      }
      if (options?.remotePolicy) {
        filters.push(eq(jobs.remotePolicy, options.remotePolicy));
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
        filters.push(
          sql`coalesce(${jobs.postedAt}, ${jobs.firstSeenAt}) >= ${cutoff}`,
        );
      }

      const query = db
        .select()
        .from(jobs)
        .where(and(...filters))
        .orderBy(desc(jobs.score), desc(jobs.postedAt));

      const rows =
        options?.limit !== undefined
          ? await query.limit(options.limit)
          : await query;
      return rows.map(toJob);
    },

    updateScore: async (id: string, score: number): Promise<Job | null> => {
      const [row] = await db
        .update(jobs)
        .set({ score, updatedAt: new Date() })
        .where(eq(jobs.id, id))
        .returning();
      return row ? toJob(row) : null;
    },

    upsertBySourceJobId: async (input: NewJob): Promise<Job> => {
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
        .returning();

      if (!row) {
        throw new Error('Failed to upsert job');
      }

      return toJob(row);
    },

    deactivateMissingBySource: async (
      source: string,
      sourceJobIds: string[],
    ): Promise<Job[]> => {
      const conditions = [eq(jobs.source, source), eq(jobs.isActive, true)];
      if (sourceJobIds.length > 0) {
        conditions.push(notInArray(jobs.sourceJobId, sourceJobIds));
      }

      const rows = await db
        .update(jobs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return rows.map(toJob);
    },

    deactivateOlderThan: async (
      maxAgeMs: number,
      now: Date = new Date(),
    ): Promise<Job[]> => {
      const cutoff = new Date(now.getTime() - maxAgeMs);
      const rows = await db
        .update(jobs)
        .set({ isActive: false, updatedAt: now })
        .where(
          and(
            eq(jobs.isActive, true),
            sql`coalesce(${jobs.postedAt}, ${jobs.firstSeenAt}) < ${cutoff}`,
          ),
        )
        .returning();
      return rows.map(toJob);
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
