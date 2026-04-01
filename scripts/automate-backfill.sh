#!/bin/bash

# ======================================================
# script: automate-backfill.sh
# Purpose: Automates the equities data backfill using Supabase REST API
# ======================================================

PROJECT_URL="https://debdriyzfcwvgrhzzzre.supabase.co"
# Using the confirmed anon key found in the script resources
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc"

echo "🚀 Starting Equities Data backfill (Remote)..."

# 1. Sync US Companies
echo "--- 1/3: Syncing US Companies ---"
curl -s -X POST "$PROJECT_URL/functions/v1/ingest-us-edgar-fundamentals" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "companies"}' | grep -o '"success":true' || echo "⚠️  Failed to sync companies"

# 2. Sync US Fundamentals
echo "--- 2/3: Syncing US Fundamentals (Backfill) ---"
curl -s -X POST "$PROJECT_URL/functions/v1/ingest-us-edgar-fundamentals" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "fundamentals"}' | grep -o '"success":true' || echo "⚠️  Failed to sync fundamentals"

# 3. Trigger CIE Macro Score Computation
echo "--- 3/3: Computing India (CIE) Macro Scores ---"
curl -s -X POST "$PROJECT_URL/functions/v1/compute-cie-macro-scores" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | grep -o '"success":true' || echo "⚠️  Failed to compute macro scores"

echo ""
echo "✅ Backfill triggering complete. Monitor logs at: https://supabase.com/dashboard/project/debdriyzfcwvgrhzzzre/functions"
