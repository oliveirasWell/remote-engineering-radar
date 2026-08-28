import { createDb, databaseSslMode } from './client';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';
import { SUPABASE_ROOT_CA } from './supabase-root-ca';

describe('createDb', () => {
  const originalUrl = process.env[DATABASE_URL_ENV];

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env[DATABASE_URL_ENV];
    } else {
      process.env[DATABASE_URL_ENV] = originalUrl;
    }
  });

  it('throws a documented error when DATABASE_URL is missing', () => {
    delete process.env[DATABASE_URL_ENV];

    expect(() => createDb()).toThrow(MISSING_DATABASE_URL_MESSAGE);
  });

  it('returns a Drizzle database instance when DATABASE_URL is provided', () => {
    const db = createDb('postgres://user:pass@localhost:5432/radar');

    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
  });

  it('requires verified TLS for non-local database hosts', () => {
    expect(
      databaseSslMode('postgres://user:pass@db.example.com:5432/radar'),
    ).toMatchObject({ rejectUnauthorized: true });
    expect(
      databaseSslMode('postgres://user:pass@db.example.com:5432/radar')?.ca,
    ).toEqual(expect.arrayContaining([SUPABASE_ROOT_CA]));
    expect(
      databaseSslMode('postgres://user:pass@localhost:5432/radar'),
    ).toBeUndefined();
    expect(
      databaseSslMode('postgres://user:pass@127.0.0.1:5432/radar'),
    ).toBeUndefined();
  });
});
