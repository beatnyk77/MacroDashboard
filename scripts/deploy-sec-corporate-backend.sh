#!/usr/bin/env bash
# ==============================================================================
# GraphiQuestor — SEC Corporate Transmission Backend Automation
# ==============================================================================
# Automates schema migration, issuer seeding, secrets configuration,
# Edge Function deployment, and verification using Supabase CLI.
#
# Requirements:
#   - SUPABASE_ACCESS_TOKEN (Personal Access Token from supabase.com/dashboard/account/tokens)
#   - Optional: SUPABASE_PROJECT_ID (defaults to debdriyzfcwvgrhzzzre)
#   - Optional: SEC_USER_AGENT (defaults to GraphiQuestor Research Terminal)
# ==============================================================================

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
SEC_USER_AGENT_VALUE="${SEC_USER_AGENT:-GraphiQuestor Research Terminal (research@graphiquestor.com)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GraphiQuestor: SEC Corporate Transmission Backend Deploy"
echo "  Project: ${PROJECT_REF}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Check CLI availability ──────────────────────────────────────────────────
SUPABASE_CMD="supabase"
if ! command -v supabase >/dev/null 2>&1; then
  echo "ℹ supabase CLI not found in PATH, using 'npx supabase'..."
  SUPABASE_CMD="npx supabase"
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "✗ Error: SUPABASE_ACCESS_TOKEN environment variable is required." >&2
  echo "  Generate one at: https://supabase.com/dashboard/account/tokens" >&2
  echo "  Usage: SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/deploy-sec-corporate-backend.sh" >&2
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

# ── 2. Link Remote Project ────────────────────────────────────────────────────
echo ""
echo "▶ [1/4] Linking remote Supabase project: ${PROJECT_REF}..."
$SUPABASE_CMD link --project-ref "$PROJECT_REF" --yes

# Reconcile any remote-only migration timestamps
echo ""
echo "▶ Reconciling remote-only migration history..."
REMOTE_ONLY_MIGRATIONS=(20260801121844 20260802220516 20260830172153 20260830172201 20260830172208 20260830172213)
for version in "${REMOTE_ONLY_MIGRATIONS[@]}"; do
  $SUPABASE_CMD migration repair --status reverted "$version" --linked --yes || true
done

# ── 3. Apply Migrations & Seed Issuers ─────────────────────────────────────────
echo ""
echo "▶ [2/4] Pushing database schema migrations & issuer seeds..."
$SUPABASE_CMD db push --include-all --yes

# ── 4. Set Required Function Secrets ──────────────────────────────────────────
echo ""
echo "▶ [3/4] Configuring Edge Function secrets (SEC_USER_AGENT)..."
$SUPABASE_CMD secrets set --project-ref "$PROJECT_REF" SEC_USER_AGENT="$SEC_USER_AGENT_VALUE"

# ── 5. Deploy SEC Edge Functions ──────────────────────────────────────────────
echo ""
echo "▶ [4/4] Deploying SEC corporate edge functions..."

FUNCTIONS=("ingest-sec-corporate" "compute-corporate-signals")

for fn in "${FUNCTIONS[@]}"; do
  echo "  • Deploying ${fn}..."
  $SUPABASE_CMD functions deploy "$fn" \
    --project-ref "$PROJECT_REF" \
    --import-map "supabase/functions/deno.json" \
    --use-api
  echo "    ✓ ${fn} deployed successfully."
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ SEC Corporate Transmission Backend deployed successfully!"
echo "    - Tables & Views: sec_corporate_issuers, sec_filing_evidence, sec_corporate_signals"
echo "    - Curated Issuers: AAPL, MSFT, AMZN, CAT, XOM, F, BA"
echo "    - Secrets Set: SEC_USER_AGENT"
echo "    - Functions: ingest-sec-corporate, compute-corporate-signals"
echo "    - Crons: Daily ingestion (22:30 UTC) & Signal computation (23:00 UTC)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
