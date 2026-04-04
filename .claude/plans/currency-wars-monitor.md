# Currency Wars Monitor Implementation Plan

## Context
The Currency Wars Monitor is a critical macro intelligence section that tracks monetary policy divergence and currency pressure between major central banks, with primary focus on USD/INR dynamics versus the Fed and RBI. The module partially exists but is not showing properly due to incomplete data ingestion, missing cron scheduling, and insufficient metrics.

## Current State Analysis

### Existing Components
1. **UI Component**: `src/features/dashboard/components/rows/CurrencyWarsMonitor.tsx` - Fully built with:
   - Dual-axis chart (policy rates vs USD/INR)
   - Policy Divergence display
   - Rupee Pressure Score
   - Zoom controls (5Y/25Y)
   - Insight cards with trend indicators

2. **Data Hook**: `src/hooks/useCurrencyWars.ts` - Queries from `metric_observations` table
   - Fetches: FED_FUNDS_RATE, IN_REPO_RATE, USD_INR_RATE, POLICY_DIVERGENCE_INDEX, RUPEE_PRESSURE_SCORE, FLOW_TENSION_INDEX

3. **Ingestion Function**: `supabase/functions/ingest-currency-wars/index.ts`
   - Fetches FRED data: FEDFUNDS, IRSTCB01INM156N (RBI repo), EXINUS (USD/INR)
   - Calculates POLICY_DIVERGENCE_INDEX
   - Calculates RUPEE_PRESSURE_SCORE from NSE flows and INR change
   - Upserts to `metric_observations` table

4. **Database Schema**: `supabase/migrations/20260214210000_currency_wars_metrics.sql`
   - Registers the metric IDs in `metrics` table

### Identified Issues
1. **Cron Job Missing**: The `ingest-currency-wars` function is NOT scheduled in any cron job (verified: no references in migrations)
2. **Incomplete Data**: The current ingestion lacks:
   - REER (Real Effective Exchange Rate) data
   - FX reserves vs forward book tracking
   - RBI intervention effectiveness metrics
   - BOP data for comprehensive pressure gauge
   - EM comparative currencies (CNY, BRL, MXN, etc.)
3. **Simplistic Pressure Calculation**: Current RUPEE_PRESSURE_SCORE only uses FII flows and INR % change
4. **Missing Derived Metrics**: No transmission lag, currency defense firepower, or comparative pressure
5. **Component Integration**: The component is in the Terminal page but may be below the fold; needs prominence

## Implementation Plan

### Phase 1: Immediate Fix - Ensure Basic Data Flow
**Priority: CRITICAL**

1. **Schedule the ingestion function**
   - Create a new migration to schedule `ingest-currency-wars` via pg_cron
   - Recommended frequency: Every 6 hours (data sources update at different times)
   - Add proper error handling and logging

2. **Verify data exists and component renders**
   - Check that `metric_observations` has data for required metrics
   - Ensure component handles empty states gracefully
   - Add data health checks

3. **Run initial backfill** if historical data is missing
   - Use existing trigger script to populate past 25 years of data

### Phase 2: Enhance Data Ingestion
**Priority: HIGH**

1. **Add REER Data Source**
   - Source: FRED series `BIS_REER_INDIA` or `USREC1_index` (BIS provides REER for major economies)
   - Metric ID: `REER_INDEX`
   - Calculation: Real Effective Exchange Rate index (base year 2010=100)
   - Update ingestion function to fetch and store

2. **Add FX Reserves vs Forward Book**
   - Sources:
     - RBI reserves: FRED `TRADEGDPINDIA` (FX reserves as % of GDP) or direct from RBI DBIE
     - Forward book: BIS or IMF data (if available), else approximate from derivatives reports
   - Metrics:
     - `FX_RESERVES_BILLIONS` (total reserves in USD)
     - `FORWARD_BOOK_RATIO` (forward obligations / reserves)
   - Add to ingestion

3. **Enhance Rupee Pressure Gauge**
   - Replace current simplistic calculation with weighted composite:
     - FII/DII net flows (from `market_pulse_daily`) - 30%
     - INR volatility (20-day realized vol) - 20%
     - REER deviation from fair value - 20%
     - Reserve adequacy (reserves / M3 or imports) - 15%
     - Forward book pressure - 15%
   - Rename to `COMPOSITE_PRESSURE_INDEX` for clarity
   - Normalize to 0-100 scale

4. **Add EM Comparative Pressure**
   - Track USD/CNY, USD/BRL, USD/MXN, USD/TRY alongside USD/INR
   - Calculate relative pressure score vs EM average
   - Metric: `EM_RELATIVE_PRESSURE`
   - Show percentile ranking

### Phase 3: Add Derived Metrics
**Priority: MEDIUM**

1. **Transmission Lag**
   - Measure: Correlation between RBI repo rate changes and money market rates (WACR/Call Money) over rolling 90-day window
   - Metric: `TRANSMISSION_LAG_DAYS` (days it takes for policy to transmit)
   - Calculation: Cross-correlation analysis in Python helper, store result

2. **Currency Defense Firepower**
   - Formula: `(FX reserves in months of imports) - (forward book ratio) + (interest rate differential)`
   - Normalized to index 0-100
   - Metric: `DEFENSE_FIREPOWER_INDEX`
   - Higher = stronger defense capability

3. **Policy Regime Classification**
   - Classify Fed-RBI divergence into regimes:
     - "Convergent Easing" (both cutting, spread shrinking)
     - "Divergent Tightening" (Fed hiking, RBI holding/ cutting)
     - "Carry Trade Optimal" (spread > 200 bps)
   - Metric: `REGIME_CLASSIFICATION` (string)
   - Add narrative tags

### Phase 4: UI Enhancements
**Priority: LOW (if data shows properly)**

1. **Add Gauge Component** for Pressure Score
   - Use semicircular gauge or progress bar with color zones
   - Green (<30), Yellow (30-70), Red (>70)

2. **Add Comparative EM Chart**
   - Small multiples or overlay of EM currency pressure indices
   - Show USD/INR relative to peers

3. **Transmission Lag Visualization**
   - Scatter plot of rate changes vs market rates over time
   - Show current lag in days

4. **Add Narrative Box**
   - Auto-generated brief: "RBI policy is X bps behind Fed, creating Y pressure. Intervention effectiveness: Z."
   - Pull from the derived metrics

## Files to Modify

**CRITICAL路径:**
- `supabase/functions/ingest-currency-wars/index.ts` - Main enhancement
- Create `supabase/migrations/20260404000000_schedule_currency_wars.sql` - Add cron schedule
- `src/hooks/useCurrencyWars.ts` - Extend interface for new metrics
- `src/features/dashboard/components/rows/CurrencyWarsMonitor.tsx` - Minor UI tweaks

**ENHANCEMENT路径:**
- Add new data fetchers for REER (FRED: `RLINATNXM156N` for India REER? Need verification)
- Add RBI reserves fetch from `https://dbie.rbi.org.in/` (requires new MCP or direct API)
- Add EM currency series from FRED or Alpha Vantage
- Create `supabase/functions/calculate-currency-derivatives/index.ts` for complex metrics (transmission lag, firepower)

**DATABASE:**
- Ensure `metric_observations` entries for new metric IDs
- Update `metrics` table with new definitions

## Verification Steps

1. **Data Ingestion**
   - Check cron job is scheduled: `select * from cron.job;` in Supabase SQL editor
   - Check ingestion logs: `select * from ingestion_logs where function_name='ingest-currency-wars' order by start_time desc limit 5;`
   - Verify data exists: `select count(*) from metric_observations where metric_id in ('FED_FUNDS_RATE', 'IN_REPO_RATE', 'USD_INR_RATE');`

2. **Component Rendering**
   - Visit home page, scroll to Currency Wars section
   - Check browser console for errors
   - Verify charts render with data (tooltip shows values)
   - Check loading states disappear after data loads

3. **End-to-End**
   - Run `npm run dev` and navigate to `/`
   - Scroll to Currency Wars Monitor section
   - Verify dual-axis chart displays both rates and USD/INR
   - Verify MetricMiniCards show live values
   - Verify InsightCards show divergence and pressure with trend colors

## Dependencies
- FRED API key (already in env)
- Alpha Vantage API key (for EM currencies, if used)
- RBI DBIE MCP server (for reserves and forward book data)
- Supabase Edge Functions with Deno runtime
- pg_cron extension enabled on database

## Risks & Mitigations
- **Risk**: RBI data not available via FRED. **Mitigation**: Use RBI DBIE MCP server or direct scraping
- **Risk**: Forward book data scarce. **Mitigation**: Use proxy or disable that component until source found
- **Risk**: Cron job conflicts with existing schedule. **Mitigation**: Space out jobs by 15 minutes
- **Risk**: Data volume too high (25 years of daily data). **Mitigation**: Limit to 2000 points, aggregate monthly for long history

## Success Criteria
- Currency Wars Monitor section visibly renders with data on the main terminal
- All three core charts/dashboards update automatically every 6 hours
- No console errors in production build
- Policy Divergence and Pressure Score show realistic values
- Component appears within viewport on typical desktop screen without excessive scrolling
