#!/usr/bin/env bash
# GraphiQuestor — Invoicing FX pipeline (Supabase CLI automation)
#
# Uses FRED_API_KEY from Supabase Edge secrets (ingest-fred / ingest-currency-wars).
# No local FRED_API_KEY required.
#
# 1. Push migrations (CNY_INR_RATE, vw_fx_monthly_cross_rates, FRED metadata)
# 2. Deploy ingest-fred (targeted deep backfill) + ingest-currency-wars (if plan allows)
# 3. Backfill via edge function invoke → SQL cross-rate derivation
#
# Requires: supabase login (SUPABASE_ACCESS_TOKEN)
#
# Usage:
#   ./scripts/deploy-invoicing-fx.sh
#   ./scripts/deploy-invoicing-fx.sh --skip-migration
#   ./scripts/deploy-invoicing-fx.sh --skip-invoke
set -euo pipefail

PROJECT_REF="${PROJECT_REF:-debdriyzfcwvgrhzzzre}"
FUNCTION_NAME="ingest-currency-wars"
# ingest-us-macro?task=fred: already deployed, limit=2000, reads FRED_API_KEY from Edge secrets
US_MACRO_FRED_SLUG="ingest-us-macro?task=fred"
FRED_FUNCTION="ingest-fred"
INVOICING_FRED_BODY='{"metric_ids":["USD_INR_RATE","USD_CNY_RATE"],"limit":2000}'
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_DIR="$ROOT/scripts/sql/invoicing-fx"
cd "$ROOT"

SKIP_MIGRATION=false
SKIP_INVOKE=false
for arg in "$@"; do
  case "$arg" in
    --skip-migration) SKIP_MIGRATION=true ;;
    --skip-invoke) SKIP_INVOKE=true ;;
  esac
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Invoicing FX Pipeline — Supabase CLI Deploy"
echo "  Project: $PROJECT_REF"
echo "  FRED key: Supabase Edge secrets (no local key needed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! command -v supabase >/dev/null 2>&1; then
  echo "✗ supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
  exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "⚠ SUPABASE_ACCESS_TOKEN not set — ensure you have run: supabase login"
fi

resolve_invoke_key() {
  if [[ -n "${SUPABASE_INVOKE_KEY:-}" ]]; then
    echo "$SUPABASE_INVOKE_KEY"
    return 0
  fi
  if [[ -n "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
    echo "$VITE_SUPABASE_ANON_KEY"
    return 0
  fi

  local keys_json
  keys_json=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null \
    | rg -v "new version|recommend|supabase.com" || true)
  echo "$keys_json" | node -e "
    const fs = require('fs');
    const j = JSON.parse(fs.readFileSync(0, 'utf8'));
    const isMasked = (k) => /[·…]/.test(String(k?.api_key || ''));
    const anon = j.find(k => k.name === 'anon');
    const secret = j.find(k => k.type === 'secret' && !isMasked(k));
    const legacy = j.find(k => k.name === 'service_role');
    const key = anon?.api_key || secret?.api_key || legacy?.api_key;
    if (!key) process.exit(1);
    process.stdout.write(key);
  "
}

invoke_function() {
  local slug="$1"
  local outfile="$2"
  local body="${3:-{}}"
  local timeout="${4:-600}"
  curl -s -o "$outfile" -w "%{http_code}" \
    -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/${slug}" \
    -H "Authorization: Bearer ${INVOKE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$body" \
    --max-time "$timeout"
}

run_sql_file() {
  local label="$1"
  local file="$2"
  echo "  → $label"
  supabase db query --linked --file "$file" -o table 2>&1 || return 1
}

deploy_function() {
  local slug="$1"
  supabase functions deploy "$slug" \
    --project-ref "$PROJECT_REF" \
    --import-map supabase/functions/deno.json \
    --use-api 2>&1 | tee "/tmp/invoicing-fx-deploy-${slug}.log"
}

echo ""
echo "▶ Link project (idempotent)..."
supabase link --project-ref "$PROJECT_REF"

if [[ "$SKIP_MIGRATION" != "true" ]]; then
  echo ""
  echo "▶ Step 1/5: Push migrations..."
  supabase db push --linked --include-all --yes
  echo "  ✓ Migrations applied"
else
  echo ""
  echo "▶ Step 1/5: Skipping migrations (--skip-migration)"
fi

echo ""
echo "▶ Step 2/5: Deploy edge functions..."
FRED_DEPLOYED=false
CURRENCY_WARS_DEPLOYED=false

echo "  → $FRED_FUNCTION (targeted backfill: metric_ids + limit=2000)"
if deploy_function "$FRED_FUNCTION"; then
  FRED_DEPLOYED=true
  echo "  ✓ $FRED_FUNCTION deployed"
else
  echo "  ⚠ $FRED_FUNCTION deploy failed — will invoke existing version"
fi

echo "  → $FUNCTION_NAME (CNY/INR cross-rate derivation)"
if deploy_function "$FUNCTION_NAME"; then
  CURRENCY_WARS_DEPLOYED=true
  echo "  ✓ $FUNCTION_NAME deployed"
else
  if rg -q "402|Max number of functions" "/tmp/invoicing-fx-deploy-${FUNCTION_NAME}.log" 2>/dev/null; then
    echo "  ⚠ $FUNCTION_NAME deploy blocked (function plan limit)"
  else
    echo "  ⚠ $FUNCTION_NAME deploy failed"
  fi
fi

echo ""
echo "▶ Step 3/5: Resolve invoke API key..."
INVOKE_KEY=$(resolve_invoke_key || true)
if [[ -z "${INVOKE_KEY:-}" ]]; then
  echo "✗ Could not resolve invoke key. Set VITE_SUPABASE_ANON_KEY or run: supabase login"
  exit 1
fi
echo "  ✓ invoke key resolved"

BACKFILL_MODE="none"
if [[ "$SKIP_INVOKE" == "true" ]]; then
  echo ""
  echo "▶ Step 4/5: Skipping backfill (--skip-invoke)"
else
  echo ""
  echo "▶ Step 4/5: Backfill FX data (FRED via Edge secrets)..."

  run_sql_file "Wire FRED metadata" "$SQL_DIR/wire-fred-metadata.sql" || true

  if [[ "$CURRENCY_WARS_DEPLOYED" == "true" ]]; then
    echo "  → Invoke $FUNCTION_NAME (FRED limit=2000 + CNY/INR derivation)"
    HTTP_CODE=$(invoke_function "$FUNCTION_NAME" /tmp/invoicing-fx-ingest.json '{}' || echo "000")
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
      BACKFILL_MODE="currency-wars"
      echo "  ✓ $FUNCTION_NAME HTTP $HTTP_CODE"
      head -c 400 /tmp/invoicing-fx-ingest.json 2>/dev/null || true
      echo ""
    else
      echo "  ⚠ $FUNCTION_NAME HTTP $HTTP_CODE — falling back to $FRED_FUNCTION"
      head -c 300 /tmp/invoicing-fx-ingest.json 2>/dev/null || true
      echo ""
    fi
  fi

  if [[ "$BACKFILL_MODE" == "none" ]]; then
    echo "  → Invoke $US_MACRO_FRED_SLUG (limit=2000, FRED_API_KEY from Edge secrets)"
    HTTP_CODE=$(invoke_function "$US_MACRO_FRED_SLUG" /tmp/invoicing-fx-us-macro.json '{}' 600 || echo "000")
    if [[ "$HTTP_CODE" =~ ^2 ]]; then
      BACKFILL_MODE="us-macro-fred"
      echo "  ✓ $US_MACRO_FRED_SLUG HTTP $HTTP_CODE"
      head -c 400 /tmp/invoicing-fx-us-macro.json 2>/dev/null || true
      echo ""
    elif [[ "$FRED_DEPLOYED" == "true" ]]; then
      echo "  ⚠ $US_MACRO_FRED_SLUG HTTP $HTTP_CODE — trying targeted $FRED_FUNCTION"
      HTTP_CODE=$(invoke_function "$FRED_FUNCTION" /tmp/invoicing-fx-fred.json "$INVOICING_FRED_BODY" 600 || echo "000")
      if [[ "$HTTP_CODE" =~ ^2 ]]; then
        BACKFILL_MODE="ingest-fred"
        echo "  ✓ $FRED_FUNCTION HTTP $HTTP_CODE"
        head -c 400 /tmp/invoicing-fx-fred.json 2>/dev/null || true
        echo ""
      fi
    fi

    if [[ "$BACKFILL_MODE" == "none" ]]; then
      echo "  ✗ FRED backfill failed (HTTP $HTTP_CODE)"
      cat /tmp/invoicing-fx-us-macro.json /tmp/invoicing-fx-fred.json 2>/dev/null || true
      exit 1
    fi

    run_sql_file "Derive CNY/INR cross-rate" "$SQL_DIR/backfill-cny-inr.sql" || true
  fi
fi

echo ""
echo "▶ Step 5/5: Verification..."
supabase db query --linked --file "$SQL_DIR/verify.sql" -o table 2>&1 || echo "  ⚠ Verification query failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$BACKFILL_MODE" == "currency-wars" ]]; then
  echo "  ✅ Invoicing FX pipeline deployed ($FUNCTION_NAME)"
elif [[ "$BACKFILL_MODE" == "us-macro-fred" || "$BACKFILL_MODE" == "ingest-fred" ]]; then
  echo "  ✅ Invoicing FX data backfilled via Edge function (FRED_API_KEY from secrets)"
else
  echo "  ⚠ Deploy finished — review verification output above"
fi
echo ""
echo "  Next: /trade-fx → Invoicing Currency Framework"
echo "  Data: FRED EXINUS + DEXCHUS → CNY_INR_RATE cross-rate"
if [[ "$CURRENCY_WARS_DEPLOYED" != "true" ]]; then
  echo "  Note: $FUNCTION_NAME not updated — delete unused functions to free a deploy slot"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"