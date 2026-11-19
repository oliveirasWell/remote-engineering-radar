import { Prisma } from '@prisma/client';
import type { Db } from '@/lib/db/client';

export type StorageMetrics = {
  databaseBytes: number;
  activeJobsByWorkModel: Record<string, number>;
};

/**
 * Database size and active jobs per work model, to watch storage as Brazilian
 * hybrid and on-site roles are kept (SPEC-037) against the plan's size limit.
 */
export const readStorageMetrics = async (db: Db): Promise<StorageMetrics> => {
  const [[size], workModels] = await Promise.all([
    db.$queryRaw<{ bytes: number }[]>(
      Prisma.sql`SELECT pg_database_size(current_database())::float8 AS bytes`,
    ),
    db.job.groupBy({
      by: ['remotePolicy'],
      where: { isActive: true },
      _count: { _all: true },
    }),
  ]);
  return {
    databaseBytes: size?.bytes ?? 0,
    activeJobsByWorkModel: Object.fromEntries(
      workModels
        .map(
          ({ remotePolicy, _count }) =>
            [remotePolicy ?? 'unknown', _count._all] as const,
        )
        .toSorted(([left], [right]) => left.localeCompare(right)),
    ),
  };
};
