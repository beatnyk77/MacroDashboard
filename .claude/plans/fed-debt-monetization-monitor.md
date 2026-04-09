# Implementation Plan: Fed Monetization & Yield Control Monitor

## Context
The request asks for a new full-width row titled **"FED Debt Monetization & Yield Control Monitor"** to be placed immediately below the existing **US Debt Maturity Wall** in the US Macro Pulse section of the Terminal (Sovereign Stress area).

This is a data visualization component with 4 charts focused on Fed balance sheet, yield suppression, inflation transmission, and real yield — all using existing FRED-sourced data already present in the database.

---

## Data Sources (Existing — No New Ingestion)

### 1. Fed Balance Sheet (Monetization Base)
- **Primary source**: `global_liquidity_direction` table → `trailing_history.cb` column stores Fed assets (WALCL) in trillions
- **Alternative/fallback**: Direct query `metric_observations` for a Fed assets metric if available (to be determined at runtime)

### 2. Total US Marketable Debt
- **Source**: `metric_observations` with `metric_id = 'US_DEBT_USD_TN'` (already used by USDebtMaturityWall)
- **Fallback**: `us_debt_maturities` table for latest outstanding

### 3. 10Y Treasury Yield
- **Source**: `metric_observations` with `metric_id = 'US_10Y_YIELD'` (FRED: DGS10) — confirmed active

### 4. M2 Money Supply Growth
- **Source**: Prefer `metric_observations` with `metric_id = 'US_M2'` if populated
- **Fallback**: `global_liquidity_direction.global_m2_growth` (absolute M2 level in billions)

### 5. CPI (Consumer Price Index)
- **Source**: `metric_observations` with `metric_id = 'US_CPI_YOY'` (FRED: CPIAUCSL YoY) — confirmed in USMacroPulseSection

### 6. Real Yield (TIPS)
- **Challenge**: TIPS yield series (T10YIE) does NOT appear in current `metric_observations`
- **Fallback approach**: Omit chart 4 OR use proxy: `US_10Y_YIELD` minus `US_CPI_YOY` = approximate real yield (with caveat that it's nominal minus headline, not breakeven)

### 7. QE/QT Period Identification
- **Source**: `vw_net_supply_private` or direct join of `metric_observations` for `FED_SOMA_CHANGE` (weekly change in Fed Treasury holdings)
- **Logic**: Positive cumulative SOMA change = QE (Fed expanding balance sheet); Negative = QT

---

## Component Design

### File: `src/features/dashboard/components/rows/FedMonetizationMonitor.tsx`

**Structure:**
```tsx
export const FedMonetizationMonitor: React.FC = () => {
  // 4 custom hooks or direct supabase queries:
  // 1. fetchDebtOwnershipData() — Fed assets + total debt (line chart: % owned over time)
  // 2. fetchYieldSuppressionData() — Fed assets + US_10Y_YIELD (dual-axis)
  // 3. fetchInflationTransmissionData() — M2 growth (lagged 12M) + US_CPI_YOY (line chart)
  // 4. fetchRealYieldData() — US_10Y_YIELD - US_CPI_YOY ≈ real yield + shaded QE/QT
}
```

**Styling:**
- Full-width: `w-full`
- Dark glassmorphic: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` with `border border-slate-700/50` and `rounded-2xl`
- Title: `text-2xl md:text-3xl font-bold text-white` with appropriate icon (e.g., `Banknote` or `TrendingUp`)
- Subtitle: "Tracking Federal Reserve debt monetization, yield suppression, and inflation dynamics"
- Updated timestamp: fetched from latest date across datasets

**Chart 1 — Monetization Gauge (Line)**
- Metric: `(Fed Balance Sheet / Total US Marketable Debt) × 100`
- Line shows % of US debt owned by Fed over time (weekly/monthly)
- Latest value prominently displayed as "FED owns X.X% of total US marketable debt"
- Y-axis: % (0–50), X-axis: time (2Y or 5Y window)
- Tooltip: exact date, Fed assets ($T), Total debt ($T), % owned

**Chart 2 — Yield Suppression (Dual-Axis Line)**
- Left axis: Fed Balance Sheet ($T) — thick cyan line
- Right axis: 10Y Treasury Yield (%) — amber line
- Correlation shaded region where Fed assets ↑ and yields ↓ (inverse relationship)
- Tooltip with both values per date
- No opinion text — just data

**Chart 3 — Inflation Transmission (Dual Line)**
- M2 Money Supply YoY Growth (%) — blue line
- CPI YoY (%) — red line, with 12-month lag shaded to show transmission lag
- Tooltip: M2 growth at T-12 vs CPI at T
- Correlation coefficient displayed in subtitle

**Chart 4 — Real Yield & QE/QT (Area + Reference)**
- Real Yield ≈ 10Y Yield − CPI YoY (computed per row)
- Shaded background: Green when SOMA change > 0 (QE), Red when < 0 (QT)
- Horizontal reference line at 0% real yield
- Tooltip with nominal yield, inflation, estimated real yield, SOMA change

**Common patterns:**
- Use `recharts` LineChart / AreaChart
- Custom tooltip: `bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3`
- Loading state: skeleton with `animate-pulse`
- Error boundary: already handled by parent SectionErrorBoundary

---

## Integration Points

### 1. Terminal.tsx (Main Dashboard)
Locate the `USDebtMaturityWall` section and insert the new component immediately after:

```tsx
<SectionErrorBoundary name="US Debt Maturity Wall">
  <USDebtMaturityWall />
</SectionErrorBoundary>

<SectionErrorBoundary name="Fed Monetization Monitor">
  <FedMonetizationMonitor />
</SectionErrorBoundary>
```

### 2. Subtle Divider Between Rows
Add a thin visual separator between USDebtMaturityWall and FedMonetizationMonitor:

```tsx
<div className="border-t border-slate-700/30 my-8" />
<p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-6">
  Federal Reserve Policy Impact
</p>
```

### 3. USMacroPulseSection (Optional)
If desired, the component can also be included in `USMacroPulseSection` as an additional Card after the CATEGORIES grid. However, based on "full-width row below US Debt Maturity Wall", Terminal page placement is primary.

---

## Data Fetching Strategy

Each chart's hook will use `useSuspenseQuery` with a `supabase.from()` query:

Example pattern for Fed assets + debt ratio:
```ts
const { data } = useSuspenseQuery({
  queryKey: ['fed-monetization-ratio'],
  queryFn: async () => {
    // 1. Get ~104 weeks of Fed assets from global_liquidity_direction.trailing_history
    // 2. Get ~104 weeks of US_DEBT_USD_TN from metric_observations
    // 3. Join on closest date, produce [{date, fedAssetsT, debtT, ratio}]
  }
});
```

**Fallback logic**: If `global_liquidity_direction` returns null or missing columns, query `metric_observations` for any Fed asset metric that may exist (e.g., `FED_BALANCE_SHEET`). If neither exists, show "Data not yet available — Fed balance sheet ingestion pending" message.

---

## Bibliographic / Source Credits
- Federal Reserve: H.4.1 (via FRED WALCL)
- U.S. Treasury: Debt to the Penny (FiscalData)
- Bureau of Labor Statistics: CPI (FRED CPIAUCSL)
- St. Louis Fed FRED API

Display as a small footer line: `Sources: FRED · U.S. Treasury · BLS`

---

## Verification Steps

1. **Local build**: `npm run lint && npm run build` must pass with 0 errors
2. **Type-check**: `npx tsc --noEmit` passes
3. **Visual check**: Terminal page renders: Debt Maturity Wall → divider → Fed Monetization Monitor (4 charts)
4. **Dark theme consistency**: Colors match: cyan (Fed), amber (yields), emerald (inflation), rose (real yield stress)
5. **Data presence**: All charts show data (not "no data" states). If any dataset missing, graceful fallback message.
6. **Interaction**: Tooltips display exact values on hover; no console errors

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WALCL not in `global_liquidity_direction` as standalone Fed-only column (it's aggregated) | Chart 1 & 2 break | Query raw WALCL directly from `global_liquidity_direction` using JSONB access on `trailing_history` (contains pre-aggregated Fed value); fallback: show "Fed assets data pending ingestion — add WALCL to metrics" |
| M2 not in `metric_observations` | Chart 3 breaks | Use `global_liquidity_direction.global_m2_growth` (absolute level) instead; show level not growth |
| TIPS real yield unavailable | Chart 4 incomplete | Compute proxy real yield = 10Y − CPI YoY; add footnote "Approximate real yield: nominal − headline CPI" |
| QE/QT period detection relies on SOMA change, which may be null | Shading missing | Omit shading, show real yield line only; add note "QE/QT periods: use SOMA cumulative change" |

---

## Files to Modify

| File | Action |
|------|--------|
| `src/features/dashboard/components/rows/FedMonetizationMonitor.tsx` | CREATE NEW — main component |
| `src/pages/Terminal.tsx` | INSERT new SectionErrorBoundary + component after USDebtMaturityWall |
| `src/features/dashboard/components/rows/index.ts` (optional) | Export new component if used elsewhere |
| `COMPONENT_REGISTRY.md` | ADD entry for new component (manual step, not code) |

---

## Post-Deployment

- Monitor data freshness: WALCL (weekly), M2 (weekly), Yields/CPI (daily)
- Consider adding dedicated ingestion for WALCL, M2SL, T10YIE to `metric_observations` if not present after deployment
- If Real Yield chart uses proxy, flag for future enhancement: ingest TIPS yield (T10YIE)
