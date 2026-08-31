import { PRISMA_BASELINE } from '../lib/db/constants';
import { assertBaselineSafe, getMigrationUrl } from './migrate-deploy';

describe('migration deployment safety', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('allows an empty database and an already-resolved baseline', () => {
    expect(() =>
      assertBaselineSafe({ applicationTableCount: 0, baselineApplied: false }),
    ).not.toThrow();
    expect(() =>
      assertBaselineSafe({ applicationTableCount: 3, baselineApplied: true }),
    ).not.toThrow();
  });

  it('blocks existing tables until the baseline is resolved', () => {
    expect(() =>
      assertBaselineSafe({ applicationTableCount: 3, baselineApplied: false }),
    ).toThrow(`migrate resolve --applied ${PRISMA_BASELINE}`);
  });

  it('uses migration-only URL precedence and fails without a URL', () => {
    process.env.DATABASE_URL = 'postgres://runtime';
    process.env.DIRECT_URL = 'postgres://direct';
    process.env.DATABASE_MIGRATION_URL = 'postgres://migration';
    expect(getMigrationUrl()).toBe('postgres://migration');

    delete process.env.DATABASE_MIGRATION_URL;
    delete process.env.DIRECT_URL;
    process.env.DATABASE_URL = 'postgres://runtime@db.example.com/database';
    expect(getMigrationUrl).toThrow(
      'DATABASE_MIGRATION_URL or DIRECT_URL is required',
    );

    process.env.DATABASE_URL = 'postgres://local@localhost/database';
    expect(getMigrationUrl()).toBe('postgres://local@localhost/database');
  });
});
