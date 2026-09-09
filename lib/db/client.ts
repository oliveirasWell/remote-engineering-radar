import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';
import { databasePoolConfig } from './connection-options';

const DB_CONNECT_TIMEOUT_MILLISECONDS = 10_000;
const DB_TRANSACTION_TIMEOUT_MILLISECONDS = 120_000;

export type Db = Prisma.TransactionClient;
export type RootDb = PrismaClient;

export const createDb = (
  connectionString = process.env[DATABASE_URL_ENV],
): PrismaClient => {
  if (!connectionString) {
    throw new Error(MISSING_DATABASE_URL_MESSAGE);
  }

  const adapter = new PrismaPg(databasePoolConfig(connectionString));
  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: DB_CONNECT_TIMEOUT_MILLISECONDS,
      timeout: DB_TRANSACTION_TIMEOUT_MILLISECONDS,
    },
  });
};

const globalForDb = globalThis as typeof globalThis & {
  radarDb?: PrismaClient;
};

export const getDb = (): PrismaClient => {
  if (!globalForDb.radarDb) {
    globalForDb.radarDb = createDb();
  }

  return globalForDb.radarDb;
};

export const disconnectDb = async (db = globalForDb.radarDb): Promise<void> => {
  if (!db) {
    return;
  }

  await db.$disconnect();
  if (db === globalForDb.radarDb) {
    delete globalForDb.radarDb;
  }
};
