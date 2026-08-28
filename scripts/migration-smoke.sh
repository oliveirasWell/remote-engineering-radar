#!/usr/bin/env bash
set -euo pipefail

database_name='radar_prisma_smoke'
unbaselined_database_name='radar_prisma_unbaselined'

docker compose up -d --wait db
database_password="$(docker compose config --format json | node -e \
  'const fs = require("node:fs"); const config = JSON.parse(fs.readFileSync(0, "utf8")); process.stdout.write(config.services.db.environment.POSTGRES_PASSWORD)')"
encoded_password="$(printf '%s' "$database_password" | node -e \
  'const fs = require("node:fs"); process.stdout.write(encodeURIComponent(fs.readFileSync(0, "utf8")))')"
database_url="postgresql://postgres:${encoded_password}@localhost:5432/${database_name}"

docker compose exec -T db dropdb --if-exists --username postgres "$database_name"
docker compose exec -T db createdb --username postgres "$database_name"
docker compose exec -T db psql --username postgres --dbname "$database_name" --command \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF; END \$\$; ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;"

DATABASE_MIGRATION_URL="$database_url" pnpm db:deploy
DATABASE_MIGRATION_URL="$database_url" pnpm db:deploy
DATABASE_MIGRATION_URL="$database_url" pnpm db:baseline-check

table_count="$(docker compose exec -T db psql --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('companies', 'jobs', 'hiring_signals')")"
test "$table_count" = '3'

migration_count="$(docker compose exec -T db psql --username postgres --dbname "$database_name" --tuples-only --no-align --command 'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL')"
test "$migration_count" = '2'

timestamp_typmods="$(docker compose exec -T db psql --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT string_agg(DISTINCT attribute.atttypmod::text, ',' ORDER BY attribute.atttypmod::text) FROM pg_attribute attribute JOIN pg_class relation ON relation.oid = attribute.attrelid JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace JOIN pg_type type ON type.oid = attribute.atttypid WHERE namespace.nspname = 'public' AND relation.relname IN ('companies', 'jobs', 'hiring_signals') AND type.typname = 'timestamptz' AND attribute.attnum > 0")"
test "$timestamp_typmods" = '-1'

public_privilege_count="$(docker compose exec -T db psql --username postgres --dbname "$database_name" --tuples-only --no-align --command "SELECT count(*) FROM pg_roles role CROSS JOIN unnest(ARRAY['companies', 'jobs', 'hiring_signals', '_prisma_migrations']) AS table_name WHERE role.rolname IN ('anon', 'authenticated') AND (has_table_privilege(role.rolname, 'public.' || table_name, 'SELECT') OR has_table_privilege(role.rolname, 'public.' || table_name, 'INSERT') OR has_table_privilege(role.rolname, 'public.' || table_name, 'UPDATE') OR has_table_privilege(role.rolname, 'public.' || table_name, 'DELETE'))")"
test "$public_privilege_count" = '0'

docker compose exec -T db dropdb --if-exists --username postgres "$unbaselined_database_name"
docker compose exec -T db createdb --username postgres "$unbaselined_database_name"
docker compose exec -T db psql --username postgres --dbname "$unbaselined_database_name" --command 'CREATE TABLE companies (id uuid PRIMARY KEY)'
unbaselined_url="postgresql://postgres:${encoded_password}@localhost:5432/${unbaselined_database_name}"
if DATABASE_MIGRATION_URL="$unbaselined_url" pnpm db:deploy; then
  echo 'Unbaselined existing tables were not blocked.' >&2
  exit 1
fi
