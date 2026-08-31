import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import {
  DATABASE_MIGRATION_URL_ENV,
  DATABASE_URL_ENV,
  DIRECT_URL_ENV,
  PRISMA_BASELINE,
} from '../lib/db/constants';
import {
  databasePoolConfig,
  databaseSslMode,
  securePrismaConnectionString,
} from '../lib/db/connection-options';

const BASELINE_GATE_MESSAGE =
  `Existing application tables require the Prisma baseline to be resolved first. ` +
  `Run: pnpm prisma migrate resolve --applied ${PRISMA_BASELINE}`;

export const getMigrationUrl = (): string => {
  const dedicatedUrl =
    process.env[DATABASE_MIGRATION_URL_ENV] ?? process.env[DIRECT_URL_ENV];
  if (dedicatedUrl) {
    return dedicatedUrl;
  }

  const runtimeUrl = process.env[DATABASE_URL_ENV];
  if (runtimeUrl && databaseSslMode(runtimeUrl) === false) {
    return runtimeUrl;
  }

  throw new Error(
    'DATABASE_MIGRATION_URL or DIRECT_URL is required; DATABASE_URL is accepted only for a local database.',
  );
};

export const assertBaselineSafe = (state: {
  applicationTableCount: number;
  baselineApplied: boolean;
}): void => {
  if (state.applicationTableCount > 0 && !state.baselineApplied) {
    throw new Error(BASELINE_GATE_MESSAGE);
  }
};

const verifyBaselineState = async (connectionString: string): Promise<void> => {
  const pool = new Pool({ ...databasePoolConfig(connectionString), max: 1 });
  try {
    const tableResult = await pool.query<{ count: number }>(`
      SELECT count(*)::integer AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('companies', 'jobs', 'hiring_signals')
    `);
    const applicationTableCount = tableResult.rows[0]?.count ?? 0;

    let baselineApplied = false;
    const migrationTableResult = await pool.query<{ exists: boolean }>(`
      SELECT to_regclass('public._prisma_migrations') IS NOT NULL AS exists
    `);
    if (migrationTableResult.rows[0]?.exists) {
      const baselineResult = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT 1 FROM "_prisma_migrations"
          WHERE migration_name = $1 AND finished_at IS NOT NULL
        ) AS exists`,
        [PRISMA_BASELINE],
      );
      baselineApplied = baselineResult.rows[0]?.exists ?? false;
    }

    assertBaselineSafe({ applicationTableCount, baselineApplied });
  } finally {
    await pool.end();
  }
};

const prismaEnvironment = (connectionString: string): NodeJS.ProcessEnv => ({
  ...process.env,
  DATABASE_MIGRATION_URL: securePrismaConnectionString(connectionString),
});

const runPrisma = async (
  connectionString: string,
  args: string[],
  operation: string,
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['node_modules/prisma/build/index.js', ...args],
      {
        stdio: 'inherit',
        env: prismaEnvironment(connectionString),
      },
    );
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${operation} failed${signal ? ` with signal ${signal}` : ` with exit code ${code ?? 'unknown'}`}`,
        ),
      );
    });
  });
};

const verifySchemaParity = async (connectionString: string): Promise<void> =>
  runPrisma(
    connectionString,
    [
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema=prisma/schema.prisma',
      '--exit-code',
    ],
    'prisma schema parity check',
  );

const verifyPrivileges = async (connectionString: string): Promise<void> => {
  const pool = new Pool({ ...databasePoolConfig(connectionString), max: 1 });
  try {
    const result = await pool.query<{ unsafe: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_roles role
        CROSS JOIN unnest(ARRAY['companies', 'jobs', 'hiring_signals', '_prisma_migrations']) AS table_name
        WHERE role.rolname IN ('anon', 'authenticated')
          AND to_regclass('public.' || table_name) IS NOT NULL
          AND (
            has_table_privilege(role.rolname, 'public.' || table_name, 'SELECT')
            OR has_table_privilege(role.rolname, 'public.' || table_name, 'INSERT')
            OR has_table_privilege(role.rolname, 'public.' || table_name, 'UPDATE')
            OR has_table_privilege(role.rolname, 'public.' || table_name, 'DELETE')
          )
      ) AS unsafe
    `);
    if (result.rows[0]?.unsafe) {
      throw new Error(
        'Public Supabase roles retain privileges on application or Prisma migration tables.',
      );
    }

    const defaultResult = await pool.query<{ unsafe: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_default_acl defaults
        CROSS JOIN LATERAL aclexplode(defaults.defaclacl) privilege
        JOIN pg_roles grantee ON grantee.oid = privilege.grantee
        WHERE defaults.defaclobjtype = 'r'
          AND (
            defaults.defaclnamespace = 0
            OR defaults.defaclnamespace = 'public'::regnamespace
          )
          AND grantee.rolname IN ('anon', 'authenticated')
          AND privilege.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
      ) AS unsafe
    `);
    if (defaultResult.rows[0]?.unsafe) {
      throw new Error(
        'Public Supabase roles retain default privileges for future tables.',
      );
    }
  } finally {
    await pool.end();
  }
};

export const baselineCheck = async (): Promise<void> => {
  const connectionString = getMigrationUrl();
  await verifySchemaParity(connectionString);
  await verifyPrivileges(connectionString);
};

export const migrateDeploy = async (): Promise<void> => {
  const connectionString = getMigrationUrl();
  await verifyBaselineState(connectionString);
  await runPrisma(
    connectionString,
    ['migrate', 'deploy'],
    'prisma migrate deploy',
  );
  await verifySchemaParity(connectionString);
  await verifyPrivileges(connectionString);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const operation = process.argv.includes('--check-only')
    ? baselineCheck
    : migrateDeploy;
  operation().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
