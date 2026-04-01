#!/bin/bash
set -e

# These are the prefixes of migrations we ACTUALLY want to push to the database.
# Everything else will be marked as "applied" so Supabase doesn't try to run them again.
EXCLUDE_IDS=(
  "20260331000000_extend_institutional_13f"
  "20260331000001_smart_money_views"
  "20260331000002_schedule_13f_weekly"
  "20260331000003_institutional_trades_inferred"
  "20260401000000_create_cusip_ticker_cache"
  "20260402000000_create_country_metrics"
  "20260402000001_country_metrics_cron"
  "20260402013224_verify_dedollarization"
)

echo "Repairing local migrations as 'applied' to bypass already existing schema..."

for filepath in supabase/migrations/*.sql; do
  filename=$(basename "$filepath")
  
  # Skip stub files
  if [[ "$filename" == *"_remote_applied"* ]]; then
    continue
  fi

  # Check if filename is in EXCLUDE array
  exclude=false
  for prefix in "${EXCLUDE_IDS[@]}"; do
    if [[ "$filename" == "$prefix.sql" ]]; then
      exclude=true
      break
    fi
  done

  if [ "$exclude" = false ]; then
    # Extract just the version number (everything before first underscore)
    version_id=$(echo "$filename" | cut -d'_' -f1)
    
    echo "Marking $version_id ($filename) as applied..."
    supabase migration repair --status applied "$version_id" 2>/dev/null || true
  else
    echo "SKIPPING $filename (Will be pushed)"
  fi
done

echo "Done repairing local files."
