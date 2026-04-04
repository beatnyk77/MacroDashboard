# Energy & Commodities Lab: Complete Data Integrity Audit & Fix Plan

## Context

The Energy & Commodities Lab is displaying mock/fallback data in several sections. This plan ensures **100% real, live data** from automated sources with zero synthetic values. The audit identified:

- **Mock/synthetic data** in ingestion functions and UI fallbacks
- **Missing cron schedules** for critical data pipelines
- **Placeholder values** for critical metrics (PPAC, Comtrade)
- **Random fallbacks** that produce fake numbers

## Critical Findings

### 1. Mock Data Sources

| Ingestion Function | Issue | Severity |
|---|---|---|
| `ingest-commodity-imports` | Uses `generateHistoricalData()` (synthetic trends) instead of real Comtrade API | **Critical** |
| `ingest-fuel-security-india` | Hardcoded PPAC values (9.8, 11.2, 5.12) with "institutional proxy" note | **Critical** |
| `ingest-global-refining` | Falls back to `85 + Math.random()*5` for utilization if EIA fails | **High** |
| `ingest-commodity-terminal` | Entirely mock flows and events (hardcoded arrays) | **Critical** |
| UI components (`AsiaCommodityFlowsSection`, `SovereignEnergySecuritySection`, `FuelSecurityClockIndia`) | Contain `generateFallbackData()` / `MOCK_DATA` that display simulated numbers when API empty | **High** |

### 2. Missing Cron Schedules

Functions **without** scheduled ingestion (must be added):
- `ingest-oil-eia` → US SPR & refining utilization
- `ingest-oil-global` → Global refining capacity + import volumes (partner breakdown)
- `ingest-oil-india-china` → Oil import costs (Brent + FX) for INR/CNY
- `ingest-energy-global` → Power mix divergence (Ember) + EU gas storage (GIE)
- `ingest-commodity-imports` → Real Comtrade data for gold/silver/REM
- `ingest-commodity-terminal` → Commodity prices (FRED) + actual flows

Note: `ingest-global-refining` exists but uses random fallback; must be fixed.

### 3. Existing Cron Schedules (Validate These Are Active)

- `ingest-fuel-security-india-daily` ✅
- `ingest-energy-monthly` (India energy) ✅
- `ingest-commodity-reserves-weekly` ✅
- `ingest-global-refining-monthly` ✅

## Fix Implementation Steps

### Phase A: Data Source Fixes (Edge Functions)

#### A1. Fix `ingest-commodity-imports` (Real Comtrade Integration)
- Replace `generateHistoricalData()` with actual Comtrade API calls
- Use UN Comtrade API (or Comtrade USDA API) to fetch:
  - Gold (HS 7108) for India/China
  - Silver (HS 7106)
  - Rare Earth Metals (HS 280530, 2846)
- Fetch latest year + backfill historical (2000-present)
- Remove all synthetic data generation
- Keep error handling clean: fail the function if API fetch fails (do not insert placeholder)

#### A2. Fix `ingest-fuel-security-india` (PPAC Data Source)
- Implement PPAC data scraping from official reports (PDF/HTML) or RSS feeds
- Alternative: Use institutional data source (e.g., India Ministry of Petroleum dashboard) if PPAC lacks API
- Extract:
  - Strategic reserves (in days)
  - Actual/estimated divergence
  - Daily consumption (mbpd)
- Remove hardcoded values; fail visibly if scrape fails (so UI shows "no data" instead of mock)

#### A3. Fix `ingest-global-refining` (Remove Random Fallback)
- If EIA International data fetch fails, do NOT use random numbers
- Instead: throw error or skip upsert; let cron log the failure
- Keep existing EIA fetch logic; just remove the `eiaVal || (85 + Math.random()*5)` fallback

#### A4. Fix `ingest-commodity-terminal` (Replace Mock with Real)
- For commodity prices: FRED (WTI, Brent, Copper, Nickel) — already implemented ✅
- For commodity flows: Need real data source:
  - Option A: Use UN Comtrade for bulk trade flows (energy, metals, agriculture)
  - Option B: Use Kpler/Vortexa API (if available) — these are paid, so likely not
  - Option C: Decommission this function and remove the Physical Flows Terminal section if no real source
- For commodity events: Use GDELT or ACLED API for real-time disruption events
- Remove all hardcoded `mockFlows` and `mockEvents`

#### A5. Verify `ingest-oil-eia`, `ingest-oil-global`, `ingest-oil-india-china` Data Quality
- These functions already call EIA API; ensure no synthetic fallbacks in them
- `ingest-oil-global` currently injects "high-fidelity partner breakdown" (lines 123-167) — these are **verified 2024 trade flow proxies** but still static, not live
  - **Action**: Replace with real partner data if possible, or document as "institutional estimates" and consider them acceptable if clearly labeled
  - For true "real-time", this would require Kpler/Vortexa; if unavailable, we must either accept quarterly proxies or remove the partner breakdown chart

### Phase B: UI Cleanup (Remove Fallback Renderers)

#### B1. Update `AsiaCommodityFlowsSection`
- Remove `generateFallbackData()` entirely
- If `useOilData()` returns empty, show a "Data not available" placeholder instead of simulated charts
- Keep the component structure; just remove the fallback merge logic

#### B2. Update `SovereignEnergySecuritySection`
- Remove `generateFallbackData()` 
- Show "Data not available" state if API empty

#### B3. Update `FuelSecurityClockIndia`
- Remove `MOCK_DATA` constant
- Component should render nothing or error state if `useFuelSecurityIndia()` returns null/error
- Remove the "Live Feed Normalizing" banner (since that was for fallback); instead, show "Data Awaiting Ingestion"

### Phase C: Cron Schedule Activation

Using **Supabase MCP** exclusively, create a new migration to add missing cron jobs:

```sql
-- Migration: Add remaining energy/commodities cron jobs
-- Uses standard vault-based auth pattern from fix_all_cron_auth_permanent.sql

SELECT public.schedule_standard_cron('ingest-oil-eia-weekly', '0 3 * * 0', 'ingest-oil-eia');
SELECT public.schedule_standard_cron('ingest-oil-global-weekly', '0 4 * * 0', 'ingest-oil-global');
SELECT public.schedule_standard_cron('ingest-oil-india-china-weekly', '0 5 * * 0', 'ingest-oil-india-china');
SELECT public.schedule_standard_cron('ingest-energy-global-monthly', '0 6 1 * *', 'ingest-energy-global');
SELECT public.schedule_standard_cron('ingest-commodity-imports-monthly', '0 7 1 * *', 'ingest-commodity-imports');
-- For commodity-terminal: decide if we keep it; if yes, schedule weekly or monthly
SELECT public.schedule_standard_cron('ingest-commodity-terminal-weekly', '0 8 * * 0', 'ingest-commodity-terminal');
```

If `public.schedule_standard_cron` helper no longer exists (it was dropped in the earlier migration), recreate it temporarily or repeat its definition inline (see 20260310000001_fix_all_cron_auth_permanent.sql lines 18-41).

### Phase D: Verification & Testing

1. **Lint & Build**
   ```
   npm run lint
   npm run build
   ```
   Ensure no TypeScript errors.

2. **Manual Trigger & Data Check** (via Supabase MCP)
   - For each fixed ingestion function, manually invoke and verify:
     - Table `oil_refining_capacity` has recent rows (latest year)
     - Table `oil_imports_by_origin` has non-zero volumes for USA/India/China
     - Table `metric_observations` has fresh `OIL_SPR_LEVEL_US`, `OIL_REFINERY_UTILIZATION_US`, `EU_GAS_STORAGE_PCT`, `IN_POWER_*`, `CN_POWER_*`, `US_POWER_*`
     - Table `commodity_imports` has real Comtrade data (volume > 0, not synthetic patterns)
     - Table `fuel_security_clock_india` has today's date and non-placeholder values
     - Table `global_refining_capacity` has real utilization (no decimals like 85.3274 from random)
     - Table `commodity_flows` and `commodity_events` have real entries (if we keep that function)

3. **Lab Page Smoke Test**
   - Visit `/labs/energy-commodities`
   - Every card must show **real numbers** (no "Initializing", no zeros, no mocked decimals)
   - Check browser network tab: all queries return 200 with data
   - Confirm no "simulated" badges appear

4. **Cron Job Verification**
   - Query `SELECT * FROM cron.job WHERE command LIKE '%ingest-%';` to see all schedules
   - Ensure all needed jobs are present with correct schedules

## Files to Modify

### Edge Functions (Supabase MCP cannot edit files; we edit via standard tools)
- `supabase/functions/ingest-commodity-imports/index.ts`
- `supabase/functions/ingest-fuel-security-india/index.ts`
- `supabase/functions/ingest-global-refining/index.ts`
- `supabase/functions/ingest-commodity-terminal/index.ts` (or remove)
- Possibly `ingest-oil-global` (remove partner proxy injection if deemed unacceptable)

### UI Components
- `src/features/dashboard/components/sections/AsiaCommodityFlowsSection.tsx`
- `src/features/dashboard/components/sections/SovereignEnergySecuritySection.tsx`
- `src/features/energy/components/FuelSecurityClockIndia.tsx`

### Cron Configuration
- Create new migration: `supabase/migrations/20260404_add_energy_commodities_cron.sql`

## Contingency: Unavailable Data Sources

If a real data source cannot be integrated in time:
1. **Comtrade**: Consider using a simpler approach: fetch from S&;P Global or World Bank if Comtrade is too complex. But we must have real trade data.
2. **PPAC**: If scraping is blocked, use RBI's petroleum statistics or India's DG Stat (may not have days-of-coverage directly). Must compute from available numbers.
3. **GDELT for events**: GDELT has a free API; we can integrate that instead of mock events.
4. **Commodity flows**: Without commercial data, this section may need to be **removed** from the lab rather than show mock data.

## Success Criteria

- **Zero** hardcoded numbers in any ingestion function (except calibrated constants like conversion factors)
- **Zero** `Math.random()` in any production data pathway
- **Zero** fallback data arrays in UI components
- All tables have data with dates within expected freshness:
  - SPR/utilization: within 7 days
  - Imports: within 30 days
  - Power mix: within 3 months (ember annual updates)
  - Fuel security: daily
  - Commodity flows: monthly
- All cron jobs are active and using `service_role` via vault
- `npm run lint && npm run build` passes cleanly

## Deliverables

1. Audit report (this document)
2. Diff of all modified files (ingest functions, UI components, new migration)
3. Evidence of successful manual triggers (logs or data snapshots)
4. Final lab page showing live data

---

**Start Date**: 2026-04-04  
**Status**: Planning phase → ready for implementation
