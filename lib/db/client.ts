import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import postgres from 'postgres';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';
import * as schema from './schema';

const DB_CONNECT_TIMEOUT_SECONDS = 10;
const DB_IDLE_TIMEOUT_SECONDS = 20;
const DB_MAX_CONNECTIONS = 10;

export type Db =
  PostgresJsDatabase<typeof schema> | PgliteDatabase<typeof schema>;

export const createDb = (
  connectionString = process.env[DATABASE_URL_ENV],
): PostgresJsDatabase<typeof schema> => {
  if (!connectionString) {
    throw new Error(MISSING_DATABASE_URL_MESSAGE);
  }

  const client = postgres(connectionString, {
    prepare: false,
    connect_timeout: DB_CONNECT_TIMEOUT_SECONDS,
    idle_timeout: DB_IDLE_TIMEOUT_SECONDS,
    max: DB_MAX_CONNECTIONS,
    ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined,
  });
  return drizzle(client, { schema });
};

let dbSingleton: PostgresJsDatabase<typeof schema> | undefined;

export const getDb = (): PostgresJsDatabase<typeof schema> => {
  if (!dbSingleton) {
    dbSingleton = createDb();
  }

  return dbSingleton;
};
