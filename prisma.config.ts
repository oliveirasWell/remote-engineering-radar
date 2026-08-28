import { defineConfig } from 'prisma/config';
import {
  databaseSslMode,
  securePrismaConnectionString,
} from './lib/db/connection-options';

const dedicatedUrl =
  process.env.DATABASE_MIGRATION_URL ?? process.env.DIRECT_URL;
const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl =
  dedicatedUrl ??
  (runtimeUrl && databaseSslMode(runtimeUrl) === false
    ? runtimeUrl
    : undefined);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Generation and validation do not need a database URL.
  datasource: migrationUrl
    ? { url: securePrismaConnectionString(migrationUrl) }
    : undefined,
});
