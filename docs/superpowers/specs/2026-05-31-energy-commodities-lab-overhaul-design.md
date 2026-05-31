# Energy & Commodities Lab Overhaul — Design Spec

**Date:** 2026-05-31  
**Approach:** B — Full overhaul with structural refactor (no new data sources)  
**Goal:** Bring the Energy & Commodities Lab to the same institutional quality standard as US Macro Pulse and India Macro Pulse by fixing all data integrity failures and improving information architecture.

---

## Diagnosis Summary

| Issue | Severity | Root Cause |
|---|---|---|
| `PriceTerminalCard` shows no data | Critical | Reads `commodity_prices` table (empty); ingestion writes to `metric_observations` |
| WTI regime badge always wrong | Critical | UI thresholds ($1/$2) don't match backend enum ($5/$10/$16) |
| Fuel Security Clock has hardcoded reserves | Critical | `reservesDaysOfficial = 9.5`, `reservesDaysActual = 7.4` are literals, not fetched |
| Tanker pipeline is fully fabricated | High | Vessel names like `MT IRAQ1` are generated — not real AIS data |
| No executive regime summary card | Medium | Lab starts cold with no framing |
| Commodity prices buried in accordion | Medium | `PriceTerminalCard` inside `SPAAccordion` (closed by default) |
| No freshness indicators in key sections | Medium | Sovereign Energy Security, Asia Flows lack `FreshnessChip` |

---

## Section 1: Data Layer Fixes

### Fix 1 — `useCommodityPrices.ts`
**Change:** Query `metric_observations` instead of `commodity_prices`.  
**Metric IDs to fetch:** `WTI_CRUDE_PRICE`, `BRENT_CRUDE_PRICE`, `COPPER_PRICE_USD`, `NICKEL_PRICE_USD`  
**Grouping:** For each metric ID, take the latest row as current price, the second-latest as previous (for % change calc).  
**Return type:** Update `CommodityPrice` interface to use `metric_id` and `as_of_date` fields from `metric_observations`.

### Fix 2 — WTI Regime Threshold Alignment
**File:** `src/features/energy/components/WTICalendarSpread.tsx`  
**Change:** Update `getRegimeDetails(spread)` thresholds to match the backend `classifyRegime()` function:
- `spread > 16` → `EXTREME` (rose-500)
- `spread > 10` → `STRESSED` (orange-500)
- `spread > 5` → `TIGHTENING` (amber-500)
- `spread < -5` → `OVERSUPPLY` (blue-500)
- else → `NORMAL` (emerald-500)

### Fix 3 — `ingest-fuel-security-india/index.ts`: Remove Hardcoded Reserves
**Replace** the hardcoded `reservesDaysOfficial = 9.5` / `reservesDaysActual = 7.4` with a real EIA International fetch:
- **Endpoint:** `https://api.eia.gov/v2/international/data/` with `facets[countryRegionId][]=IND`, `facets[activityId][]=3` (ending stocks), `facets[productId][]=53` (crude oil + products)
- **Fallback:** If EIA fetch fails, use 9.5 / 7.4 as explicit fallback values with a log warning (not silent defaults)
- **FRED fetch for INR/USD:** Add fetch for series `DEXINUS` (already available via FRED API key) to replace hardcoded `83.0` fallback. Use existing `FRED_API_KEY` env var.

### Fix 4 — Fuel Security Clock: Remove Tanker Table
**Delete** the tanker pipeline table from `FuelSecurityClockIndia.tsx`.  
**Replace with three real-data panels** (all data already in DB):
1. **Import Origin Breakdown** — bar chart from `oil_imports_by_origin` where `importer_country_code = 'IN'`, grouped by `exporter_country_name`, showing top 8 origins by `import_volume_mbbl`
2. **Brent-INR Cost Display** — `inr_per_barrel` and `brent_price_usd` from `fuel_security_clock_india` (already fetched by hook)
3. **SPR Coverage Gauge** — horizontal progress bar showing `reserves_days_coverage` vs 30-day target, with official vs actual comparison using real EIA values

**Source attribution line:** `Source: EIA International Energy Statistics · PPAC India · FRED`

---

## Section 2: New `CurrentEnergyRegimeCard` Component

### New files
- `src/features/energy/components/CurrentEnergyRegimeCard.tsx`
- `src/hooks/useEnergyRegime.ts`

### `useEnergyRegime` hook
Fans out to:
1. `useLatestOilSpread()` — WTI spread + regime enum
2. Two `useQuery` calls to `metric_observations`:
   - Latest `OIL_BRENT_PRICE_USD` (+ previous for 1d change)
   - Latest `OIL_REFINERY_UTILIZATION_US`
   - Latest `EU_GAS_STORAGE_PCT`

Returns a unified `EnergyRegime` object:
```ts
interface EnergyRegime {
  wtiSpread: number;
  wtiRegime: string;
  brentPrice: number;
  brentChange1d: number;
  refineryUtil: number;
  euGasStorage: number;
  isAnyStale: boolean;
  overallNarrative: string;
}
```

### `CurrentEnergyRegimeCard` layout
- Full-width dark glassmorphic card (matches WTI card style: `bg-black/40 border-white/10 backdrop-blur-xl rounded-[2rem]`)
- Header bar: "Energy Market Regime" label + `FreshnessChip`
- Body: Four metric pillars in a CSS grid (`grid-cols-2 lg:grid-cols-4`)
- Footer: Single-sentence regime narrative (deterministic, assembled from live values)

### Regime narrative rule table (deterministic, client-side)
| WTI Regime | Refinery Util | Narrative |
|---|---|---|
| EXTREME / STRESSED | any | "Physical oil markets in acute stress — immediate supply shortage risk." |
| TIGHTENING | > 90% | "Market tightening with refinery utilization at capacity ceiling." |
| NORMAL | > 88% | "Balanced physical flows with high refinery utilization — watch for demand-side shocks." |
| OVERSUPPLY | any | "Oversupply conditions with storage pressure building." |
| any | < 80% | "Refinery slack signals demand weakness or maintenance cycle." |

---

## Section 3: UX & Structural Changes

### Change 1 — Promote Commodity Prices
Add `PriceTerminalCard` as a standalone always-visible section on the lab page, placed **after** the WTI Calendar Spread section and **before** Sovereign Energy Security.  
The `SPAAccordion` in `CommodityTerminalRow` remains for the flow network and metal import cards.

### Change 2 — Freshness Indicators
Add `FreshnessChip` to `SovereignEnergySecuritySection` and `AsiaCommodityFlowsSection` section headers.  
Each section adds a single `useQuery` call (staleTime: 1h) fetching `max(last_updated_at)` from its respective table.

### Change 3 — Fuel Security Clock Rework
As described in Fix 4. The `FuelSecurityClockIndia` component is refactored to remove the tanker table and replace with real-data panels. The `useFuelSecurityIndia` hook is unchanged.

### Change 4 — Lab Page Section Order
```
1. CurrentEnergyRegimeCard          [NEW]
2. WTI Calendar Spread              [existing]
3. Live Commodity Prices            [promoted from accordion]
4. Sovereign Energy Security        [existing + freshness chip]
5. Asia Energy & Commodity Flows    [existing + freshness chip]
6. Global Refining Imbalance        [existing]
7. Fuel Security Clock – India      [reworked]
8. Physical Flows Terminal          [existing accordion]
```

---

## Section 4: Error Handling & Build Quality

### Error states
- `CurrentEnergyRegimeCard`: Each pillar degrades independently — failed pillar shows `—` with muted label. Card never crashes.
- `FuelSecurityClockIndia`: Import origin breakdown shows "No data" state if `oil_imports_by_origin` returns empty for India.
- All sections retain existing `SectionErrorBoundary` wrappers.

### Staleness
- `CurrentEnergyRegimeCard`: Amber border + stale chip if `isAnyStale === true`
- `FuelSecurityClockIndia`: Existing staleness from `fuel_security_clock_india.last_updated_at`

### Build constraints
- No `@ts-ignore` — use `@ts-expect-error` with justification comment if needed
- Remove all unused imports when deleting tanker table code
- `CommodityPrice` interface updated to match `metric_observations` shape
- `npm run lint && npm run build` must pass with 0 warnings

---

## Files Modified

| File | Change Type |
|---|---|
| `src/hooks/useCommodityPrices.ts` | Rewrite query target |
| `src/features/energy/components/WTICalendarSpread.tsx` | Fix regime thresholds |
| `src/features/energy/components/FuelSecurityClockIndia.tsx` | Remove tanker table, add real panels |
| `src/features/energy/hooks/useFuelSecurityIndia.ts` | Minor type cleanup if needed |
| `supabase/functions/ingest-fuel-security-india/index.ts` | Remove hardcoded reserves, add EIA fetch |
| `src/pages/labs/EnergyCommoditiesLab.tsx` | New section order, add CurrentEnergyRegimeCard |

## New Files

| File | Purpose |
|---|---|
| `src/features/energy/components/CurrentEnergyRegimeCard.tsx` | Executive regime summary card |
| `src/hooks/useEnergyRegime.ts` | Unified energy regime data hook |
