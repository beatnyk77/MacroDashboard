#!/usr/bin/env bash
# GraphiQuestor — Undeploy/Delete obsolete and ghost edge functions from Supabase Cloud.
# Usage: SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_ID=... bash scripts/prune-remote-functions.sh
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GraphiQuestor — Remote Edge Function Pruning"
echo "  Project: ${PROJECT_REF}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# List of 16 legacy ghost functions that were deleted from repo in past sprints
GHOST_FUNCTIONS=(
  "api-auth-middleware"
  "debug-logs"
  "execute-restoration-sql"
  "ingest-china-defaults"
  "ingest-eurostat-debt"
  "ingest-financial-hubs-gold"
  "ingest-imf-gdp-per-capita"
  "ingest-macro-events"
  "llm-knowledge"
  "ingest-us-edgar-fundamentals"
  "ingest-events"
  "ingest-events-markers"
  "ingest-asi"
  "ingest-uk-trade-ots"
  "ingest-uk-trade-traders"
  "ingest-trade-gravity"
)

# List of 8 deprecated/synthetic functions being retired
DEPRECATED_FUNCTIONS=(
  "ingest-daily"
  "ingest-shadow-trade"
  "ingest-india-macro-weekly"
  "ingest-india-macro-snapshot"
  "ingest-india-digitization"
  "ingest-india-fiscal-allocation"
  "ingest-gold-history"
  "ingest-oil-global"
)

ALL_TO_DELETE=("${GHOST_FUNCTIONS[@]}" "${DEPRECATED_FUNCTIONS[@]}")

echo ""
echo "▶ Deleting ${#ALL_TO_DELETE[@]} obsolete/ghost functions from project ${PROJECT_REF}..."

for fn in "${ALL_TO_DELETE[@]}"; do
  echo -n "  • Deleting ${fn}... "
  if supabase functions delete "$fn" --project-ref "$PROJECT_REF" --yes >/dev/null 2>&1; then
    echo "✓ deleted"
  else
    echo "• (not present or already deleted)"
  fi
done

echo ""
echo "✓ Edge function pruning complete."
