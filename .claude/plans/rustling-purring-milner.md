# Debug: India Equities Daily Data Not Populating

**Date**: 2026-04-02  
**Severity**: Critical (Production data freshness issue)  
**Status**: Root causes identified, awaiting approval to fix

---

## Context

The India Equities page (`/india-equities`) shows stale or missing daily data. The page uses the `CorporateIndiaEngine` component which depends on the `cie_macro_signals` table (and related `cie_companies`, `cie_fundamentals`) to display macro-integrated equity intelligence.

---

## Root Causes Identified

### 1. Missing CIE Schema in Active Migrations

**Problem**: The Corporate India Engine (CIE) tables are defined only in `migrations_backup/` but NOT in the active `migrations/` folder.

**Files affected**:
- `migrations_backup/20260227000001_cie_schema.sql` (contains `cie_companies`, `cie_fundamentals`, `cie_macro_signals`, `cie_watchlists`)
- Active migrations folder has NO equivalent

**Impact**: 
- If production was deployed from active migrations only, these tables DO NOT EXIST
- If tables exist from earlier deployment, they're not tracked in migration history → migration sync is broken
- Page queries fail silently or return empty results when tables are missing

**Evidence**:
```bash
grep -r "cie_companies" supabase/migrations/*.sql  # No results
grep -r "cie_companies" supabase/migrations_backup/*.sql  # Found
```

---

### 2. Missing CIE Cron Jobs

**Problem**: The Edge Functions for CIE data ingestion exist but are **never scheduled**:

- `supabase/functions/ingest-cie-fundamentals/` - Pulls quarterly financial data from NSE
- `supabase/functions/compute-cie-macro-scores/` - Calculates macro impact scores daily

These are NOT in the cron schedule from `20260310000001_fix_all_cron_auth_permanent.sql` which schedules 25+ other jobs.

**Impact**:
- Even if tables exist, they contain no data
- `cie_macro_signals.as_of_date` is never updated
- India Equities page shows empty/default values

**Evidence**:
```bash
grep -h "ingest-cie-fundamentals\|compute-cie-macro" supabase/migrations/*.sql  # No output
ls supabase/functions/ | grep cie  # Functions exist but aren't scheduled
```

---

### 3. Potential NSE Flows Cron Auth Issues

**Problem**: While the `ingest-nse-flows-daily` cron is scheduled correctly in `20260310000001_fix_all_cron_auth_permanent.sql`, it relies on:
- `vault.decrypted_secrets` extension being installed and configured
- Secret `SUPABASE_SERVICE_ROLE_KEY` present in vault

**Impact**:
- `market_pulse_daily` table may also be stale (affects other pages like `/india-equities/fii-dii`)
- India Flow Pulse page would show no data

**Evidence**:
- Old migrations had hardcoded JWT tokens that expired in 2024
- Current auth uses vault, but we haven't verified vault setup

---

## Implementation Plan

### Phase 1: Immediate Verification (Read-Only)

**Goal**: Confirm the current state without making changes.

1. **Check if CIE tables exist** in production DB:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' AND tablename LIKE 'cie_%';
   ```
   Expected: Should list `cie_companies`, `cie_fundamentals`, `cie_macro_signals`

2. **Check cron job status**:
   ```sql
   SELECT jobname, active, last_run_status 
   FROM vw_cron_job_status 
   WHERE jobname LIKE '%cie%' OR jobname = 'ingest-nse-flows-daily';
   ```
   Expected: CIE jobs may be missing; NSE flows should be active

3. **Check data freshness**:
   ```sql
   SELECT 
     'cie_macro_signals' as table_name,
     COUNT(*) as row_count,
     MAX(as_of_date) as latest_date
   FROM cie_macro_signals
   UNION ALL
   SELECT 
     'market_pulse_daily',
     COUNT(*),
     MAX(date)
   FROM market_pulse_daily;
   ```
   Expected: Should show recent dates (within last few days)

4. **Check vault setup**:
   ```sql
   SELECT * FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
   ```
   Expected: Should return a row with the service role key encrypted

---

### Phase 2: Deploy Missing CIE Schema

**Action**: Create a new migration to add the CIE schema to the active migrations folder.

**File**: `supabase/migrations/20260402000010_cie_schema.sql`

**Contents**: Copy the schema from `migrations_backup/20260227000001_cie_schema.sql` (adapted with current date prefix)

**Steps**:
1. Create the migration file with proper timestamp (later than all existing)
2. Include all CIE tables: `cie_companies`, `cie_fundamentals`, `cie_macro_signals`, `cie_watchlists`, `cie_alerts`, `cie_saved_views`
3. Include RLS policies and triggers
4. Deploy via `supabase db push`

**Validation**:
- Tables appear in `pg_tables`
- RLS policies are in place
- Public read access works

---

### Phase 3: Schedule CIE Cron Jobs

**Action**: Create a new migration to schedule the missing cron jobs.

**File**: `supabase/migrations/20260402000011_cie_cron_schedules.sql`

**Contents**:
```sql
-- Schedule CIE data ingestion (using standard auth helper)

-- Only schedule if helper function exists (from fix_all_cron_auth_permanent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'schedule_standard_cron') THEN
        -- Use the standard helper
        SELECT public.schedule_standard_cron(
            'ingest-cie-fundamentals-daily', 
            '0 18 * * 1-5',  -- 18:00 UTC = 23:30 IST (after market close)
            'ingest-cie-fundamentals'
        );
        SELECT public.schedule_standard_cron(
            'compute-cie-macro-scores-daily',
            '30 18 * * 1-5',  -- 18:30 UTC = 00:00 IST (late evening)
            'compute-cie-macro-scores'
        );
    ELSE
        -- Fallback: use direct net.http_post with vault (similar to fix_all_cron_auth_permanent)
        PERFORM cron.schedule(
            'ingest-cie-fundamentals-daily',
            '0 18 * * 1-5',
            $$
            SELECT net.http_post(
                url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/ingest-cie-fundamentals',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
                ),
                body := '{}'::jsonb,
                timeout_milliseconds := 55000
            );
            $$
        );
        PERFORM cron.schedule(
            'compute-cie-macro-scores-daily',
            '30 18 * * 1-5',
            $$
            SELECT net.http_post(
                url := 'https://debdriyzfcwvgrhzzzre.supabase.co/functions/v1/compute-cie-macro-scores',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
                ),
                body := '{}'::jsonb,
                timeout_milliseconds := 55000
            );
            $$
        );
    END IF;
END $$;
```

**Schedule Times**:
- `ingest-cie-fundamentals`: 18:00 UTC (11:30 PM IST) Monday-Friday — after market close, gives time for NSE to publish data
- `compute-cie-macro-scores`: 18:30 UTC (00:00 IST midnight) — after fundamentals ingestion completes

---

### Phase 4: Verify and Backfill Initial Data

**Manual Trigger** (once migrations are deployed):
```bash
# Trigger fundamentals ingestion to populate cie_fundamentals
supabase functions invoke ingest-cie-fundamentals

# Then compute macro scores
supabase functions invoke compute-cie-macro-scores
```

**Check logs**:
```bash
supabase functions logs ingest-cie-fundamentals --limit 50
supabase functions logs compute-cie-macro-scores --limit 50
```

**Verify data**:
```sql
-- Check fundamentals populated
SELECT COUNT(*) FROM cie_fundamentals;  -- Should be > 0 (tickers × quarters)

-- Check macro signals populated
SELECT 
  COUNT(*) as total_signals,
  MAX(as_of_date) as latest,
  COUNT(DISTINCT company_id) as companies_covered
FROM cie_macro_signals;
```

---

### Phase 5: Validate Frontend

1. Visit `https://graphiquestor.com/india-equities`
2. Verify stats cards show actual numbers (not N/A)
3. Verify Screener tab loads companies with macro scores
4. Refresh page and check network tab for successful API calls to `cie_macro_signals`
5. Check Data Health Dashboard shows CIE data as fresh

---

## Rollback Plan

If issues arise:

1. **Disable CIE cron jobs**:
   ```sql
   SELECT cron.unschedule('ingest-cie-fundamentals-daily');
   SELECT cron.unschedule('compute-cie-macro-scores-daily');
   ```

2. **Remove CIE tables** (if needed):
   ```sql
   DROP TABLE IF EXISTS cie_macro_signals CASCADE;
   DROP TABLE IF EXISTS cie_fundamentals CASCADE;
   DROP TABLE IF EXISTS cie_companies CASCADE;
   DROP TABLE IF EXISTS cie_watchlists CASCADE;
   -- etc.
   ```
   *Note: This would require a revert migration in production*

3. **Revert migrations**:
   ```bash
   # Create new migration to drop the tables if deployment breaks
   supabase migration new revert_cie_schema
   # Add DROP statements
   supabase db push
   ```

---

## Additional Notes

- The Country Metrics deployment (`ingest-country-metrics`) is **unrelated** to this issue. That's for global country-level macro data, not India equities.
- The NSE Flows cron (`ingest-nse-flows-daily`) should also be verified for auth, as it affects the FII/DII Flow Pulse page (`/india-equities/fii-dii`). The same vault-based auth pattern applies.
- The `vault.decrypted_secrets` extension must be installed and the `SUPABASE_SERVICE_ROLE_KEY` secret added via Supabase secrets management. This was set up in earlier migrations but should be double-checked.

---

## Checklist Before Starting

- [ ] Confirm with user: Is the issue specifically with the stats on `/india-equities` (CIE page) or with `/india-equities/fii-dii` (NSE flows page)?
- [ ] Verify production database has vault extension enabled
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` exists in vault.decrypted_secrets
- [ ] Review `supabase/functions/ingest-cie-fundamentals/index.ts` for any hardcoded dependencies or NSE scraping that might fail
- [ ] Ensure Edge Functions `ingest-cie-fundamentals` and `compute-cie-macro-scores` are deployed to Supabase
- [ ] Have `supabase db push` CLI ready and authenticated

---

## Expected Outcome After Fix

- CIE tables exist and are tracked in migrations
- Cron jobs run daily Monday-Friday
- `cie_macro_signals` contains fresh data (as_of_date = today or yesterday)
- India Equities page displays:
  - Stats cards with real numbers
  - Screener with list of Nifty companies and macro scores
  - All tabs (Aggregates, Watchlists, Promoters, etc.) show populated data

---
