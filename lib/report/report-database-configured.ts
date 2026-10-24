import { DATABASE_URL_ENV } from '@/lib/db/constants';

/** Preview builds for branches without a database must still prerender. */
export const reportDatabaseConfigured = (): boolean =>
  Boolean(process.env[DATABASE_URL_ENV]?.trim());
