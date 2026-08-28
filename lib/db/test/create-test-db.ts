import { PrismaClient } from '@prisma/client';
import { afterEach } from 'vitest';
import { PGliteBridge, pushMigrations } from 'prisma-pglite-bridge';
import type { RootDb } from '../client';
import { MIGRATIONS_FOLDER } from '../constants';

const openDatabases = new Map<RootDb, PGliteBridge>();

export const createTestDb = async (): Promise<RootDb> => {
  const bridge = new PGliteBridge({
    max: 1,
    connectionTimeoutMillis: 10_000,
    query_timeout: 30_000,
  });

  try {
    await pushMigrations(bridge.pglite, { migrationsPath: MIGRATIONS_FOLDER });
    const db = new PrismaClient({
      adapter: bridge.adapter,
      transactionOptions: { maxWait: 10_000, timeout: 120_000 },
    });
    openDatabases.set(db, bridge);
    return db;
  } catch (error) {
    await bridge.close();
    throw error;
  }
};

export const disconnectTestDb = async (db: RootDb): Promise<void> => {
  const bridge = openDatabases.get(db);
  openDatabases.delete(db);
  await db.$disconnect();
  await bridge?.close();
};

afterEach(async () => {
  await Promise.all([...openDatabases.keys()].map(disconnectTestDb));
});
