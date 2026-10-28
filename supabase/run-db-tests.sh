#!/usr/bin/env bash
# Runs the DB-level verification scripts in supabase/tests against the local
# Supabase database. Each script runs in a transaction that is rolled back.
set -euo pipefail
cd "$(dirname "$0")/.."

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
PROJECT_ID="$(sed -n 's/^project_id = "\(.*\)"/\1/p' supabase/config.toml)"

run_sql() {
  if command -v psql >/dev/null 2>&1; then
    psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f "$1"
  else
    # No local psql: run it inside the Supabase Postgres container.
    docker exec -i "supabase_db_${PROJECT_ID}" psql -U postgres -v ON_ERROR_STOP=1 -q < "$1"
  fi
}

for f in supabase/tests/*.sql; do
  echo "▶ $f"
  run_sql "$f"
done
echo "✓ all DB checks passed"
