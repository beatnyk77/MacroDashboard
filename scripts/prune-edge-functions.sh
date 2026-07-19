#!/usr/bin/env bash
# Free-tier edge-function prune helper.
# Deletes only the 2026-07-19 approved set (or custom list).
# Does NOT delete local source — re-deploy later if product needs them back.
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
# Default: keep newsletter + CIE; cut A-minus-newsletter + UK trade pair
DEFAULT_CUT=(
  api-auth-middleware
  ingest-china-defaults
  ingest-eurostat-debt
  ingest-financial-hubs-gold
  ingest-imf-gdp-per-capita
  ingest-macro-events
  ingest-trade-gravity
  ingest-uk-trade-ots
  ingest-uk-trade-traders
)

fns=("${@:-${DEFAULT_CUT[@]}}")

echo "Project: $PROJECT_REF"
echo "Deleting ${#fns[@]} functions (remote only)..."
for fn in "${fns[@]}"; do
  echo "→ $fn"
  supabase functions delete "$fn" --project-ref "$PROJECT_REF" --yes
done

echo
echo "ACTIVE count:"
supabase functions list --project-ref "$PROJECT_REF" | grep -c ACTIVE || true
echo "Budget: stay ≤95 ACTIVE (leave headroom for deploys)."
