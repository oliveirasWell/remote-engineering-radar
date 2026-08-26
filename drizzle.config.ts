import { defineConfig } from 'drizzle-kit';
import { DATABASE_URL_ENV } from './lib/db/constants';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    // generate does not connect; migrate requires a real DATABASE_URL
    url: process.env[DATABASE_URL_ENV] ?? 'postgres://localhost:5432/radar',
  },
});
