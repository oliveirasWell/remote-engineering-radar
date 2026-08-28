import { createDb, disconnectDb, getDb } from './client';
import {
  databasePoolConfig,
  databaseSslMode,
  securePrismaConnectionString,
} from './connection-options';
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

  it('constructs lazily and disconnects without opening a connection', async () => {
    const db = createDb('postgres://user:pass@localhost:5432/radar');

    expect(db).toBeDefined();
    expect(typeof db.company.findMany).toBe('function');
    await expect(disconnectDb(db)).resolves.toBeUndefined();
  });

  it('requires verified TLS for non-local database hosts', () => {
    const ssl = databaseSslMode(
      'postgres://user:pass@db.example.com:5432/radar',
    );
    expect(ssl).toMatchObject({ rejectUnauthorized: true });
    if (ssl === false) {
      throw new Error('Expected TLS for a non-local database');
    }
    expect(ssl.ca).toEqual(expect.arrayContaining([SUPABASE_ROOT_CA]));
    expect(databaseSslMode('postgres://user:pass@localhost:5432/radar')).toBe(
      false,
    );
    expect(databaseSslMode('postgres://user:pass@127.0.0.1:5432/radar')).toBe(
      false,
    );
  });

  it('sets explicit production pool limits and timeouts', () => {
    expect(
      databasePoolConfig(
        'postgres://user:pass@db.example.com:5432/radar?sslmode=disable',
      ),
    ).toMatchObject({
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
      query_timeout: 30_000,
      ssl: { rejectUnauthorized: true },
    });
    expect(
      databasePoolConfig(
        'postgres://user:pass@db.example.com:5432/radar?sslmode=disable',
      ).connectionString,
    ).not.toContain('sslmode');
    expect(
      securePrismaConnectionString(
        'postgres://user:pass@db.example.com:5432/radar?sslmode=disable',
      ),
    ).toContain('sslmode=require');
  });

  it('reuses and clears the hot-reload singleton', async () => {
    process.env[DATABASE_URL_ENV] = 'postgres://user:pass@localhost:5432/radar';

    const first = getDb();
    expect(getDb()).toBe(first);
    await disconnectDb();

    const replacement = getDb();
    expect(replacement).not.toBe(first);
    await disconnectDb();
  });
});
