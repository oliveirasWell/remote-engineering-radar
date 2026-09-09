import { X509Certificate } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { createDb, disconnectDb, getDb } from './client';
import {
  databasePoolConfig,
  databaseSslMode,
  securePrismaConnectionString,
} from './connection-options';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';
import { SUPABASE_ROOT_CA } from './supabase-root-ca';

const REMOTE_DATABASE_URL = 'postgres://user:pass@db.example.com:5432/radar';
const LOCAL_DATABASE_URLS = [
  'postgres://user:pass@localhost:5432/radar',
  'postgres://user:pass@127.0.0.1:5432/radar',
  'postgres://user:pass@[::1]:5432/radar',
];
const INSECURE_TLS_QUERIES = [
  '',
  'sslmode=require',
  'sslmode=disable&sslaccept=accept_invalid_certs',
  'sslmode=prefer&sslaccept=accept_invalid_certs',
  'sslmode=no-verify&ssl=no-verify&uselibpqcompat=true',
  'sslmode=require&sslmode=disable&sslaccept=strict&sslaccept=accept_invalid_certs',
];
const CA_FILE_PATH = '/etc/ssl/certs/supabase root ca.pem';
const OTHER_CA_FILE_PATH = '/etc/ssl/certs/other-ca.pem';
const ORDINARY_CONNECTION_PARAMETERS = {
  schema: 'radar',
  application_name: 'radar migrations',
  connect_timeout: '12',
  options: '-c statement_timeout=30000',
  pgbouncer: 'true',
};
const TLS_MODE_PARAMETER = 'sslmode';
const TLS_ACCEPT_PARAMETER = 'sslaccept';
const CA_PARAMETER = 'sslcert';
const PG_CA_PARAMETER = 'sslrootcert';
const REQUIRED_TLS_MODE = 'require';
const DISABLED_TLS_MODE = 'disable';
const STRICT_TLS_ACCEPT = 'strict';
const SUPABASE_DATABASE_HOSTS = [
  'db.project-ref.supabase.co',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-1-eu-west-1.pooler.supabase.com',
  'pooler.supabase.com',
  'DB.PROJECT-REF.SUPABASE.CO',
];
const OTHER_DATABASE_HOSTS = [
  'db.example.com',
  'db.project-ref.supabase.co.attacker.example',
  'aws-0-us-east-1.pooler.supabase.com.attacker.example',
  'not-supabase.co',
  'not-supabase.com',
  'supabase.co',
  'supabase.com',
];
const SUPABASE_DATABASE_URL =
  'postgres://user:pass@db.project-ref.supabase.co:5432/radar';
const SUPABASE_CA_FILE_PATH = fileURLToPath(
  new URL('./supabase-root-ca.pem', import.meta.url),
);
const BLANK_CA_PATHS = ['', ' \t '];

describe('database TLS', () => {
  it('ships the exact runtime CA as a readable, valid public PEM for Prisma', () => {
    expect(existsSync(SUPABASE_CA_FILE_PATH)).toBe(true);
    const pem = readFileSync(SUPABASE_CA_FILE_PATH, 'utf8');

    expect(pem).toBe(`${SUPABASE_ROOT_CA}\n`);
    const certificate = new X509Certificate(pem);
    expect(certificate.ca).toBe(true);
    expect(certificate.verify(certificate.publicKey)).toBe(true);
    expect(certificate.fingerprint256).toBe(
      new X509Certificate(SUPABASE_ROOT_CA).fingerprint256,
    );
  });

  it.each(SUPABASE_DATABASE_HOSTS)(
    'defaults %s to the bundled CA without weakening TLS or losing query parameters',
    (hostname) => {
      const original = new URL(REMOTE_DATABASE_URL);
      original.hostname = hostname;
      original.search = new URLSearchParams(
        ORDINARY_CONNECTION_PARAMETERS,
      ).toString();
      const secured = new URL(
        securePrismaConnectionString(original.toString()),
      );
      const certificate = secured.searchParams.get(CA_PARAMETER);

      expect(certificate).toBe(SUPABASE_CA_FILE_PATH);
      expect(isAbsolute(certificate!)).toBe(true);
      expect(readFileSync(certificate!, 'utf8')).toBe(`${SUPABASE_ROOT_CA}\n`);
      expect(secured.searchParams.get(TLS_MODE_PARAMETER)).toBe(
        REQUIRED_TLS_MODE,
      );
      expect(secured.searchParams.get(TLS_ACCEPT_PARAMETER)).toBe(
        STRICT_TLS_ACCEPT,
      );
      for (const [key, value] of Object.entries(
        ORDINARY_CONNECTION_PARAMETERS,
      )) {
        expect(secured.searchParams.get(key)).toBe(value);
      }
      expect(securePrismaConnectionString(secured.toString())).toBe(
        secured.toString(),
      );
    },
  );

  it.each([CA_PARAMETER, PG_CA_PARAMETER])(
    'preserves an explicit Supabase %s instead of using the bundled CA',
    (parameter) => {
      const original = new URL(SUPABASE_DATABASE_URL);
      original.searchParams.set(parameter, CA_FILE_PATH);
      const secured = new URL(
        securePrismaConnectionString(original.toString()),
      );

      expect(secured.searchParams.get(CA_PARAMETER)).toBe(CA_FILE_PATH);
      expect(secured.searchParams.has(PG_CA_PARAMETER)).toBe(false);
    },
  );

  it.each(BLANK_CA_PATHS)(
    'defaults blank CA paths (%j) on Supabase',
    (blank) => {
      const original = new URL(SUPABASE_DATABASE_URL);
      original.searchParams.set(CA_PARAMETER, blank);
      original.searchParams.set(PG_CA_PARAMETER, blank);

      expect(
        new URL(
          securePrismaConnectionString(original.toString()),
        ).searchParams.get(CA_PARAMETER),
      ).toBe(SUPABASE_CA_FILE_PATH);
    },
  );

  it.each(BLANK_CA_PATHS)(
    'uses a nonblank root certificate alias when sslcert is blank (%j)',
    (blank) => {
      const original = new URL(SUPABASE_DATABASE_URL);
      original.searchParams.set(CA_PARAMETER, blank);
      original.searchParams.set(PG_CA_PARAMETER, CA_FILE_PATH);

      expect(
        new URL(
          securePrismaConnectionString(original.toString()),
        ).searchParams.get(CA_PARAMETER),
      ).toBe(CA_FILE_PATH);
    },
  );

  it.each(OTHER_DATABASE_HOSTS)(
    'uses system trust rather than the Supabase CA for %s',
    (hostname) => {
      const original = new URL(REMOTE_DATABASE_URL);
      original.hostname = hostname;
      original.searchParams.set(CA_PARAMETER, BLANK_CA_PATHS[1]);
      original.searchParams.set(PG_CA_PARAMETER, BLANK_CA_PATHS[0]);
      const secured = new URL(
        securePrismaConnectionString(original.toString()),
      );

      expect(secured.searchParams.has(CA_PARAMETER)).toBe(false);
      expect(secured.searchParams.has(PG_CA_PARAMETER)).toBe(false);
      expect(secured.searchParams.get(TLS_MODE_PARAMETER)).toBe(
        REQUIRED_TLS_MODE,
      );
      expect(secured.searchParams.get(TLS_ACCEPT_PARAMETER)).toBe(
        STRICT_TLS_ACCEPT,
      );
    },
  );

  it('keeps the Prisma CA file path out of the runtime pg connection', () => {
    const secured = securePrismaConnectionString(SUPABASE_DATABASE_URL);
    const config = databasePoolConfig(secured);
    const client = new Client(config);

    expect(
      new URL(config.connectionString).searchParams.has(CA_PARAMETER),
    ).toBe(false);
    expect(client.ssl).toEqual(databaseSslMode(SUPABASE_DATABASE_URL));
    expect(client.ssl).toMatchObject({
      rejectUnauthorized: true,
      ca: expect.arrayContaining([SUPABASE_ROOT_CA]),
    });
  });

  it.each(INSECURE_TLS_QUERIES)(
    'requires strict certificate validation for remote Prisma URLs with %s',
    (query) => {
      const secured = new URL(
        securePrismaConnectionString(`${REMOTE_DATABASE_URL}?${query}`),
      );

      expect(secured.searchParams.getAll(TLS_MODE_PARAMETER)).toEqual([
        REQUIRED_TLS_MODE,
      ]);
      expect(secured.searchParams.getAll(TLS_ACCEPT_PARAMETER)).toEqual([
        STRICT_TLS_ACCEPT,
      ]);
    },
  );

  it.each([CA_PARAMETER, PG_CA_PARAMETER])(
    'passes the configured %s PEM path to Prisma without losing ordinary query parameters',
    (parameter) => {
      const original = new URL(REMOTE_DATABASE_URL);
      original.search = new URLSearchParams(
        ORDINARY_CONNECTION_PARAMETERS,
      ).toString();
      original.searchParams.set(parameter, CA_FILE_PATH);
      const secured = new URL(
        securePrismaConnectionString(original.toString()),
      );

      expect(secured.searchParams.get(CA_PARAMETER)).toBe(CA_FILE_PATH);
      expect(secured.searchParams.has(PG_CA_PARAMETER)).toBe(false);
      for (const [key, value] of Object.entries(
        ORDINARY_CONNECTION_PARAMETERS,
      )) {
        expect(secured.searchParams.get(key)).toBe(value);
      }
      expect(secured.origin).toBe(original.origin);
      expect(secured.username).toBe(original.username);
      expect(secured.password).toBe(original.password);
      expect(secured.pathname).toBe(original.pathname);
      expect(securePrismaConnectionString(secured.toString())).toBe(
        secured.toString(),
      );
    },
  );

  it('prefers an explicit Prisma certificate over the pg root certificate alias', () => {
    const original = new URL(REMOTE_DATABASE_URL);
    original.searchParams.set(CA_PARAMETER, CA_FILE_PATH);
    original.searchParams.set(PG_CA_PARAMETER, OTHER_CA_FILE_PATH);

    expect(
      new URL(
        securePrismaConnectionString(original.toString()),
      ).searchParams.get(CA_PARAMETER),
    ).toBe(CA_FILE_PATH);
  });

  it.each(INSECURE_TLS_QUERIES)(
    'keeps pg certificate verification enabled after the driver parses %s',
    (query) => {
      const original = new URL(`${REMOTE_DATABASE_URL}?${query}`);
      original.searchParams.set(CA_PARAMETER, CA_FILE_PATH);
      original.searchParams.set(PG_CA_PARAMETER, OTHER_CA_FILE_PATH);
      for (const [key, value] of Object.entries(
        ORDINARY_CONNECTION_PARAMETERS,
      )) {
        original.searchParams.set(key, value);
      }
      const config = databasePoolConfig(original.toString());
      // Constructing a pg client parses the URL but never opens a connection.
      const client = new Client(config);

      expect(client.ssl).toEqual(databaseSslMode(REMOTE_DATABASE_URL));
      expect(client.ssl).toMatchObject({ rejectUnauthorized: true });
      expect(client.user).toBe(original.username);
      expect(client.host).toBe(original.hostname);
      for (const [key, value] of Object.entries(
        ORDINARY_CONNECTION_PARAMETERS,
      )) {
        expect(new URL(config.connectionString).searchParams.get(key)).toBe(
          value,
        );
      }
    },
  );

  it.each(LOCAL_DATABASE_URLS)(
    'keeps local development non-TLS for %s',
    (url) => {
      expect(databaseSslMode(url)).toBe(false);
      expect(new Client(databasePoolConfig(url)).ssl).toBe(false);
      expect(
        new URL(securePrismaConnectionString(url)).searchParams.has(
          CA_PARAMETER,
        ),
      ).toBe(false);
      expect(
        new URL(securePrismaConnectionString(url)).searchParams.get(
          TLS_MODE_PARAMETER,
        ),
      ).toBe(DISABLED_TLS_MODE);
    },
  );
});

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
