#!/usr/bin/env bash
# deploy-all-functions.sh — deploy every supabase/functions/*/index.ts with import-map.
# Usage: bash scripts/deploy-all-functions.sh [--only-failed path/to/fail-list]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
REF="${SUPABASE_PROJECT_ID:-debdriyzfcwvgrhzzzre}"
MAP="supabase/functions/deno.json"
LOG="scripts/.deploy-all-functions.log"
FAIL="scripts/.deploy-all-functions.fail"
OK="scripts/.deploy-all-functions.ok"
: >"$LOG"
: >"$FAIL"
: >"$OK"

LIST_FILE="$(mktemp)"
if [[ "${1:-}" == "--only-failed" && -f "${2:-}" ]]; then
  cp "$2" "$LIST_FILE"
else
  find supabase/functions -mindepth 2 -maxdepth 2 -name index.ts \
    | sed 's|supabase/functions/||;s|/index.ts||' \
    | grep -v '^_shared' \
    | sort >"$LIST_FILE"
fi

TOTAL=$(wc -l <"$LIST_FILE" | tr -d ' ')
echo "Deploying $TOTAL functions to $REF (import-map + use-api)"
i=0
while IFS= read -r fn; do
  [ -z "$fn" ] && continue
  i=$((i+1))
  echo "[$i/$TOTAL] $fn" | tee -a "$LOG"
  if supabase functions deploy "$fn" \
      --project-ref "$REF" \
      --import-map "$MAP" \
      --use-api \
      >>"$LOG" 2>&1; then
    echo "$fn" >>"$OK"
    echo "  OK"
  else
    echo "$fn" >>"$FAIL"
    echo "  FAIL (see $LOG)"
  fi
done <"$LIST_FILE"
rm -f "$LIST_FILE"

echo "----"
echo "OK:   $(wc -l <"$OK" | tr -d ' ')"
echo "FAIL: $(wc -l <"$FAIL" | tr -d ' ')"
if [[ -s "$FAIL" ]]; then
  echo "Failed functions:"
  cat "$FAIL"
  exit 1
fi
exit 0
