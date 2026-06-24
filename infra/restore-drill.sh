#!/usr/bin/env bash
# Backup + Time-Travel helper for the restore drill (NFR-08). Wraps the read-only
# steps: an SQL export and the Time Travel window. The actual restore (which
# overwrites data) is deliberately left manual - see infra/restore-drill.md.
set -euo pipefail

ENVIRONMENT="${1:-staging}"

case "$ENVIRONMENT" in
  staging)
    FILTER="@cutura/storefront"
    DB="cutura-staging"
    ENV_FLAG="--env staging"
    ;;
  production)
    FILTER="@cutura/admin"
    DB="cutura-production"
    ENV_FLAG=""
    ;;
  *)
    echo "usage: $0 <staging|production>" >&2
    exit 1
    ;;
esac

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="backup-${ENVIRONMENT}-${STAMP}.sql"

echo "Exporting ${DB} to ${OUT} ..."
pnpm --filter "$FILTER" exec wrangler d1 export "$DB" $ENV_FLAG --remote --output "$OUT"

echo "Time Travel window for ${DB}:"
pnpm --filter "$FILTER" exec wrangler d1 time-travel info "$DB" $ENV_FLAG

echo "Done. Store ${OUT} off-platform. To restore (overwrites data):"
echo "  pnpm --filter $FILTER exec wrangler d1 time-travel restore $DB $ENV_FLAG --timestamp <ISO-8601>"
