#!/usr/bin/env bash
set -euo pipefail

database_name='radar_prisma_smoke'
unbaselined_database_name='radar_prisma_unbaselined'
legacy_database_name='radar_prisma_legacy'

# All databases and cluster-wide test roles live in this disposable container.
database_password="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(24).toString("hex"))')"
container_id="$(docker run --detach --rm --publish 127.0.0.1::5432 --env POSTGRES_PASSWORD="$database_password" postgres:17-alpine)"
trap 'docker rm --force --volumes "$container_id"' EXIT
for attempt in {1..30}; do
  # The temporary bootstrap server only accepts Unix-socket connections.
  if docker exec "$container_id" pg_isready --host 127.0.0.1 --username postgres; then
    break
  fi
  sleep 1
done
docker exec "$container_id" pg_isready --host 127.0.0.1 --username postgres
database_address="$(docker port "$container_id" 5432/tcp)"
database_url="postgresql://postgres:${database_password}@${database_address}/${database_name}"

docker exec "$container_id" createdb --username postgres "$database_name"
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --command \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF; END \$\$; ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;"
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --command \
  "CREATE ROLE provider_owner; ALTER DEFAULT PRIVILEGES FOR ROLE provider_owner IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;"

DATABASE_MIGRATION_URL="$database_url" pnpm db:deploy
DATABASE_MIGRATION_URL="$database_url" pnpm db:deploy
DATABASE_MIGRATION_URL="$database_url" pnpm db:baseline-check
provider_defaults="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT EXISTS (SELECT 1 FROM pg_default_acl WHERE defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'provider_owner'))")"
test "$provider_defaults" = 't'
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --command \
  "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon;"
if DATABASE_MIGRATION_URL="$database_url" pnpm db:baseline-check; then
  echo 'Unsafe Radar creator defaults were not blocked.' >&2
  exit 1
fi
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --command \
  "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;"

table_count="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('companies', 'jobs', 'hiring_signals')")"
test "$table_count" = '3'

migration_count="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --tuples-only --no-align --command 'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')"
test "$migration_count" = '2'

timestamp_typmods="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT string_agg(DISTINCT attribute.atttypmod::text, ',' ORDER BY attribute.atttypmod::text) FROM pg_attribute attribute JOIN pg_class relation ON relation.oid = attribute.attrelid JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace JOIN pg_type type ON type.oid = attribute.atttypid WHERE namespace.nspname = 'public' AND relation.relname IN ('companies', 'jobs', 'hiring_signals', 'ingestion_runs') AND type.typname = 'timestamptz' AND attribute.attnum > 0")"
test "$timestamp_typmods" = '-1'

public_privilege_count="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT count(*) FROM pg_roles role CROSS JOIN unnest(ARRAY['companies', 'jobs', 'hiring_signals', 'ingestion_runs', '_prisma_migrations']) AS table_name WHERE role.rolname IN ('anon', 'authenticated') AND (has_table_privilege(role.rolname, 'public.' || table_name, 'SELECT') OR has_table_privilege(role.rolname, 'public.' || table_name, 'INSERT') OR has_table_privilege(role.rolname, 'public.' || table_name, 'UPDATE') OR has_table_privilege(role.rolname, 'public.' || table_name, 'DELETE'))")"
test "$public_privilege_count" = '0'

docker exec "$container_id" createdb --username postgres "$unbaselined_database_name"
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$unbaselined_database_name" --command 'CREATE TABLE companies (id uuid PRIMARY KEY)'
unbaselined_url="postgresql://postgres:${database_password}@${database_address}/${unbaselined_database_name}"
if DATABASE_MIGRATION_URL="$unbaselined_url" pnpm db:deploy; then
  echo 'Unbaselined existing tables were not blocked.' >&2
  exit 1
fi

docker exec "$container_id" createdb --username postgres "$legacy_database_name"
legacy_url="postgresql://postgres:${database_password}@${database_address}/${legacy_database_name}"
# Reproduce the full legacy schema without changing migration files or registering Prisma.
node --input-type=module -e '
  import { readFileSync } from "node:fs";
  const baseline = readFileSync("prisma/migrations/20260828000000_prisma_baseline/migration.sql", "utf8");
  process.stdout.write(baseline.split("DO $$")[0].replace(/^\s+"(?:kind|geographies|countries)" .+\n/gm, ""));
' | docker exec --interactive "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name"
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --command "
  CREATE SCHEMA drizzle;
  CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('legacy-history', 1787875200000);
  INSERT INTO companies (id, name, slug, source, hiring_score) VALUES ('00000000-0000-4000-8000-000000000001', 'Legacy company', 'legacy-company', 'smoke', 21);
  INSERT INTO jobs (company_id, source, source_job_id, title, url, technologies) VALUES ('00000000-0000-4000-8000-000000000001', 'smoke', 'legacy-job', 'Existing role', 'https://example.com/job', '[\"React\"]');
  INSERT INTO hiring_signals (company_id, type, description) VALUES ('00000000-0000-4000-8000-000000000001', 'smoke', 'Keep this signal');
  INSERT INTO ingestion_runs (persisted_jobs, companies_updated) VALUES (1, 1);
  GRANT ALL ON companies, jobs TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
"
snapshot_query="SELECT jsonb_build_object(
  'companies', (SELECT jsonb_agg(to_jsonb(c) - 'kind' ORDER BY id) FROM companies c),
  'jobs', (SELECT jsonb_agg(to_jsonb(j) - 'geographies' - 'countries' ORDER BY id) FROM jobs j),
  'hiring_signals', (SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM hiring_signals s),
  'ingestion_runs', (SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM ingestion_runs r),
  'drizzle', (SELECT jsonb_agg(to_jsonb(m) ORDER BY id) FROM drizzle.__drizzle_migrations m)
)"
before="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --tuples-only --no-align --command "$snapshot_query")"
if DATABASE_MIGRATION_URL="$legacy_url" pnpm db:baseline-check; then
  echo 'Legacy schema with missing columns unexpectedly passed parity.' >&2
  exit 1
fi
if DATABASE_MIGRATION_URL="$legacy_url" pnpm db:deploy; then
  echo 'Legacy schema was automatically prepared or resolved by deploy.' >&2
  exit 1
fi
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:prepare-baseline
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:baseline-check
defaults="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --tuples-only --no-align --command "SELECT kind = 'product' AND geographies = '[]'::jsonb AND countries = '[]'::jsonb FROM companies JOIN jobs ON jobs.company_id = companies.id")"
test "$defaults" = 't'
ledger_absent="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --tuples-only --no-align --command "SELECT to_regclass('public._prisma_migrations') IS NULL")"
test "$ledger_absent" = 't'
if DATABASE_MIGRATION_URL="$legacy_url" pnpm db:deploy; then
  echo 'Prepared schema bypassed explicit baseline resolution.' >&2
  exit 1
fi
docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --command "UPDATE companies SET kind = 'consultancy'; UPDATE jobs SET geographies = '[\"LATAM\"]', countries = '[\"BR\"]';"
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:prepare-baseline
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:resolve-baseline
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:deploy
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:deploy
DATABASE_MIGRATION_URL="$legacy_url" pnpm db:status
after="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --tuples-only --no-align --command "$snapshot_query")"
test "$before" = "$after"
preserved="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --tuples-only --no-align --command "SELECT kind = 'consultancy' AND geographies = '[\"LATAM\"]'::jsonb AND countries = '[\"BR\"]'::jsonb FROM companies JOIN jobs ON jobs.company_id = companies.id")"
test "$preserved" = 't'
migration_count="$(docker exec "$container_id" psql --set ON_ERROR_STOP=1 --username postgres --dbname "$legacy_database_name" --tuples-only --no-align --command 'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')"
test "$migration_count" = '2'
echo 'Fresh deploy and legacy preparation/check/resolve/deploy passed without data loss.'
