#!/usr/bin/env bash
# GraphiQuestor — China Debt stack deployment (migrations + edge functions + seed invoke)
# Requires: supabase login (SUPABASE_ACCESS_TOKEN) and linked project (debdriyzfcwvgrhzzzre)
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FUNCTIONS=(
  ingest-china-debt
  compute-china-debt-signals
  generate-weekly-regime-digest
  generate-morning-brief
  send-weekly-digest
)

INVOKE_AFTER=(
  ingest-china-debt
  compute-china-debt-signals
  generate-weekly-regime-digest
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GraphiQuestor — China Debt Stack Deployment"
echo "  Project: ${PROJECT_REF}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "▶ Step 1/4: Link project (idempotent)..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "▶ Step 2/4: Apply migrations (--include-all for out-of-order timestamps)..."
supabase db push --include-all --yes

echo ""
echo "▶ Step 3/4: Deploy edge functions..."
DEPLOY_FAILED=0
for fn in "${FUNCTIONS[@]}"; do
  echo "  → ${fn}"
  if ! supabase functions deploy "$fn" --project-ref "$PROJECT_REF"; then
    echo "  ⚠ Deploy failed for ${fn} (continuing)"
    DEPLOY_FAILED=$((DEPLOY_FAILED + 1))
  fi
done

echo ""
echo "▶ Step 4/4: Trigger ingestion + composite compute + weekly digest..."
AUTH_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${VITE_SUPABASE_ANON_KEY:-}}"
if [ -z "$AUTH_KEY" ]; then
  AUTH_KEY=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null \
    | node -e "
      let d='';
      process.stdin.on('data',c=>d+=c);
      process.stdin.on('end',()=>{
        const j=JSON.parse(d);
        const s=j.find(k=>k.name==='service_role');
        const a=j.find(k=>k.name==='anon');
        console.log(s?.api_key||a?.api_key||'');
      });
    " || true)
fi

EDGE_BASE="https://${PROJECT_REF}.supabase.co/functions/v1"
if [ -z "$AUTH_KEY" ]; then
  echo "  ⚠ Could not resolve API key — skipping invoke step"
else
  for slug in "${INVOKE_AFTER[@]}"; do
    code=$(curl -s -o /tmp/gq-fn-out.json -w "%{http_code}" \
      -X POST "${EDGE_BASE}/${slug}" \
      -H "Authorization: Bearer ${AUTH_KEY}" \
      -H "Content-Type: application/json" \
      -d '{}' || echo "000")
    echo "    ${slug}: HTTP ${code} $(head -c 120 /tmp/gq-fn-out.json 2>/dev/null || true)"
  done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$DEPLOY_FAILED" -gt 0 ]; then
  echo "  ⚠ Deployment completed with ${DEPLOY_FAILED} function error(s)"
  echo "  (If 'Max number of functions reached', delete unused functions in Supabase dashboard)"
else
  echo "  ✅ China debt backend deployment complete"
fi
echo "  • Migrations: phase 2–4 applied via db push --include-all"
echo "  • Functions: ${FUNCTIONS[*]}"
echo "  • Cron jobs: ingest-china-debt-quarterly, compute-china-debt-signals-weekly (from migrations)"
echo "  • Frontend: /intel/china#debt  |  /methods/china-debt-iceberg"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit "$DEPLOY_FAILED"