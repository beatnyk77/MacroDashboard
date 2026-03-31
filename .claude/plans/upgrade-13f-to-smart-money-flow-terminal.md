# Upgrade Plan: 13-F Smart Money Tracker → Live Smart Money Flow Terminal
**Objective**: Transform the current 13-F block into a unified Smart Money Flow Terminal combining quarterly institutional positioning with near real-time options flow signals.

**Created**: 2026-04-01
**Target**: Hero section flagship component
**Integration**: Alpha Vantage (existing) + sec-edgar-mcp (existing)
**Status**: Ready for implementation

---

## Executive Summary

The current `InstitutionalHoldingsWall` shows only quarterly 13-F holdings. We need to add **options flow intelligence** to answer: "Where are whales actively positioning right now via options?"

**Deliverables**:
1. **Trade Tape** – Recent high-conviction moves from flagship institutions (already exists, enhance)
2. **Options Flow Heatmap** – Large options trades color-coded by bullish/bearish conviction
3. **Sector Flow + Options Conviction** – Combined view showing accumulation/distribution + call/put skew
4. **Smart Money Regime Indicator** – Combined real-time signal using 13-F delta + options flow sentiment
5. **Collapsible 8-quarter allocation chart** – Maintain existing as context panel

**Architecture**: Strictly additive. No removal of existing 13-F functionality.

---

## Current State Analysis

### Existing Infrastructure
- **Database**: `institutional_13f_holdings` (enriched with asset_class_allocation, top_holdings, regime_z_score, etc.)
- **Ingestion**: `supabase/functions/ingest-institutional-13f` (weekly SEC + Alpha Vantage)
- **Frontend**: `InstitutionalHoldingsWall.tsx` (full-featured with regime gauge, stacked area, heatmap, cards)
- **Trade Tape**: `TradeTape.tsx` + `useSmartMoneyTradeTape` (shows inferred 13-F position changes)
- **Alpha Vantage**: Already integrated, rate-limited (12s delay), working

### Gaps to Fill
- ❌ No options flow data table
- ❌ No options flow ingestion
- ❌ No options flow UI components
- ❌ No combined regime calculation (13-F + options)
- ❌ No unusual options activity detection
- ⚠️ Trade Tape only shows 13-F trades, not options flow sweeps

---

## Phase 1: Database Schema for Options Flow

**File**: `supabase/migrations/20260401000000_create_options_flow_tables.sql`

```sql
-- =====================================================
-- Options Flow: Unusual Activity & Sentiment Signals
-- =====================================================

-- Main options flow table: aggregates by ticker/institution/expiry
CREATE TABLE IF NOT EXISTS options_flow_inferred (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(10) NOT NULL,
    institution_name VARCHAR(255), -- if known (often anonymous)
    option_type VARCHAR(4) CHECK (option_type IN ('CALL', 'PUT')),
    expiry_date DATE NOT NULL,
    strike_price DECIMAL(10,2) NOT NULL,
    volume_spike_pct INTEGER, -- How much above average (e.g., 300 = 300% of avg)
    premium_usd NUMERIC, -- Total premium traded (approx)
    volume_total INTEGER,
    open_interest_change INTEGER,
    sentiment_score INTEGER NOT NULL, -- -10 to +10 (negative = bearish PUTs, positive = bullish CALLs)
    is_sweep BOOLEAN DEFAULT FALSE, -- True if multiple large trades across exchanges
    is_block BOOLEAN DEFAULT FALSE, -- True if large single trade (>100 contracts)
    unusual_activity_score INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN volume_spike_pct > 500 AND ABS(sentiment_score) >= 7 THEN 9
            WHEN volume_spike_pct > 300 AND ABS(sentiment_score) >= 5 THEN 7
            WHEN volume_spike_pct > 100 AND ABS(sentiment_score) >= 3 THEN 5
            ELSE 3
        END
    ) STORED,
    data_source VARCHAR(50) DEFAULT 'alpha_vantage',
    as_of_date DATE NOT NULL, -- Date of the options flow event (usually today or yesterday)
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_options_flow_ticker_date ON options_flow_inferred (ticker, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_options_flow_sentiment ON options_flow_inferred (sentiment_score DESC);
CREATE INDEX IF NOT EXISTS idx_options_flow_unusual ON options_flow_inferred (unusual_activity_score DESC) WHERE unusual_activity_score >= 7;
CREATE INDEX IF NOT EXISTS idx_options_flow_expiry ON options_flow_inferred (expiry_date);
CREATE INDEX IF NOT EXISTS idx_options_flow_institution ON options_flow_inferred (institution_name) WHERE institution_name IS NOT NULL;

-- Materialized view for aggregated ticker-level options sentiment
CREATE MATERIALIZED VIEW IF NOT EXISTS vw_options_sentiment_by_ticker AS
SELECT
    ticker,
    DATE(as_of_date) as date,
    COUNT(*) as flow_events,
    SUM(CASE WHEN option_type = 'CALL' THEN volume_total ELSE 0 END) as call_volume,
    SUM(CASE WHEN option_type = 'PUT' THEN volume_total ELSE 0 END) as put_volume,
    AVG(sentiment_score) as avg_sentiment,
    MAX(unusual_activity_score) as peak_unusual_score,
    SUM(CASE WHEN is_sweep THEN 1 ELSE 0 END) as sweep_count,
    SUM(premium_usd) as total_premium,
    MAX(as_of_date) as updated_at
FROM options_flow_inferred
WHERE as_of_date >= (CURRENT_DATE - INTERVAL '7 days')
GROUP BY ticker, DATE(as_of_date);

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_vw_options_sentiment_ticker ON vw_options_sentiment_by_ticker (ticker DESC, date DESC);

-- View for top unusual activity (last 3 days)
CREATE OR REPLACE VIEW vw_top_options_flow AS
SELECT
    ticker,
    option_type,
    expiry_date,
    strike_price,
    volume_spike_pct,
    premium_usd,
    sentiment_score,
    unusual_activity_score,
    is_sweep,
    as_of_date
FROM options_flow_inferred
WHERE as_of_date >= (CURRENT_DATE - INTERVAL '3 days')
  AND unusual_activity_score >= 5
ORDER BY unusual_activity_score DESC, as_of_date DESC
LIMIT 100;

-- Function to refresh the materialized view (called by ingestion)
CREATE OR REPLACE FUNCTION refresh_options_sentiment_mv()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_options_sentiment_by_ticker;
END;
$$ LANGUAGE plpgsql;
```

---

## Phase 2: Options Flow Ingestion Function

**File**: `supabase/functions/ingest-options-flow/index.ts`

### Design Principles
- **Frequency**: Daily at 02:00 UTC (after market close, pre-Asia open)
- **Alpha Vantage integration**: Reuse existing rate-limit pattern (12s delay)
- **Data sources**: Alpha Vantage `OPTION_CHAIN` + `TICKER_INDICATORS` for unusual activity detection
- **Unusual activity heuristics**: Volume spikes, sweep detection, block trades
- **Sentiment scoring**: -10 to +10 based on call/put ratio, volume anomaly, premium size

### Implementation Outline

```typescript
// Key functions:
// 1. fetchOptionChain(ticker, apiKey) – gets current options chain
// 2. detectUnusualActivity(chainData, historicalBaseline) – identifies outliers
// 3. calculateSentimentScore(callVolume, putVolume, volumeSpike) – -10 to +10 scale
// 4. isSweep(tradeData) – detect multiple large trades across exchanges
// 5. aggregateByTicker(flows) – summarize per-ticker sentiment
// 6. upsertToSupabase(flows) – insert with conflict resolution
// 7. refreshMaterializedView() – refresh vw_options_sentiment_by_ticker

// Target institutions list (same as 13F)
const INSTITUTIONS = [
    { name: 'Norges Bank', known_affinity: ['SPY', 'QQQ', 'SPX'] },
    { name: 'GIC Private Ltd', known_affinity: ['AAPL', 'MSFT', 'GOOGL'] },
    // ... add more with known options activity patterns
];

// For each institution's known tickers, fetch option chain and look for:
// - Volume > 3x 30-day average
// - Large block trades (>100 contracts)
// - Sweeps (same strike/expiry across multiple exchange timestamps)
// - High-premium trades (>$1M notional)
```

### Enhanced Ingestion Scheduler

**File**: `supabase/migrations/20260401000001_schedule_options_flow_daily.sql`

```sql
SELECT cron.schedule(
    'ingest-options-flow-daily',
    '0 2 * * *',  -- Daily 02:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/ingest-options-flow',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    ) as request_id;
    $$
);
```

---

## Phase 3: Combined Smart Money Regime Calculation

**File**: `supabase/functions/compute-smart-money-regime/index.ts`

This new function runs after both 13-F and options ingestion to compute combined signals.

### Inputs
- Latest `institutional_13f_holdings` (aggregate across institutions)
- Last 3 days of `options_flow_inferred`
- Historical `institutional_13f_holdings` for trend analysis

### Outputs (store in new table or cache)

```sql
CREATE TABLE IF NOT EXISTS smart_money_regime_current (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL UNIQUE,
    regime_13f_score NUMERIC NOT NULL, -- existing regime_z_score aggregate
    regime_options_score NUMERIC NOT NULL, -- normalized options sentiment -10 to +10
    combined_regime_score NUMERIC NOT NULL, -- weighted: 60% 13F, 40% options
    risk_signal VARCHAR(10) CHECK (risk_signal IN ('RISK_ON', 'RISK_OFF', 'NEUTRAL')),
    confidence_level NUMERIC, -- 0-100 based on data completeness
    top_bullish_sectors JSONB, -- array of {sector, conviction}
    top_bearish_sectors JSONB,
    theta_balance VARCHAR(10), -- CALL/PUT flow skew
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Regime Algorithm
1. **13F Component** (60% weight):
   - Use `vw_smart_money_collective.avg_regime_z`
   - Z-score normalized to -100 to +100 scale
   
2. **Options Component** (40% weight):
   - Average sentiment across last 3 days of flows
   - Normalize -10 to +10 to -100 to +100 scale
   - Adjust by unusual activity volume (higher volume = more weight)
   
3. **Combined Score** = (0.6 × 13F_score) + (0.4 × Options_score)

4. **Risk Signal**:
   - `combined_regime_score > 30` → RISK_ON
   - `combined_regime_score < -30` → RISK_OFF
   - else → NEUTRAL

5. **Theta Balance**:
   - `SUM(CALL volume) / SUM(PUT volume)` ratio
   - > 1.5 = CALL heavy (bullish)
   - < 0.67 = PUT heavy (bearish)
   - 0.67-1.5 = BALANCED

---

## Phase 4: Frontend Hooks

### 4.1: `useOptionsFlow` Hook

**File**: `src/hooks/useOptionsFlow.ts`

```typescript
export interface OptionsFlowSignal {
    ticker: string;
    date: string;
    avg_sentiment: number;
    flow_events: number;
    call_volume: number;
    put_volume: number;
    sweep_count: number;
    total_premium: number;
    peak_unusual_score: number;
}

export interface OptionsHeatmapDatum {
    ticker: string;
    sector?: string;
    sentiment: number;      // -10 to +10
    conviction: number;     // 1-10 (unusual activity score)
    premium: number;
    is_sweep: boolean;
    expiry: string;
    strike: number;
}

export function useOptionsFlow() {
    const { data: tickerSentiment = [] } = useSuspenseQuery<OptionsFlowSignal[]>({
        queryKey: ['options_flow_sentiment'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_options_sentiment_by_ticker')
                .select('*')
                .eq('date', new Date().toISOString().split('T')[0]) // today
                .order('avg_sentiment', { ascending: false });
            if (error) throw error;
            return data as OptionsFlowSignal[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: topUnusual = [] } = useSuspenseQuery<OptionsHeatmapDatum[]>({
        queryKey: ['options_flow_unusual'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_top_options_flow')
                .select('*')
                .order('unusual_activity_score', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data as OptionsHeatmapDatum[];
        },
        staleTime: 1000 * 60 * 5,
    });

    // Aggregate by sector (need sector mapping, can join with static sector list)
    const sectorSentiment = useMemo(() => {
        const sectorMap = new Map<string, { totalSentiment: number; count: number }>();
        tickerSentiment.forEach(item => {
            // TODO: Map ticker to sector (use existing sector mapping from 13F or Alpha Vantage)
            const sector = mapTickerToSector(item.ticker) || 'Other';
            const existing = sectorMap.get(sector) || { totalSentiment: 0, count: 0 };
            sectorMap.set(sector, {
                totalSentiment: existing.totalSentiment + item.avg_sentiment,
                count: existing.count + 1
            });
        });
        return Array.from(sectorMap.entries())
            .map(([sector, stats]) => ({
                sector,
                avg_sentiment: stats.totalSentiment / stats.count,
                signals: stats.count
            }))
            .sort((a, b) => b.avg_sentiment - a.avg_sentiment);
    }, [tickerSentiment]);

    return {
        tickerSentiment,
        topUnusual,
        sectorSentiment,
        thetaBalance: computeThetaBalance(tickerSentiment)
    };
}

function mapTickerToSector(ticker: string): string | null {
    // Reuse sector mapping from institutional holdings cache or Alpha Vantage
    // For now, return null and map later with enriched data
    return null;
}

function computeThetaBalance(data: OptionsFlowSignal[]): number {
    const totalCalls = data.reduce((sum, d) => sum + d.call_volume, 0);
    const totalPuts = data.reduce((sum, d) => sum + d.put_volume, 0);
    return totalPuts > 0 ? totalCalls / totalPuts : 1;
}
```

### 4.2: Enhanced `useSmartMoneyHoldings` (for combined signals)

**Modify** `src/hooks/useSmartMoneyHoldings.ts` to also fetch `smart_money_regime_current`.

---

## Phase 5: UI Components

### 5.1: Options Flow Heatmap

**File**: `src/components/OptionsFlowHeatmap.tsx`

**Design**: Grid of top ~30-50 tickers with unusual options activity.

**Columns**:
- Ticker (monospace, bold)
- Sentiment bar (horizontal bar from -10 to +10, green-to-red gradient)
- Conviction badge (1-10, colored: 8-10=red, 5-7=orange, 3-4=yellow, 1-2=grey)
- Premium amount ($M)
- Sweep indicator (animated pulse if is_sweep)
- Expiry date (UX: highlight near-term < 30 days)

**Interactions**:
- Hover tooltip: Show strike, volume spike %, block size, premium, timestamp
- Click ticker → modal with detailed option chain breakdown (optional, can open new panel)

**Color scheme**:
- Sentiment bar: diverging (red ← negative → white midpoint → green positive)
- Conviction: opacity/intensity of the bar

**Sizing**: Responsive grid (4-6 columns on desktop, 2 on mobile)

**Code structure**:
```typescript
const OptionsFlowHeatmap: React.FC = () => {
    const { topUnusual } = useOptionsFlow();
    
    // Group by ticker, take latest per ticker
    const tickerData = useMemo(() => {
        const map = new Map<string, OptionsHeatmapDatum[]>();
        topUnusual.forEach(d => {
            const list = map.get(d.ticker) || [];
            list.push(d);
            map.set(d.ticker, list);
        });
        // Take the most recent/highest conviction per ticker
        return Array.from(map.values()).map(list => 
            list.sort((a,b) => b.conviction - a.conviction)[0]
        ).sort((a,b) => Math.abs(b.sentiment) - Math.abs(a.sentiment)).slice(0, 40);
    }, [topUnusual]);

    return (
        <MotionCard className="h-full">
            <Header>Options Flow Heatmap</Header>
            <Grid container spacing={1}>
                {tickerData.map(ticker => (
                    <Grid item xs={6} sm={4} md={3} key={ticker.ticker}>
                        <TickerRow data={ticker} />
                    </Grid>
                ))}
            </Grid>
        </MotionCard>
    );
};
```

### 5.2: Sector Flow Combined View

**File**: `src/components/SectorFlowCombined.tsx`

**Purpose**: Show how smart money is rotating across sectors, combining 13-F allocation changes + options flow sentiment.

**Layout**: 2-column layout
- Left: 13-F sector allocation (bar chart, % of total AUM)
- Right: Options flow sentiment by sector (horizontal bar -10 to +10)

**Visualization**:
- X-axis shared: sectors listed vertically
- Bar 1 (left): Stacked bar showing equity vs bond allocation for that sector (derived from 13F top_sectors)
- Bar 2 (right): Sentiment bar (options flow)

**Data merge**: Need to map option flow tickers to sectors (use same sector mapping as 13F for consistency).

**Enhancement**: Add "net flow" sparkline showing combined signal strength.

### 5.3: Smart Money Regime Indicator (Enhanced)

**Modify** existing `RegimeGauge` component in `InstitutionalHoldingsWall.tsx` to accept combined score from `smart_money_regime_current`.

**New features**:
- Show gauge with combined score
- Display breakdown: "13F: +45 | Options: +62 | Combined: +53"
- Color glow pulse based on signal strength
- Tooltip explaining components

### 5.4: Trade Tape Enhancement

**Modify** `TradeTape.tsx` to include options flow sweeps as separate category:

- Add a third "mode": `'13F' | 'options' | 'combined'`
- When `mode='options'`, show tickers with high unusual activity scores
- Format: `[🔥] AAPL 150C 05/16 $2.3M CALL SWEEP (+420%)`
- Show `CALL`/`PUT` distinctly with color
- Show volume spike % and premium

**New hook**: `useCombinedTradeTape` that merges:
- Top 20 13-F inferred trades (conviction score)
- Top 20 options flow sweeps (unusual activity score)
- Interleave or show in separate rows?

**Decision**: Keep separate rows but unified marquee. Format:
```
[Norges] MSFT +2.1%  [🔥] AAPL 150C $2.3M CALL SWEEP
[GIC] GOOGL -1.3%    [💎] SPY 450P $1.8M PUT BLOCK
```

---

## Phase 6: Integration INTO InstitutionalHoldingsWall

### New Layout Structure

```tsx
<InstitutionalHoldingsWall>
    {/* Row 1: Header + Live Regime + Trade Tape */}
    <Row>
        <Col md={8}>
            <Header />
            <CombinedRegimeGauge />
            <TradeTape mode="combined" />
        </Col>
        <Col md={4}>
            <SmartMoneySummaryCards /> {/* Key institutions snapshot */}
        </Col>
    </Row>

    {/* Row 2: Options Heatmap + Sector Combined */}
    <Row>
        <Col md={6}>
            <OptionsFlowHeatmap />
        </Col>
        <Col md={6}>
            <SectorFlowCombined />
        </Col>
    </Row>

    {/* Row 3: Existing 13-F Components (Preserved) */}
    <Row>
        <Col md={12}>
            <CollapsibleSection title="13-F Holdings Details (8-Quarter Context)" defaultOpen={false}>
                {/* Existing asset allocation stacked chart */}
                <AssetAllocationTrend />
                {/* Institution cards */}
                <InstitutionCardsGrid />
                {/* Top holdings concentration */}
                <TopHoldingsConcentration />
                {/* Sector heatmap */}
                <SectorRotationHeatmap />
                {/* Benchmark comparisons */}
                <BenchmarkComparisons />
            </CollapsibleSection>
        </Col>
    </Row>
</InstitutionalHoldingsWall>
```

### Styling Requirements
- Maintain dark glassmorphic aesthetic (`bg-[rgba(15,23,42,0.4)]`, borders `rgba(255,255,255,0.05)`)
- Use Stitch MCP components if available (ask ChatGPT to verify)
- Terminal fonts (monospace) for all numeric data
- Responsive: mobile-first, 1 column on sm, 2 on md, 3 on lg

---

## Phase 7: Crontab & Scheduling

### Current Schedule
- 13F ingestion: Sunday 03:00 UTC (weekly)
- Options flow: Daily 02:00 UTC (new)

### Combined Regime Computation
Run 15 minutes after both ingests complete:
- After 13F (Sunday ~04:00 UTC)
- After options flow (daily ~03:00 UTC)

**Migration**: `20260401000002_schedule_combined_regime.sql`

```sql
SELECT cron.schedule(
    'compute-smart-money-regime',
    '0 4 * * 0',  -- Sunday 04:00 UTC
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/compute-smart-money-regime',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);

-- Also schedule daily at 04:00 for daily options flow days
SELECT cron.schedule(
    'compute-smart-money-regime-daily',
    '0 4 * * *',
    $$
    SELECT net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/compute-smart-money-regime',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body := '{}'::jsonb
    );
    $$
);
```

---

## Phase 8: Testing & Verification Checklist

### Data Pipeline
- [ ] Run `ingest-options-flow` manually, verify rows inserted into `options_flow_inferred`
- [ ] Check materialized view刷新 completes without lock contention
- [ ] Verify `smart_money_regime_current` populated with combined score
- [ ] Confirm cron jobs scheduled in Supabase (`SELECT * FROM cron.job;`)

### UI Rendering
- [ ] `OptionsFlowHeatmap` displays 30-50 tickers with sentiment bars
- [ ] Sentiment colors correct (negative=red, positive=green)
- [ ] Conviction badges show proper levels with hover tooltips
- [ ] Sweep indicators animate (pulse effect)
- [ ] `SectorFlowCombined` shows merged 13F + options data
- [ ] Regime gauge updates with combined score breakdown
- [ ] Trade Tape includes options sweeps alongside 13F trades
- [ ] Collapsible section works for 13F details

### Mobile Responsiveness
- [ ] Test on 375px width: Options heatmap grid → 2 columns
- [ ] Trade Tape scrolls horizontally on mobile
- [ ] All text ≥ 12px (readable)
- [ ] No horizontal overflow on any component

### Real Data Verification
- [ ] Options flow shows activity from last 3 days (not empty)
- [ ] Tickers correspond to sectors from 13F watchlist (AAPL, MSFT, SPY, etc.)
- [ ] Sentiment scores reasonable (not all +10 or -10)
- [ ] Theta balance reflects current market (CALL heavy in bull markets, etc.)
- [ ] Regime combined score correlates with recent market moves

### Build & Lint
```bash
npm run lint   # Should pass with 0 warnings
npm run build  # Should compile successfully
```

---

## Phase 9: Implementation Order (Priority Sequence)

**Day 1**:
1. Create `options_flow_inferred` table + materialized view migration
2. Build `ingest-options-flow` function (start with mock data, test with 1 ticker)
3. Test ingestion on real Alpha Vantage data (respect rate limits)

**Day 2**:
4. Schedule options flow cron
5. Build `vw_top_options_flow` view
6. Create `useOptionsFlow` hook + test queries
7. Build `OptionsFlowHeatmap` component (basic, static data)

**Day 3**:
8. Build `SectorFlowCombined` component
9. Build `compute-smart-money-regime` function
10. Create `smart_money_regime_current` table + cron
11. Enhance `RegimeGauge` with combined score
12. Enhance `TradeTape` with options mode

**Day 4**:
13. Integrate all components into `InstitutionalHoldingsWall`
14. Add collapsible section for 13F details
15. Responsive layout testing
16. Refine tooltips, hover states, animations

**Day 5**:
17. Full QA on staging
18. Production rollout (run migrations, deploy functions, monitor logs)
19. Verify cron jobs running
20. Check data freshness in frontend

---

## Files to Create/Modify

### Database (5 files)
1. `supabase/migrations/20260401000000_create_options_flow_tables.sql`
2. `supabase/migrations/20260401000001_schedule_options_flow_daily.sql`
3. `supabase/migrations/20260401000002_schedule_combined_regime.sql`
4. `supabase/migrations/20260401000003_add_smart_money_regime_table.sql` (if separate table)
5. `supabase/migrations/20260401000004_index_options_flow.sql` (optional, if separate)

### Backend Functions (2 files)
1. `supabase/functions/ingest-options-flow/index.ts` (new)
2. `supabase/functions/compute-smart-money-regime/index.ts` (new)

### Frontend Hooks (2 files)
1. `src/hooks/useOptionsFlow.ts` (new)
2. `src/hooks/useSmartMoneyHoldings.ts` (modify to include regime current)

### Frontend Components (4 files)
1. `src/components/OptionsFlowHeatmap.tsx` (new)
2. `src/components/SectorFlowCombined.tsx` (new)
3. `src/components/TradeTape.tsx` (modify to support options mode)
4. `src/components/InstitutionalHoldingsWall.tsx` (major integration)

### Utils (1 file)
1. `src/utils/sectorMapping.ts` (new, shared mapping ticker→sector across 13F + options)

### Types (1 file)
1. `src/types/options-flow.ts` (new, or inline in hook)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Alpha Vantage rate limits (5/min) | Spread calls across day; use delayed queue; limit to top 50 tickers daily |
| Options data less complete than 13F | Use "unusual activity" heuristics rather than full chain; focus on large trades only |
| Sector mapping mismatch between 13F and options | Build master sector mapping table cached in `sector_mapping` table, reuse both ingestion functions |
| Regime calculation confusion (mixed scales) | Normalize both scores clearly to -100/+100 before combining; show breakdown in tooltip |
| UI clutter from too much data | Collapsible sections; progressive disclosure; prioritize heatmap & regime on top |
| Real-time expectations (options daily, 13F weekly) | Show data freshness badges; options = "as of yesterday", 13F = "as of quarter-end" |
| Build failures from missing dependencies | Test locally with `vercel dev`; ensure TypeScript types added for new tables |

---

## Success Criteria

### CIO/PM Experience (5-Second Inference)
At a glance, the CIO should see:
1. **What is smart money doing RIGHT NOW?** (Trade Tape streaming)
2. **Overall posture?** (Regime gauge: RISK_ON/RISK_OFF)
3. **Which sectors getting bullish options?** (Sector Flow combined)
4. **Any unusual spikes?** (Options Heatmap with red badges)
5. **Context from 13F?** (Expand collapsible for deeper view)

### Technical
- All charts render without errors
- Data updates daily (options) and weekly (13F)
- No console warnings
- Build passes: `npm run lint && npm run build`
- Mobile responsive, legible fonts ≥12px

### Data Quality
- Options flow shows ≥50 ticker events per day
- Combined regime score changes at least 3× per week (responsive)
- Trade Tape updates within 5 minutes of ingestion completion
- No stale data (>24h old shown as warning)

---

## Open Questions (To Clarify Before Starting)

1. **Options flow granularity**: Should we store individual trades or aggregated by ticker/strike/expiry?  
   → **Recommend**: Aggregated by (ticker, strike, expiry, option_type, date) to reduce row count.

2. **Institution identification in options**: Often options flow is anonymous. How to link to 13F institutions?  
   → **Approach**: Store `institution_name` only when identifiable via sweep detection patterns (e.g., known market maker desks). Otherwise leave NULL. Trade Tape shows institution only for 13-F trades.

3. **Stitch MCP availability**: Do we have access to Stitch MCP components for superior UI?  
   → **If yes**: Use `StitchCard`, `StitchHeatmap`, `StitchGauge` where possible. If not, use MUI + custom CSS.

4. **Collapsible section implementation**: Use existing `CollapsibleSection` component or build new with Radix?  
   → Reuse `CollapsibleSection` from `src/components/CollapsibleSection.tsx`.

5. **Cron timezone**: Current crons use UTC. Should options flow run at US market close (16:00 ET) or pre-Asia (02:00 UTC)?  
   → 02:00 UTC is fine (captures EOD options flow, processes before Asia open).

---

## Appendix: Sample Options Flow Entries

Expected daily data volume: ~200-500 rows (unusual activity only)

```
ticker: AAPL
option_type: CALL
expiry: 2026-05-16
strike: 150.00
volume_spike_pct: 420
premium_usd: 2300000
sentiment_score: 9
is_sweep: true
unusual_activity_score: 9
```

---

## Rollback Plan

If options flow ingestion fails:
1. Disable cron: `SELECT cron.unschedule('ingest-options-flow-daily');`
2. Keep existing 13F functionality running
3. UI degrades gracefully: hide options heatmap/sector flow, show "Data temporarily unavailable"
4. Combined regime falls back to 13F-only (with note)

---

**Ready to build.**
**Next step**: Run database migrations, then implement `ingest-options-flow` function.
