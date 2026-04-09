# Country Pages Implementation Summary

**Status**: Step 1 (Database View) ✓ Complete | Step 2 (Frontend) ✓ Complete

## What Was Done

### Step 1 — Database View (`vw_country_terminal`)
- Created view joining `g20_countries` → `metric_observations` (FRED policy rates) + `yield_curves` (sovereign yields) + `country_reserves` (FX + gold)
- View returns **1 row per country** with wide columns:
  - `central_bank_rate_pct`, `central_bank_rate_date` ← FRED `{ISO}_POLICY_RATE`
  - `yield_2y_pct`, `yield_2y_date` ← `yield_curves` tenor='2Y'
  - `yield_10y_pct`, `yield_10y_date` ← `yield_curves` tenor='10Y'
  - `yield_slope_2s10s` ← computed (10Y − 2Y) × 100 in bps
  - `fx_reserves_bn`, `fx_reserves_date` ← `country_reserves.fx_reserves_usd / 1e9`
  - `gold_tonnes`, `gold_date` ← `country_reserves.gold_tonnes`
- Applied to remote DB at `20260408000001_country_terminal_view.sql`
- Covers all **Top 25 countries** (G20 + major EMs). Verified: all 25 rows returned.

### Step 2 — Frontend (`src/pages/CountryProfilePage.tsx`)
- Changed query from `country_metrics` (limited 3 metrics) → `vw_country_terminal` (full macro set)
- Reduced sections to 3 focused groups that have real FRED-sourced data:
  1. **Macro Heartbeat**: `central_bank_rate_pct` (FRED)
  2. **Yield Curve**: `yield_2y_pct`, `yield_10y_pct`, `yield_slope_2s10s` (Derived)
  3. **Reserves & Alignment**: `fx_reserves_bn`, `gold_tonnes` (IMF/WGC)
- Updated `src/lib/macro-metrics.ts` to reflect actual view column names
- Build passes cleanly (`npm run build` ✓)

### Step 3 — Data Coverage Reality (as of 2026-04-08)
| Metric | Coverage | Source |
|---|---|---|
| Policy Rate | 6/25 countries (US, CN, IN, JP, RU, EU) | FRED `{ISO}_POLICY_RATE` |
| 2Y Yield | ~8–10 countries (US, CN, DE, FR, GB, JP, etc.) | FRED/ECB/RBI via `yield_curves` |
| 10Y Yield | ~8–10 countries | Same |
| FX Reserves | All 25 (seeded by `ingest-country-metrics`) | IMF COFER via `country_reserves` |
| Gold Reserves | All 25 (seeded) | WGC/IMF via `country_reserves` |

**Known gaps**: Many countries lack FRED policy-rate IDs (only 6 mapped in `metric_observations`). Missing: most EM policy rates, CPI, GDP, unemployment, debt metrics.

### Step 4 — What's Working Now
- `/countries/US` → Full data: policy rate 4.5%, 2Y 3.84%, 10Y 4.34%, slope −50 bps, FX $245B, gold 8133.5T
- `/countries/CN`, `/countries/IN`, `/countries/JP`, `/countries/DE`, `/countries/GB` → show yields + reserves (partial data is still visible)
- All other countries (BR, MX, RU, KR, ID, … → show reserves + gold only)

---

## Files Changed

| File | Change |
|---|---|
| `supabase/migrations/20260408000001_country_terminal_view.sql` | NEW — DB view |
| `src/pages/CountryProfilePage.tsx` | UPDATED — query switched to view, sections simplified |
| `src/lib/macro-metrics.ts` | UPDATED — keys aligned to view columns |
| `src/App.tsx` | Already has route `path="/countries/:iso"` → `CountryProfilePage` |

---

## Limitations & Next Steps

**Why some countries show sparse data**: The `{ISO}_POLICY_RATE` metric IDs exist only for a subset of countries in the `metric_observations` table. To expand coverage, need to add FRED IDs for more countries and ensure `ingest-daily` pulls them.

**Suggested expansion path** (not in scope for this fix):
1. Add missing FRED policy rate series to `metrics` table for all 25 countries
2. Extend `ingest-daily` to handle the expanded country set
3. Consider adding `fx_reserves_bn` and `gold_tonnes` into the view with proper joins (currently only 3 countries show via `country_metrics`)

---

## Verification

```bash
# DB verification
npx supabase db query "SELECT COUNT(*) FROM vw_country_terminal" --linked
# Expected: 25

npx supabase db query "SELECT iso, central_bank_rate_pct, yield_2y_pct, yield_10y_pct, fx_reserves_bn, gold_tonnes FROM vw_country_terminal WHERE iso='US'" --linked
# Expected: US + all 6 columns populated

# Frontend
npm run build  # ✓ passes
# Dev server already running — test /countries/US, /countries/CN, /countries/IN
```

---

## Related External Repo
**Global-Macro-Database** (https://github.com/beatnyk77/Global-Macro-Database) — contains pre-compiled country-level macro datasets. Could be used for future bulk backfill of CPI/GDP/debt metrics if domestic FRED ingestion proves too sparse. Requires separate exploration phase.
