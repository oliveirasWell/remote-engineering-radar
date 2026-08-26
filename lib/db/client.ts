import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';

export type Db = ReturnType<typeof drizzle>;

export const createDb = (
  connectionString = process.env[DATABASE_URL_ENV],
): Db => {
  if (!connectionString) {
    throw new Error(MISSING_DATABASE_URL_MESSAGE);
  }

  const client = postgres(connectionString, { prepare: false });
  return drizzle(client);
};

let dbSingleton: Db | undefined;

export const getDb = (): Db => {
  if (!dbSingleton) {
    dbSingleton = createDb();
  }

  return dbSingleton;
};
