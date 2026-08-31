import { desc } from 'drizzle-orm';
import type { Db } from '../client';
import { ingestionRuns } from '../schema/ingestion-runs';

export type IngestionRunRecord = {
  completedAt?: Date;
  persistedJobs: number;
  companiesUpdated: number;
};

export const createIngestionRunsRepository = (db: Db) => ({
  record: async (input: IngestionRunRecord): Promise<void> => {
    await db.insert(ingestionRuns).values({
      completedAt: input.completedAt ?? new Date(),
      persistedJobs: input.persistedJobs,
      companiesUpdated: input.companiesUpdated,
    });
  },

  getLatestCompletedAt: async (): Promise<Date | null> => {
    const [row] = await db
      .select({ completedAt: ingestionRuns.completedAt })
      .from(ingestionRuns)
      .orderBy(desc(ingestionRuns.completedAt))
      .limit(1);

    return row?.completedAt ?? null;
  },
});
