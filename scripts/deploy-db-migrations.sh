#!/usr/bin/env bash
# GraphiQuestor — apply pending Supabase migrations to the linked remote project.
# Requires: supabase login (SUPABASE_ACCESS_TOKEN) and SUPABASE_PROJECT_ID or default ref.
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GraphiQuestor — Database Migrations"
echo "  Project: ${PROJECT_REF}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v supabase >/dev/null 2>&1; then
  echo "✗ supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "✗ SUPABASE_ACCESS_TOKEN is required for CI-safe Supabase deployment" >&2
  exit 1
fi

if [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "✗ SUPABASE_DB_PASSWORD is required for migration deployment" >&2
  exit 1
fi

echo ""
echo "▶ Step 1/2: Link project (idempotent)..."
if [ -n "${SUPABASE_DB_PASSWORD:-}" ]; then
  supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --yes
else
  supabase link --project-ref "$PROJECT_REF" --yes
fi

echo ""
echo "▶ Reconciling known remote-only migration history..."
# These versions were reported by Supabase as present remotely but have no
# matching SQL file in this repository. Marking them reverted preserves the
# applied schema while allowing the repository migration set to become the
# authoritative history. Keep this list explicit and review new IDs manually.
REMOTE_ONLY_MIGRATIONS=(20260801121844 20260802220516)
MIGRATION_HISTORY="$(supabase migration list --linked 2>&1)"
for version in "${REMOTE_ONLY_MIGRATIONS[@]}"; do
  if printf '%s\n' "$MIGRATION_HISTORY" | grep -q "$version"; then
    echo "  • $version → reverted (remote history only)"
    supabase migration repair --status reverted "$version" --linked --yes
  else
    echo "  • $version → already reconciled"
  fi
done

echo ""
echo "▶ Step 2/2: Push migrations (--include-all for out-of-order timestamps)..."
supabase db push --include-all --yes

echo ""
echo "▶ Migration status:"
supabase migration list

echo ""
echo "✓ Migrations applied successfully."
