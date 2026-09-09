import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Pool } from 'pg';
import {
  assertBaselineSafe,
  getMigrationUrl,
  migrateDeploy,
  prepareBaseline,
} from './migrate-deploy';

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  query: vi.fn(),
  end: vi.fn(),
}));

vi.mock('node:child_process', () => ({ spawn: mocks.spawn }));
vi.mock('pg', () => ({
  Pool: vi.fn(
    class {
      query = mocks.query;
      end = mocks.end;
    },
  ),
}));

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
    ).toThrow('pnpm db:resolve-baseline');
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

describe('explicit baseline preparation', () => {
  const originalEnvironment = { ...process.env };
  const migrationUrl = 'postgresql://migration@db.example.com/radar';

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReset().mockResolvedValue({ rows: [{ unsafe: false }] });
    mocks.spawn.mockReset().mockImplementation(() => {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit('exit', 0, null));
      return child;
    });
    process.env.DATABASE_MIGRATION_URL = migrationUrl;
    process.env.DIRECT_URL = 'postgresql://other@direct.example.com/radar';
    process.env.DATABASE_URL = 'postgresql://runtime@pooler.example.com/radar';
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('only executes preparation SQL then full parity and ACL checks on the same trusted URL', async () => {
    mocks.spawn.mockImplementationOnce(() => {
      const child = new EventEmitter();
      queueMicrotask(() => {
        process.env.DATABASE_MIGRATION_URL = process.env.DIRECT_URL;
        child.emit('exit', 0, null);
      });
      return child;
    });
    await prepareBaseline();
    expect(mocks.spawn.mock.calls.map((call) => call[1])).toEqual([
      [
        'node_modules/prisma/build/index.js',
        'db',
        'execute',
        '--file',
        'scripts/prepare-prisma-baseline.sql',
      ],
      [
        'node_modules/prisma/build/index.js',
        'migrate',
        'diff',
        '--from-config-datasource',
        '--to-schema=prisma/schema.prisma',
        '--exit-code',
      ],
    ]);
    for (const call of mocks.spawn.mock.calls) {
      expect(call[2].env.DATABASE_MIGRATION_URL).toBe(
        `${migrationUrl}?sslmode=require&sslaccept=strict`,
      );
    }
    expect(Pool).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: migrationUrl,
        ssl: expect.objectContaining({ rejectUnauthorized: true }),
      }),
    );
    expect(mocks.query).toHaveBeenCalledTimes(2);
    expect(mocks.query.mock.calls[0][0]).toContain('has_table_privilege');
    expect(mocks.query.mock.calls[1][0]).toContain('pg_default_acl');
    expect(mocks.end).toHaveBeenCalledOnce();
  });

  it.each([1, 2])(
    'propagates failure of Prisma command %s without proceeding',
    async (failedCommand) => {
      if (failedCommand === 2) {
        mocks.spawn.mockImplementationOnce(() => {
          const child = new EventEmitter();
          queueMicrotask(() => child.emit('exit', 0, null));
          return child;
        });
      }
      mocks.spawn.mockImplementationOnce(() => {
        const child = new EventEmitter();
        queueMicrotask(() => child.emit('exit', 2, null));
        return child;
      });
      await expect(prepareBaseline()).rejects.toThrow('with exit code 2');
      expect(mocks.spawn).toHaveBeenCalledTimes(failedCommand);
      expect(mocks.query).not.toHaveBeenCalled();
    },
  );

  it.each([false, true])(
    'fails closed on unsafe privileges (defaults: %s)',
    async (defaults) => {
      if (defaults) {
        mocks.query.mockResolvedValueOnce({ rows: [{ unsafe: false }] });
      }
      mocks.query.mockResolvedValueOnce({ rows: [{ unsafe: true }] });
      await expect(prepareBaseline()).rejects.toThrow(
        'Public Supabase roles retain',
      );
      expect(mocks.spawn).toHaveBeenCalledTimes(2);
      expect(mocks.end).toHaveBeenCalledOnce();
    },
  );

  it('refuses preparation without a trusted migration URL', async () => {
    delete process.env.DATABASE_MIGRATION_URL;
    delete process.env.DIRECT_URL;
    await expect(prepareBaseline()).rejects.toThrow(
      'DATABASE_MIGRATION_URL or DIRECT_URL',
    );
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(Pool).not.toHaveBeenCalled();
  });

  it('keeps normal deploy fail-closed without preparing or resolving existing tables', async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ exists: false }] });
    await expect(migrateDeploy()).rejects.toThrow('pnpm db:resolve-baseline');
    expect(mocks.spawn).not.toHaveBeenCalled();
    expect(mocks.end).toHaveBeenCalledOnce();
  });

  it('keeps empty-database deploy separate from preparation and resolution', async () => {
    mocks.query
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ exists: false }] });
    await migrateDeploy();
    expect(mocks.spawn.mock.calls.map((call) => call[1].slice(1, 3))).toEqual([
      ['migrate', 'deploy'],
      ['migrate', 'diff'],
    ]);
  });
});

describe('production workflow operation isolation', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/ingest.yml', import.meta.url),
    'utf8',
  );
  const steps = workflow.split(/^      - /m).slice(1);

  it.each([
    ['workflow_dispatch', 'prepare-baseline', ['prepare-baseline']],
    ['workflow_dispatch', 'check-baseline', ['baseline-check']],
    [
      'workflow_dispatch',
      'resolve-baseline',
      ['baseline-check', 'resolve-baseline', 'deploy'],
    ],
    ['workflow_dispatch', 'deploy-migrations', ['deploy']],
    ['workflow_dispatch', 'ingest', ['deploy', 'ingest']],
    ['schedule', 'prepare-baseline', ['deploy', 'ingest']],
    ['push', 'prepare-baseline', ['deploy', 'ingest']],
  ])(
    'runs only intended database operations for %s / %s',
    (event, operation, expected) => {
      const commands = steps.flatMap((step) => {
        const command = step.match(/\brun: pnpm (?:db:([\w-]+)|(ingest))\s/);
        if (!command) {
          return [];
        }
        const condition = step.match(/^        if: (.+)$/m)?.[1];
        const enabled =
          !condition ||
          runInNewContext(condition, {
            github: { event_name: event },
            inputs: { operation },
          });
        return enabled ? [command[1] ?? command[2]] : [];
      });
      expect(commands).toEqual(expected);
    },
  );

  it('requires the exact preparation confirmation before the preparation step', () => {
    const confirmation = steps.findIndex((step) =>
      step.includes(
        'run: test "$CONFIRMATION" = \'PREPARE PRODUCTION BASELINE\'',
      ),
    );
    const preparation = steps.findIndex((step) =>
      step.includes('run: pnpm db:prepare-baseline'),
    );
    expect(confirmation).toBeGreaterThanOrEqual(0);
    expect(preparation).toBeGreaterThan(confirmation);
    expect(steps[confirmation]).toContain(
      "if: github.event_name == 'workflow_dispatch' && inputs.operation == 'prepare-baseline'",
    );
    expect(steps[confirmation]).toContain(
      'CONFIRMATION: ${{ inputs.confirmation }}',
    );
    expect(steps[preparation]).toContain(
      'DATABASE_MIGRATION_URL: ${{ secrets.DATABASE_MIGRATION_URL }}',
    );
  });
});
