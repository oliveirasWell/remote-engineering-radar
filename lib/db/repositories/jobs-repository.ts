import { and, eq } from 'drizzle-orm';
import type { Job, NewJob } from '@/lib/jobs/types';
import type { Db } from '../client';
import { jobs } from '../schema/jobs';

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
  seniority: row.seniority,
  score: row.score,
  postedAt: row.postedAt,
  firstSeenAt: row.firstSeenAt,
  lastSeenAt: row.lastSeenAt,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createJobsRepository = (db: Db) => ({
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

  updateScore: async (id: string, score: number): Promise<Job | null> => {
    const [row] = await db
      .update(jobs)
      .set({ score, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return row ? toJob(row) : null;
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
});
