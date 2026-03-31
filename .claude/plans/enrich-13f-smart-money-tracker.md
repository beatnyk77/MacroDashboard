# Plan: Enrich 13-F Smart Money Tracker — Flagship Feature Enhancement

## Context
The current 13-F Smart Money Tracker (`InstitutionalHoldingsWall`) is basic, showing only AUM rankings and simple sector heatmaps. The goal is to transform it into an institutional-grade flagship section with advanced visualizations, regime indicators, and comparative analytics, matching the quality of other premium sections like `GlobalLiquidityMonitor`.

**Current State:**
- Component: `src/components/InstitutionalHoldingsWall.tsx`
- Data source: `institutional_13f_holdings` table (populated by `supabase/functions/ingest-institutional-13f`)
- Features: Bar chart of AUM, sector allocation heatmap per institution, QoQ delta

**Requested Enhancements:**
1. Quarter-over-quarter allocation shifts (equity vs bonds vs gold) — stacked area/Sankey
2. Top 10 holdings concentration + sector rotation heatmap
3. Smart Money Regime Indicator with z-score (already has basic version)
4. Institution-specific cards (Norges, GIC, ADIA, CPPIB, CalPERS) with highlighted moves
5. Historical 8-quarter flow trend for major asset classes
6. Comparison vs S&P 500 and ETFs (SPY, TLT, GLD)
7. Risk-on/Risk-off signal based on collective rotation
8. Weekly ingestion cron (Sunday 03:00 UTC)

## Approach

### Phase 1: Database Schema Extension
**File:** `supabase/migrations/YYYYMMDDHHMMSS_extend_institutional_13f.sql`

Add columns to `institutional_13f_holdings`:
- `asset_class_allocation` JSONB (equity_pct, bond_pct, gold_pct, other_pct)
- `top_holdings` JSONB (array of {cusip, ticker, name, value, sector, concentration_contribution})
- `concentration_score` NUMERIC (Herfindahl-Hirschman Index or top 5 sum %)
- `sector_rotation_signal` TEXT (‘ACCUMULATE’, ‘REDUCE’, ‘NEUTRAL’) per top sector
- `spy_comparison` NUMERIC (relative performance vs SPY)
- `tlt_comparison` NUMERIC (relative vs TLT)
- `gld_comparison` NUMERIC (relative vs GLD)
- `regime_z_score` NUMERIC (composite z-score for this institution’s positioning)
- `historical_allocation` JSONB (array of {quarter, equity_pct, bond_pct, gold_pct})

Also create a **materialized view** `vw_smart_money_collective` for aggregated signals across all institutions, refreshed daily.

### Phase 2: Ingestion Enhancement
**File:** `supabase/functions/ingest-institutional-13f/index.ts`

Modify the existing function to:
1. **Calculate asset class allocation:** From the holdings list, classify each security as Equity, Bond, Gold/Commodity, or Other (using Alpha Vantage asset type or sector logic)
2. **Extract top 10 holdings:** Already fetching top 30, expand to store top 10 with names (via Alpha Vantage OVERVIEW) and sectors
3. **Compute concentration score:** HHI = sum(weight²) or simpler top_5_sum_pct
4. **Determine sector rotation signals:** Compare current sector weights vs 8-quarter average → ACCUMULATE/REDUCE/NEUTRAL
5. **Fetch benchmark prices:** Use Alpha Vantage to get latest SPY, TLT, GLD prices and their 3-month returns for comparison
6. **Store historical snapshots:** Keep last 8 quarters in `historical_allocation` array (or create separate table if array becomes too large)
7. **Calculate institution regime z-score:** Compare equity allocation vs historical average

**New weekly cron migration:** `supabase/migrations/YYYYMMDDHHMMSS_schedule_13f_weekly.sql`
```sql
SELECT cron.schedule(
    'ingest-institutional-13f-weekly',
    '0 3 * * 0',  -- Sunday 03:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/ingest-institutional-13f',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);
```

### Phase 3: Backend Views & Aggregations
**File:** `supabase/migrations/YYYYMMDDHHMMSS_smart_money_views.sql`

Create `vw_smart_money_collective`:
- Aggregates across all tracked institutions
- Calculates average equity/bond/gold allocation
- Computes collective concentration score
- Generates composite regime_z_score (avg of institution z-scores)
- Determines overall risk_signal (‘RISK_ON’, ‘RISK_OFF’, ‘NEUTRAL’) based on avg equity allocation z-score
- Includes 8-quarter trend arrays for each asset class

### Phase 4: Frontend Hook
**File:** `src/hooks/useSmartMoneyHoldings.ts` (new)

Create a comprehensive hook:
- Fetch latest `institutional_13f_holdings` for all institutions (ordered by total_aum desc)
- Optionally fetch `vw_smart_money_collective` for aggregate signals
- Transform data for charts:
  - Asset allocation stacked area (equity/bond/gold over 8 quarters)
  - Sector rotation heatmap grid (institutions × sectors, color = allocation %)
  - Concentration bar chart
  - Benchmark comparison cards
- Provide derived signals: top buyer/seller this quarter, biggest sector rotation

Reuse existing hooks pattern: `useSuspenseQuery`, `supabase` client, 1-hour staleTime.

### Phase 5: Enhanced Component
**File:** `src/components/InstitutionalHoldingsWall.tsx` (major rewrite)

New layout structure:
1. **Header** (unchanged but add subtitle about enhanced telemetry)
2. **Top Row: Collective Regime & Allocation Stack**
   - Left: Smart Money Regime Gauge (like existing RegimeGauge in SmartMoneyFlowMonitor) + Risk On/Off signal + z-score
   - Right: Stacked area chart showing 8-quarter trend of avg equity/bond/gold allocation across all tracked institutions (use Recharts AreaChart)
3. **Middle Row: 3-Column Grid**
   - **Col 1: Institution Cards** (Norges, GIC, ADIA, CPPIB, CalPERS only, then "Others" summary)
     - For each: AUM, QoQ delta, regime badge (color: bullish/bearish/neutral)
     - Mini sparkline of equity allocation over 8 quarters
     - Highlight key moves: "Increased Tech exposure +2.1%", "Reduced Financials -1.3%"
   - **Col 2: Top 10 Holdings Concentration**
     - Horizontal stacked bar chart: Each top holding (across all institutions aggregated) or per-institution toggle?
     - Better: Bubble chart or Treemap showing Top 20 holdings by aggregate smart money value, sized by concentration, colored by sector
     - Alternatively: Simple bar chart of Top 10 holdings with sector color bands
   - **Col 3: Sector Rotation Heatmap**
     - Grid: institutions (rows) × sectors (columns)
     - Color intensity = allocation %; borders = significant rotation (>±1% QoQ)
     - Best practice: Use same style as `PromoterActivityHeatmap` component
4. **Bottom Row: Benchmark Comparison & Signals**
   - Cards: "vs S&P 500" (avg institution performance relative to SPY), "vs TLT", "vs GLD"
   - Risk-on/Risk-off summary: "Collective rotation into Equities (+3.2% avg) indicates RISK-ON regime"
   - Data freshness timestamp

**Technical Details:**
- Use `MotionCard` for subtle entrance animations
- Use MUI `Grid` or plain Tailwind `grid`
- Charts: Recharts `AreaChart` for stacked area, `BarChart` for concentration, `ResponsiveContainer`
- Keep dark glassmorphic aesthetic consistent
- Maintain terminal font (monospace) for numbers
- Use format utilities: `formatNumber`, `formatDelta`
- Maintain existing error boundary wrapper

### Phase 6: Testing & Verification
1. Verify ingestion runs weekly via cron (check Supabase logs)
2. Ensure data appears in component within 1 hour of cron execution
3. Confirm all visualizations render without errors for 8+ quarters of data
4. Verify benchmark comparison calculations (Alpha Vantage data quality)
5. Test fallback for missing data (e.g., if Alpha Vantage rate-limited, use previous sector mapping)

## Files to Modify/Create

**Database (Migrations):**
- `supabase/migrations/YYYYMMDDHHMMSS_extend_institutional_13f.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_smart_money_views.sql`
- `supabase/migrations/YYYYMMDDHHMMSS_schedule_13f_weekly.sql`

**Backend:**
- `supabase/functions/ingest-institutional-13f/index.ts` (enhance)

**Frontend:**
- `src/hooks/useSmartMoneyHoldings.ts` (new)
- `src/components/InstitutionalHoldingsWall.tsx` (rewrite)
- Possibly `src/utils/formatNumber.ts` extend if needed (reuse existing)

**No changes needed:**
- `SmartMoneyFlowMonitor.tsx` (separate component, keep as-is unless later integration desired)
- Terminal page layout (InstitutionalHoldingsWall remains at top as flagship)

## Success Criteria

- All 7 requested visualizations/signals are present and functional
- Data refreshes weekly automatically via cron
- Component renders smoothly with glassmorphic UI
- No console errors; query hooks use proper error boundaries
- Density: Immediate view of 8 institutions + aggregates without scrolling
- Institutional-grade appearance matching Bloomberg terminal aesthetics

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Alpha Vantage rate limits (5/min free tier) | Process institutions sequentially with 200ms delay; cache sector mappings; fall back to 'Other' for unmapped CUSIPs |
| Historical data may not have 8 quarters of depth | Show partial trend; fetch from FRED for older proxies?; show "Insufficient history" gracefully |
| Performance: Large JSON blobs slow queries | Use materialized view for aggregates; fetch only latest row for each institution; pagination not needed for 8 institutions |
| Top holdings names may be missing | Use fallback ticker or CUSIP; add tooltip with "Name unavailable" |

## Implementation Order
1. Database migration (schema + view)
2. Ingestion function enhancements (thoroughly test locally or in Supabase logs)
3. Create new hook and mock data for UI dev
4. Build enhanced component incrementally (regime gauge → stacked chart → institution cards → heatmap → benchmarks)
5. Create cron migration and test scheduling
6. QA on production: check data freshness, visual consistency, mobile responsiveness

---

**Note:** This plan targets enhancement of `InstitutionalHoldingsWall` (the current flagship 13-F tracker). The separate `SmartMoneyFlowMonitor` (Sankey-based) will remain unchanged unless requested otherwise.
