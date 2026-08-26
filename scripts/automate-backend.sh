#!/usr/bin/env bash
# automate-backend.sh — Supabase CLI ops for GraphiQuestor (debdriyzfcwvgrhzzzre)
#
# Subcommands:
#   status     Link check + migration parity + key crons + function versions
#   migrate    Apply pending migrations (db push --include-all --yes)
#   deploy     Deploy edge function(s). Args: slug [slug…] | --all | --seo
#   all        migrate + deploy --seo (safe default for cathedral / brief stack)
#   india      migrate + deploy India ingestion + invoke live India sync
#   smoke      Invoke generate-morning-brief (service path via functions invoke)
#
# Env:
#   SUPABASE_PROJECT_ID   default debdriyzfcwvgrhzzzre
#   SUPABASE_ACCESS_TOKEN optional if already logged in via `supabase login`
#
# Examples:
#   bash scripts/automate-backend.sh status
#   bash scripts/automate-backend.sh deploy generate-morning-brief
#   bash scripts/automate-backend.sh deploy --seo
#   bash scripts/automate-backend.sh all
#   bash scripts/automate-backend.sh india
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
MAP="supabase/functions/deno.json"
CMD="${1:-status}"
shift || true

# SEO / brief cathedral stack — redeploy after main SEO or brief changes
SEO_FUNCS=(
  generate-morning-brief
  send-daily-brief
  compute-daily-macro-signal
  check-data-health
  generate-weekly-regime-digest
  generate-monthly-regime-digest
  gsc-sync
  growth-actions
)

INDIA_FUNCS=(
  ingest-fred
  ingest-currency-wars
  ingest-india-credit-cycle
  ingest-mospi
)

die() { echo "ERROR: $*" >&2; exit 1; }

need_cli() {
  command -v supabase >/dev/null 2>&1 || die "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
}

link_project() {
  echo "▶ Linking project $REF …"
  supabase link --project-ref "$REF" --yes 2>/dev/null || supabase link --project-ref "$REF"
}

deploy_one() {
  local fn="$1"
  if [[ ! -f "supabase/functions/$fn/index.ts" ]]; then
    die "No function slug: $fn (missing supabase/functions/$fn/index.ts)"
  fi
  echo "▶ Deploy $fn"
  supabase functions deploy "$fn" \
    --project-ref "$REF" \
    --import-map "$MAP" \
    --use-api
}

cmd_status() {
  need_cli
  link_project
  echo ""
  echo "━━━ Edge functions (brief / health slice) ━━━"
  supabase functions list --project-ref "$REF" 2>/dev/null \
    | grep -E 'generate-morning|send-daily|compute-daily|check-data|generate-weekly|generate-monthly|gsc-sync|growth-actions|NAME' \
    || true

  echo ""
  echo "━━━ Migration tail (local ↔ remote) ━━━"
  supabase migration list --linked 2>/dev/null | tail -20 || true

  echo ""
  echo "━━━ Key pg_cron jobs ━━━"
  supabase db query --linked -o table "
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname ILIKE '%morning%'
   OR jobname ILIKE '%brief%'
   OR jobname ILIKE '%macro-signal%'
   OR jobname ILIKE '%data-health%'
   OR jobname ILIKE '%regime%'
ORDER BY jobname;
" 2>/dev/null || echo "(cron query failed — check DB password / link)"

  echo ""
  echo "━━━ Last generate-morning-brief cron runs ━━━"
  supabase db query --linked -o table "
SELECT r.status, r.start_time,
       left(coalesce(r.return_message,''), 100) AS msg
FROM cron.job j
JOIN cron.job_run_details r ON r.jobid = j.jobid
WHERE j.jobname = 'generate-morning-brief'
ORDER BY r.start_time DESC
LIMIT 5;
" 2>/dev/null || true

  echo ""
  echo "✓ status complete"
}

cmd_migrate() {
  need_cli
  link_project
  echo "▶ db push --include-all --yes"
  supabase db push --include-all --yes
  echo "▶ migration list"
  supabase migration list --linked 2>/dev/null | tail -15 || true
  echo "✓ migrations applied"
}

cmd_deploy() {
  need_cli
  link_project
  if [[ $# -eq 0 ]]; then
    die "deploy needs: <slug…> | --all | --seo"
  fi
  case "${1:-}" in
    --all)
      bash scripts/deploy-all-functions.sh
      ;;
    --seo)
      for fn in "${SEO_FUNCS[@]}"; do
        deploy_one "$fn" || echo "  WARN: $fn deploy failed"
      done
      ;;
    *)
      for fn in "$@"; do
        deploy_one "$fn"
      done
      ;;
  esac
  echo "✓ deploy complete"
}

cmd_all() {
  cmd_migrate
  echo ""
  cmd_deploy --seo
  echo ""
  cmd_status
}

invoke_one() {
  local fn="$1"
  local endpoint="https://${REF}.supabase.co/functions/v1/${fn}"
  local headers=(-H "Content-Type: application/json")
  if [[ -n "${CRON_SECRET:-}" ]]; then
    headers+=(-H "x-cron-secret: ${CRON_SECRET}")
  fi
  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    headers+=(-H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
  elif [[ -n "${SUPABASE_ANON_KEY:-}" ]]; then
    headers+=(-H "Authorization: Bearer ${SUPABASE_ANON_KEY}" -H "apikey: ${SUPABASE_ANON_KEY}")
  else
    die "india sync needs CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY"
  fi
  echo "▶ Invoke ${fn}"
  local response
  response=$(curl --fail-with-body --silent --show-error -X POST "$endpoint" "${headers[@]}" -d '{}')
  echo "${response:0:3000}"
  echo ""
}

cmd_india() {
  need_cli
  cmd_migrate
  for fn in "${INDIA_FUNCS[@]}"; do
    deploy_one "$fn"
  done
  for fn in "${INDIA_FUNCS[@]}"; do
    invoke_one "$fn"
  done
  echo "▶ Verify canonical India observations"
  supabase db query --linked -o table "
SELECT metric_id, COUNT(*) AS observations, MAX(as_of_date) AS latest_as_of
FROM public.metric_observations
WHERE metric_id IN (
  'IN_CPI_YOY', 'IN_WPI_YOY', 'IN_IIP_GROWTH_YOY', 'IN_GDP_GROWTH_YOY',
  'IN_REPO_RATE', 'IN_FX_RESERVES', 'IN_DEBT_GDP_PCT',
  'IN_BANK_CREDIT_GROWTH_YOY', 'USD_INR_RATE'
)
GROUP BY metric_id
ORDER BY metric_id;
"
  echo "✓ India backend sync complete"
}

cmd_smoke() {
  need_cli
  link_project
  local url="https://${REF}.supabase.co/functions/v1/generate-morning-brief"
  echo "▶ POST $url"
  # Prefer CRON_SECRET header when set (matches pg_cron). Optional service role JWT.
  local headers=(-H "Content-Type: application/json")
  if [[ -n "${CRON_SECRET:-}" ]]; then
    headers+=(-H "x-cron-secret: ${CRON_SECRET}")
  fi
  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    headers+=(-H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}")
  elif [[ -n "${SUPABASE_ANON_KEY:-}" ]]; then
    headers+=(-H "Authorization: Bearer ${SUPABASE_ANON_KEY}")
    headers+=(-H "apikey: ${SUPABASE_ANON_KEY}")
  fi
  local body
  if ! body=$(curl -sS -w "\n%{http_code}" -X POST "$url" "${headers[@]}" -d '{}' 2>&1); then
    die "curl failed: $body"
  fi
  local code
  code=$(echo "$body" | tail -n1)
  local resp
  resp=$(echo "$body" | sed '$d')
  echo "HTTP $code"
  echo "$resp" | head -c 2000
  echo ""
  if [[ "$code" != "200" && "$code" != "201" ]]; then
    echo "Tip: export CRON_SECRET=… and/or SUPABASE_SERVICE_ROLE_KEY=… then re-run."
    echo "  Or use Dashboard → Edge Functions → generate-morning-brief → Invoke."
    exit 1
  fi
  echo "✓ smoke invoke returned $code"
}

case "$CMD" in
  status)  cmd_status ;;
  migrate) cmd_migrate ;;
  deploy)  cmd_deploy "$@" ;;
  all)     cmd_all ;;
  india)   cmd_india ;;
  smoke)   cmd_smoke ;;
  -h|--help|help)
    sed -n '2,25p' "$0"
    ;;
  *)
    die "Unknown command: $CMD (status|migrate|deploy|all|india|smoke)"
    ;;
esac
