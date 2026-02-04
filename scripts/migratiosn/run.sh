#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" && -z "${DATABASE_URL:-}" ]]; then
  echo "Missing database URL. Set SUPABASE_DB_URL or DATABASE_URL." >&2
  exit 1
fi

node scripts/db/migrate.mjs
