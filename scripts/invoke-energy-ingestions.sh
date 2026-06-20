#!/usr/bin/env bash
# GraphiQuestor — Energy & Commodities ingestion backfill
# Applies energy metrics migration (if pending) and triggers all energy pipelines.
#
# Requires: supabase login (SUPABASE_ACCESS_TOKEN)
# Usage:    ./scripts/invoke-energy-ingestions.sh
#           PROJECT_REF=debdriyzfcwvgrhzzzre ./scripts/invoke-energy-ingestions.sh --skip-migration
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-debdriyzfcwvgrhzzzre}"
SKIP_MIGRATION=false
for arg in "$@"; do
  case "$arg" in
    --skip-migration) SKIP_MIGRATION=true ;;
  esac
done

FUNCTIONS=(
  ingest-fred
  ingest-oil-spread
  ingest-oil-eia
  ingest-oil-global
  ingest-oil-india-china
  ingest-energy-global
  ingest-commodity-terminal
  ingest-fuel-security-india
  ingest-global-refining
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Energy & Commodities — Ingestion Backfill"
echo "  Project: $PROJECT_REF"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$SKIP_MIGRATION" != "true" ]]; then
  echo ""
  echo "▶ Step 1/3: Applying database migrations..."
  supabase db push --linked --include-all --yes
  echo "  ✓ Migrations applied"
else
  echo ""
  echo "▶ Step 1/3: Skipping migrations (--skip-migration)"
fi

echo ""
echo "▶ Step 2/3: Resolving service_role key..."
KEYS_JSON=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null \
  | rg -v "new version|recommend|supabase.com" || true)
SERVICE_ROLE_KEY=$(echo "$KEYS_JSON" | node -e "
  const fs = require('fs');
  const j = JSON.parse(fs.readFileSync(0, 'utf8'));
  const row = j.find(k => k.name === 'service_role');
  if (!row?.api_key) process.exit(1);
  process.stdout.write(row.api_key);
")

if [[ -z "${SERVICE_ROLE_KEY:-}" ]]; then
  echo "::error::Could not resolve service_role key. Run: supabase login"
  exit 1
fi
echo "  ✓ service_role key resolved"

BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"
FAILED=0
SUCCEEDED=0

echo ""
echo "▶ Step 3/3: Invoking edge functions..."

for fn in "${FUNCTIONS[@]}"; do
  echo -n "  → $fn ... "
  HTTP_CODE=$(curl -s -o /tmp/energy-ingest-"$fn".json -w "%{http_code}" \
    -X POST "${BASE_URL}/${fn}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    --max-time 300 || echo "000")

  if [[ "$HTTP_CODE" =~ ^2 ]]; then
    echo "HTTP $HTTP_CODE ✓"
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    echo "HTTP $HTTP_CODE ✗"
    head -c 200 /tmp/energy-ingest-"$fn".json 2>/dev/null || true
    echo ""
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $SUCCEEDED succeeded, $FAILED failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi