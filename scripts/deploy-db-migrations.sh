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
  echo "⚠ SUPABASE_ACCESS_TOKEN not set — ensure you have run: supabase login"
fi

echo ""
echo "▶ Step 1/2: Link project (idempotent)..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "▶ Step 2/2: Push migrations (--include-all for out-of-order timestamps)..."
supabase db push --include-all --yes

echo ""
echo "▶ Migration status:"
supabase migration list

echo ""
echo "✓ Migrations applied successfully."