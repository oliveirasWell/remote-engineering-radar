#!/usr/bin/env bash
# Verifies Supabase pooler access with a password read silently and passed to
# psql over stdin. Credential-bearing URLs require explicit confirmation.
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-fjhpbdrcoutxjunqvddf}"
POOLER_HOST="${POOLER_HOST:-aws-0-us-east-1.pooler.supabase.com}"
CONNECTIONS=(
  '6543|transaction|Vercel'
  '5432|session|Actions'
)

read -rsp 'Supabase database password: ' PASSWORD
echo

for connection in "${CONNECTIONS[@]}"; do
  IFS='|' read -r port mode consumer <<<"$connection"
  if printf '%s\n' "$PASSWORD" | docker compose exec -T db psql \
      --host="$POOLER_HOST" \
      --port="$port" \
      --username="postgres.$PROJECT_REF" \
      --dbname=postgres \
      --password \
      --command='select 1' >/dev/null 2>&1; then
    echo "  :$port $mode ($consumer) - OK"
  else
    echo "  :$port $mode ($consumer) - FAILED"
  fi
done

echo
read -rp 'Print URLs containing your password? [y/N] ' DISPLAY_URLS

case "$DISPLAY_URLS" in
  [yY] | [yY][eE][sS])
    ENCODED=$(printf '%s' "$PASSWORD" | node -e \
      'process.stdout.write(encodeURIComponent(require("node:fs").readFileSync(0, "utf8")))')

    build_url() {
      printf 'postgresql://postgres.%s:%s@%s:%s/postgres' \
        "$PROJECT_REF" "$ENCODED" "$POOLER_HOST" "$1"
    }

    echo 'Copy the line you need (it contains your password):'
    for connection in "${CONNECTIONS[@]}"; do
      IFS='|' read -r port _ consumer <<<"$connection"
      printf '  %-8s DATABASE_URL: %s\n' "$consumer" "$(build_url "$port")"
    done
    ;;
  *)
    echo 'Connection URLs were not printed.'
    ;;
esac
