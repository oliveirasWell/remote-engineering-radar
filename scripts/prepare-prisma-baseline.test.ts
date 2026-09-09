import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const preparationSql = readFileSync(
  new URL('./prepare-prisma-baseline.sql', import.meta.url),
  'utf8',
);

describe('legacy Prisma baseline preparation SQL', () => {
  let db: PGlite;

  beforeEach(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE TABLE companies (id integer PRIMARY KEY, name text NOT NULL);
      CREATE TABLE jobs (
        id integer PRIMARY KEY,
        company_id integer NOT NULL REFERENCES companies(id),
        title text NOT NULL,
        technologies jsonb NOT NULL DEFAULT '[]'::jsonb
      );
      CREATE TABLE hiring_signals (id integer PRIMARY KEY, description text);
      CREATE SCHEMA drizzle;
      CREATE TABLE drizzle.__drizzle_migrations (id integer PRIMARY KEY, hash text);
      INSERT INTO companies VALUES (1, 'Legacy company');
      INSERT INTO jobs VALUES (2, 1, 'Existing role', '["React"]');
      INSERT INTO hiring_signals VALUES (3, 'Keep this signal');
      INSERT INTO drizzle.__drizzle_migrations VALUES (4, 'historical-hash');
    `);
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds exactly the three legacy columns with NOT NULL types and defaults, preserving rows', async () => {
    await db.exec(preparationSql);

    const columns = await db.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name IN ('kind', 'geographies', 'countries')
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
    ]);
    expect((await db.query('SELECT * FROM companies')).rows).toEqual([
      { id: 1, name: 'Legacy company', kind: 'product' },
    ]);
    expect((await db.query('SELECT * FROM jobs')).rows).toEqual([
      {
        id: 2,
        company_id: 1,
        title: 'Existing role',
        technologies: ['React'],
        geographies: [],
        countries: [],
      },
    ]);
    await db.exec(`
      INSERT INTO companies (id, name) VALUES (5, 'New company');
      INSERT INTO jobs (id, company_id, title) VALUES (6, 5, 'New role');
    `);
    expect(
      (await db.query('SELECT kind FROM companies WHERE id = 5')).rows,
    ).toEqual([{ kind: 'product' }]);
    expect(
      (await db.query('SELECT geographies, countries FROM jobs WHERE id = 6'))
        .rows,
    ).toEqual([{ geographies: [], countries: [] }]);
    await expect(db.exec('UPDATE companies SET kind = NULL')).rejects.toThrow();
    await expect(
      db.exec('UPDATE jobs SET geographies = NULL'),
    ).rejects.toThrow();
    await expect(db.exec('UPDATE jobs SET countries = NULL')).rejects.toThrow();
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
      { id: 1, name: 'Legacy company' },
    ]);
    expect(preparationSql).toMatch(/BEGIN;\s+SET LOCAL lock_timeout = '5s';/);
    expect(preparationSql.trim()).toMatch(/COMMIT;$/);
  });
});
