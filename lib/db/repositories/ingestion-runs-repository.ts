import type { Db } from '../client';

export type IngestionSourceRunRecord = {
  source: string;
  fetched: number;
  eligible: number;
  persisted: number;
  newJobs: number;
  medianAgeHours?: number;
  error?: string;
};

export type IngestionRunRecord = {
  completedAt?: Date;
  persistedJobs: number;
  companiesUpdated: number;
  sources?: readonly IngestionSourceRunRecord[];
};

export const createIngestionRunsRepository = (db: Db) => ({
  record: async (input: IngestionRunRecord): Promise<void> => {
    const run = await db.ingestionRun.create({
      data: {
        completedAt: input.completedAt ?? new Date(),
        persistedJobs: input.persistedJobs,
        companiesUpdated: input.companiesUpdated,
      },
      select: { id: true },
    });
    if (input.sources?.length) {
      await db.ingestionSourceRun.createMany({
        data: input.sources.map((source) => ({ ...source, runId: run.id })),
      });
    }
  },

  getLatestCompletedAt: async (): Promise<Date | null> => {
    const row = await db.ingestionRun.findFirst({
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    return row?.completedAt ?? null;
  },
});
