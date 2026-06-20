# TradeFx — Currency Intelligence: Agent Implementation Prompt
## GraphiQuestor.com | Claude Code Sonnet 4.6 / Grok Composer 2.5 Fast

---

## CONTEXT LOCK — READ BEFORE ANYTHING ELSE

You are an elite senior full-stack engineer working inside the **GraphiQuestor.com** production codebase.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Supabase (Postgres + Edge Functions + pg_cron) + Recharts + React Router v6 + TanStack Query

**Non-negotiables — violation of any of these is a build failure:**
1. Institutional, calm authority tone — Bloomberg Terminal meets Bridgewater research. Zero hype, zero marketing language.
2. Maximum reuse of existing patterns: hooks, components, `SEOManager`, `FreshnessChip`, TanStack Query, `_shared` utilities. Inspect the codebase before inventing anything new.
3. Every batch must pass `npm run lint && npm run build` with **zero new warnings**. Report results after each batch.
4. Zero new heavy dependencies. No new npm packages unless strictly unavoidable and explicitly justified.
5. SEO-correct everywhere: semantic `<h1>`/`<h2>`/`<h3>` hierarchy, canonical tags via `SEOManager`, `prerender`-friendly static shells, JSON-LD structured data on key pages.
6. Educational disclaimers — non-dismissible, prominent, on every strategy and payoff section. Never use "recommended for you." Always "archetypes commonly considered by market participants in this regime."
7. One-man AI operations friendly: clean, maintainable, well-commented increments only. No clever hacks.

**Design system (already established — reuse exactly):**
- Background: `#0D0D0D` (dark terminal)
- Gold accent: `#B8860B`
- Font stack: IBM Plex Sans, IBM Plex Mono
- Borders: 1px solid borders, no shadows
- Card style: glass-morphic dark panels, consistent with existing modules
- Colors: semantic green for positive P&L, red for negative, amber for warning/regime flags

---

## TASK: Implement TradeFx — Currency Intelligence

### Feature URL: `/trade-fx`

A new standalone route integrated into the existing navigation under Trade Intelligence. This feature serves Indian exporters and importers with institutional-grade currency intelligence, regime-aware hedging strategy frameworks, live payoff diagrams, and natural affiliate lead capture.

**Business objective:** Organic SEO flywheel targeting the 800K+ Indian exporter/importer universe. Affiliate lead referral to partner banks (HDFC, Kotak, ICICI forex desks), Skydo, Karbon, and structured product platforms.

---

## PHASE 1: PLANNING (DO THIS FIRST — WAIT FOR CONFIRMATION BEFORE CODING)

Before writing a single line of implementation code, produce a structured plan covering all of the following sections. Be precise and specific to the GraphiQuestor codebase you are working in.

### 1.1 Codebase Audit
- List every existing hook, utility, and component you will reuse
- Identify the existing `subscribers` table schema and the pattern used for lead capture elsewhere
- Identify how `SEOManager` is currently called and what props it accepts
- Identify how `FreshnessChip` works
- Identify how existing TanStack Query patterns are structured (`useQuery`, `queryKey` conventions)
- Identify the existing Trade Intelligence route and nav entry point

### 1.2 Files to Create
Provide the exact file tree for all new files with one-line descriptions:
```
src/
  features/
    trade-fx/
      TradeFxPage.tsx          — top-level route component, SEOManager, canonical
      components/
        RoleToggle.tsx          — Exporter | Importer | Balanced toggle
        CurrencyPairSelector.tsx — USD/INR primary, EUR/INR, CNY/INR
        RateRegimeChart.tsx     — Recharts ComposedChart: spot line + vol area + event markers
        MacroDriversPanel.tsx   — 3–5 regime cards with FreshnessChip
        ExposureSimulator.tsx   — Notional + ΔRate inputs → P&L outputs
        HedgingStrategyMatrix.tsx — 5-archetype regime-filtered cards
        CollarPayoffDiagram.tsx — Recharts LineChart + sliders + metrics
        RiskOpportunityFlags.tsx — Green/amber/red role-aware callouts
        DisclaimerBanner.tsx    — Non-dismissible educational disclaimer
        AffiliateCTA.tsx        — Lead capture + partner referral
      lib/
        collarPayoff.ts         — Pure TS payoff calculation functions
        regimeEngine.ts         — Lightweight deterministic regime classification
        hedgingArchetypes.ts    — Strategy archetype config + regime filter logic
        tradeFxTypes.ts         — All TypeScript interfaces
      hooks/
        useTradeFxData.ts       — Composes existing hooks; no new Edge Functions
      constants/
        currencyPairs.ts        — Pair definitions, pip values, display metadata
```

### 1.3 Files to Modify
- `src/router.tsx` (or equivalent) — add `/trade-fx` route
- `src/components/nav/` — add TradeFx nav entry under Trade Intelligence
- `supabase/migrations/` — add column extensions to `subscribers` table (if needed for lead capture — assess first)

### 1.4 TypeScript Interfaces (write these in full)

Produce the complete TypeScript interface definitions for:

```typescript
// tradeFxTypes.ts — write these in full, no stubs

type Role = 'exporter' | 'importer' | 'balanced';

type CurrencyPair = 'USD/INR' | 'EUR/INR' | 'CNY/INR';

type TimeHorizon = '1M' | '3M' | '6M' | '1Y' | 'YTD';

type VolatilityRegime = 'low' | 'moderate' | 'elevated' | 'high';

type MacroRegimeSignal = {
  source: string;          // 'india_pulse' | 'us_pulse' | 'dedol_lab' | 'commodities'
  label: string;           // Short display label
  sentiment: 'supportive' | 'neutral' | 'cautionary';
  detail: string;          // One sentence context
  freshness: string;       // ISO timestamp
};

type CollarPayoffPoint = {
  spotAtMaturity: number;
  unhedged: number;
  forwardHedge: number;
  zeroCollar: number;
};

type CollarParams = {
  currentSpot: number;
  forwardRate: number;
  floorStrike: number;     // Put strike (protection floor for exporter)
  capStrike: number;       // Call strike (upside cap for exporter)
  notionalFC: number;
  horizonDays: number;
};

type CollarMetrics = {
  protectedFloor: number;
  cappedAt: number;
  participationZone: [number, number];
  breakEvenVsForward: number;
};

type HedgingArchetype = {
  id: string;
  name: string;
  typicalRegimeFit: string;
  protectionLevel: 'high' | 'medium' | 'low';
  costDrag: 'lowest' | 'low' | 'moderate' | 'premium';
  upsideParticipation: 'full' | 'partial' | 'capped' | 'none';
  keyMacroTrigger: string;
  regimeFilter: (regime: VolatilityRegime, role: Role) => boolean;
  partnerCTA: string;
  partnerCTALabel: string;
};

type ExposureSimResult = {
  role: Role;
  notionalFC: number;
  deltaRatePct: number;
  deltaRateAbsolute: number;
  pnlINR: number;
  direction: 'gain' | 'loss' | 'neutral';
  regimeNote: string;
};
```

### 1.5 Pure Calculation Functions (write the signatures + docstrings)

```typescript
// collarPayoff.ts

/**
 * Generates data points for the collar payoff diagram.
 * Exporter perspective: long USD/INR (benefits from INR depreciation).
 * @param params CollarParams
 * @param steps Number of data points across spot range (default 100)
 * @returns CollarPayoffPoint[]
 */
export function generateCollarPayoffData(
  params: CollarParams,
  steps?: number
): CollarPayoffPoint[];

/**
 * Calculates summary metrics for the collar structure.
 */
export function calculateCollarMetrics(params: CollarParams): CollarMetrics;

/**
 * Calculates exposure impact for exporter and importer roles.
 * ΔP&L_Exporter = NotionalFC × ΔRate × (+1)
 * ΔP&L_Importer = NotionalFC × ΔRate × (-1)
 */
export function calculateExposureImpact(
  role: Role,
  notionalFC: number,
  currentSpot: number,
  deltaRatePct: number
): ExposureSimResult;
```

### 1.6 Regime Engine Logic (write the full deterministic rules)

The regime engine must be a pure function with no external dependencies. It takes existing macro signal data from the codebase and returns a `VolatilityRegime` and an array of `MacroRegimeSignal` objects. Write the full logic spec.

### 1.7 Data Flow Diagram (ASCII)

```
Existing hooks (India Pulse, US Pulse, DeDol Lab, Commodities)
         ↓
useTradeFxData.ts (composes, no new fetch)
         ↓
regimeEngine.ts (pure TS, deterministic)
         ↓
TradeFxPage.tsx (state: role, pair, horizon, notional)
    ↓         ↓          ↓             ↓           ↓
RateChart  MacroPanel  ExposureSim  HedgingMatrix  CollarDiagram
```

### 1.8 SEO & AEO Strategy

Provide the exact:
- Page `<title>` and meta `description`
- `<h1>`, `<h2>`, `<h3>` hierarchy for the page
- JSON-LD structured data type and key fields
- 5 primary target keyword clusters with search intent classification
- Canonical URL
- Internal linking plan (which existing pages to link to and from)

Target keywords to anchor around (write the full list):
1. "USD INR hedging strategy for exporters" (informational → commercial)
2. "zero cost collar USD INR" (commercial investigation)
3. "how to hedge forex exposure India" (informational)
4. "forward contract vs options for importers India" (informational)
5. "INR depreciation impact on exporters" (informational)
6. "currency risk management India SME" (informational → commercial)
7. "RBI intervention USD INR 2025 2026" (navigational/informational)
8. Programmatic variants: `[pair] hedging strategy [month] [year]`

### 1.9 AEO (Answer Engine Optimization) Strategy

This feature must be optimized for AI assistant citation, not just Google ranking. Provide:
- FAQ schema targets (5 questions with ideal answer format)
- How to structure the Hedging Strategy Matrix content so it's extractable by AI answer engines
- `speakable` schema consideration
- Where to place definitional anchors (glossary-style inline definitions for "zero-cost collar", "forward rate", "hedging", "notional", etc.)

### 1.10 Affiliate Lead Capture Design

**Do NOT create a new Supabase table.** Extend the existing `subscribers` table with the following columns (write the migration):

```sql
-- Proposed extension (confirm existing schema first)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS lead_type TEXT;
-- 'trade_fx_bank_referral' | 'trade_fx_skydo' | 'trade_fx_alert'
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS trade_role TEXT;
-- 'exporter' | 'importer' | 'balanced'
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS currency_pair TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS notional_range TEXT;
-- '<1Cr' | '1-5Cr' | '5-25Cr' | '>25Cr'
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS partner_preference TEXT;
-- 'hdfc' | 'kotak' | 'icici' | 'skydo' | 'karbon' | 'any'
```

The CTA flow: user fills in name + email + notional range + partner preference → insert into `subscribers` with `source = 'trade_fx'` → display confirmation + next steps. No new Edge Function needed for MVP (use existing insert pattern). Post-MVP: add a pg_cron trigger to notify partner CRM.

### 1.11 Effort Estimate

| Component | Estimated Effort | Risk |
|---|---|---|
| TradeFxPage + routing + nav | 1h | Low |
| RoleToggle + CurrencyPairSelector | 0.5h | Low |
| RateRegimeChart | 2h | Medium — needs event marker overlay |
| MacroDriversPanel | 1h | Low — reuses existing hooks |
| ExposureSimulator | 1.5h | Low — pure math |
| HedgingStrategyMatrix | 2h | Low — config-driven |
| CollarPayoffDiagram | 3h | Medium — slider + Recharts shading |
| RiskOpportunityFlags | 1h | Low |
| DisclaimerBanner | 0.5h | Low |
| AffiliateCTA + Supabase extend | 1.5h | Low |
| SEO/JSON-LD/canonical | 1h | Low |
| Lint + build + review | 1h | Low |
| **Total MVP** | **~15h** | |

### 1.12 Clarifying Questions (answer before coding)

Before proceeding to implementation, ask and answer:

1. Does `/trade-fx` live as a top-level route or nested under `/trade`?
2. Are there existing `useIndiaData`, `useUSData`, `useDeDolData` hooks? What do they return?
3. What is the exact existing `subscribers` table schema?
4. Is there an existing event/annotation system for chart markers, or should a static config be created?
5. Are there existing slider UI components in the design system, or should HTML `<input type="range">` be used with Tailwind styling?
6. What is the existing pattern for `AffiliateCTA` / lead capture (if any)?

---

## PHASE 2: IMPLEMENTATION (AFTER PLAN IS CONFIRMED)

Implement in the following strict batch order. After each batch, run `npm run lint && npm run build` and report results before proceeding.

---

### BATCH 1 — Foundation (Route + Types + Pure Logic)

**Files:**
- `src/features/trade-fx/lib/tradeFxTypes.ts`
- `src/features/trade-fx/lib/collarPayoff.ts`
- `src/features/trade-fx/lib/regimeEngine.ts`
- `src/features/trade-fx/lib/hedgingArchetypes.ts`
- `src/features/trade-fx/constants/currencyPairs.ts`
- Route registration in router
- Nav entry

**Acceptance criteria:**
- All TypeScript interfaces compile with zero errors
- `generateCollarPayoffData` returns correct shape: verify with unit-style console check
- `calculateExposureImpact` returns correct sign for exporter (positive when INR depreciates) and importer (negative when INR depreciates)
- `regimeEngine` returns deterministic output given same inputs
- Route `/trade-fx` renders without error (empty shell is fine)
- `npm run lint && npm run build` passes

---

### BATCH 2 — Page Shell + SEO + Disclaimer

**Files:**
- `src/features/trade-fx/TradeFxPage.tsx`
- `src/features/trade-fx/components/DisclaimerBanner.tsx`
- `src/features/trade-fx/hooks/useTradeFxData.ts`

**Requirements for TradeFxPage:**
```tsx
// SEOManager call must include:
<SEOManager
  title="USD/INR Currency Intelligence for Exporters & Importers | GraphiQuestor"
  description="Real-time USD/INR hedging analysis, zero-cost collar payoff diagrams, and regime-aware currency strategy frameworks for Indian exporters and importers."
  canonical="https://graphiquestor.com/trade-fx"
  jsonLd={tradeFxJsonLd}  // FinancialProduct or Dataset schema
/>

// Page h1:
<h1>TradeFx — Currency Intelligence</h1>
// Subheading as h2:
<h2>Regime-Aware Hedging Analysis for Indian Exporters & Importers</h2>
```

**DisclaimerBanner requirements:**
```tsx
// Must be:
// 1. Non-dismissible (no close button)
// 2. Visually prominent (amber border, not subtle)
// 3. Appear at top of page AND inline above every strategy/payoff section
// 4. Text (hardcoded):
const DISCLAIMER_TEXT = `This tool is for educational and informational purposes only. 
All calculations, strategy frameworks, and payoff diagrams are illustrative. 
Nothing on this page constitutes financial advice, a recommendation, or an offer 
to buy or sell any financial instrument. Consult your bank, treasury advisor, 
or authorised forex dealer before making any hedging or currency management decisions.`;
```

**useTradeFxData requirements:**
- Compose existing India Pulse, US Pulse, De-Dol Lab, Commodities hooks
- Return a unified `TradeFxData` object with regime signals
- No new fetch calls, no new Edge Functions
- Handle loading and error states from all composed hooks

**Acceptance criteria:**
- `/trade-fx` renders with proper SEO tags visible in document head
- DisclaimerBanner visible and non-dismissible
- `useTradeFxData` composes existing hooks without errors
- `npm run lint && npm run build` passes

---

### BATCH 3 — Controls + Rate Chart

**Files:**
- `src/features/trade-fx/components/RoleToggle.tsx`
- `src/features/trade-fx/components/CurrencyPairSelector.tsx`
- `src/features/trade-fx/components/RateRegimeChart.tsx`

**RoleToggle requirements:**
```tsx
// Three states: 'exporter' | 'importer' | 'balanced'
// Visual: segmented control (pill-style, matching existing toggle patterns)
// Default: 'balanced'
// Exporter active: gold accent
// Importer active: blue accent
// Keyboard accessible (arrow keys)
```

**CurrencyPairSelector requirements:**
```tsx
// Pairs: USD/INR (default), EUR/INR, CNY/INR
// Time horizons: 1M, 3M, 6M, 1Y, YTD
// Dropdown or tab-style selector (match existing patterns)
```

**RateRegimeChart requirements:**
```tsx
// Recharts ComposedChart
// Data: use static/mock USD/INR rate data for MVP (clearly labeled "Illustrative — replace with live feed post-MVP")
// Line: spot rate
// Area: implied volatility band (±1 std dev, using estimated vol proxy)
// Reference lines: key macro event dates from a static config
// Annotations: short text callouts at event markers
// Tooltip: spot rate + vol context + GraphiQuestor regime note
// Responsive: ResponsiveContainer width="100%"
// Colors: spot line = gold (#B8860B), vol band = subtle amber fill, event markers = white dashed
```

**Static macro events config (hardcode for MVP):**
```typescript
// src/features/trade-fx/constants/macroEvents.ts
export const MACRO_EVENTS = [
  { date: '2025-02-07', label: 'RBI MPC — rate hold', gqNote: 'RBI signals pause; INR steady on strong reserves' },
  { date: '2025-03-19', label: 'Fed FOMC', gqNote: 'Fed hold — DXY softer; exporters\' window widened' },
  { date: '2025-06-04', label: 'RBI MPC', gqNote: 'India reserves robust; RBI intervention bias supportive' },
  // Add 4–6 more recent events
];
```

**Acceptance criteria:**
- RoleToggle state changes propagate to parent correctly
- CurrencyPairSelector switches pair label correctly
- RateRegimeChart renders without Recharts errors
- Event markers visible at correct x-axis positions
- Responsive on mobile viewport
- `npm run lint && npm run build` passes

---

### BATCH 4 — Macro Drivers Panel + Exposure Simulator

**Files:**
- `src/features/trade-fx/components/MacroDriversPanel.tsx`
- `src/features/trade-fx/components/ExposureSimulator.tsx`

**MacroDriversPanel requirements:**
```tsx
// 3–5 compact signal cards, each showing:
// - Source label (India Pulse / US Pulse / De-Dol Lab / Commodities)
// - Sentiment badge (green = supportive, amber = neutral, red = cautionary)
// - One-sentence regime context
// - FreshnessChip using existing component
// - Link to relevant pulse section

// Example card content:
{
  source: 'India Pulse',
  label: 'Reserves & RBI Bias',
  sentiment: 'supportive',
  detail: 'India forex reserves robust at $680B+; RBI intervention bias supportive for USD exporters in current window.',
  link: '/india-macro',
}
```

**ExposureSimulator requirements:**
```tsx
// Inputs:
// - Notional (number input, labeled in FC currency, e.g., "USD amount")
// - Assumed INR move (range slider: –10% to +10%, step 0.5%)
// - Time horizon (inherited from parent selector)

// Outputs (two side-by-side cards):
// Exporter card:
//   ΔP&L = notionalFC × (deltaRatePct / 100) × currentSpot × (+1)
//   Color: green if positive (INR depreciation = gain), red if negative
//   Label: "If INR depreciates X%, your USD receivables gain ₹Y"

// Importer card:
//   ΔP&L = notionalFC × (deltaRatePct / 100) × currentSpot × (-1)
//   Color: green if positive, red if negative
//   Label: "If INR depreciates X%, your USD payables cost ₹Y more"

// Regime note below:
//   Pulled from regimeEngine output
//   Example: "Current low-volatility regime + RBI support = tactical hedging window open for exporters"

// Strong disclaimer inline:
//   "Illustrative calculation only. Not a forecast or advice."

// Number formatting: INR Crore/Lakh with proper formatting
// INR amounts: use Intl.NumberFormat('en-IN')
```

**Acceptance criteria:**
- Slider changes update P&L in real-time (no lag, pure client-side)
- Correct sign: +deltaRate → Exporter gains, Importer loses
- Number formatting is Indian (lakhs/crores, not millions)
- FreshnessChip renders on each MacroDrivers card
- `npm run lint && npm run build` passes

---

### BATCH 5 — Collar Payoff Diagram

**Files:**
- `src/features/trade-fx/components/CollarPayoffDiagram.tsx`
- (collarPayoff.ts already implemented in Batch 1 — use it here)

**CollarPayoffDiagram requirements:**

```tsx
// CHART SPEC:
// Type: Recharts ComposedChart (LineChart with ReferenceLine + ReferenceArea)
// X-axis: Spot rate at maturity (e.g., 80 to 90 for USD/INR)
// Y-axis: Effective realized rate for exporter (INR per USD received)
// Lines:
//   1. Unhedged — dashed white/gray line (45° through current spot)
//   2. Forward Hedge — solid blue line (horizontal at forward rate)
//   3. Zero-Cost Collar — solid gold (#B8860B) kinked line:
//      - Below floor strike: horizontal at floor (protected)
//      - Between floor and cap: follows spot (participation zone)
//      - Above cap: horizontal at cap (capped)
// ReferenceArea: shade participation zone (between floor and cap) in subtle gold
// ReferenceLine: vertical line at current spot
// Tooltip: custom — shows all three values at cursor + regime note

// CONTROLS (below chart):
// Floor Strike slider: currentSpot × 0.92 to currentSpot × 0.99
// Cap Strike slider: currentSpot × 1.01 to currentSpot × 1.12
// Notional slider: 100K to 10M USD (log scale or step 100K)

// METRICS PANEL (below controls, updates live):
// Protected Floor: ₹X per USD (floor × notional)
// Capped At: ₹Y per USD
// Participation Zone: X to Y
// Vs Forward (net cost): show collar is zero net premium

// IMPORTANT: Role-awareness
// In Exporter mode: show put (floor) protection above, call (cap) gives up upside
// In Importer mode: invert — call ceiling protection, put floor gives up downside saving
// In Balanced mode: show both perspectives with a role toggle inside diagram

// DISCLAIMER:
// Non-dismissible inline disclaimer above chart:
// "Payoff diagrams are illustrative only. Actual collar structures involve bid/offer spreads,
// credit considerations, and bank-specific terms. Request indicative pricing from a licensed dealer."
```

**Pure calculation logic (implement in collarPayoff.ts):**
```typescript
export function generateCollarPayoffData(
  params: CollarParams,
  steps: number = 100
): CollarPayoffPoint[] {
  const { currentSpot, forwardRate, floorStrike, capStrike, notionalFC } = params;
  const spotMin = currentSpot * 0.88;
  const spotMax = currentSpot * 1.12;
  const step = (spotMax - spotMin) / steps;
  
  return Array.from({ length: steps + 1 }, (_, i) => {
    const spot = spotMin + i * step;
    const unhedged = spot; // Effective rate = spot for unhedged exporter
    const forwardHedge = forwardRate; // Fixed at forward, regardless of spot
    // Zero-cost collar for exporter:
    // - Below floor: protected at floor
    // - Between floor and cap: follows spot
    // - Above cap: capped at cap
    const zeroCollar = spot < floorStrike 
      ? floorStrike 
      : spot > capStrike 
        ? capStrike 
        : spot;
    return { spotAtMaturity: spot, unhedged, forwardHedge, zeroCollar };
  });
}
```

**Acceptance criteria:**
- Chart renders with all three lines distinct and labeled
- Sliders update chart data in real-time (no debounce needed at this scale)
- Participation zone shaded correctly between floor and cap
- Metrics panel updates on every slider change
- Custom tooltip shows all three values + percentage vs forward
- Mobile responsive
- `npm run lint && npm run build` passes

---

### BATCH 6 — Hedging Strategy Matrix

**Files:**
- `src/features/trade-fx/components/HedgingStrategyMatrix.tsx`
- (hedgingArchetypes.ts already implemented in Batch 1)

**HedgingStrategyMatrix requirements:**

```tsx
// Layout: responsive grid (2-col desktop, 1-col mobile)
// Each card shows:
// - Archetype name (h3)
// - Regime fit indicator (colored badge: high/medium/low fit in current regime)
// - Protection level badge
// - Cost/drag badge  
// - Upside participation badge
// - Key macro trigger (one sentence from GraphiQuestor signals)
// - "Commonly considered when:" short context
// - Partner CTA button (links to AffiliateCTA flow)
// - "Educational only" badge — non-removable, on every card

// REGIME FILTERING:
// Show archetypes ordered by fit in current regime (highest fit first)
// Dim (opacity 50%) archetypes with low regime fit — don't hide them
// Show tooltip on dimmed cards: "Less commonly considered in current [low-vol] regime"

// ROLE AWARENESS:
// Exporter mode: show exporter-specific context (receivables, long FC)
// Importer mode: show importer-specific context (payables, short FC)
// Balanced: show both perspectives in each card

// The five archetypes (hardcode in hedgingArchetypes.ts):
const HEDGING_ARCHETYPES: HedgingArchetype[] = [
  {
    id: 'natural',
    name: 'Natural / Structural Hedge',
    typicalRegimeFit: 'Strong when INR invoicing or matching payables possible',
    protectionLevel: 'high',
    costDrag: 'lowest',
    upsideParticipation: 'full',
    keyMacroTrigger: 'De-Dollarization Pulse shows viable INR settlement corridors',
    regimeFilter: (regime, role) => true, // Always relevant
    partnerCTA: 'Explore INR invoicing support',
    partnerCTALabel: 'Explore with Skydo',
  },
  {
    id: 'full_forward',
    name: 'Full Forward Contract',
    typicalRegimeFit: 'Elevated volatility or clear directional pressure',
    protectionLevel: 'high',
    costDrag: 'moderate',
    upsideParticipation: 'none',
    keyMacroTrigger: 'India Pulse + RBI intervention bias + low-vol regime',
    regimeFilter: (regime, role) => regime === 'low' || regime === 'moderate',
    partnerCTA: 'Discuss forward booking with partner bank',
    partnerCTALabel: 'Request Bank Intro',
  },
  {
    id: 'partial_hedge',
    name: 'Partial Hedge + Active Monitor',
    typicalRegimeFit: 'Balanced regime or uncertain outlook',
    protectionLevel: 'medium',
    costDrag: 'low',
    upsideParticipation: 'partial',
    keyMacroTrigger: 'Mixed signals across US/India pulses',
    regimeFilter: (regime, role) => regime === 'moderate',
    partnerCTA: 'Set alert + review in 2 weeks',
    partnerCTALabel: 'Set Rate Alert',
  },
  {
    id: 'zero_collar',
    name: 'Zero-Cost Collar / Put Spread',
    typicalRegimeFit: 'Want downside protection without full premium outlay',
    protectionLevel: 'high',
    costDrag: 'lowest',
    upsideParticipation: 'capped',
    keyMacroTrigger: 'Rising volatility regime + exporter-favorable macro',
    regimeFilter: (regime, role) => regime === 'low' || regime === 'moderate',
    partnerCTA: 'Structure collar via partner desk',
    partnerCTALabel: 'Request Collar Pricing',
  },
  {
    id: 'standalone_put',
    name: 'Standalone Put Option',
    typicalRegimeFit: 'High-conviction protection needed; willing to pay premium',
    protectionLevel: 'high',
    costDrag: 'premium',
    upsideParticipation: 'full',
    keyMacroTrigger: 'Sharp move expected or event risk (policy dates)',
    regimeFilter: (regime, role) => regime === 'elevated' || regime === 'high',
    partnerCTA: 'Price protective options',
    partnerCTALabel: 'Request Options Pricing',
  },
];
```

**Acceptance criteria:**
- All 5 archetypes render in cards
- Regime filtering orders cards correctly based on current regime
- Low-fit cards dimmed not hidden
- Role toggle changes card context (exporter vs importer framing)
- "Educational only" badge visible on every card
- CTA buttons work (open AffiliateCTA modal or scroll)
- `npm run lint && npm run build` passes

---

### BATCH 7 — Risk Flags + Affiliate CTA + Final Assembly

**Files:**
- `src/features/trade-fx/components/RiskOpportunityFlags.tsx`
- `src/features/trade-fx/components/AffiliateCTA.tsx`
- Final assembly in `TradeFxPage.tsx`

**RiskOpportunityFlags requirements:**
```tsx
// Role-aware callout cards (green / amber / red)
// Each flag:
// - Color indicator (left border: green=supportive, amber=caution, red=risk)
// - Icon: ↑ for opportunity, ↗ for caution, ⚠ for risk
// - One headline (bold)
// - One sentence context
// - Link to relevant GraphiQuestor section (India Pulse, De-Dol Lab, etc.)

// Exporter example flags:
const EXPORTER_FLAGS = [
  {
    type: 'opportunity',
    color: 'green',
    headline: 'Hedging window open',
    detail: 'Low volatility regime + RBI support = favorable entry for forward contracts or collars.',
    link: '/india-macro',
  },
  {
    type: 'caution',
    color: 'amber',
    headline: 'USD strength watch',
    detail: 'Fed policy uncertainty persists. Monitor US Pulse for DXY signals before locking long tenors.',
    link: '/us-macro',
  },
];

// Importer example flags:
const IMPORTER_FLAGS = [
  {
    type: 'caution',
    color: 'amber',
    headline: 'CNY corridor signal emerging',
    detail: 'De-dollarization data shows early INR settlement signals on China corridor — explore invoicing flexibility.',
    link: '/dedollarization',
  },
];
```

**AffiliateCTA requirements:**
```tsx
// Trigger: CTA button from HedgingStrategyMatrix or sticky bottom bar
// Mode: modal overlay or inline expanded section
// Form fields:
// - Name (text)
// - Business email (email)
// - Role (Exporter / Importer / Both) — pre-filled from toggle
// - Notional range (select: <1Cr / 1-5Cr / 5-25Cr / >25Cr)
// - Currency pair — pre-filled from selector
// - Partner preference (select: 
//     'HDFC Forex Desk' | 'Kotak FX' | 'ICICI FX' | 'Skydo' | 'Karbon' | 'No preference')
// - Interest type (select: 
//     'Forward contract' | 'Collar / structured product' | 'Options' | 
//     'INR invoicing support' | 'General FX advisory')

// On submit:
// 1. Insert into existing subscribers table with:
//    source = 'trade_fx'
//    lead_type = 'trade_fx_bank_referral' (or 'trade_fx_skydo' if Skydo selected)
//    trade_role = role
//    currency_pair = pair
//    notional_range = selected range
//    partner_preference = selected partner
// 2. Show confirmation: 
//    "Your interest has been logged. A GraphiQuestor partner will be in touch within 2 business days."
// 3. No email sending from frontend (post-MVP: add pg_cron notification trigger)

// COMPLIANCE: 
// Above the submit button, non-optional legal note:
// "By submitting, you consent to GraphiQuestor sharing your contact details with 
// the selected partner institution for the purpose of discussing currency management solutions. 
// This is not an application for financial products. View our privacy policy."

// Partner badges displayed:
// Show partner logos or text badges: "Partner: Skydo | Karbon | [Bank Name]"
// Label: "Preferred Partner Network — Independently selected for quality and reliability"
```

**Final TradeFxPage assembly:**
```tsx
// Layout (responsive, natural scroll):
// 1. SEOManager
// 2. Page header: h1 + h2 + breadcrumb
// 3. DisclaimerBanner (non-dismissible, amber)
// 4. Controls bar: RoleToggle + CurrencyPairSelector + TimeHorizon (sticky on scroll)
// 5. Two-column layout (desktop): 
//    Left (70%): RateRegimeChart → ExposureSimulator → CollarPayoffDiagram → HedgingStrategyMatrix
//    Right (30%): MacroDriversPanel (sticky) → RiskOpportunityFlags
// 6. Single column on mobile (MacroDriversPanel moves above chart)
// 7. AffiliateCTA: sticky bottom bar on mobile, inline section at bottom on desktop
// 8. Footer disclaimer (repeat full text)
```

**Acceptance criteria:**
- Full page renders without layout breaks on desktop and mobile
- Sticky controls bar works without breaking scroll
- Risk flags render correctly for each role
- AffiliateCTA form submits to Supabase without error
- Supabase insert confirmed in database
- Internal links to India Pulse, US Pulse, De-Dol Lab work
- `npm run lint && npm run build` passes — zero warnings

---

### BATCH 8 — SEO Hardening + JSON-LD + Sitemap

**Files:**
- JSON-LD structured data in `TradeFxPage.tsx`
- FAQ schema with 5 institutional-quality Q&A pairs
- Update `sitemap.xml` or dynamic sitemap generator to include `/trade-fx`
- Canonical tag via `SEOManager`
- `<meta name="robots" content="index, follow">`
- Add internal links from:
  - `/trade` → TradeFx feature card
  - `/india-macro` → "Currency Intelligence" link in sidebar
  - Homepage → TradeFx in feature grid

**JSON-LD targets:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "TradeFx — Currency Intelligence",
  "description": "Institutional-grade USD/INR hedging analysis, zero-cost collar payoff diagrams, and regime-aware currency strategy for Indian exporters and importers.",
  "applicationCategory": "FinanceApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
  "featureList": [
    "Zero-cost collar payoff diagrams",
    "USD/INR exposure impact simulator", 
    "Regime-aware hedging strategy framework",
    "Macro driver context from India, US, China pulses"
  ]
}
```

**FAQ schema (5 entries — write full Q&A for each):**
1. "What is a zero-cost collar for USD/INR?"
2. "How do Indian exporters hedge USD receivables?"
3. "What is the difference between a forward contract and a currency option for importers?"
4. "How does RBI intervention affect USD/INR for exporters?"
5. "What is the current USD/INR hedging regime in [current month year]?"

**Acceptance criteria:**
- JSON-LD validates in Google's Rich Results Test
- FAQ schema renders in `<script type="application/ld+json">`
- `/trade-fx` returns 200 and correct canonical in prerender check
- Sitemap includes `/trade-fx`
- `npm run lint && npm run build` passes

---

## DEPLOYMENT NOTES (provide at end)

At the end of all batches, provide:

### Supabase
```bash
# Run migration to extend subscribers table:
supabase migration new trade_fx_lead_capture
# (agent: write the SQL file content here)
supabase db push
```

### Netlify / Vercel
```bash
# Standard build — no new env vars needed for MVP
npm run build
# Ensure /trade-fx is included in _redirects for SPA:
echo "/trade-fx  /index.html  200" >> public/_redirects
# If prerender plugin configured, add /trade-fx to prerender routes
```

### Post-MVP additions (document but don't implement):
1. Live USD/INR feed via RBI API or Supabase Edge Function
2. pg_cron trigger to notify partner CRM on new lead_type = 'trade_fx_*'
3. Email confirmation to lead via Resend/Postmark
4. PDF playbook generation (Puppeteer Edge Function)
5. Programmatic SEO pages: `/trade-fx/usd-inr-hedging-[month]-[year]`

---

## QUALITY GATES (non-negotiable)

Before declaring any batch complete:
- [ ] `npm run lint` — zero warnings
- [ ] `npm run build` — zero errors, zero new warnings  
- [ ] TypeScript strict mode — no `any` types
- [ ] No inline styles (Tailwind classes only, matching existing patterns)
- [ ] All disclaimer text present and non-dismissible
- [ ] No "recommended for you" language anywhere
- [ ] All CTAs clearly labeled as partner referrals, not GraphiQuestor services
- [ ] Responsive check: 375px mobile, 768px tablet, 1440px desktop

---

## OUTPUT STYLE

- Structured with headings and tables
- Precise TypeScript (no pseudocode in implementation phase)
- Report `npm run lint && npm run build` output verbatim after each batch
- Flag any deviation from existing patterns with explicit justification
- No fluff, no filler, no placeholder code in the implementation phase

Begin with the Planning phase. Produce it in full. Wait for confirmation before writing any implementation code.
