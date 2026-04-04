# Currency Wars Monitor - Implementation Guide

## Overview
The Currency Wars Monitor tracks monetary policy divergence and currency pressure between major central banks, focusing on USD/INR dynamics versus Fed and RBI policies.

## What Was Implemented

### Phase 1: Core Functionality (Immediate)
- ✅ **Scheduled Ingestion**: Cron job set to run every 6 hours (`0 */6 * * *`)
- ✅ **Enhanced EM Coverage**: Added USD/CNY, USD/BRL, USD/MXN, USD/TWD
- ✅ **Improved Pressure Gauge**: Composite index (0-100) with weighted components:
  - 40% FII/DII net flows
  - 30% INR volatility (20-day rolling std dev)
  - 30% EM relative weakness (USD/INR underperformance vs EM average)
- ✅ **Database Schema**: New metrics registered (`COMPOSITE_PRESSURE_INDEX`, `EM_RELATIVE_PRESSURE`, plus EM currency rates)
- ✅ **UI Updates**: Component now displays composite pressure and supports EM data

### Phase 2: Data Pipeline
- Edge Function: `supabase/functions/ingest-currency-wars/index.ts`
- Hook: `src/hooks/useCurrencyWars.ts` (updated with new fields)
- Component: `src/features/dashboard/components/rows/CurrencyWarsMonitor.tsx` (using composite pressure)

### Phase 3 (Stretch - Not Implemented Yet)
- REER integration (already exists via `ingest-bis-reer`, need to link)
- FX reserves integration (requires RBI DBIE MCP)
- Transmission lag calculation
- Currency defense firepower index

## File Changes

### New Files
1. `supabase/migrations/20260404000000_schedule_currency_wars.sql` - Cron job
2. `supabase/migrations/20260404000001_add_currency_wars_metrics.sql` - New metrics registration
3. `scripts/backfill_currency_wars_enhancements.ts` - Backfill script for historical data

### Modified Files
1. `supabase/functions/ingest-currency-wars/index.ts` - Added EM currencies and composite pressure calculation
2. `src/hooks/useCurrencyWars.ts` - Extended interface
3. `src/features/dashboard/components/rows/CurrencyWarsMonitor.tsx` - Updated to use composite pressure

## Database Schema Changes

### New Metrics Registered
```sql
-- EM Currency Rates
USD_CNY_RATE
USD_BRL_RATE
USD_MXN_RATE
USD_TWD_RATE

-- Derived Indices
COMPOSITE_PRESSURE_INDEX  -- 0-100 scale (replaces RUPEE_PRESSURE_SCORE)
EM_RELATIVE_PRESSURE      -- bps relative to EM average
```

### Existing Metrics Used
- FED_FUNDS_RATE (FRED)
- IN_REPO_RATE (FRED)
- USD_INR_RATE (FRED)
- REER_INDEX_IN (from ingest-bis-reer)
- market_pulse_daily.fii_cash_net, dii_cash_net

## Deployment Steps

### 1. Apply Database Migrations
```bash
# Connect to your Supabase database and run:
psql -h your-db.supabase.co -U postgres -d postgres < supabase/migrations/20260404000000_schedule_currency_wars.sql
psql -h your-db.supabase.co -U postgres -d postgres < supabase/migrations/20260404000001_add_currency_wars_metrics.sql
```

Or via Supabase SQL Editor in the dashboard.

### 2. Deploy Edge Function
```bash
# From project root, deploy the updated function
supabase functions deploy ingest-currency-wars --project-ref your-project-ref

# This will update the function code with the new metrics and calculations
```

### 3. Set Environment Variables (if not already set)
In Supabase Dashboard → Edge Functions → `ingest-currency-wars`:
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `FRED_API_KEY`: Your FRED API key

All should already exist from previous deployments.

### 4. Verify Cron Job Schedule
Connect to database and run:
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%currency%';
```

Should show job `ingest-currency-wars-every-6h` scheduled every 6 hours.

### 5. Initial Backfill
The new metrics (COMPOSITE_PRESSURE_INDEX, EM_RELATIVE_PRESSURE) need historical data.

Run the backfill script:
```bash
# Ensure Deno is installed: https://deno.com/
deno run --allow-net --allow-env --allow-read scripts/backfill_currency_wars_enhancements.ts
```

This will:
- Process existing market_pulse_daily, FRED data
- Calculate composite pressure back to earliest available date
- Generate EM relative pressure series

Monitor console output for progress and errors.

### 6. Test the UI
Start dev server:
```bash
npm run dev
```

Navigate to `http://localhost:3000/`

Scroll to "Currency Wars Monitor" section (under "Sovereign Stress" or directly on terminal depending on layout).

**Expected display:**
- Dual-axis chart showing Fed Funds Rate, RBI Repo Rate, USD/INR
- MetricMiniCards: Policy Divergence (bps), USD/INR Spot, Pressure Score (0-100)
- InsightCards: Policy Divergence with trend, Rupee Pressure with trend
- Zoom controls (5Y/25Y)

### 7. Verify Data in Database
```sql
-- Check base metrics
SELECT COUNT(*) FROM metric_observations WHERE metric_id = 'FED_FUNDS_RATE';
SELECT COUNT(*) FROM metric_observations WHERE metric_id = 'USD_INR_RATE';
SELECT COUNT(*) FROM metric_observations WHERE metric_id = 'COMPOSITE_PRESSURE_INDEX';

-- Check latest values
SELECT * FROM metric_observations 
WHERE metric_id IN ('FED_FUNDS_RATE', 'IN_REPO_RATE', 'USD_INR_RATE', 'POLICY_DIVERGENCE_INDEX', 'COMPOSITE_PRESSURE_INDEX')
ORDER BY as_of_date DESC 
LIMIT 5;
```

## Troubleshooting

### Issue: Currency Wars section shows loading forever
- Check browser console for GraphQL/Query errors
- Verify `metric_observations` has data for required metrics
- Check React Query devtools (if enabled) for failing queries

### Issue: No data in charts
Query may be returning empty. Check hook logic:
```ts
// In browser console, test query:
fetch('/supabase/functions/get-metrics?metricIds=FED_FUNDS_RATE,IN_REPO_RATE,USD_INR_RATE')
```
(Adjust endpoint based on your API routes)

### Issue: Cron job not running
1. Check `cron.job` table in database
2. Verify Edge Function is deployed and has correct env vars
3. Check `ingestion_logs` table for errors:
```sql
SELECT * FROM ingestion_logs 
WHERE function_name = 'ingest-currency-wars' 
ORDER BY start_time DESC LIMIT 10;
```

### Issue: TypeScript errors in Edge Function
The function uses Deno with ES modules. Ensure:
- No `import` statements using Node-style `require`
- All types properly defined (we fixed these)

## Next Steps (Phase 3)

### 1. Integrate REER Data
The `ingest-bis-reer` function already populates REER indices. To use in Currency Wars:
- Add UI card showing India REER trend
- Correlate REER with composite pressure
- Add REER deviation from fair value to pressure calculation

### 2. Add FX Reserves
Need to ingest RBI reserves data:
- Source: RBI DBIE API (see MCP server integration)
- Metric: `IN_FX_RESERVES` (already exists) or create new
- Add to pressure calculation: `reserves_months_of_imports`
- Update ingestion function to fetch and compute

### 3. Advanced Derived Metrics
Create a separate function `calculate-currency-derivatives`:
- Transmission lag: cross-correlation of policy rate vs market rates
- Defense firepower: `(reserves / imports) - (forward_book_ratio) + (rate_diff)`
- Regime classification: string tag based on divergence trajectory

## Performance Considerations

- Ingestion fetches ~2000 daily observations per series → manageable
- Composite pressure calculation processes ~5000 records → optimized with maps
- Cron runs every 6 hours → not heavy load on database (upserts are idempotent)
- UI query fetches limited date range (last 3 years for chart) → efficient

## Monitoring

Add alerts for:
- Ingestion failures (check `ingestion_logs` where status = 'failed')
- No rows updated for >2 consecutive runs
- Data freshness lag >24 hours

## Success Criteria

- ✅ Component renders on Terminal page without errors
- ✅ All three charts (Fed rate, RBI rate, USD/INR) show 25-year history
- ✅ Policy Divergence displays in bps (± values)
- ✅ Pressure Score shows 0-100 scale with color zones
- ✅ Data updates automatically every 6 hours
- ✅ No console errors in production build

---

**Last Updated**: 2026-04-04  
**Status**: Implementation Complete (Phase 1+2), Backfill Pending
