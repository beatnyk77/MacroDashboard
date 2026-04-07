# Fix Country Pages: Complete Audit & Implementation Plan

## Context

The country pages (`/countries/:iso`) are currently blank or failing to load due to:

1. **Data gap**: `country_metrics` table may be empty or have incomplete data
2. **Metric mismatch**: The UI expects 15 metrics in `COUNTRY_METRIC_GROUPS`, but the ingestion function only populates ~8 metrics
3. **Missing metrics**: Key metrics like `central_bank_rate_pct`, `hh_debt_gdp_pct`, `military_exp_gdp_pct`, `oil_import_dependency_pct`, etc. are not being ingested
4. **Cron schedule**: Currently scheduled weekly (Sunday 2 AM) — may need daily updates for fresher data
5. **Potential deployment gaps**: Migration may not be applied, or function may not have run successfully

---

## Phase 1: Diagnostic & Verification

### 1.1 Check Database State

```bash
# Verify table exists and check row count
npx supabase db remote sql "
  SELECT COUNT(*) as total_rows FROM country_metrics;
"

# Check which countries have data
npx supabase db remote sql "
  SELECT iso, COUNT(*) as metric_count, MAX(last_cron) as latest
  FROM country_metrics
  GROUP BY iso
  ORDER BY iso;
"

# Check which metrics are populated
npx supabase db remote sql "
  SELECT metric_key, COUNT(DISTINCT iso) as countries_with_data
  FROM country_metrics
  GROUP BY metric_key
  ORDER BY metric_key;
"
```

### 1.2 Check Ingestion Function Logs

```bash
# View recent function logs
npx supabase functions logs ingest-country-metrics --limit 50

# Check if cron job is scheduled
npx supabase db remote sql "
  SELECT * FROM cron.job WHERE jobname LIKE '%country%';
"
```

### 1.3 Verify Migration Status

```bash
# List applied migrations
npx supabase db remote sql "
  SELECT id FROM suprebase.migrations WHERE id LIKE '202604%' ORDER BY id DESC;
"
```

---

## Phase 2: Data Population & Fixes

### 2.1 Manual Test Run (Trigger Function)

If data is missing or incomplete, manually invoke the function:

```bash
npx supabase functions invoke ingest-country-metrics
```

Monitor logs for errors:

```bash
npx supabase functions logs ingest-country-metrics --tail
```

**Expected result**: ~1,320 rows (40 countries × 33 metrics) OR at minimum, all countries should have the 8 currently implemented metrics.

### 2.2 Expand Metric Coverage (Critical)

**Problem**: UI expects these metrics but they're not ingested:

| Metric Key | Source | Status |
|-------------|--------|--------|
| `central_bank_rate_pct` | BIS | ❌ Missing |
| `hh_debt_gdp_pct` | BIS | ❌ Missing |
| `military_exp_gdp_pct` | SIPRI | ❌ Missing |
| `oil_import_dependency_pct` | IEA | ❌ Missing |
| `top_partner_export_share_pct` | IMF DOTS | ❌ Missing |
| `gold_reserves_tonnes` | WGC/IMF | ❌ Missing |
| `usd_reserve_share_pct` | IMF COFER | ❌ Missing |
| `brics_alignment_score` | Internal | ❌ Missing |

**Solution**: Add these metrics to `supabase/functions/ingest-country-metrics/index.ts`:

- For BIS metrics → Use BIS API (if available) or find alternative sources
- For IMF COFER → Add to existing METRIC_CONFIG with 'IMF' source
- For IMF DOTS → Add trade partner data source
- For WGC gold → Extend current gold_reserves logic (already has gold_tonnes in another table?)
- For SIPRI → Use SIPRI API or static dataset
- For internal score → Compute from existing metrics (de-dollarization, gold reserves, etc.)

**See**: `src/lib/macro-metrics.ts` for the full metric definitions.

---

## Phase 3: Align UI with Available Data

**Option A (Preferred)**: Expand ingestion to match UI expectations (Phase 2.2)

**Option B (Fallback)**: If some data sources are unavailable, adjust `COUNTRY_METRIC_GROUPS` to only include metrics we actually ingest:

```ts
export const COUNTRY_METRIC_GROUPS = {
  BASICS: [
    { key: 'population_mn', label: 'Population', unit: 'Mn', source: 'WB' },
    { key: 'area_sq_km', label: 'Land Area', unit: 'sq km', source: 'WB' },
    { key: 'gdp_usd_bn', label: 'GDP (Nominal)', unit: '$Bn', source: 'IMF' },
  ],
  MACRO_HEARTBEAT: [
    { key: 'gdp_yoy_pct', label: 'Real GDP Growth', unit: '%', source: 'IMF' },
    { key: 'cpi_yoy_pct', label: 'Inflation (CPI)', unit: '%', source: 'IMF' },
    { key: 'unemployment_pct', label: 'Unemployment Rate', unit: '%', source: 'IMF' },
    // Skip central_bank_rate_pct if BIS unavailable
    { key: 'ca_gdp_pct', label: 'Current Account/GDP', unit: '%', source: 'IMF' },
    { key: 'fx_reserves_bn', label: 'FX Reserves (ex-Gold)', unit: '$Bn', source: 'FRED' },
  ],
  // ... reduce other groups to match available metrics only
};
```

---

## Phase 4: Cron Optimization

Change cron from weekly to **daily at 3 AM UTC** to keep data fresher:

```sql
-- In supabase/migrations/20260402000001_country_metrics_cron.sql

SELECT cron.unschedule('ingest-country-metrics-weekly');  -- Remove old

SELECT cron.schedule(
  'ingest-country-metrics-daily',
  '0 3 * * *',  -- Daily 3 AM UTC
  $$
    SELECT net.http_post(
      'https://ohefbbvldkoflrcjixow.functions.supabase.co/ingest-country-metrics',
      '{}',
      '{"Authorization": "Bearer '' || current_setting(''app.settings.service_role_key'') || ''", "Content-Type": "application/json"}'::jsonb
    )
  $$
);
```

---

## Phase 5: Testing & Validation

### 5.1 Frontend Test

```bash
# Build the frontend
npm ci
npm run build

# Preview locally
npm run preview
```

Then visit:
- `/countries` — should show all 40 countries with data badges
- `/countries/US` — should display 15 metric cards with real values
- `/countries/CN` — should display 15 metric cards with real values

### 5.2 Lint & TypeCheck

```bash
npm run lint
npm run type-check  # if available
```

Fix any errors before commit.

### 5.3 Data Validation Queries

```sql
-- Ensure all expected countries have data
SELECT iso, COUNT(*) as metrics_count
FROM country_metrics
GROUP BY iso
HAVING COUNT(*) < 10;  -- Should return 0 rows if all have >10 metrics

-- Check data freshness (should be within last 7 days)
SELECT iso, MAX(last_cron) as latest_update
FROM country_metrics
GROUP BY iso
HAVING MAX(last_cron) < NOW() - INTERVAL '7 days';
```

---

## Phase 6: Deployment Steps

### 6.1 Apply Migrations (if pending)

```bash
npx supabase db push
```

### 6.2 Redeploy Edge Function

```bash
npx supabase functions deploy ingest-country-metrics --no-verify-jwt
```

### 6.3 Update Cron (if changing frequency)

```bash
# Either push migration:
npx supabase db push

# Or run SQL manually in Supabase SQL Editor:
npx supabase db remote sql "
  SELECT cron.unschedule('ingest-country-metrics-weekly');
  SELECT cron.schedule('ingest-country-metrics-daily', '0 3 * * *', $$ ... $$);
"
```

### 6.4 Trigger Initial Data Load

```bash
npx supabase functions invoke ingest-country-metrics
```

Wait 30-60 seconds, then verify data landed.

---

## Phase 7: Commit & Push

### 7.1 Create Feature Branch

```bash
git checkout -b fix/country-pages-data-population
```

### 7.2 Stage Changes

```bash
git add .
```

### 7.3 Commit with Clear Message

```bash
git commit -m "$(cat <<'EOF'
fix(country-pages): populate country_metrics with real data and expand coverage

- Deploy country_metrics table migration
- Expand ingest-country-metrics to cover all 15 UI metrics
- Add BIS, SIPRI, IMF COFER, and internal alignment score
- Switch cron from weekly to daily at 3 AM UTC
- Update COUNTRY_METRIC_GROUPS to align with available data sources
- Verify all 40 countries have live data
- Test all country pages render correctly
- Passing npm run lint && npm run build

Fixes #XXX
EOF
)"
```

### 7.4 Push & Create PR

```bash
git push origin fix/country-pages-data-population
# Create PR via CLI or GitHub
```

---

## Verification Checklist

After deployment, verify:

- [ ] `country_metrics` table exists with correct schema
- [ ] Table has > 1,000 rows (40 countries × 25+ metrics each)
- [ ] All 40 countries in `ALL_COUNTRIES` have at least 20 metrics populated
- [ ] No `NULL` values for critical metrics (GDP, CPI, debt, yields)
- [ ] `last_cron` timestamps are within last 24 hours for >90% of rows
- [ ] `/countries` page loads and shows "Live Data" badges for all 40 countries
- [ ] `/countries/US` displays 15 metric cards with values (not "N/A")
- [ ] `/countries/IN` displays 15 metric cards with values
- [ ] `/countries/CN` displays 15 metric cards with values
- [ ] No console errors in browser DevTools
- [ ] SEO metadata renders correctly (view source for JSON-LD)
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` succeeds without errors
- [ ] Edge Function deployed and ACTIVE in Supabase dashboard
- [ ] Cron job scheduled (daily at 3 AM UTC)
- [ ] Function logs show successful runs (no errors)

---

## Rollback Plan

If something breaks:

1. **Disable cron**:
   ```sql
   SELECT cron.unschedule('ingest-country-metrics-daily');
   ```

2. **Revert code changes**: Git revert the commit

3. **Drop table** (if needed):
   ```sql
   DROP TABLE IF EXISTS public.country_metrics;
   ```

4. **Delete function**:
   ```bash
   npx supabase functions delete ingest-country-metrics
   ```

---

## Notes & Assumptions

- **Environment variables**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRED_API_KEY` must be set in Supabase secrets
- **Rate limits**: FRED ~100 req/min, IMF/BIS/World Bank have no auth rate limits but be respectful
- **API reliability**: Some series may be missing for certain countries (e.g., AR 2Y yield). UI gracefully shows "N/A" for missing values.
- **Scalability**: Table size is bounded (40 countries × ~30 metrics ≈ 1,200 rows). No growth concerns.
- **Data freshness**: Daily cron ensures values no older than 1-2 days (most sources publish daily/weekly).

---

## Contact & Support

- Infra issues: Check `docs/DEPLOYMENT-COUNTRY-METRICS.md`
- Data source issues: Review `supabase/functions/ingest-*/` patterns
- Supabase limits: https://supabase.com/docs/guides/database/quotas
