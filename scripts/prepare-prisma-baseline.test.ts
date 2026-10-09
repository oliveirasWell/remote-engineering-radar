import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const preparationSql = readFileSync(
  new URL('./prepare-prisma-baseline.sql', import.meta.url),
  'utf8',
);
const LEGACY_COMPANY_ID = '00000000-0000-4000-8000-000000000001';
const NEW_COMPANY_ID = '00000000-0000-4000-8000-000000000005';

describe('legacy Prisma baseline preparation SQL', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE TABLE companies (id uuid PRIMARY KEY, name text NOT NULL);
      CREATE TABLE jobs (
        id integer PRIMARY KEY,
        company_id uuid NOT NULL REFERENCES companies(id),
        title text NOT NULL,
        technologies jsonb NOT NULL DEFAULT '[]'::jsonb
      );
      CREATE TABLE hiring_signals (id integer PRIMARY KEY, description text);
      CREATE SCHEMA drizzle;
      CREATE TABLE drizzle.__drizzle_migrations (id integer PRIMARY KEY, hash text);
      INSERT INTO companies VALUES ('${LEGACY_COMPANY_ID}', 'Legacy company');
      INSERT INTO jobs VALUES (2, '${LEGACY_COMPANY_ID}', 'Existing role', '["React"]');
      INSERT INTO hiring_signals VALUES (3, 'Keep this signal');
      INSERT INTO drizzle.__drizzle_migrations VALUES (4, 'historical-hash');
    `);
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds legacy columns and the verified-board table without changing existing rows', async () => {
    await db.exec(preparationSql);

    const columns = await db.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name IN ('kind', 'geographies', 'countries', 'role_focus', 'click_count')
      ORDER BY table_name, column_name
    `);
    expect(columns.rows).toEqual([
      {
        table_name: 'companies',
        column_name: 'kind',
        data_type: 'text',
        is_nullable: 'NO',
        column_default: "'product'::text",
      },
      {
        table_name: 'jobs',
        column_name: 'click_count',
        data_type: 'integer',
        is_nullable: 'NO',
        column_default: '0',
      },
      {
        table_name: 'jobs',
        column_name: 'countries',
        data_type: 'jsonb',
        is_nullable: 'NO',
        column_default: "'[]'::jsonb",
      },
      {
        table_name: 'jobs',
        column_name: 'geographies',
        data_type: 'jsonb',
        is_nullable: 'NO',
        column_default: "'[]'::jsonb",
      },
      {
        table_name: 'jobs',
        column_name: 'role_focus',
        data_type: 'jsonb',
        is_nullable: 'NO',
        column_default: "'[]'::jsonb",
      },
    ]);
    expect((await db.query('SELECT * FROM companies')).rows).toEqual([
      {
        id: LEGACY_COMPANY_ID,
        name: 'Legacy company',
        kind: 'product',
        board_checked_at: null,
      },
    ]);
    expect((await db.query('SELECT * FROM jobs')).rows).toEqual([
      {
        id: 2,
        company_id: LEGACY_COMPANY_ID,
        title: 'Existing role',
        technologies: ['React'],
        geographies: [],
        countries: [],
        role_focus: [],
        click_count: 0,
      },
    ]);
    await db.exec(`
      INSERT INTO companies (id, name) VALUES ('${NEW_COMPANY_ID}', 'New company');
      INSERT INTO jobs (id, company_id, title) VALUES (6, '${NEW_COMPANY_ID}', 'New role');
    `);
    expect(
      (await db.query("SELECT to_regclass('public.ats_boards') AS board_table"))
        .rows,
    ).toEqual([{ board_table: 'ats_boards' }]);
    expect(
      (
        await db.query(
          `SELECT kind FROM companies WHERE id = '${NEW_COMPANY_ID}'`,
        )
      ).rows,
    ).toEqual([{ kind: 'product' }]);
    expect(
      (
        await db.query(
          'SELECT geographies, countries, role_focus FROM jobs WHERE id = 6',
        )
      ).rows,
    ).toEqual([{ geographies: [], countries: [], role_focus: [] }]);
    await expect(db.exec('UPDATE companies SET kind = NULL')).rejects.toThrow();
    await expect(
      db.exec('UPDATE jobs SET geographies = NULL'),
    ).rejects.toThrow();
    await expect(db.exec('UPDATE jobs SET countries = NULL')).rejects.toThrow();
    await expect(
      db.exec('UPDATE jobs SET role_focus = NULL'),
    ).rejects.toThrow();
    await expect(
      db.exec('UPDATE jobs SET click_count = NULL'),
    ).rejects.toThrow();
  });

  it('is safe to repeat and preserves existing non-default column values', async () => {
    await db.exec(`
      ALTER TABLE companies ADD COLUMN kind text DEFAULT 'product' NOT NULL;
      ALTER TABLE jobs ADD COLUMN countries jsonb DEFAULT '[]'::jsonb NOT NULL;
      UPDATE companies SET kind = 'consultancy';
      UPDATE jobs SET countries = '["BR"]';
    `);
    await db.exec(preparationSql);
    await db.exec(`UPDATE jobs SET geographies = '["LATAM"]'`);
    const companies = (await db.query('SELECT * FROM companies')).rows;
    const jobs = (await db.query('SELECT * FROM jobs')).rows;
    await db.exec(preparationSql);
    expect((await db.query('SELECT * FROM companies')).rows).toEqual(companies);
    expect((await db.query('SELECT * FROM jobs')).rows).toEqual(jobs);
    expect(companies[0]).toMatchObject({ kind: 'consultancy' });
    expect(jobs[0]).toMatchObject({
      countries: ['BR'],
      geographies: ['LATAM'],
    });
    expect((await db.query('SELECT * FROM hiring_signals')).rows).toEqual([
      { id: 3, description: 'Keep this signal' },
    ]);
    expect(
      (await db.query('SELECT * FROM drizzle.__drizzle_migrations')).rows,
    ).toEqual([{ id: 4, hash: 'historical-hash' }]);
    expect(
      (
        await db.query(
          "SELECT to_regclass('public._prisma_migrations') AS ledger",
        )
      ).rows,
    ).toEqual([{ ledger: null }]);
  });

  it('does not repair or overwrite incompatible existing columns', async () => {
    await db.exec('ALTER TABLE companies ADD COLUMN kind integer DEFAULT 42');
    await db.exec(preparationSql);
    expect((await db.query('SELECT kind FROM companies')).rows).toEqual([
      { kind: 42 },
    ]);
    expect(
      (await db.query('SELECT geographies, countries FROM jobs')).rows,
    ).toEqual([{ geographies: [], countries: [] }]);
  });

  it('revokes all table privileges from existing public roles only on companies and jobs', async () => {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      GRANT ALL ON companies, jobs, hiring_signals TO anon, authenticated;
    `);
    await db.exec(preparationSql);
    await db.exec(preparationSql);
    const privileges = await db.query(`
      SELECT role.rolname, table_name, privilege
      FROM pg_roles role
      CROSS JOIN unnest(ARRAY['companies', 'jobs']) AS table_name
      CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) AS privilege
      WHERE role.rolname IN ('anon', 'authenticated')
        AND has_table_privilege(role.rolname, table_name, privilege)
    `);
    expect(privileges.rows).toEqual([]);
    expect(
      (
        await db.query(
          "SELECT has_table_privilege('anon', 'hiring_signals', 'SELECT') AS retained",
        )
      ).rows,
    ).toEqual([{ retained: true }]);
  });

  it('removes migration-owner default grants before the Prisma ledger is created', async () => {
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO anon, authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    `);
    await db.exec(preparationSql);
    await db.exec('CREATE TABLE future_migration_metadata (id integer)');
    const privileges = await db.query(`
      SELECT role.rolname, privilege
      FROM pg_roles role
      CROSS JOIN unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS privilege
      WHERE role.rolname IN ('anon', 'authenticated')
        AND has_table_privilege(role.rolname, 'future_migration_metadata', privilege)
    `);
    expect(privileges.rows).toEqual([]);
  });

  it('rolls back earlier additions on SQL failure and bounds lock acquisition', async () => {
    await db.exec('DROP TABLE jobs');
    await expect(db.exec(preparationSql)).rejects.toThrow('jobs');
    await db.exec('ROLLBACK');
    expect(
      (
        await db.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'kind'",
        )
      ).rows,
    ).toEqual([]);
    expect((await db.query('SELECT * FROM companies')).rows).toEqual([
      { id: LEGACY_COMPANY_ID, name: 'Legacy company' },
    ]);
    expect(preparationSql).toMatch(/BEGIN;\s+SET LOCAL lock_timeout = '5s';/);
    expect(preparationSql.trim()).toMatch(/COMMIT;$/);
  });
});
