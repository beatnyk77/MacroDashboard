# Design Spec: Macro Benchmarks & Historical Precedents Engine

**Date:** 2026-09-08  
**Status:** Approved  
**Author:** Pair Programming (Antigravity & User)  
**Target:** GraphiQuestor Macro Intelligence Terminal

---

## 1. Executive Summary & Objective

In macro intelligence, isolated telemetry values lack actionable context without structural relativization. "US Net Liquidity is $5.9T" or "India Credit Growth is 14.2%" gain their true institutional utility when contextualized along two dimensions:
1. **Historical Precedents (Analogs):** How does current trajectory compare to canonical historical stress episodes aligned at shock onset ($T=0$)?
2. **Cross-Country / Peer Benchmarks:** Where does an economy's metric sit relative to cohort peers (G7, BRICS, EM medians and deciles)?

In accordance with GraphiQuestor's core philosophy (*"Observe structural reality. Do not forecast"*), this functionality provides strictly factual, verifiable comparative telemetry with zero black-box forecasting or speculative extrapolations.

---

## 2. Architecture & Design

The solution follows a **Hybrid UX Pattern**:
1. **Glanceable Telemetry Badges:** Micro-badges embedded directly within `MetricCard` for immediate macro relativization in the main terminal.
2. **Thematic Comparative Lab (`/labs/macro-precedents`):** A dedicated institutional research workspace allowing multi-metric precedent comparison, normalized $T=0$ trajectory overlays, and peer cohort distributions.

### Data Flow

```
Supabase / metric_observations 
  → useMetricHistory & useLatestMetric
    → precedentsConfig.ts (Deterministic Curated Episodes Registry)
      → useHistoricalPrecedents (Normalizes timestamps to T=0 offset days)
        → useMacroBenchmarks (Computes peer percentiles, medians, z-scores)
          ├─► MetricCard Badges (PrecedentChip, BenchmarkBadge)
          └─► /labs/macro-precedents (Normalized Overlay Charts & Peer Matrix)
```

---

## 3. Data Model & Configuration

### A. Curated Precedent Registry (`src/config/precedentsConfig.ts`)

```typescript
export interface MacroPrecedent {
  id: string;
  name: string;
  shortLabel: string;
  tZeroDate: string; // The anchor event (e.g. Rate hike shock, Lehman collapse, etc.)
  startDate: string; // T - 90d
  endDate: string;   // T + 365d (or relevant horizon)
  summary: string;
  structuralDivergence: string; // Crucial: why today is different
  tags: ('liquidity-shock' | 'sovereign-stress' | 'fx-defense' | 'inflation-surge' | 'commodity-supercycle')[];
  applicableMetrics: string[]; // Metric IDs supported for direct comparison
}
```

**Initial Canonical Episodes:**
1. **2013 Taper Tantrum** (`2013-05-22` Bernanke speech)
   - Relevant for: US 10Y yields, DXY, EM FX, India RBI FX reserves.
2. **2008 Great Financial Crisis** (`2008-09-15` Lehman filing)
   - Relevant for: Net liquidity, corporate credit spreads, gold/copper ratios.
3. **2017–2019 Fed Quantitative Tightening & Repo Spike** (`2017-10-01` QT start)
   - Relevant for: US Fed balance sheet runoff, bank reserves, money market spreads.
4. **2021–2022 Inflation & Rapid Rate Tightening** (`2022-03-16` First Fed hike)
   - Relevant for: 10Y-2Y yield curve, energy price transmission, real rates.

### B. Peer Cohorts (`src/config/benchmarksConfig.ts`)
* Cohorts: `G7 + EU`, `BRICS`, `EM Asia`, `All G20`.
* Metrics supported for peer benchmarking:
  * Debt-to-GDP (%)
  * Real Policy Rate (Nominal minus CPI)
  * FX Reserve Import Cover (months)
  * Sovereign 10Y Yield Spread vs US Treasuries
  * Current Account Balance (% of GDP)

---

## 4. UI Components

### 1. `PrecedentBadge` & `BenchmarkBadge` in `MetricCard.tsx`
* **Placement:** Positioned alongside the existing σ (Z-score) chip and Provenance badge in the card footer/meta row.
* **Format:**
  * Precedent: `[Precedent: 2013 Taper Tantrum]` → Tooltip displays correlation/distance and link to lab.
  * Benchmark: `[G20: Top 15%]` → Tooltip displays cohort median comparison.
* **Link:** Clicking badge opens `/labs/macro-precedents?metric={metricId}&precedent={precedentId}`.

### 2. Dedicated Lab: `/labs/macro-precedents` (`src/pages/labs/MacroPrecedentsLab.tsx`)
* **Header & Metric Selector:** Choose target metric (e.g. US Net Liquidity, India FX Reserves, US 10Y Yield).
* **Normalized $T=0$ Trajectory Chart:**
  * Primary Series: Current cycle aligned from current shock start date to date.
  * Overlay Series (Dashed): Historical analog episode(s) aligned at their respective $T=0$.
  * Synchronized tooltip displaying delta from $T=0$ in elapsed trading days.
* **Precedent Context Accordion / Card:**
  * What triggered the historical precedent.
  * Observed transmission mechanism during that episode.
  * Key structural differences between that era and the current macro regime.
* **Cross-Country Cohort Distribution Matrix:**
  * Box-plot or ranked bar chart showing where India, China, US, and peers rank against the G20 median.

---

## 5. Navigation & Routing

1. Route added in `src/App.tsx`:
   * `/labs/macro-precedents` -> `MacroPrecedentsLab`
2. Sidebar nav item in `src/layout/GlobalLayout.tsx`:
   * ID: `macro-precedents`, Label: `Precedents & Benchmarks`, Icon: `History` / `GitCompare`, Group: `RESEARCH` / `THEMATIC LABS`.

---

## 6. Non-Functional Requirements & Guardrails

1. **No Data Fabrication:** If metric history does not extend to an older episode (e.g. pre-2005 for high-frequency Indian series), show an explicit "Historical data unavailable for this window" notice rather than interpolation.
2. **Performance:** Computation of $T=0$ alignment and percentile ranks happens client-side in pure helper utilities using Memoization (`useMemo`). Zero database migrations or extra Edge Function infrastructure required.
3. **Accessibility & SEO:** Full SEO metadata, canonical URLs, and `ChartAccessibleTranscript` for terminal chart readers.
