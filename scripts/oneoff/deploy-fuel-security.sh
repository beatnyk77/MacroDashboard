#!/bin/bash
set -e

# Fuel Security Clock – India: Automated Deployment Script
# Usage: ./deploy-fuel-security.sh [project-ref] [service-role-key]

PROJECT_REF="${1:?Provide your Supabase project ref (e.g., debdriyzfcwvgrhzzzre)}"
SERVICE_ROLE_KEY="${2:?Provide your service role key}"

echo "🚀 Deploying Fuel Security Clock – India to project: $PROJECT_REF"
echo ""

# Step 1: Push database migrations
echo "📦 Step 1/5: Applying database migrations..."
supabase db push --project-ref "$PROJECT_REF"
echo "✅ Migrations applied"
echo ""

# Step 2: Deploy edge function
echo "⚡ Step 2/5: Deploying edge function..."
supabase functions deploy ingest-fuel-security-india --project-ref "$PROJECT_REF" --no-verify-jwt
echo "✅ Edge function deployed"
echo ""

# Step 3: Set required secrets
echo "🔑 Step 3/5: Setting function secrets..."
# Check if keys exist in environment, otherwise prompt
EIA_API_KEY="${EIA_API_KEY:?Set EIA_API_KEY environment variable}"
FRED_API_KEY="${FRED_API_KEY:?Set FRED_API_KEY environment variable}"

supabase secrets set --project-ref "$PROJECT_REF" EIA_API_KEY="$EIA_API_KEY"
supabase secrets set --project-ref "$PROJECT_REF" FRED_API_KEY="$FRED_API_KEY"
echo "✅ Secrets configured"
echo ""

# Step 4: Configure app settings for cron
echo "⚙️  Step 4/5: Configuring app settings for cron..."
cat > /tmp/set_config.sql <<EOF
SELECT set_config('app.edge_function_url', 'https://$PROJECT_REF.functions.supabase.co', false);
SELECT set_config('app.service_role_key', '$SERVICE_ROLE_KEY', false);
EOF

supabase db execute --project-ref "$PROJECT_REF" -f /tmp/set_config.sql
echo "✅ App settings configured"
echo ""

# Step 5: Trigger initial ingestion
echo "🔄 Step 5/5: Triggering initial data ingestion..."
curl -s -X POST "https://$PROJECT_REF.functions.supabase.co/ingest-fuel-security-india" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" | jq .

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Verification Steps:"
echo "1. Check data: supabase db execute --project-ref $PROJECT_REF -f <(echo 'SELECT * FROM fuel_security_clock_india ORDER BY as_of_date DESC LIMIT 1;')"
echo "2. View logs: Supabase Dashboard → Edge Functions → ingest-fuel-security-india → Logs"
echo "3. Open dashboard: https://your-app.vercel.app/macro-observatory"
echo ""
echo "⚠️  Note: PPAC data uses placeholder values until real scraping is implemented."
echo "📖 See DEPLOYMENT_FUEL_SECURITY_CLOCK.md for full troubleshooting guide."
