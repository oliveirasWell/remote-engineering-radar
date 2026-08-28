import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { rootCertificates } from 'node:tls';
import postgres from 'postgres';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';
import * as schema from './schema';
import { SUPABASE_ROOT_CA } from './supabase-root-ca';

const DB_CONNECT_TIMEOUT_SECONDS = 10;
const DB_IDLE_TIMEOUT_SECONDS = 20;
const DB_MAX_CONNECTIONS = 10;

export type Db =
  PostgresJsDatabase<typeof schema> | PgliteDatabase<typeof schema>;

export const databaseSslMode = (
  connectionString: string,
): { ca: string[]; rejectUnauthorized: true } | undefined => {
  const hostname = new URL(connectionString).hostname;
  return hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
    ? undefined
    : {
        ca: [...rootCertificates, SUPABASE_ROOT_CA],
        rejectUnauthorized: true,
      };
};

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
    ssl: databaseSslMode(connectionString),
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
