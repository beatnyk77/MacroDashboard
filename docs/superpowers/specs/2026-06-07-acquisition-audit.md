# GraphiQuestor — Acquisition-Grade UI/UX Audit
**Date:** 2026-06-07  
**Auditor:** Claude Code  
**Audit basis:** Full codebase review (src/, layout, components, hooks, theme, routes)

---

## CODEBASE REALITY CHECK (Pre-Audit)

Before scoring, what actually exists vs. what the brief assumed:

| Claim | Reality |
|---|---|
| Command Palette needs to be built | ✅ Already exists — `cmdk` library, Cmd+K wired in GlobalLayout |
| 12+ nav items | 19 nav items, flat, no visual grouping |
| India page needs design | Exists at `/intel/india` with 10+ lazy-loaded sections |
| API docs exist | `/api-docs` is a 2.5KB stub |
| No src/constants/ | Confirmed — does not exist |
| No src/config/ | Confirmed — does not exist |
| Theme system exists | Yes — MUI dark theme in `src/theme.ts` + Tailwind terminal palette |

---

## PART 1: THE 90-SECOND ACQUISITION DEMO FLOW

### The Scene
A Zerodha or Dhan CPO opens their laptop. You have 90 seconds before they decide whether to stay in the room.

### The Script

**0–10s: The Opening Frame**
> "This is GraphiQuestor. It is not a charting tool. It is a macro observatory."

Load the homepage (`/`). Point to the header immediately:
- The **regime badge** pulsing in the top bar — this is a live signal, not a label
- The real-time clock showing UTC synchronized time
- The subtitle: *"High-Frequency Liquidity & Sovereign Stress Telemetry"*

**10–25s: The Data Moat Statement**
> "Bloomberg shows you the same data as everyone else. GraphiQuestor shows you what that data *means* through a specific intellectual lens — Gromen's fiscal dominance thesis, Gave's multipolar capital flows, Middelkoop's gold-as-monetary-anchor framework."

Scroll to the **Daily Macro Brief panel** (TodaysBriefPanel). Point to the GQSignalBadge (amber).
> "That amber badge means this is GQ synthesis — not a data pass-through. This is interpretation."

**25–40s: India Depth Proof**
> "India is where we have no competitor. Go to `/intel/india`."

- Point to the **8 signal cards** at the top — each links to a specific, anchor-able section
- Click **Credit Cycle** → scrolls to IndiaCreditCycleClock
> "The India Credit Cycle Clock tracks the credit-to-deposit ratio inflection in real time. No one else computes this composite for free."
- Point to **RBI FX Defense Monitor**
> "The RBI intervention posture — buy, sell, or neutral — derived from reserve drawdown velocity and forward book estimates. This would cost you $300/month on CEIC."

**40–55s: The Moat Is Proprietary Computation**
Navigate to `/methods/india-credit-cycle-clock`
> "Every composite signal has a methodology page. Central bank staff can verify the formula. That's the credibility layer Bloomberg doesn't give you."

Navigate quickly to `/labs/de-dollarization-gold`
> "De-dollarization composite signal. Central bank gold buying velocity, BRICS settlement share, petrodollar recycling stress — all in one view."

**55–75s: The Embed Argument**
Open browser DevTools, paste `?embed=true` onto any URL
> "Every page is iframe-embeddable. Your institutional portal or research tab — drop in any panel. The chrome disappears, the data stays."

Navigate to `/api-docs`
> "We expose 270+ metrics via API. Your quant desk queries directly. Your product team embeds the viz. White-label is a config file change."

**75–90s: The Close**
Back to homepage. Point to the left sidebar (TerminalSidebar).
> "50+ routes. 12 thematic labs. 90 data hooks. India, China, US, Africa — all live, all sourced, all methodology-documented. This is what you put on your institutional research tab with your logo."

---

**Critical gap this demo exposes:** The `/api-docs` page needs to exist properly before you run this demo. Currently it is a 2.5KB stub. Fix this before any acquisition conversation.

---

## PART 2: NAVIGATION ARCHITECTURE REDESIGN

### Current State Friction Map

The 19 flat nav items have three structural problems:

1. **No intent-to-section mapping.** "Morning Brief," "Regime Digest," "Weekly Narrative" are all time-based content but appear scattered among analytical labs.
2. **Inconsistent iconography.** Globe icon appears 4 times (China, India, Trade Intelligence, Africa, BRICS Trade). The visual alphabet breaks.
3. **No "depth signal."** A first-time institutional user cannot tell from the nav whether GraphiQuestor is a single-page dashboard or a 50-route product.

### Intent Friction Analysis

**INTENT A: "What is the macro regime right now?"**
Current path: Load `/` → scan DailyMacroPanel → find regime badge → click through to `/macro-brief` for today's brief. 3 clicks, 2 scrolls.  
The regime is visible in the header badge and in the Terminal homepage, but it is not the **first thing** above the fold. The DailyMacroPanel is below the header, but the RegimeAnchor component sits mid-page.  
**Current friction: 5/10.** The answer exists but is not the loudest signal.  
**Target: 2/10.** Regime score should be the first rendered element — even before the page header.

**INTENT B: "What is the India macro signal today?"**
Current path: Find "India Macro Pulse" in nav (item 8 of 19) → `/intel/india` → 8 signal cards visible above fold. 1 click, 0 scrolls to overview.  
**Current friction: 2/10.** This is actually good. India is reachable in 1 click.  
**Target: 1/10.** India should have a nav badge showing "live" or the current India macro score.

**INTENT C: "De-dollarization trend — where is it going?"**
Current path: Find "De-Dollarization & Gold" in nav (item 13 of 19) → `/labs/de-dollarization-gold` → data visible. But the narrative framing (the methodology guide at `/methods/de-dollarization-guide`) is a separate nav item (item 12).  
The user wanting trend context must navigate twice — data and narrative are split.  
**Current friction: 6/10.** Data exists but narrative-to-data connection is broken.  
**Target: 2/10.** The lab page should embed a "Framework" collapsed section linking to the methodology.

### Proposed Navigation Structure

Replace the 19-item flat list with **4 grouped sections** in TerminalSidebar, with visual group dividers:

```
GROUP 1: INTELLIGENCE (time-based outputs)
  ├── Morning Brief             /macro-brief         [Newspaper icon]
  ├── Weekly Narrative          /weekly-narrative    [FileText icon]
  ├── Regime Digest             /regime-digest       [Activity icon]
  └── Global Macro Overview     /                    [Radio icon]

GROUP 2: REGIONAL TERMINALS
  ├── India Macro Terminal  ●   /intel/india         [custom India flag icon or MapPin]
  ├── China Macro Pulse         /intel/china         [TrendingUp icon]
  ├── US Fiscal Pulse           /labs/us-macro-fiscal [BarChart2 icon]
  └── Africa Macro Pulse        /labs/africa-macro   [Globe icon - unique per group]

GROUP 3: THEMATIC LABS
  ├── De-Dollarization & Gold   /labs/de-dollarization-gold    [Anchor icon]
  ├── Energy & Commodities      /labs/energy-commodities       [Zap icon]
  ├── Sovereign Stress          /labs/sovereign-stress         [ShieldAlert icon]
  ├── Trade Intelligence        /trade                         [Package icon - NOT Globe]
  ├── Central Bank Gold         /labs/central-bank-gold-purchases [Coins icon]
  ├── BRICS Settlement          /labs/brics-trade-settlement   [ArrowLeftRight icon]
  ├── US Treasury Holdings      /labs/us-treasury-foreign-holdings [Landmark icon]
  └── Petrodollar Decay         /labs/petrodollar-decay-indicators [TrendingDown icon]

GROUP 4: METHODS & TOOLS
  ├── De-Dollarization Guide    /methods/de-dollarization-guide
  ├── All Thematic Labs         /labs
  └── Countries Index           /countries
```

The `●` indicator on India Macro Terminal signals a live composite score (India Macro Score, 0-100) that updates daily — this is the badge that makes a CIO glance at the nav and immediately see "India: 67 (Expansion)."

### Command Palette Enhancement Spec

The Command Palette (`src/components/CommandPalette/CommandPalette.tsx`) **already exists** using `cmdk`. Current limitations:
- No fuzzy search ranking (cmdk does substring match only)
- No metric values shown in results
- No search across 270+ metric IDs
- No recent items / favorites
- No HS code search
- No country page search

**Enhanced Command Palette Specification:**

```tsx
// Search index structure — built once on mount, cached in module scope
interface SearchItem {
  id: string;
  label: string;
  category: 'page' | 'metric' | 'country' | 'glossary' | 'digest' | 'hscode';
  path: string;
  value?: string;           // last known value for metrics (e.g. "7.25%")
  delta?: string;           // e.g. "+0.25%"
  deltaDir?: 'up' | 'down' | 'neutral';
  keywords?: string[];      // aliases for fuzzy matching
}
```

**Result rendering by category:**

| Category | Icon | Left | Right |
|---|---|---|---|
| page | Globe/FileText | Page name + section | — |
| metric | Activity | Metric name | Last value + delta chip |
| country | MapPin | Country name + ISO | Sovereign stress score |
| glossary | Book | Term | Brief definition (1 line) |
| digest | Calendar | "Weekly · 2026-06-02" | Regime label |
| hscode | Package | HS code + description | Export opportunity score |

**Keyboard handling (add to existing):**
- `↑↓` to navigate (already in cmdk)
- `Enter` to navigate to result path
- `Ctrl+Enter` to open in new tab
- `Tab` to cycle through category filters
- `/` as alternative trigger from homepage (vi-style)

**Implementation approach:**
```tsx
// Add to CommandPalette.tsx — lazy-loaded search index
import Fuse from 'fuse.js'; // npm install fuse.js (~24KB)

const fuse = new Fuse(searchIndex, {
  keys: ['label', 'keywords'],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
});
```

**Search index construction** (add to `src/lib/commandSearchIndex.ts`):
- Static entries: all nav pages, all glossary terms, all countries from `src/lib/countries.ts`
- Dynamic entries: metric labels from `src/lib/metricLabels.ts` (270+ entries) — these are static labels but can show last value from useLatestMetric if already cached
- HS codes: top 500 codes pre-indexed (full HS code search stays sub-100ms client-side)

**Category filter chips** (appear above results when typing):
`All` `Pages` `Metrics` `Countries` `Glossary` `Briefs`

---

## PART 3: INDIA TERMINAL REDESIGN SPEC

### Gap Table — All 25 India Variables

| Variable | Present | Depth | Visual Quality | Component |
|---|---|---|---|---|
| RBI Policy Rate + forward guidance signal | Y | 3 | 3 | IndiaMacroPulseSection |
| CPI breakdown (headline/core/food/fuel) | Y | 4 | 3 | IndiaInflationPulseMonitor |
| WPI trend | Partial | 2 | 2 | IndiaInflationPulseMonitor (headline only) |
| GST collections (MoM trend, YoY) | Y | 3 | 3 | IndiaFiscalStressMonitor |
| FX Reserves (weekly RBI data) | Y | 4 | 4 | RBIFXDefenseMonitor |
| RBI Intervention Signal (buy/sell/neutral) | Y | 5 | 4 | RBIFXDefenseMonitor — proprietary |
| INR/USD with intervention overlay | Y | 4 | 4 | RBIFXDefenseMonitor |
| India 10Y G-Sec yield | Partial | 2 | 2 | IndiaMacroPulseSection (may be present) |
| India-US 10Y spread (carry signal) | **N** | — | — | — |
| Credit Growth YoY | Y | 4 | 4 | IndiaCreditCycleClock |
| Deposit Growth YoY | Y | 4 | 4 | IndiaCreditCycleClock |
| Credit-Deposit Ratio | Y | 5 | 5 | IndiaCreditCycleClock — proprietary |
| FII equity flows (monthly) | **N** | — | — | — |
| FDI flows (quarterly) | **N** | — | — | — |
| Manufacturing PMI | Y | 3 | 3 | IndiaMacroPulseSection |
| Services PMI | Partial | 2 | 2 | IndiaMacroPulseSection (may lack history) |
| IIP (Industrial Production) | **N** | — | — | — |
| India VIX | **N** | — | — | — |
| Current Account Balance | **N** | — | — | — |
| Trade Balance (monthly) | **N** | — | — | — |
| Naukri Job Index | Partial | 2 | 2 | May be in IndiaMacroPulseSection |
| India Sovereign Stress Score | Y | 4 | 3 | Computed by GQ composite |
| State-level fiscal data | Y | 5 | 4 | IndiaFiscalAllocationTracker + StateFiscalHeatmap — unique |
| Monsoon/rainfall deviation | **N** | — | — | — |
| India corporate earnings cycle signal | **N** | — | — | — |

**Missing variables — data sources and priority:**

| Variable | Source | API? | Complexity | CIO Impact |
|---|---|---|---|---|
| India-US 10Y spread | RBI DBIE + FRED | Free | S | Very high — carry trade signal |
| FII equity flows | SEBI/NSDL (monthly) | Scraped/PDF | M | High — institutional flow tracker |
| FDI flows | DIPP/RBI (quarterly) | RBI DBIE | M | Medium — structural allocation |
| IIP | MOSPI | Free API | S | High — activity proxy |
| India VIX | NSE (scrape) | Limited | M | Medium — risk overlay |
| Current Account Balance | RBI DBIE | Free | S | High — external vulnerability |
| Trade Balance | DGCI&S / MOSPI | Free | S | High — monthly cadence |
| Monsoon (IMD) | IMD public data | Free | M | High — agri/CPI lead indicator |
| Earnings cycle | BSE bulk data | Free | L | Medium — equity overlay |

**Priority closing order:**
1. India-US 10Y spread (S, very high CIO impact, data already in pipeline from FRED+RBI)
2. Current Account + Trade Balance (S/M, external sector panel — rounds out the picture)
3. IIP (S, free MOSPI API, fills the "growth & activity" gap)
4. FII flows (M, SEBI data, most-requested institutional signal)
5. Monsoon deviation (M, IMD data, lead indicator for agri CPI)

### The /intel/india Page Architecture Redesign

**CURRENT ARCHITECTURE PROBLEM:** The India page is a linear scroll of 10+ lazy-loaded sections. A CIO opening it at 8am on mobile cannot get the macro answer without scrolling. There is no single "India Macro Score" as a headline signal.

**PROPOSED ARCHITECTURE:**

```
┌────────────────────────────────────────────────────────┐
│  TOP BAR (sticky, 60px)                                 │
│  India Macro Score: 67/100  │  Regime: EXPANSION  │    │
│  RBI: 6.50% (hold)  │  Next MPC: Jul 9  │  INR: 83.4  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  SIGNAL CARDS ROW (8 cards, scrollable on mobile)       │
│  [existing 8 cards — keep, these work well]            │
└────────────────────────────────────────────────────────┘

FOLD 1: 4-PANEL GRID (above fold on 1440px desktop)
┌──────────────┬──────────────┬──────────────┬──────────┐
│  MONETARY    │  GROWTH &    │  EXTERNAL    │ LIQUIDITY│
│  POLICY      │  ACTIVITY    │  SECTOR      │          │
│              │              │              │          │
│  RBI Rate    │  GDP (latest)│  FX Reserves │  CD Ratio│
│  Real Rate   │  PMI Mfg     │  INR/USD     │  Credit  │
│  Next MPC    │  PMI Svc     │  CAB         │  Growth  │
│  Stance      │  IIP YoY     │  Trade Bal   │  GST Coll│
└──────────────┴──────────────┴──────────────┴──────────┘

FOLD 2: INDIA CREDIT CYCLE CLOCK (full-width, 600px height)
→ This is the unique visual. Hero treatment, not buried.
→ Add: "Used by 2,400+ institutional subscribers" (social proof)

FOLD 3: INDIA INFLATION MATRIX (full-width)
→ CPI headline/core/food/fuel in a 2×2 panel
→ WPI trend as sparkline comparison
→ Add: "RBI target range" band overlay on CPI chart

FOLD 4: EXTERNAL SECTOR + FLOWS (full-width)
→ New: India-US 10Y spread with carry signal
→ Existing: RBI FX Defense Monitor
→ New: FII equity flows (monthly bar chart)
→ New: Current Account Balance trend

FOLD 5: FISCAL HEALTH (full-width)
→ Existing: IndiaFiscalStressMonitor
→ Existing: IndiaFiscalAllocationTracker

FOLD 6: INDIA MACRO DIVERGENCE (full-width, NEW)
→ India GDP growth vs G20 median
→ India inflation vs G20 median
→ India credit growth vs EM peer median
→ Framing: "Where India's cycle diverges from global consensus"

FOLD 7: TRADE INTELLIGENCE — INDIA VIEW (full-width)
→ Embed from /trade filtered to India
→ Top export markets, top import dependencies, supply chain stress

FOLD 8: STATE FISCAL HEATMAP (full-width)
→ Existing: StateFiscalHeatmap — keep
→ Existing: IndiaDigitizationPremiumMonitor — keep

FOLD 9: MONEY MARKET (collapsible, for institutional depth)
→ Existing: RBIMoneyMarketMonitor
```

**The India Macro Score (top bar)** — needs a new composite:
- Component weights: Monetary stance (20%) + Growth momentum (20%) + External sector (20%) + Liquidity (20%) + Fiscal health (20%)
- Output: 0–100 score, regime label (Expansion/Neutral/Tightening/Stress)
- Hook: `useIndiaMacroScore()` returning `{ score, regime, components, asOf }`
- DB: Store in `metric_observations` with metric_id `india_macro_composite`
- Compute: New edge function `compute-india-macro-score`

**The White-Label Pitch:**
> "India Macro Terminal, powered by [Dhan / Zerodha / Angel One]"
> Every element on `/intel/india` is componentized and embed-ready. The platform acquirer injects their `brandConfig`, the GQSignalBadge amber becomes their brand color, the methodology pages carry their logo. The India Credit Cycle Clock becomes a signature feature of their institutional product — not ours.

---

## PART 4: VISUAL SYSTEM SPECIFICATION

### Number Hierarchy — Tailwind Classes

**Level 0 — THE SIGNAL NUMBER** (regime score, India macro score, Net Liquidity Z-score)
```tsx
// Usage: one per page maximum. The number a CIO reads from 2 meters away.
className="text-[64px] md:text-[80px] font-black text-white tabular-nums tracking-tighter leading-none"
// Animate only on value change — use framer-motion AnimatePresence with number ticker
// Never pulse/breathe — movement must be data-driven, not decorative
```

**Level 1 — PRIMARY METRICS** (10Y yield, DXY, Gold, INR/USD, CPI)
```tsx
// Usage: 3-6 per page. Numbers a CIO checks without hunting.
className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight leading-none"
// Always accompanied by Level 2 delta
```

**Level 2 — SUPPORTING METRICS** (MoM delta, YoY change, percentile rank, Z-score)
```tsx
// Usage: paired with Level 1.
// Up: className="text-sm font-bold text-emerald-400 tabular-nums"
// Down: className="text-sm font-bold text-rose-400 tabular-nums"
// Neutral: className="text-sm font-bold text-slate-400 tabular-nums"
// Arrow prefix: ↑ ↓ → (Unicode, not icons — faster render, no import cost)
```

**Level 3 — REFERENCE DATA** (timestamps, source attribution, methodology links)
```tsx
// Usage: metadata only. Never competes for attention.
className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-[0.08em]"
// Always right-aligned or bottom-aligned within its card
```

### Color Semantic System — `src/constants/semanticColors.ts`

```typescript
// src/constants/semanticColors.ts
// Single source of truth for all semantic color meaning in GraphiQuestor.
// Import this instead of hardcoding Tailwind classes with meaning.

export const SemanticColors = {

  // ── Regime Classification ──────────────────────────────────────
  // Applied to regime badges, header accent, and chart background tints
  regime: {
    expansion:    { text: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    recovery:     { text: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
    neutral:      { text: 'text-blue-400',     bg: 'bg-blue-500/10',     border: 'border-blue-500/20',    dot: 'bg-blue-500' },
    tightening:   { text: 'text-rose-400',     bg: 'bg-rose-500/10',     border: 'border-rose-500/20',    dot: 'bg-rose-500' },
    slowdown:     { text: 'text-amber-400',    bg: 'bg-amber-500/10',    border: 'border-amber-500/20',   dot: 'bg-amber-500' },
    stagflation:  { text: 'text-orange-400',   bg: 'bg-orange-500/10',   border: 'border-orange-500/20',  dot: 'bg-orange-500' },
    stress:       { text: 'text-rose-500',     bg: 'bg-rose-500/15',     border: 'border-rose-500/30',    dot: 'bg-rose-600' },
    deflation:    { text: 'text-purple-400',   bg: 'bg-purple-500/10',   border: 'border-purple-500/20',  dot: 'bg-purple-500' },
  },

  // ── Metric Direction ────────────────────────────────────────────
  direction: {
    up:      'text-emerald-400',
    down:    'text-rose-400',
    neutral: 'text-slate-400',
    // High-severity alerts override direction colors:
    alert:   'text-rose-500',
    warning: 'text-amber-400',
  },

  // ── Data Freshness ──────────────────────────────────────────────
  staleness: {
    fresh:      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Live'        },
    lagged:     { text: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Lagged'      },
    very_lagged:{ text: 'text-rose-400',   bg: 'bg-rose-500/10',   label: 'Stale'       },
    offline:    { text: 'text-slate-500',  bg: 'bg-slate-500/10',  label: 'Unavailable' },
  },

  // ── GQ Signal (proprietary synthesis — always amber) ───────────
  gqSignal: {
    text:   'text-amber-400',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/30',
    pulse:  'animate-pulse', // only on newly-updated signals (< 1hr)
  },

  // ── Metric Alert Thresholds ──────────────────────────────────────
  // Used by MetricCard and useLatestMetric to auto-color values
  // Each metric_id maps to thresholds for red/amber/green
  thresholds: {
    // US metrics
    'us_10y_yield':        { low: 3.5, mid: 4.5, high: 5.5 },   // high = alert
    'us_cpi_yoy':          { low: 1.5, mid: 3.0, high: 4.5 },
    'us_fed_funds_rate':   { low: 0.5, mid: 4.0, high: 5.5 },
    'us_gdp_growth_yoy':   { low: 0,   mid: 1.5, high: 3.0 },    // low = concern
    // India metrics
    'india_cpi_yoy':       { low: 2.0, mid: 5.0, high: 6.5 },
    'india_rbi_rate':      { low: 4.0, mid: 6.0, high: 7.5 },
    'india_fx_reserves_bn':{ low: 550, mid: 620, high: 700 },     // low = concern
    'india_cd_ratio':      { low: 65,  mid: 78,  high: 85  },    // high = stress
    // Sovereign stress (0–100 composite)
    'sovereign_stress_score': { low: 30, mid: 60, high: 80 },
  },

  // ── Chart Color Palette ──────────────────────────────────────────
  // Consistent across all Recharts instances
  chart: {
    primary:    '#3b82f6',   // blue-500
    secondary:  '#10b981',   // emerald-500
    tertiary:   '#f59e0b',   // amber-500
    quaternary: '#8b5cf6',   // violet-500
    danger:     '#f43f5e',   // rose-500
    muted:      '#475569',   // slate-600
    gridLine:   '#1e293b',   // slate-800
    axisText:   '#64748b',   // slate-500
    tooltip:    '#0f172a',   // slate-950
    series: [
      '#3b82f6', '#10b981', '#f59e0b',
      '#8b5cf6', '#f43f5e', '#06b6d4',
      '#84cc16', '#f97316',
    ],
  },
} as const;

// Convenience accessor for regime coloring
export function getRegimeColors(regimeLabel: string) {
  const label = regimeLabel.toLowerCase();
  if (label.includes('expansion') || label.includes('recovery'))
    return SemanticColors.regime.expansion;
  if (label.includes('stagflation'))
    return SemanticColors.regime.stagflation;
  if (label.includes('tightening'))
    return SemanticColors.regime.tightening;
  if (label.includes('slowdown'))
    return SemanticColors.regime.slowdown;
  if (label.includes('stress'))
    return SemanticColors.regime.stress;
  if (label.includes('deflation'))
    return SemanticColors.regime.deflation;
  return SemanticColors.regime.neutral;
}
```

### Chart Standard — `src/constants/chartDefaults.ts`

```typescript
// src/constants/chartDefaults.ts
// Default Recharts props applied globally to maintain visual grammar.

import { SemanticColors } from './semanticColors';

export const CHART_MARGIN = { top: 8, right: 16, bottom: 8, left: 0 };

export const DEFAULT_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '12px',
  fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
  color: '#f8fafc',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export const DEFAULT_CARTESIAN_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: SemanticColors.chart.gridLine,
  vertical: false,   // horizontal grid only — vertical grids are noise
};

export const DEFAULT_XAXIS_PROPS = {
  tick: { fill: SemanticColors.chart.axisText, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
  axisLine: { stroke: 'transparent' },
  tickLine: { stroke: 'transparent' },
};

export const DEFAULT_YAXIS_PROPS = {
  tick: { fill: SemanticColors.chart.axisText, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
  axisLine: { stroke: 'transparent' },
  tickLine: { stroke: 'transparent' },
  width: 48,
};

// Event annotation props (Fed decisions, RBI meetings, etc.)
export const EVENT_REFERENCE_LINE_PROPS = {
  stroke: SemanticColors.chart.muted,
  strokeDasharray: '4 4',
  strokeWidth: 1,
  label: {
    fontSize: 10,
    fill: SemanticColors.chart.axisText,
    fontFamily: 'IBM Plex Mono, monospace',
  },
};

// Sparkline (no axes, no tooltip) defaults
export const SPARKLINE_DEFAULTS = {
  dot: false,
  strokeWidth: 1.5,
  activeDot: false,
};
```

**Implementation sequence:**
1. Create `src/constants/semanticColors.ts` — zero breaking changes, additive
2. Create `src/constants/chartDefaults.ts` — additive
3. Migrate `GlobalLayout.tsx` regimeColorClass to use `getRegimeColors()` — 5-line change
4. Migrate `MetricCard` and `GQSignalBadge` to reference constants — reduces drift risk
5. Apply `DEFAULT_CARTESIAN_GRID_PROPS` to top 10 most-used charts — visual consistency pass

---

## PART 5: ACQUISITION READINESS REPORT

### White-Label Readiness Score: **4/10**

Hardcoded brand elements that must become config variables:

| Location | Hardcoded string | Impact |
|---|---|---|
| `GlobalLayout.tsx:103-106` | "Graphi**Questor**" — split-color wordmark | Must be brand name |
| `GlobalLayout.tsx:107` | "Macro Observatory · Not Sovereign AI" | Must be tagline |
| `Terminal.tsx:64` | "GraphiQuestor — Global Macro Intelligence Terminal" | SEO title |
| `SEOManager` calls (all pages) | `graphiquestor.com` domain | Must be configurable |
| `GQSignalBadge` | "GQ" prefix on all synthesis badges | Must be brand prefix |
| `IntelIndiaPage.tsx:92-99` | `https://graphiquestor.com/intel/india` | All schema.org URLs |
| `InstitutionalFooter` | Brand name, legal disclaimers | Must be configurable |
| `src/theme.ts` | Color values are fine (already variables) | No change needed |

**`src/config/brandConfig.ts` spec:**

```typescript
// src/config/brandConfig.ts
// All brand variables in one file. In white-label builds, swap this file.
// The rest of the codebase imports from here — never hardcodes brand strings.

export const BrandConfig = {
  name: 'GraphiQuestor',
  shortName: 'GQ',
  namePrefix: 'Graphi',         // for split-color wordmark
  nameSuffix: 'Questor',
  tagline: 'Macro Observatory · Not Sovereign AI',
  domain: 'graphiquestor.com',
  baseUrl: 'https://graphiquestor.com',
  signalBadgePrefix: 'GQ',      // appears as "GQ Synthesis" on amber badges
  supportEmail: 'research@graphiquestor.com',
  institutionalEmail: 'institutional@graphiquestor.com',
  colors: {
    primary: '#3b82f6',         // overrideable per white-label
    accent: '#f59e0b',          // amber — GQ signal color
  },
  seo: {
    siteName: 'GraphiQuestor',
    titleTemplate: '%s | GraphiQuestor',
    defaultDescription: 'Institutional macro intelligence terminal...',
  },
  features: {
    showSubscribeCTA: true,
    showAPIAccess: true,
    showInstitutionalInquiry: true,
    showBlog: true,
  },
} as const;

export type BrandConfigType = typeof BrandConfig;
```

White-label gap: once BrandConfig is wired, a Dhan white-label build changes 1 file and gets `Dhan Macro Terminal` everywhere — GQSignalBadge becomes `DM Synthesis`, schema.org URLs resolve to `dhan.co`, colors match their palette.

### Top 5 Embed-Ready Components

**1. IndiaCreditCycleClock**
- File: `src/features/dashboard/components/rows/IndiaCreditCycleClock.tsx`
- Props needed: none (self-contained)
- Data fetch: `useIndiaCreditCycle()` — internal, could be externalized via prop `creditCycleData?: CreditCycleData`
- iframe-embeddable: Yes — works with `?embed=true`
- What Zerodha calls it: "India Credit Cycle Signal" — embedded in their macro research tab
- Whitelist priority: **#1** — most unique, most defensible

**2. RBIFXDefenseMonitor**
- File: `src/features/dashboard/components/rows/RBIFXDefenseMonitor.tsx`
- Props needed: none (self-contained)
- Data: `useRBIFXDefense()` — could accept `initialData` for SSR pre-loading
- iframe-embeddable: Yes
- What Zerodha calls it: "RBI Currency Defense Dashboard" — relevant to FX traders
- Whitelist priority: **#2**

**3. RegimeAnchor / DailyMacroPanel**
- File: `src/features/dashboard/components/RegimeAnchor.tsx` + `src/features/daily-macro/components/DailyMacroPanel.tsx`
- Props: could accept `regimeData` override
- iframe-embeddable: Yes with `?embed=true`
- What Dhan calls it: "Daily Macro Signal" — embedded in their morning brief feature
- Whitelist priority: **#3** — the regime signal is the hook

**4. SovereignRiskMatrix (G20)**
- File: `src/features/dashboard/components/sections/SovereignRiskMatrix.tsx`
- Data: `useG20SovereignMatrix()` — fetchable via API endpoint
- iframe-embeddable: Yes
- What Angel One calls it: "G20 Sovereign Stress Matrix" — institutional product overlay
- Whitelist priority: **#4**

**5. USDebtMaturityWall**
- File: `src/components/USDebtMaturityWall.tsx`
- Data: internal hook, but data is static/slow-moving enough to SSR
- iframe-embeddable: Yes — already appears to be standalone
- What a Gulf SWF calls it: "US Sovereign Debt Rollover Risk Monitor"
- Whitelist priority: **#5**

### API Surface Assessment

Current endpoints (from `/api-docs` stub):
- `GET /metrics` — 270+ metrics
- `GET /observations` — time-series by metric_id
- `GET /events` — macro events

**What's missing for a platform integration:**

| Endpoint | Priority | Use Case |
|---|---|---|
| `GET /metrics?country=IN` | High | Filter 270 metrics to India-only |
| `GET /composite-scores` | High | Expose regime score, India macro score, sovereign stress |
| `GET /regime/current` | Critical | Single-endpoint regime state for real-time widgets |
| `GET /india/summary` | High | India macro summary in one call — for Zerodha integration |
| `GET /briefs/latest` | Medium | Latest weekly narrative for content embedding |
| `GET /countries/{iso}/stress` | Medium | Sovereign stress score per country |
| WebSocket `/ws/regime` | Future | Real-time regime change events |

The current stub needs a full OpenAPI 3.0 spec. This is the single most important acquisition-readiness item after brandConfig.

### The Data Moat Inventory

GraphiQuestor's proprietary data moat includes the following **unique signals** that cost an estimated **$2,400–$4,200/month** to replicate via commercial providers:

| Signal | Commercial Equivalent | Est. Cost/Month | GQ Status |
|---|---|---|---|
| India Credit Cycle Clock (composite) | CEIC India + analyst time | $300 + $500 | Proprietary formula |
| RBI Intervention Posture Signal | Refinitiv FX Monitor | $400 | Proprietary classification |
| India State Fiscal Heatmap (26 states) | CMIE Prowess + analyst | $800 | Unique aggregation |
| India Digitization Premium Monitor (UPI+GST+DPI) | No direct equivalent | ~$600 | First-of-kind composite |
| RBI Money Market Terminal (daily) | Bloomberg WIRP | $200 | Free RBI data, novel viz |
| Fed Debt Monetization Monitor | Bloomberg custom | $300 | Proprietary computation |
| Net Liquidity Z-Score (GQ formula) | None — no direct equivalent | $500 | GQ original formula |
| G20 Sovereign Stress Matrix (composite scores) | S&P Sovereign Risk | $600 | Proprietary weighting |
| De-Dollarization Composite Signal | Haver Analytics | $400 | GQ formula on public data |
| BRICS Trade Settlement Tracker | No free equivalent | $300 | First-mover |

**Total commercial replication cost: ~$4,400/month**

Additionally, the **intellectual framework** (Gromen + Gave + Middelkoop + Rickards lens applied to data presentation) is not replicable by a data vendor — it is editorial IP that differentiates GraphiQuestor from Bloomberg in the same way The Economist differentiates from Reuters.

---

## PART 6: THE IMPLEMENTATION ROADMAP

### TRACK A — "CIO Morning Workflow" (< 4 hours each)

**A1: Regime Color Propagation**
- What: When regime = Tightening, the header Activity icon and regime badge propagate rose-500. When Expansion, emerald-500. Currently hardcoded in GlobalLayout with partial implementation.
- CIO: "The header tells me the regime before I read anything."
- Banker: "Consistent visual coding matches our internal risk dashboards."
- Acquirer: "The visual language is systematic, not ad hoc."
- Files: `src/layout/GlobalLayout.tsx:59-65`, `src/constants/semanticColors.ts` (new)
- Effort: 2 hours
- **Claude Code prompt:** "In src/layout/GlobalLayout.tsx, refactor the regimeColorClass memo (currently lines 59-65) to use a new getRegimeColors() function from src/constants/semanticColors.ts (create this file). The function should map regime label strings to Tailwind color classes covering: expansion/recovery → emerald-400, tightening → rose-400, slowdown/stagflation → amber-400, deflation → purple-400, neutral/unknown → blue-400. Apply this to both the Activity icon in the header and the regime badge. Also create src/constants/semanticColors.ts with the full SemanticColors object as specified in the design doc. Run npm run lint && npm run build."

**A2: Command Palette Fuzzy Search + Metric Values**
- What: Add Fuse.js to the existing CommandPalette. Extend the search index to include all 270 metric labels from metricLabels.ts with last-known cached values. Add category filter chips.
- CIO: "I type 'India CPI' and see the value immediately — no navigation."
- Banker: "Can search glossary terms inline."
- Acquirer: "The command palette is the product's power-user interface."
- Files: `src/components/CommandPalette/CommandPalette.tsx`, new `src/lib/commandSearchIndex.ts`
- Effort: 3 hours
- **Claude Code prompt:** "Enhance the existing CommandPalette at src/components/CommandPalette/CommandPalette.tsx. 1) Install fuse.js (npm install fuse.js). 2) Create src/lib/commandSearchIndex.ts that exports a static search index array of SearchItems (type: page|metric|country|glossary), built from: terminalNavItems in GlobalLayout, all entries in src/lib/metricLabels.ts (type='metric'), and all entries in src/lib/countries.ts (type='country'). 3) In CommandPalette, replace the current cmdk built-in filtering with a Fuse.js instance initialized with the search index (threshold: 0.35, keys: ['label', 'keywords']). 4) For metric results, show the label on the left and a placeholder '--' on the right (live values are a future enhancement). 5) Add 5 category filter chips (All/Pages/Metrics/Countries/Glossary) above the results using the existing command-palette.css for styling. Run npm run lint && npm run build."

**A3: India Macro Score — Composite Top Bar**
- What: Add a sticky top bar to IntelIndiaPage showing India Macro Score (0-100), current regime label, RBI rate, next MPC date, and INR/USD. Score is a simple weighted average of existing hook outputs.
- CIO: "I know the India macro state before I scroll."
- Banker: "Single composite metric I can cite in briefings."
- Acquirer: "This is the 'hero number' that makes the India Terminal a standalone product."
- Files: `src/pages/IntelIndiaPage.tsx`, new `src/hooks/useIndiaMacroScore.ts`
- Effort: 3–4 hours
- **Claude Code prompt:** "Add an India Macro Score composite to the India Intelligence page. 1) Create src/hooks/useIndiaMacroScore.ts. It should import useIndiaMacro, useIndiaCreditCycle, useIndiaFiscalStress, useIndiaLiquidity, and useIndiaInflation. Compute a simple 0-100 score as a weighted average of available sub-scores (use 20% weight each; if a sub-hook is loading, exclude it from the average and renormalize). Return { score: number, regime: 'Expansion'|'Neutral'|'Tightening'|'Stress', components: Record<string,number>, isLoading: boolean }. 2) In src/pages/IntelIndiaPage.tsx, add a sticky bar (position: sticky, top: 64px, z-index: 1200) immediately below the page header that shows: 'India Macro Score: [score]/100', current regime label (colored per SemanticColors), and 3 quick-stat chips (RBI Rate, Next MPC, INR/USD from useIndiaMacro). Use the terminal aesthetic: bg-slate-950/90 backdrop-blur, border-b border-white/10. Run npm run lint && npm run build."

**A4: Navigation Grouping with Visual Dividers**
- What: Add group labels and visual dividers to the TerminalSidebar nav items. Group into: Intelligence (4 items), Regional Terminals (4 items), Thematic Labs (8 items), Methods (remaining). Fix icon duplication — replace 4 Globe icons with distinct icons.
- CIO: "I can find Trade Intelligence without scanning 19 items."
- Banker: "Grouped nav signals product depth — not a single-page tool."
- Acquirer: "Clean architecture visible in the nav itself."
- Files: `src/layout/GlobalLayout.tsx` (terminalNavItems), `src/components/TerminalSidebar.tsx`
- Effort: 2 hours
- **Claude Code prompt:** "Restructure the terminalNavItems in src/layout/GlobalLayout.tsx into 4 groups: INTELLIGENCE [morning-brief, weekly-narrative, regime-digest, observatory], REGIONAL [india, china, us-macro, africa], THEMATIC LABS [de-dollarization, energy-commodities, sovereign, trade-intelligence, central-bank-gold, brics-trade, us-treasury-holdings, petrodollar-decay], METHODS [de-dollarization-guide, labs]. Add a 'group' field to each nav item with the group name. In src/components/TerminalSidebar.tsx, render group headers as 10px uppercase text-muted-foreground/40 tracking-widest labels, separated by 1px bg-white/5 dividers. Replace duplicate Globe icons: Trade Intelligence → Package icon, Africa → (keep Globe, it's the only one in its group), BRICS Trade → ArrowLeftRight icon, Countries → Map icon. Run npm run lint && npm run build."

**A5: Chart Event Annotations (Fed/RBI Decision Markers)**
- What: Add `useEventsMarkers` data to the top 6 charts as vertical ReferenceLine annotations (Fed decisions, RBI MPC dates). Currently useEventsMarkers hook exists but is not wired to charts.
- CIO: "I can see 'what happened here' without switching windows."
- Banker: "Primary source events contextualize the data."
- Acquirer: "No competitor chart has this context layer at this price point."
- Files: Charts in `src/features/dashboard/components/` that use Recharts, `src/constants/chartDefaults.ts` (new)
- Effort: 3 hours
- **Claude Code prompt:** "Create src/constants/chartDefaults.ts with the full chart defaults spec (DEFAULT_CARTESIAN_GRID_PROPS, DEFAULT_XAXIS_PROPS, DEFAULT_YAXIS_PROPS, EVENT_REFERENCE_LINE_PROPS as defined in the design doc). Then wire event markers into 3 charts: 1) NetLiquidityRow — add Fed FOMC dates as vertical ReferenceLine with EVENT_REFERENCE_LINE_PROPS. 2) RBIFXDefenseMonitor — add RBI MPC dates. 3) IndiaInflationPulseMonitor — add RBI rate decisions. Source events from the useEventsMarkers hook (already exists). Filter to relevant event types per chart (FOMC for Fed charts, RBI_MPC for India charts). Run npm run lint && npm run build."

**A6: API Docs Page — Full OpenAPI Stub**
- What: Replace the 2.5KB stub at `/api-docs` with a complete interactive API documentation page covering all endpoints, with request/response examples, metric_id reference, and authentication guide.
- CIO: "I can send this to my quant analyst to integrate."
- Banker: "Data provenance documented to institutional standard."
- Acquirer: "The API surface is visible and real — not a stub."
- Files: `src/pages/APIDocsPage.tsx`
- Effort: 3 hours
- **Claude Code prompt:** "Rewrite src/pages/APIDocsPage.tsx with complete API documentation. Cover these endpoints: GET /api/v1/metrics (with query params: country, category, limit), GET /api/v1/observations (params: metric_id, from, to, limit), GET /api/v1/events (params: from, to, type), GET /api/v1/regime/current, GET /api/v1/composite-scores. For each endpoint, show: description, authentication header (Bearer token), curl example, response JSON example, and parameter table. Add a 'Metric ID Reference' section that renders a searchable table of the top 50 metric IDs from src/lib/metricLabels.ts with their descriptions. Use the terminal dark aesthetic matching the rest of the app. No external API call needed — all docs are static. Run npm run lint && npm run build."

---

### TRACK B — "India Terminal Ownership" (1-3 days each)

**B1: India-US 10Y Spread + External Sector Panel** (1 day)
- What: Add a new "External Sector" section to IntelIndiaPage showing India 10Y G-Sec yield, India-US 10Y spread (carry signal), Current Account Balance trend, and Trade Balance.
- CIO: "The carry signal is the first thing I check for India allocation."
- Data: India 10Y from RBI DBIE (already in pipeline?), US 10Y from FRED (already in pipeline), CAB from RBI DBIE quarterly
- **Claude Code prompt:** "Create a new IndiaExternalSectorPanel component at src/features/dashboard/components/rows/IndiaExternalSectorPanel.tsx. It should show 4 metrics in a 2×2 grid: India 10Y G-Sec Yield (useLatestMetric('india_gsec_10y')), India-US 10Y Spread computed as india_gsec_10y minus us_10y_yield (both from useLatestMetric), Current Account Balance in $bn (useLatestMetric('india_current_account_usd_bn')), and Trade Balance MoM (useLatestMetric('india_trade_balance_usd_bn')). For the spread, add a carry signal label: spread > 4% = 'Carry Attractive' (emerald), 3-4% = 'Neutral' (blue), < 3% = 'Carry Compressed' (amber). Wire into IntelIndiaPage.tsx between the RBIFXDefenseMonitor and IndiaFiscalStressMonitor sections. Add anchor id='external'. If metrics show no data, render DataProvenanceBadge with source 'RBI DBIE' and a 'Data pending ingestion' note. Run npm run lint && npm run build."

**B2: FII Equity Flows Section** (1-2 days)
- What: Monthly FII equity inflow/outflow bar chart from SEBI/NSDL data, with 12-month trailing trend and cumulative YTD flow.
- CIO: "This is the institutional flow signal that moves India equities."
- Data: SEBI/NSDL publishes monthly FII data (free, requires scraping or API call)
- **Claude Code prompt:** "Create a new edge function at supabase/functions/ingest-fii-flows/index.ts that fetches monthly FII equity flow data from the SEBI NSDL website (https://www.fpi.nsdl.co.in/web/Reports/Latest.aspx — check the page for download links; alternatively use RBI DBIE source). Store results in metric_observations with metric_id='india_fii_equity_net_usd_mn'. Then create src/features/dashboard/components/rows/IndiaFIIFlowsMonitor.tsx that shows: a monthly bar chart (positive bars emerald, negative bars rose) for the trailing 12 months, YTD cumulative flow chip, and a 3-month trend label (Buying/Selling/Neutral). Wire the component into IntelIndiaPage.tsx in the External Sector section. Run npm run lint && npm run build."

**B3: IIP + PMI Composite Activity Section** (1 day)
- What: Industrial Production Index (IIP) monthly YoY chart alongside Manufacturing and Services PMI. Creates a unified "Growth & Activity" panel.
- Data: MOSPI publishes IIP (free), PMI already exists in pipeline
- **Claude Code prompt:** "Create src/features/dashboard/components/rows/IndiaActivityCompositePanel.tsx. It should show three metrics side-by-side on desktop (stacked on mobile): IIP YoY% (useLatestMetric('india_iip_yoy') with 12-month Recharts line chart), Manufacturing PMI (useLatestMetric('india_pmi_manufacturing') with level context: >50 = expansion emerald, <50 = contraction rose), Services PMI (useLatestMetric('india_pmi_services') same treatment). Add a composite 'Activity Signal' that averages normalized IIP + Manufacturing PMI + Services PMI into a 0-100 score with label. Wire into IntelIndiaPage.tsx as the 'Growth & Activity' section between the IndiaMacroPulseSection and IndiaInflationPulseMonitor. Run npm run lint && npm run build."

**B4: India vs G20 Macro Divergence Panel** (1-2 days)
- What: 4-metric comparison showing India's position vs G20 median on GDP growth, inflation, credit growth, and current account. This is the "why India is different" panel.
- **Claude Code prompt:** "Create src/features/dashboard/components/sections/IndiaMacroDivergencePanel.tsx. It shows 4 divergence metrics in a 2×2 grid, each as a gauge/comparison bar: India GDP growth vs G20 median (from useMajorEconomies hook), India CPI vs G20 median, India credit growth vs EM peer average, India CAB vs G20 median. Each cell shows India value vs peer value with a delta and a one-line interpretation ('India growing 2.3pp faster than G20 median'). Use the GQSignalBadge (amber) on the interpretations to mark them as GQ synthesis. Add section header 'India Macro Divergence — Where India's Cycle Breaks From Consensus'. Wire into IntelIndiaPage.tsx near the bottom before the trade section. Add anchor id='divergence'. Run npm run lint && npm run build."

**B5: Monsoon Deviation Signal** (1-2 days)
- What: IMD seasonal rainfall vs normal, shown as a deviation chart. Lead indicator for agri CPI (kharif crop proxy).
- Data: IMD publishes weekly all-India rainfall data (free, scraping required for automation)
- **Claude Code prompt:** "Create a simple IndiaMonsoonsDeviation widget at src/features/dashboard/components/cards/IndiaMonsoonCard.tsx. It shows: current-year cumulative rainfall vs LPA (Long Period Average) as a single percentage deviation metric (useLatestMetric('india_monsoon_deviation_pct')), a status label (Above Normal/Normal/Below Normal/Deficient) colored emerald/blue/amber/rose respectively, and a 1-sentence GQSignal interpretation: 'Above-normal monsoon → downward pressure on food CPI in Q3.' Wire into the IndiaInflationPulseMonitor section as a sidebar card. Source: IMD publishes weekly district/zone/all-India data at imd.gov.in — create ingest-imd-monsoon edge function. Run npm run lint && npm run build."

---

### TRACK C — "Acquisition Readiness" (1-5 days each)

**C1: brandConfig.ts — White-Label Foundation** (1 day)
- What: Create src/config/brandConfig.ts and migrate all hardcoded "GraphiQuestor" strings to import from it.
- Acquirer: "I can white-label this in 1 hour."
- Files: GlobalLayout, Terminal, SEOManager calls (all pages), GQSignalBadge, InstitutionalFooter
- **Claude Code prompt:** "Create src/config/brandConfig.ts with the full BrandConfig object as specified in the design doc. Then do a global migration: 1) In src/layout/GlobalLayout.tsx, replace the hardcoded 'Graphi'/'Questor' split wordmark and the 'Macro Observatory · Not Sovereign AI' tagline with BrandConfig.namePrefix, BrandConfig.nameSuffix, and BrandConfig.tagline. 2) In src/components/GQSignalBadge.tsx, replace the hardcoded 'GQ' badge text with BrandConfig.shortName. 3) In src/components/InstitutionalFooter.tsx, replace hardcoded brand name with BrandConfig.name. 4) In src/components/SEOManager.tsx, use BrandConfig.seo.siteName and BrandConfig.seo.titleTemplate. Do NOT change any other hardcoded strings in this session — only the 4 files listed. Run npm run lint && npm run build. Report which strings were migrated."

**C2: Embed Component API — Top 3 Components** (2-3 days)
- What: Make IndiaCreditCycleClock, RBIFXDefenseMonitor, and RegimeAnchor fully embeddable with external data injection props (so embedders can provide their own data source).
- **Claude Code prompt:** "Make 3 GraphiQuestor components iframe-embeddable with optional external data injection. For each component, add an optional `data` prop so embedders can bypass the internal hook and provide pre-fetched data. 1) src/features/dashboard/components/rows/IndiaCreditCycleClock.tsx — add prop `creditCycleData?: CreditCycleSnapshot` (use the type from useIndiaCreditCycle return type); if provided, skip the hook call. 2) src/features/dashboard/components/rows/RBIFXDefenseMonitor.tsx — same pattern with `fxDefenseData?: RBIFXSnapshot`. 3) src/features/dashboard/components/RegimeAnchor.tsx — add `regimeData?: RegimeSnapshot`. None of these components should break when the prop is not provided (hooks remain the default). Create an embed route at /embed/credit-cycle, /embed/rbi-fx, /embed/regime that renders each component in isolation with ?embed=true already applied. Wire in src/App.tsx. Run npm run lint && npm run build."

**C3: OpenAPI Spec + API Surface Completeness** (3-5 days)
- What: Write a complete OpenAPI 3.0 spec for the GraphiQuestor API. Deploy 3 new Supabase edge functions that expose the missing endpoints (/regime/current, /composite-scores, /india/summary).
- **Claude Code prompt:** "Create 3 new Supabase edge functions. 1) supabase/functions/api-regime-current/index.ts — returns the latest regime row from the regime_observations table (or vw_latest_metrics filtered to regime_label, regime_score, regime_confidence). Returns JSON: { regime_label, regime_score, confidence_interval, as_of, methodology_url }. 2) supabase/functions/api-composite-scores/index.ts — returns the latest GQ composite scores: Net Liquidity Z-Score, India Macro Score, Sovereign Stress (G20 average), De-Dollarization Index. Query metric_observations for metric_ids: gq_net_liquidity_zscore, india_macro_composite, g20_sovereign_stress_avg, gq_dedollarization_index. 3) supabase/functions/api-india-summary/index.ts — returns a summary of key India metrics in one response (20 metric_ids from useIndiaMacro). Run supabase functions deploy for all 3. Update src/pages/APIDocsPage.tsx to document these new endpoints. Run npm run lint && npm run build."

**C4: Component Story Isolation + Demo Mode** (2-3 days)
- What: Add a `/demo` route that renders GraphiQuestor's 5 most impressive components with sample/seeded data — no live API calls required. This is what you show a CPO when the internet is spotty at a boardroom meeting.
- **Claude Code prompt:** "Create src/pages/DemoPage.tsx (named export DemoPage) that renders 5 key components with seeded static data (no network calls). The components to render: IndiaCreditCycleClock, RBIFXDefenseMonitor, SovereignRiskMatrix (or G20SovereignMatrix), USTreasuryDemandGauge, and DailyMacroPanel. Create src/lib/demoData.ts with realistic static data matching the shape of each component's data prop (use real-looking values, not Lorem Ipsum — e.g. CD ratio at 79.3, FX reserves at $648bn). Each component on the DemoPage uses the optional `data` prop (created in C2) to inject demoData, bypassing all hooks. Add the route /demo to src/App.tsx. The page should have a header 'GraphiQuestor — Interactive Demo' and a note 'Static demonstration data — connect API for live signals.' Run npm run lint && npm run build."

---

## PART 7: THE ACQUISITION PITCH PARAGRAPH

> GraphiQuestor is the only free institutional macro intelligence terminal that combines a proprietary India Credit Cycle Clock, RBI intervention posture signal, and G20 sovereign stress matrix with the intellectual framework of the leading fiscal dominance and multipolar capital flow analysts — creating a data moat estimated at $4,400/month to replicate commercially. Its architecture is embed-ready (every component accepts external data injection), white-label-ready (brand is a single config file), and API-backed (270+ live macro metrics with time-series), making it immediately deployable as a branded institutional intelligence layer for Dhan, Zerodha, or Angel One's HNI research product — without rebuilding anything. The India macro terminal alone, white-labeled as "Dhan Macro Intelligence," would differentiate their institutional offering from every domestic competitor that relies on Bloomberg pass-through data.

---

## APPENDIX: AUDIT SCORES

| Dimension | Current Score | Target Score | Gap |
|---|---|---|---|
| First impression / demo moment | 5/10 | 8/10 | Need tour flow + regime as hero |
| Navigation friction (Intent A: Regime) | 5/10 | 9/10 | Regime must be above-fold hero |
| Navigation friction (Intent B: India) | 8/10 | 9/10 | Small — add India score badge |
| Navigation friction (Intent C: De-doll.) | 4/10 | 8/10 | Split data/narrative needs fixing |
| India terminal completeness | 6/10 | 9/10 | 9 variables missing |
| Visual hierarchy consistency | 4/10 | 8/10 | No codified constants |
| White-label readiness | 4/10 | 9/10 | brandConfig.ts needed |
| API surface | 3/10 | 8/10 | Stub needs real spec |
| Embed readiness | 5/10 | 8/10 | Data injection props missing |
| Command palette power | 5/10 | 9/10 | Fuzzy search + metric values |

**Overall acquisition readiness: 4.9/10 → target 8.5/10**  
Gap closes entirely within Track A + C items (estimated 15–20 engineer-days or 15-20 Claude Code sessions).
