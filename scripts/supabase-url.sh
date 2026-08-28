#!/usr/bin/env bash
# Verifies a least-privilege Supabase role and optionally prints its pooler URL.
# The password is read silently and passed to psql over stdin.
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-fjhpbdrcoutxjunqvddf}"
POOLER_HOST="${POOLER_HOST:-aws-0-us-east-1.pooler.supabase.com}"
POOLER_PORT="${POOLER_PORT:-6543}"
DB_ROLE="${DB_ROLE:-}"
DB_ACCESS="${DB_ACCESS:-read}"

if [[ -z "$DB_ROLE" ]]; then
  echo 'Set DB_ROLE to a dedicated least-privilege PostgreSQL role.' >&2
  exit 1
fi

case "$DB_ROLE" in
  postgres | supabase_admin | service_role)
    echo 'DB_ROLE must not be a database owner or administrative role.' >&2
    exit 1
    ;;
esac

case "$POOLER_PORT" in
  5432 | 6543) ;;
  *)
    echo 'POOLER_PORT must be 5432 or 6543.' >&2
    exit 1
    ;;
esac

case "$DB_ACCESS" in
  read)
    ACCESS_CHECK="
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(ARRAY['companies', 'hiring_signals', 'jobs']) AS table_name
        WHERE has_table_privilege(current_user, 'public.' || table_name, 'INSERT')
           OR has_table_privilege(current_user, 'public.' || table_name, 'UPDATE')
           OR has_table_privilege(current_user, 'public.' || table_name, 'DELETE')
           OR has_table_privilege(current_user, 'public.' || table_name, 'TRUNCATE')
      )"
    ;;
  ingest)
    ACCESS_CHECK="
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(ARRAY['companies', 'hiring_signals', 'jobs']) AS table_name
        WHERE NOT has_table_privilege(current_user, 'public.' || table_name, 'SELECT')
           OR NOT has_table_privilege(current_user, 'public.' || table_name, 'INSERT')
           OR NOT has_table_privilege(current_user, 'public.' || table_name, 'UPDATE')
           OR NOT has_table_privilege(current_user, 'public.' || table_name, 'DELETE')
      )"
    ;;
  *)
    echo 'DB_ACCESS must be read or ingest.' >&2
    exit 1
    ;;
esac

ROLE_CHECK_SQL="
  SELECT CASE WHEN
    NOT rolsuper
    AND NOT rolcreaterole
    AND NOT rolcreatedb
    AND NOT rolreplication
    AND NOT rolbypassrls
    AND NOT has_schema_privilege(current_user, 'public', 'CREATE')
    AND NOT EXISTS (
      SELECT 1 FROM pg_class WHERE relowner = pg_roles.oid AND relnamespace = 'public'::regnamespace
    )
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(ARRAY['companies', 'hiring_signals', 'jobs']) AS table_name
      WHERE NOT has_table_privilege(current_user, 'public.' || table_name, 'SELECT')
    )
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(ARRAY['companies', 'hiring_signals', 'jobs']) AS table_name
      WHERE has_table_privilege(current_user, 'public.' || table_name, 'TRUNCATE')
         OR has_table_privilege(current_user, 'public.' || table_name, 'REFERENCES')
         OR has_table_privilege(current_user, 'public.' || table_name, 'TRIGGER')
         OR has_table_privilege(current_user, 'public.' || table_name, 'MAINTAIN')
    )
    $ACCESS_CHECK
  THEN 'safe' ELSE 'unsafe' END
  FROM pg_roles
  WHERE rolname = current_user
"

read -rsp 'Supabase database password: ' PASSWORD
echo

mode=$([[ "$POOLER_PORT" == 6543 ]] && echo transaction || echo session)
if ! role_status=$(printf '%s\n' "$PASSWORD" | docker compose exec \
    -e PGSSLMODE=verify-full \
    -T db psql \
    --host="$POOLER_HOST" \
    --port="$POOLER_PORT" \
    --username="$DB_ROLE.$PROJECT_REF" \
    --dbname=postgres \
    --password \
    --tuples-only \
    --no-align \
    --command="$ROLE_CHECK_SQL" 2>/dev/null); then
  echo "  :$POOLER_PORT $mode ($DB_ROLE) - FAILED"
  exit 1
fi

role_status=${role_status//$'\n'/}
if [[ "$role_status" != safe ]]; then
  echo "Role $DB_ROLE failed the $DB_ACCESS least-privilege check." >&2
  exit 1
fi
echo "  :$POOLER_PORT $mode ($DB_ROLE) - OK"

echo
read -rp 'Print URLs containing your password? [y/N] ' DISPLAY_URLS

case "$DISPLAY_URLS" in
  [yY] | [yY][eE][sS])
    ENCODED=$(printf '%s' "$PASSWORD" | node -e \
      'process.stdout.write(encodeURIComponent(require("node:fs").readFileSync(0, "utf8")))')

    build_url() {
      printf 'postgresql://%s.%s:%s@%s:%s/postgres?sslmode=verify-full' \
        "$DB_ROLE" "$PROJECT_REF" "$ENCODED" "$POOLER_HOST" "$POOLER_PORT"
    }

    echo 'DATABASE_URL (contains your password):'
    printf '  %s\n' "$(build_url)"
    ;;
  *)
    echo 'Connection URLs were not printed.'
    ;;
esac
