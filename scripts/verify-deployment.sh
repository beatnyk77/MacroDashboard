#!/bin/bash
# RBI Money Market Deployment Verification Script
# Run this after deploying the edge function and applying the migration

set -e

echo "=== RBI Money Market Deployment Verification ==="
echo ""

# Check if environment variables are set
if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "⚠️  SUPABASE_ANON_KEY not set. Using placeholder."
  SUPABASE_ANON_KEY="your-anon-key"
fi

if [ -z "$SUPABASE_URL" ]; then
  echo "⚠️  SUPABASE_URL not set. Using placeholder."
  SUPABASE_URL="https://your-project.supabase.co"
fi

PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo "Project ref: $PROJECT_REF"
echo ""

# 1. Check function deployment status
echo "1. Checking edge function deployment status..."
curl -s -X GET \
  "https://$PROJECT_REF.functions.supabase.co/ingest-rbi-money-market" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  --fail-with-body 2>/dev/null || echo "Function endpoint may not be ready yet (expected 405 for GET)."
echo ""

# 2. Trigger manual ingestion
echo "2. Triggering manual ingestion..."
TRIGGER_RESPONSE=$(curl -s -X POST \
  "https://$PROJECT_REF.functions.supabase.co/ingest-rbi-money-market" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response: $TRIGGER_RESPONSE"
echo ""

# 3. Wait a moment and check ingestion logs
echo "3. Waiting 5 seconds for ingestion to complete..."
sleep 5

echo "4. Checking latest data in rbi_money_market_ops..."
# Query via PostgREST - note: you need SELECT permission on these tables for anon role
curl -s "$SUPABASE_URL/rest/v1/rbi_money_market_ops?select=*,call_money_vol,call_money_rate&order=date.desc&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.' 2>/dev/null || echo "Could not query data (check RLS policies or jq not installed)"

echo ""
echo "5. Checking latest data in rbi_liquidity_ops..."
curl -s "$SUPABASE_URL/rest/v1/rbi_liquidity_ops?select=*,msf_rate,sdf_rate&order=date.desc&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.' 2>/dev/null || echo "Could not query data"

echo ""
echo "=== Verification Steps Complete ==="
echo ""
echo "Next steps:"
echo "- Check Supabase Dashboard > Logs > Edge Functions for any errors"
echo "- Check Supabase Dashboard > Table Editor for rbi_money_market_ops and rbi_liquidity_ops"
echo "- Verify Interest Rate Corridor chart shows historical series in UI"
echo "- Confirm Segment Allocation shows real volumes and rates (not zeros)"
echo ""
