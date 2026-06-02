#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GraphiQuestor — Trade Imports Backend Deployment Script
# Requires: supabase login (SUPABASE_ACCESS_TOKEN set)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT_REF="debdriyzfcwvgrhzzzre"
FUNCTION_NAME="ingest-trade-global-pulse"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GraphiQuestor Trade Imports — Backend Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Apply the SQL migration (vw_country_trade_imports view)
echo ""
echo "▶ Step 1/3: Applying SQL migration vw_country_trade_imports..."
supabase db push \
  2>&1 | tail -5

echo "  ✓ Migration applied"

# 2. Deploy the updated edge function (now with flowCode=M imports)
echo ""
echo "▶ Step 2/3: Deploying edge function '$FUNCTION_NAME' (with import flow)..."
supabase functions deploy "$FUNCTION_NAME" \
  --project-ref "$PROJECT_REF" \
  --import-map supabase/functions/deno.json \
  --use-api \
  2>&1 | tail -5

echo "  ✓ Edge function deployed"

# 3. Trigger an initial ingestion for IND and USA (most watched countries)
echo ""
echo "▶ Step 3/3: Triggering initial import ingestion for IND and USA..."

SUPABASE_ANON_KEY=$(supabase projects api-keys --project-ref "$PROJECT_REF" --output json 2>/dev/null \
  | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); const ak=j.find(k=>k.name==='anon'); console.log(ak?.api_key || '')" 2>/dev/null || echo "")

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "  ⚠ Could not get anon key automatically. Triggering via curl with service role key..."
  SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$VITE_SUPABASE_ANON_KEY}"
fi

EDGE_URL="https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}"

# Trigger IND import ingestion
echo "  → Triggering IND imports..."
curl -s -o /dev/null -w "    IND: HTTP %{http_code}\n" \
  -X POST "${EDGE_URL}?reporterISO=IND" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" || echo "  ⚠ Trigger failed (check auth)"

# Trigger USA import ingestion
echo "  → Triggering USA imports..."
curl -s -o /dev/null -w "    USA: HTTP %{http_code}\n" \
  -X POST "${EDGE_URL}?reporterISO=USA" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" || echo "  ⚠ Trigger failed (check auth)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Backend deployment complete!"
echo ""
echo "  Next steps:"
echo "  • Open /trade in your browser"
echo "  • Click a country then 'Refresh' in the Import Pulse panel"
echo "  • Import data will populate in ~30-60 seconds per country"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
