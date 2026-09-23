import type { RootDb } from '@/lib/db/client';
import { DATA_MIGRATIONS } from './registry';
import type { DataMigration } from './types';

export const runPendingDataMigrations = async (
  db: RootDb,
  migrations: readonly DataMigration[] = DATA_MIGRATIONS,
): Promise<string[]> => {
  const applied: string[] = [];

  for (const migration of migrations) {
    const existing = await db.dataMigration.findUnique({
      where: { name: migration.name },
    });
    if (existing) {
      continue;
    }
    await migration.up(db);
    await db.dataMigration.create({ data: { name: migration.name } });
    applied.push(migration.name);
  }

  return applied;
};
