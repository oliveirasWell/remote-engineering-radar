import type { Db } from '../client';

export type IngestionRunRecord = {
  completedAt?: Date;
  persistedJobs: number;
  companiesUpdated: number;
};

export const createIngestionRunsRepository = (db: Db) => ({
  record: async (input: IngestionRunRecord): Promise<void> => {
    await db.ingestionRun.create({
      data: {
        completedAt: input.completedAt ?? new Date(),
        persistedJobs: input.persistedJobs,
        companiesUpdated: input.companiesUpdated,
      },
    });
  },

  getLatestCompletedAt: async (): Promise<Date | null> => {
    const row = await db.ingestionRun.findFirst({
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    return row?.completedAt ?? null;
  },
});
