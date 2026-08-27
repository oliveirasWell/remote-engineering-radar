import { defineConfig } from 'drizzle-kit';
import { DATABASE_URL_ENV } from './lib/db/constants';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    // generate does not connect; migrate fails if the URL is not provided.
    url: process.env[DATABASE_URL_ENV] ?? '',
  },
});
