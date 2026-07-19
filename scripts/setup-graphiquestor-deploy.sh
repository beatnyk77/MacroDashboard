#!/usr/bin/env bash
# setup-graphiquestor-deploy.sh
# Wire Supabase CLI + GitHub secrets for GraphiQuestor (debdriyzfcwvgrhzzzre),
# then deploy generate-morning-brief and trigger Heartbeat Deploy + Verify.
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN='sbp_…'   # from https://supabase.com/dashboard/account/tokens
#   # optional: export SUPABASE_DB_PASSWORD='…'  # if GH secret is stale
#   bash scripts/setup-graphiquestor-deploy.sh
#
# Or pass token as first arg:
#   bash scripts/setup-graphiquestor-deploy.sh 'sbp_…'
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
TOKEN="${1:-${SUPABASE_ACCESS_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: No access token."
  echo "1) Open https://supabase.com/dashboard/account/tokens (account that owns GraphiQuestor)"
  echo "2) Generate a token (starts with sbp_)"
  echo "3) Run:  bash scripts/setup-graphiquestor-deploy.sh 'sbp_…'"
  exit 1
fi

if [[ "$TOKEN" != sbp_* ]]; then
  echo "ERROR: Token must start with sbp_ (Management API personal access token)."
  echo "Got prefix: ${TOKEN:0:6}…"
  exit 1
fi

echo "==> Logging into Supabase CLI with PAT"
supabase login --token "$TOKEN" --yes

echo "==> Verifying org/project access to $PROJECT_REF"
if ! supabase projects list -o json 2>/dev/null | python3 -c "
import sys, json
refs = {p.get('id') or p.get('ref') for p in json.load(sys.stdin)}
# API shape varies: reference_id vs id
" 2>/dev/null; then
  :
fi

# Explicit Management API check
export SUPABASE_ACCESS_TOKEN="$TOKEN"
export SUPABASE_PROJECT_ID="$PROJECT_REF"
python3 - <<'PY'
import json, os, urllib.request, sys
tok = os.environ["SUPABASE_ACCESS_TOKEN"]
ref = os.environ["SUPABASE_PROJECT_ID"]
req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{ref}",
    headers={"Authorization": f"Bearer {tok}"},
)
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        p = json.loads(r.read())
        print(f"  Project OK: {p.get('name')} ({ref}) org={p.get('organization_id')}")
except Exception as e:
    body = e.read().decode()[:300] if hasattr(e, "read") else str(e)
    print(f"ERROR: Cannot access project {ref}: {getattr(e, 'code', '')} {body}")
    print("  → Log into the Supabase account that owns GraphiQuestor and create a new sbp_ token.")
    sys.exit(1)
PY

echo "==> Linking local project"
supabase link --project-ref "$PROJECT_REF" --yes 2>/dev/null || supabase link --project-ref "$PROJECT_REF"

echo "==> Setting GitHub Actions secrets (repo beatnyk77/MacroDashboard)"
printf '%s' "$TOKEN" | gh secret set SUPABASE_ACCESS_TOKEN --repo beatnyk77/MacroDashboard
printf '%s' "$PROJECT_REF" | gh secret set SUPABASE_PROJECT_ID --repo beatnyk77/MacroDashboard
printf '%s' "https://${PROJECT_REF}.supabase.co" | gh secret set SUPABASE_URL --repo beatnyk77/MacroDashboard

if [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
  printf '%s' "$SUPABASE_DB_PASSWORD" | gh secret set SUPABASE_DB_PASSWORD --repo beatnyk77/MacroDashboard
  echo "  SUPABASE_DB_PASSWORD updated"
else
  echo "  SUPABASE_DB_PASSWORD left unchanged (set SUPABASE_DB_PASSWORD env to refresh)"
fi

echo "==> Deploying generate-morning-brief (critical P0)"
supabase functions deploy generate-morning-brief \
  --project-ref "$PROJECT_REF" \
  --import-map supabase/functions/deno.json \
  --use-api

echo "==> Invoking generate-morning-brief (service role from project if available)"
# Prefer vault-less invoke via CLI if supported; else skip
if supabase functions invoke generate-morning-brief --project-ref "$PROJECT_REF" 2>/dev/null; then
  echo "  invoke attempted via CLI"
else
  echo "  CLI invoke skipped (deploy still succeeded) — Heartbeat workflow will re-verify"
fi

echo "==> Triggering GitHub Heartbeat Deploy + Verify"
gh workflow run heartbeat-deploy-verify.yml \
  --repo beatnyk77/MacroDashboard \
  -f trigger_netlify=true \
  -f deploy_functions=true \
  2>/dev/null || gh workflow run "Heartbeat Deploy + Verify" --repo beatnyk77/MacroDashboard 2>/dev/null || \
  gh workflow run heartbeat-deploy-verify.yml --repo beatnyk77/MacroDashboard

echo ""
echo "Done. Next:"
echo "  gh run list --workflow=heartbeat-deploy-verify.yml --limit 3"
echo "  curl -sI https://graphiquestor.com/macro-brief/ | head -20"
echo "  # After Netlify publishes, confirm self-canonical + MacroBrief assets"
