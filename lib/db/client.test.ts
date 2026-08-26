import { createDb } from './client';
import { DATABASE_URL_ENV, MISSING_DATABASE_URL_MESSAGE } from './constants';

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
});
