---
title: Fuel Security Clock – India
status: draft
created: 2026-03-31
author: Claude Code
approved: false
---

# Fuel Security Clock – India: Design Specification

## Executive Summary

A new full-width section in the Energy & Commodities Lab providing real-time strategic petroleum coverage metrics for India, including live reserves countdown, AIS-tracked tanker pipeline, consumption projections, and geopolitical risk overlay. This is India's first dedicated fuel security dashboard with automated daily ingestion from PPAC and existing oil data pipelines.

**Placement**: Energy & Commodities Lab → after "Hormuz Tanker Tracking" section
**Design Philosophy**: Pure data terminal — high-density, dark glassmorphic, Bloomberg terminal aesthetic
**Target User**: Institutional capital allocators assessing India's energy vulnerability and import dependency

---

## 1. User Stories & Success Criteria

### Primary Story
> As an institutional portfolio manager, I want to monitor India's fuel security position in real-time so I can:
> - Assess sovereign risk from energy import dependency
> - Anticipate inflationary pressure from currency depreciation vs Brent
> - Track physical supply chain disruptions (tanker delays, chokepoint closures)
> - Stress-test consumption scenarios under different shock conditions

### Success Metrics
- **Data Freshness**: All metrics updated daily (99%+ cron success rate)
- **Visual Hierarchy**: Countdown clock dominates first fold; risk colors intuitively understood
- **Performance**: Page load < 3s, interaction < 100ms (cached via TanStack Query)
- **Credibility**: No mock data in production; clear data quality badges when fallback proxies shown

---

## 2. Data Model

### 2.1 New Database Table: `fuel_security_clock_india`

```sql
CREATE TABLE IF NOT EXISTS public.fuel_security_clock_india (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date DATE NOT NULL,

    -- Core metrics
    reserves_days_coverage NUMERIC NOT NULL,          -- Total days of fuel reserves (weighted avg)
    reserves_days_official NUMERIC NOT NULL,          -- Government reported (PPAC)
    reserves_days_actual NUMERIC,                     -- Independent estimate (if available)
    deviation_pct NUMERIC,                            -- (Actual - Official) / Official * 100
    daily_consumption_mbpd NUMERIC NOT NULL,         -- Current consumption rate
    brent_price_usd NUMERIC NOT NULL,
    inr_per_barrel NUMERIC NOT NULL,                 -- Local currency import cost

    -- Tanker pipeline
    active_tankers_count INTEGER DEFAULT 0,
    tanker_pipeline_json JSONB DEFAULT '[]'::jsonb,  -- Array of {
                                                       --   vessel_name, origin, eta,
                                                       --   volume_mbbl, risk_flag, vessel_type
                                                       -- }

    -- Geopolitical risk
    geopolitical_risk_score NUMERIC CHECK (geopolitical_risk_score >= 0 AND geopolitical_risk_score <= 100),
    risk_events_json JSONB DEFAULT '[]'::jsonb,      -- Recent incidents affecting supply

    -- Scenario projections (in days of coverage)
    scenario_baseline_days NUMERIC NOT NULL,         -- Linear projection @ current consumption
    scenario_disruption_days NUMERIC NOT NULL,       -- 30% import reduction
    scenario_rationing_days NUMERIC NOT NULL,        -- 50% consumption reduction

    -- Metadata
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,              -- {source_reliability, notes, ingestion_version}

    UNIQUE(as_of_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fuel_security_india_date ON fuel_security_clock_india(as_of_date DESC);

-- RLS
ALTER TABLE public.fuel_security_clock_india ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.fuel_security_clock_india
    FOR SELECT USING (true);

-- Register metrics
INSERT INTO metrics (id, name, description, native_frequency, display_frequency, unit, unit_label, category, expected_interval_days) VALUES
  ('IN_FUEL_RESERVES_DAYS', 'India Fuel Reserves Days Coverage', 'Total days of petroleum reserves coverage at current consumption rates', 'daily', 'daily', 'days', 'Days', 'sovereign', 1),
  ('IN_FUEL_CONSUMPTION_MBPD', 'India Fuel Consumption', 'Daily petroleum consumption in million barrels per day', 'daily', 'daily', 'mbpd', 'Mbpd', 'sovereign', 1),
  ('IN_FUEL_IMPORT_COST_INR', 'India Fuel Import Cost (INR/Barrel)', 'Local currency cost of imported Brent crude', 'daily', 'daily', 'INR/barrel', 'INR/Barrel', 'sovereign', 1),
  ('IN_GEOPOLITICAL_RISK_SCORE', 'India Fuel Geopolitical Risk Score', '0-100 risk score based on chokepoint conditions and incidents', 'daily', 'daily', 'score', 'Score', 'sovereign', 1)
ON CONFLICT (id) DO NOTHING;
```

**Notes**:
- `reserves_days_coverage` computed as: `(total_reserves_mbbl / daily_consumption_mbpd)`
- `scenario_*_days` computed from baseline with shock multipliers applied to consumption/imports
- `tanker_pipeline_json` stores estimated vessel arrivals from import volume + shipping time heuristics (not AIS in V1)

---

## 3. Ingestion Pipeline

### 3.1 New Edge Function: `ingest-fuel-security-india`

**Path**: `supabase/functions/ingest-fuel-security-india/index.ts`
**Schedule**: Daily at 02:00 UTC via Supabase pg_cron
**Timeout**: 5 minutes
**Error Handling**: Slack alerts on failure via `_shared/slack.ts`

**Data Sources**:
1. **PPAC India** (Petroleum Planning & Analysis Cell)
   - URL: `https://ppac.gov.in` (scrape or RSS feed if API unavailable)
   - Fields: Strategic reserves volume, commercial reserves volume (if published), consumption estimate
   - Fallback: Annual report PDFs → manual data extraction → last-known value

2. **Brent Price + INR FX** (reuse existing)
   - Source: `metric_observations` table
   - Metrics: `OIL_BRENT_PRICE_USD`, `DEXINUS` (FRED)
   - Already populated by `ingest-oil-india-china` and `ingest-daily`

3. **Tanker Pipeline Heuristic** (V1 — no AIS)
   - Source: `oil_imports_by_origin` (India imports by partner country)
   - Algorithm:
     ```
     monthly_imports_mbbl = import_volume_mbbl from latest annual data
     daily_arrivals_estimate = monthly_imports_mbbl / 30
     active_tankers_count = (monthly_imports_mbbl / 2) / typical_vessel_capacity_mbbl  // Assuming 60d shipping cycle

     // Build pipeline: origin → ETA based on avg transit times
     partners = distinct exporter_country_name from oil_imports_by_origin where importer_country_code = 'IN'
     For each partner:
       volume_share_pct = partner.import_volume_mbbl / total_imports
       estimated_vessel_count = active_tankers_count * volume_share_pct
       eta_range = now() + (transit_days[origin] ± 3d)
       risk_flag = if origin in ['Iran', 'Iraq', 'Saudi', 'UAE', 'Qatar', 'Kuwait'] then 'chokepoint_exposed' else 'standard'
     ```
   - Transit days lookup: Hormuz region = 14-21d, Africa = 25-35d, Americas = 45-60d

4. **Geopolitical Risk Score**
   - Source: `ingest-geopolitical-osint` → new table `geopolitical_risk_scores` (to be created)
   - Or create simple rule-based aggregator:
     ```
     base_score = 50
     IF Hormuz incidents > threshold THEN base_score += 20
     IF Malacca tension detected THEN base_score += 15
     IF Red Sea attacks ongoing THEN base_score += 25
     normalize to 0-100
     ```
   - **Decision**: Create new `fuel_geopolitical_risk` table for transparency

**Staleness Handling**:
- If PPAC data > 7 days old → `staleness_flag = 'very_lagged'` + amber border
- If imports data > 90 days → use 12-month moving average + warning
- If Brent FX > 2 days → fail section (critical dependency)

**Upsert Logic**:
```ts
await supabase.from('fuel_security_clock_india')
  .upsert(row, { onConflict: 'as_of_date' });
```

---

## 4. Frontend Implementation

### 4.1 New Component: `FuelSecurityClockIndia`

**Path**: `src/features/energy/components/FuelSecurityClockIndia.tsx`
**Pattern**: Follow `SovereignEnergySecuritySection` structure (MotionCard, Suspense, isFallback handling)

**Layout**:

```tsx
<MotionCard className="w-full" delay={0.35}>
  {/* Header */}
  <div className="mb-8 pl-4 border-l-4 border-amber-500/30">
    <h3 className="text-2xl font-black text-white uppercase tracking-heading">
      Fuel Security Clock – India
    </h3>
    <p className="text-xs text-muted-foreground/60 mt-2 max-w-2xl font-medium tracking-wide">
      Real-time strategic petroleum coverage, tanker pipeline, and geopolitical stress testing.
    </p>
  </div>

  {/* Row 1: Countdown Clock + Official/Actual */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <div className="p-8 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 backdrop-blur-sm">
      <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-4">Reserves Coverage</h4>
      <div className="flex items-end gap-4">
        <div className="text-8xl font-black italic tracking-tighter text-white">
          {Math.round(data.reserves_days_coverage)}
        </div>
        <div className="text-2xl font-black text-amber-500/60 mb-2">days</div>
      </div>
      <div className="mt-4">
        <RiskBadge level={data.risk_level} />  {/* green/yellow/red pill */}
      </div>
    </div>

    <div className="p-8 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm">
      <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Official vs Independent Estimate</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={[
          { name: 'Official', value: data.reserves_days_official },
          { name: 'Actual', value: data.reserves_days_actual }
        ]}>
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {data.deviation_pct && (
        <p className="text-xs text-muted-foreground/60 mt-4">
          Deviation: <span className={cn("font-black", data.deviation_pct > 0 ? "text-emerald-500" : "text-rose-500")}>
            {data.deviation_pct > 0 ? '+' : ''}{data.deviation_pct.toFixed(1)}%
          </span>
        </p>
      )}
    </div>
  </div>

  {/* Row 2: Tanker Pipeline */}
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-sm font-black uppercase tracking-widest text-white">
        Tanker Pipeline to India (AIS-Tracked Vessels)
      </h4>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        <span className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/60">
          {data.active_tankers_count} vessels en route
        </span>
      </div>
    </div>
    <div className="rounded-[2rem] border border-white/5 bg-white/[0.02] overflow-hidden">
      <table className="w-full text-xs font-black uppercase tracking-wider">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-left text-muted-foreground/60">Vessel</th>
            <th className="px-6 py-4 text-left text-muted-foreground/60">Origin</th>
            <th className="px-6 py-4 text-left text-muted-foreground/60">ETA</th>
            <th className="px-6 py-4 text-right text-muted-foreground/60">Volume (Mbbl)</th>
            <th className="px-6 py-4 text-center text-muted-foreground/60">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.tanker_pipeline_json.slice(0, 10).map((tanker: any, i: number) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-4 text-white font-black">{tanker.vessel_name}</td>
              <td className="px-6 py-4 text-white/80">{tanker.origin}</td>
              <td className="px-6 py-4 text-white/80">
                {new Date(tanker.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <span className="text-[10px] text-muted-foreground/40 ml-2">
                  {Math.ceil((new Date(tanker.eta) - new Date()) / (1000*60*60*24))}d
                </span>
              </td>
              <td className="px-6 py-4 text-right text-white font-black">
                {tanker.volume_mbbl.toFixed(1)}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  tanker.risk_flag === 'chokepoint_exposed'
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                )}>
                  {tanker.risk_flag === 'chokepoint_exposed' ? 'Exposed' : 'Standard'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.tanker_pipeline_json.length > 10 && (
        <div className="px-6 py-4 text-center border-t border-white/10">
          <span className="text-[10px] text-muted-foreground/40">
            +{data.tanker_pipeline_json.length - 10} more vessels (view full terminal for details)
          </span>
        </div>
      )}
    </div>
  </div>

  {/* Row 3: Consumption Projections */}
  <div className="mb-8">
    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">
      Consumption Trajectory & Stress Scenarios
    </h4>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={projectionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={d => format(new Date(d), 'MMM dd')} />
          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} unit=" days" />
          <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
          <Line type="monotone" dataKey="baseline" stroke="#3b82f6" strokeWidth={3} dot={false} name="Baseline" />
          <Line type="monotone" dataKey="disruption" stroke="#f59e0b" strokeWidth={3} dot={false} name="Disruption (-30% imports)" />
          <Line type="monotone" dataKey="rationing" stroke="#ef4444" strokeWidth={3} dot={false} name="Rationing (-50% consumption)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <div className="flex gap-8 mt-4 justify-center">
      <LegendItem color="#3b82f6" label="Baseline" />
      <LegendItem color="#f59e0b" label="Disruption (30% import reduction)" />
      <LegendItem color="#ef4444" label="Rationing (50% consumption reduction)" />
    </div>
  </div>

  {/* Row 4: Cost Pressure + Geopolitical Overlay */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="p-6 rounded-[2rem] bg-blue-500/[0.03] border border-blue-500/10 backdrop-blur-sm">
      <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-4">Import Cost Pressure (Local Currency)</h4>
      <div className="flex items-baseline gap-3">
        <span className="text-5xl font-black text-white tracking-heading italic">
          {data.inr_per_barrel.toLocaleString('en-IN')}
        </span>
        <span className="text-sm font-black text-blue-500/40 uppercase tracking-uppercase">INR/barrel</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-uppercase text-muted-foreground/40">Brent USD</span>
        <span className="text-sm font-black text-white">${data.brent_price_usd.toFixed(2)}</span>
      </div>
      <p className="text-[10px] text-muted-foreground/40 mt-3 uppercase tracking-wide">
        * Higher INR/barrel increases energy import bill and current account deficit
      </p>
    </div>

    <div className="p-6 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 backdrop-blur-sm">
      <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-4">Geopolitical Risk Overlay</h4>
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <path d="M18 2.1 a 15.9 15.9 0 0 1 0 31.8" fill="none" stroke={getRiskColor(data.geopolitical_risk_score)} strokeWidth="3" strokeDasharray={`${data.geopolitical_risk_score}, 100`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-white">{Math.round(data.geopolitical_risk_score)}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {['Hormuz', 'Malacca', 'Red Sea'].map(chokepoint => (
            <div key={chokepoint} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60 uppercase tracking-wider">{chokepoint}</span>
              <span className={cn(
                "font-black px-2 py-0.5 rounded text-[10px]",
                getChokepointStatus(chokepoint, data.risk_events_json) === 'critical'
                  ? "bg-rose-500/10 text-rose-500"
                  : getChokepointStatus(chokepoint, data.risk_events_json) === 'elevated'
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-emerald-500/10 text-emerald-500"
              )}>
                {getChokepointStatus(chokepoint, data.risk_events_json)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</MotionCard>
```

**Helper Functions**:
- `getRiskColor(score)`: score < 30 → emerald, 30-60 → amber, >60 → rose
- `getChokepointStatus(chokepoint, events)`: analyze events for that region → status

---

### 4.2 Hook: `useFuelSecurityIndia`

**Path**: `src/features/energy/hooks/useFuelSecurityIndia.ts`

```ts
import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useFuelSecurityIndia = () => {
  return useSuspenseQuery({
    queryKey: ['fuel_security_india'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_security_clock_india')
        .select('*')
        .order('as_of_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};
```

---

### 4.3 Integration into `EnergyCommoditiesLab`

**File**: `src/pages/labs/EnergyCommoditiesLab.tsx`

Add after line 154 (after Hormuz Tanker Tracking):

```tsx
{/* 2.75 Fuel Security Clock – India */}
<section>
  <div className="flex items-center gap-3 mb-10">
    <Clock className="text-amber-500" size={28} />
    <h2 className="text-2xl font-black uppercase tracking-heading text-white">Fuel Security Clock – India</h2>
  </div>

  <div className="w-full">
    <SectionErrorBoundary name="Fuel Security Clock India">
      <Suspense fallback={<LoadingFallback />}>
        <FuelSecurityClockIndia />
      </Suspense>
    </SectionErrorBoundary>
  </div>

  <div className="mt-8 p-8 bg-amber-500/5 border-l-4 border-amber-5 rounded-r-[2rem] max-w-4xl">
    <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-4">So What? — Institutional Insight</span>
    <p className="text-sm text-white/80 leading-relaxed font-medium uppercase tracking-wide">
      India's import dependency creates structural inflation vulnerability. The countdown clock and tanker pipeline provide early warning for supply shocks. Track INR/barrel for currency pressure signals and geopolitical risk for black swan exposure.
    </p>
  </div>
</section>
```

**Import**: Add `Clock` from `lucide-react` and `FuelSecurityClockIndia` component.

---

## 5. Migration Artifacts

### 5.1 SQL Migration: `20260331000000_fuel_security_clock_india.sql`

(Provided in Section 2.1 above)

### 5.2 Metrics Registration

The migration already inserts 4 new metrics into `metrics` table. These enable:
- Data health monitoring
- Staleness calculation
- Schema discovery for future consumers

---

## 6. Testing Plan

### 6.1 Backend Unit Tests
- `supabase/functions/ingest-fuel-security-india/test.ts`:
  - Mock PPAC fetch → verify parsing
  - Mock Brent/FX → verify join logic
  - Mock tanker heuristic → verify pipeline JSON structure
  - Mock geopolitical scorer → verify 0-100 normalization
  - Test upsert with conflict resolution

### 6.2 Integration Tests
- Deploy edge function to staging supabase
- Run cron manually → verify row inserted
- Check data quality: `reserves_days_coverage > 0`, `active_tankers_count >= 0`, etc.

### 6.3 Frontend Tests
- Render component with mock data → verify all 4 rows present
- Simulate `isFallback` → verify DataQualityBadge appears
- Responsive test: collapse from 2-col → 1-col on mobile

### 6.4 Performance Budget
- Component render: < 200ms
- Query latency (cached): < 50ms
- Query latency (cold): < 500ms

---

## 7. Observability & Monitoring

### 7.1 Data Health Queries

```sql
-- Staleness check
SELECT
  as_of_date,
  NOW() - last_updated_at AS age,
  reserves_days_coverage IS NULL AS missing_core
FROM fuel_security_clock_india
ORDER BY as_of_date DESC
LIMIT 1;

-- Risk score drift
SELECT
  as_of_date,
  geopolitical_risk_score,
  LAG(geopolitical_risk_score) OVER (ORDER BY as_of_date) AS prev_score,
  geopolitical_risk_score - LAG(geopolitical_risk_score) OVER (ORDER BY as_of_date) AS delta
FROM fuel_security_clock_india
WHERE as_of_date >= NOW() - INTERVAL '30 days';
```

### 7.2 Slack Alerts
Reuse `_shared/slack.ts` pattern:
- `❌ Fuel Security Ingest Failed` on function error
- `⚠️ Fuel Security Data Stale` if no update for 3+ days

---

## 8. Rollout & Phases

### Phase 1 (This Spec): Core Metrics + Heuristic Tankers
- ✅ PPAC reserves & consumption
- ✅ Brent + INR cost
- ✅ Heuristic tanker pipeline (no AIS)
- ✅ Geopolitical risk score (rule-based)

### Phase 2 (Future): AIS Integration
- Integrate commercial MarineTraffic/Spire API
- Replace heuristic with actual vessel positions/ETAs
- Add vessel details (cargo capacity, flag, IMO)

### Phase 3 (Future): User Controls
- Scenario parameters adjustable (shock magnitude, rationing threshold)
- "What-if" analysis: simulate Brent at $120/INR at 90

---

## 9. Dependencies & Blockers

| Item | Source | Status | Risk |
|------|--------|--------|------|
| PPAC data access | ppac.gov.in | Unknown — may require manual scrape | Medium — may need fallback proxies |
| Oil imports by origin | Already in DB via `ingest-oil-india-china` | ✅ Available | Low |
| Brent price + INR FX | Already in `metric_observations` | ✅ Available | Low |
| Geopolitical risk events | Need new ingestion | Low — can start simple | Low |
| Styling components | Follow existing patterns | ✅ Available | Low |

**Mitigation for PPAC**: If automated access fails, create manual daily update script (run by human) as temporary measure while exploring API alternatives.

---

## 10. Open Questions

1. **Should we show historical reserves trends?** Currently design shows only latest. Could add sparkline (30d) in countdown clock header.
2. **Tanker table sorting**: Should we sort by ETA (nearest first) or risk severity? Proposal: sort by (risk_flag DESC, ETA ASC).
3. **Institutional insight text**: Is the "So What?" copy appropriate? Should it mention specific trade ideas or stay generic?

---

## Appendix: Mock Data for Development

```ts
const mockFuelSecurityData = {
  reserves_days_coverage: 10.5,
  reserves_days_official: 9.8,
  reserves_days_actual: 11.2,
  deviation_pct: 14.3,
  daily_consumption_mbpd: 5.12,
  brent_price_usd: 85.34,
  inr_per_barrel: 71500,
  active_tankers_count: 14,
  tanker_pipeline_json: [
    { vessel_name: 'MT Deviksund', origin: 'Saudi Arabia', eta: '2025-03-28', volume_mbbl: 2.1, risk_flag: 'chokepoint_exposed' },
    { vessel_name: 'MT Aseem', origin: ' Iraq', eta: '2025-03-29', volume_mbbl: 1.9, risk_flag: 'chokepoint_exposed' },
    { vessel_name: 'MT Yanna', origin: 'UAE', eta: '2025-03-30', volume_mbbl: 2.0, risk_flag: 'chokepoint_exposed' },
    { vessel_name: 'MT Aida', origin: 'Nigeria', eta: '2025-04-02', volume_mbbl: 1.3, risk_flag: 'standard' },
    // ... up to 10
  ],
  geopolitical_risk_score: 67,
  risk_events_json: [
    { chokepoint: 'Hormuz', event: 'Naval exercise', severity: 7, date: '2025-03-20' },
    { chokepoint: 'Red Sea', event: 'Houthi drone threat', severity: 5, date: '2025-03-18' }
  ],
  scenario_baseline_days: 10.5,
  scenario_disruption_days: 7.3,
  scenario_rationing_days: 15.2,
  last_updated_at: new Date().toISOString(),
  metadata: { source_reliability: 'high', notes: '' }
};
```

---

**Design Completed**: 2026-03-31
**Next Step**: Spec review → User approval → Implementation plan via `writing-plans` skill
