# Regime Digest Monthly Notebook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Regime Digest into a fully automated Monthly Regime Notebook: rules-based desk brief + frozen MoM scoreboard with validation, no LLM narrative dependency.

**Architecture:** A pure TypeScript notebook builder (validated MoM rows, regime freeze, template thesis, movers, watchlist) runs inside `generate-monthly-regime-digest`, freezes a `notebook_payload` JSONB on `monthly_regime_digests`, and the React edition/archive pages render that payload as structured UI (not `dangerouslySetInnerHTML` for primary content). LLM generation is removed from the critical path so editions never ship invented numbers.

**Tech Stack:** React 18 + TypeScript, TanStack Query v5, Supabase (Postgres + Deno Edge Functions), React Router v7, Tailwind / shadcn-ui, date-fns, vitest + jsdom.

## Global Constraints

- No new external data vendors — only existing `metric_observations` / pulses / `daily_signal` (or equivalent) already in GraphiQuestor.
- Fully automated — no human CMS; no LLM-required narrative for publish success.
- Never display metrics that fail plausible-range validation.
- Hybrid layout: desk brief first, reference scoreboard below.
- Success priority: analysis utility > SEO/AEO > newsletter growth.
- Keep URL scheme `/regime-digest/` and `/regime-digest/YYYY/MM/`.
- Preserve public read RLS on digests; upsert by `year_month`.
- Spec: `docs/superpowers/specs/2026-07-27-regime-digest-monthly-notebook-design.md`.

---

## File Map

**Create:**
- `src/features/regime-digest/lib/types.ts` — `NotebookPayload`, `MetricRow`, statuses
- `src/features/regime-digest/lib/metricCatalog.ts` — board metric defs, ranges, sections, glossary paths
- `src/features/regime-digest/lib/validateMetric.ts` — range/unit validation
- `src/features/regime-digest/lib/computeMom.ts` — Δ, Δ%, movers
- `src/features/regime-digest/lib/buildThesis.ts` — rule templates
- `src/features/regime-digest/lib/positioning.ts` — static regime → framework bullets
- `src/features/regime-digest/lib/buildWatchlist.ts` — level watches (+ optional events)
- `src/features/regime-digest/lib/buildNotebookPayload.ts` — orchestrator
- `src/features/regime-digest/lib/__tests__/validateMetric.test.ts`
- `src/features/regime-digest/lib/__tests__/computeMom.test.ts`
- `src/features/regime-digest/lib/__tests__/buildThesis.test.ts`
- `src/features/regime-digest/lib/__tests__/buildNotebookPayload.test.ts`
- `src/features/regime-digest/components/RegimeStrip.tsx`
- `src/features/regime-digest/components/DeskBrief.tsx`
- `src/features/regime-digest/components/Scoreboard.tsx`
- `src/features/regime-digest/components/RegimeHistory.tsx`
- `src/features/regime-digest/components/BriefIndex.tsx`
- `src/features/regime-digest/components/QualityFooter.tsx`
- `src/features/regime-digest/components/EditionHeader.tsx`
- `supabase/functions/_shared/regime-digest/notebook.ts` — Deno copy of pure builder (same API; keep in sync with `src/.../lib`)
- `supabase/migrations/20260728000000_monthly_digest_notebook_payload.sql`

**Modify:**
- `supabase/functions/generate-monthly-regime-digest/index.ts` — month-end fetch, validate, build payload, no LLM required
- `src/features/regime-digest/hooks/useRegimeDigest.ts` — types for `notebook_payload`
- `src/pages/RegimeDigestPage.tsx` — structured notebook UI + unique SEO
- `src/pages/RegimeDigestArchivePage.tsx` — featured latest + regime badges
- `src/types/database.types.ts` — only if project regenerates types manually; else note regenerate

**Optional / later (out of v1 plan body):** CSV export, email HTML parity, interactive charts.

---

### Task 1: Notebook types + metric catalog + validation

**Files:**
- Create: `src/features/regime-digest/lib/types.ts`
- Create: `src/features/regime-digest/lib/metricCatalog.ts`
- Create: `src/features/regime-digest/lib/validateMetric.ts`
- Test: `src/features/regime-digest/lib/__tests__/validateMetric.test.ts`

**Interfaces:**
- Consumes: none
- Produces: types + `validateObservation(def, value, asOf, now)` → status/level

- [ ] **Step 1: Write failing tests**

```typescript
// src/features/regime-digest/lib/__tests__/validateMetric.test.ts
import { describe, it, expect } from 'vitest';
import { validateObservation } from '../validateMetric';
import { DIGEST_METRICS } from '../metricCatalog';

const cpi = DIGEST_METRICS.find((m) => m.id === 'US_CPI_YOY')!;

describe('validateObservation', () => {
  it('accepts a plausible CPI YoY', () => {
    const r = validateObservation(cpi, 2.7, '2026-06-30', new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('ok');
    expect(r.level).toBe(2.7);
  });

  it('withholds impossible CPI YoY (double-scaled index)', () => {
    const r = validateObservation(cpi, 332.57, '2026-06-30', new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('failed_validation');
    expect(r.level).toBeNull();
  });

  it('marks missing value', () => {
    const r = validateObservation(cpi, null, null, new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('missing');
  });

  it('marks stale daily series older than threshold', () => {
    const dxy = DIGEST_METRICS.find((m) => m.id === 'DXY_INDEX')!;
    const r = validateObservation(dxy, 100.5, '2026-06-01', new Date('2026-07-01T00:00:00Z'));
    expect(r.status).toBe('stale');
    expect(r.level).toBe(100.5);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard
npx vitest run src/features/regime-digest/lib/__tests__/validateMetric.test.ts
```

Expected: FAIL (modules not found).

- [ ] **Step 3: Implement types, catalog, validator**

```typescript
// src/features/regime-digest/lib/types.ts
export type MetricStatus = 'ok' | 'stale' | 'missing' | 'failed_validation';
export type QualityOverall = 'ok' | 'partial' | 'blocked';

export type RegimeLabel = 'RISK_ON' | 'NEUTRAL' | 'RISK_OFF';

export interface MetricDef {
  id: string;
  name: string;
  section: ScoreboardSectionId;
  unit: string;
  sourceFamily: string;
  min: number;
  max: number;
  /** Max age in days before status becomes stale (still shown). */
  staleDays: number;
  glossaryPath?: string;
  format?: 'number' | 'percent' | 'usd' | 'ratio';
  decimals?: number;
}

export type ScoreboardSectionId =
  | 'liquidity'
  | 'rates_usd'
  | 'vol'
  | 'metals'
  | 'energy'
  | 'us'
  | 'india'
  | 'china';

export interface MetricRow {
  id: string;
  name: string;
  section: ScoreboardSectionId;
  level: number | null;
  priorLevel: number | null;
  delta: number | null;
  deltaPct: number | null;
  unit: string;
  asOf: string | null;
  sourceFamily: string;
  status: MetricStatus;
  glossaryPath?: string;
}

export interface MetricMove {
  id: string;
  name: string;
  deltaPct: number;
  level: number;
  section: ScoreboardSectionId;
}

export interface WatchItem {
  type: 'event' | 'level';
  date?: string;
  label: string;
  why: string;
}

export interface NotebookRegime {
  label: RegimeLabel;
  confidence: number | null;
  daysInRegime: number | null;
  compositeScore: number | null;
}

export interface NotebookPayload {
  yearMonth: string;
  editionNumber: number | null;
  publishedAt: string;
  asOf: string | null;
  regime: NotebookRegime;
  thesis: string[];
  movers: { up: MetricMove[]; down: MetricMove[] };
  watchlist: WatchItem[];
  positioning: string[];
  board: MetricRow[];
  history: { yearMonth: string; regime: RegimeLabel }[];
  briefLinks: { date: string; url: string; title: string }[];
  quality: {
    okCount: number;
    staleCount: number;
    withheldCount: number;
    missingCount: number;
    failedMetrics: string[];
    overall: QualityOverall;
  };
  generation: { mode: 'notebook_v1'; engine: 'rules' };
}
```

```typescript
// src/features/regime-digest/lib/metricCatalog.ts
import type { MetricDef } from './types';

export const DIGEST_METRICS: MetricDef[] = [
  {
    id: 'BIS_GLOBAL_LIQUIDITY_USD_BN',
    name: 'Global Net Liquidity',
    section: 'liquidity',
    unit: 'USD bn',
    sourceFamily: 'BIS/GQ',
    min: 5_000,
    max: 100_000,
    staleDays: 45,
    glossaryPath: '/glossary/net-liquidity-z-score/',
    format: 'number',
    decimals: 0,
  },
  {
    id: 'DXY_INDEX',
    name: 'DXY',
    section: 'rates_usd',
    unit: 'index',
    sourceFamily: 'market',
    min: 70,
    max: 130,
    staleDays: 7,
    format: 'number',
    decimals: 2,
  },
  {
    id: 'VIX_INDEX',
    name: 'VIX',
    section: 'vol',
    unit: 'index',
    sourceFamily: 'market',
    min: 5,
    max: 100,
    staleDays: 7,
    format: 'number',
    decimals: 2,
  },
  {
    id: 'GOLD_PRICE_USD',
    name: 'Gold',
    section: 'metals',
    unit: 'USD/oz',
    sourceFamily: 'market',
    min: 500,
    max: 10_000,
    staleDays: 7,
    format: 'usd',
    decimals: 0,
  },
  {
    id: 'RATIO_DEBT_GOLD',
    name: 'Debt/Gold',
    section: 'metals',
    unit: 'x',
    sourceFamily: 'GQ',
    min: 1,
    max: 200,
    staleDays: 14,
    format: 'ratio',
    decimals: 2,
  },
  {
    id: 'BRENT_CRUDE_PRICE',
    name: 'Brent',
    section: 'energy',
    unit: 'USD/bbl',
    sourceFamily: 'market',
    min: 10,
    max: 300,
    staleDays: 7,
    format: 'usd',
    decimals: 2,
  },
  {
    id: 'US_CPI_YOY',
    name: 'US CPI YoY',
    section: 'us',
    unit: '%',
    sourceFamily: 'FRED',
    min: -5,
    max: 25,
    staleDays: 45,
    format: 'percent',
    decimals: 2,
  },
  {
    id: 'IN_GDP_GROWTH_YOY',
    name: 'India GDP YoY',
    section: 'india',
    unit: '%',
    sourceFamily: 'MOSPI',
    min: -15,
    max: 20,
    staleDays: 120,
    format: 'percent',
    decimals: 2,
  },
  {
    id: 'IN_CPI_YOY',
    name: 'India CPI YoY',
    section: 'india',
    unit: '%',
    sourceFamily: 'MOSPI',
    min: -5,
    max: 25,
    staleDays: 45,
    format: 'percent',
    decimals: 2,
  },
  {
    id: 'CN_GDP_GROWTH_YOY',
    name: 'China GDP YoY',
    section: 'china',
    unit: '%',
    sourceFamily: 'NBS',
    min: -15,
    max: 20,
    staleDays: 120,
    format: 'percent',
    decimals: 2,
  },
];

/** Core set for publish quality gate */
export const CORE_METRIC_IDS = [
  'BIS_GLOBAL_LIQUIDITY_USD_BN',
  'DXY_INDEX',
  'VIX_INDEX',
  'GOLD_PRICE_USD',
  'US_CPI_YOY',
] as const;
```

```typescript
// src/features/regime-digest/lib/validateMetric.ts
import type { MetricDef, MetricStatus } from './types';

export interface ValidatedObservation {
  status: MetricStatus;
  level: number | null;
  asOf: string | null;
}

function daysBetween(asOf: string, now: Date): number {
  const a = new Date(asOf + (asOf.length === 10 ? 'T00:00:00Z' : ''));
  return (now.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function validateObservation(
  def: MetricDef,
  value: number | null | undefined,
  asOf: string | null | undefined,
  now: Date,
): ValidatedObservation {
  if (value == null || !Number.isFinite(Number(value))) {
    return { status: 'missing', level: null, asOf: asOf ?? null };
  }
  const n = Number(value);
  if (n < def.min || n > def.max) {
    return { status: 'failed_validation', level: null, asOf: asOf ?? null };
  }
  if (!asOf) {
    return { status: 'stale', level: n, asOf: null };
  }
  if (daysBetween(asOf, now) > def.staleDays) {
    return { status: 'stale', level: n, asOf };
  }
  return { status: 'ok', level: n, asOf };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/validateMetric.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/regime-digest/lib/
git commit -m "feat(regime-digest): add metric catalog and validation gates"
```

---

### Task 2: MoM computation + movers

**Files:**
- Create: `src/features/regime-digest/lib/computeMom.ts`
- Test: `src/features/regime-digest/lib/__tests__/computeMom.test.ts`

**Interfaces:**
- Consumes: `MetricDef`, `ValidatedObservation` from Task 1
- Produces: `buildMetricRow`, `rankMovers`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { buildMetricRow, rankMovers } from '../computeMom';
import { DIGEST_METRICS } from '../metricCatalog';
import type { MetricRow } from '../types';

const dxy = DIGEST_METRICS.find((m) => m.id === 'DXY_INDEX')!;

describe('buildMetricRow', () => {
  it('computes delta and deltaPct', () => {
    const row = buildMetricRow(
      dxy,
      { status: 'ok', level: 102, asOf: '2026-06-30' },
      { status: 'ok', level: 100, asOf: '2026-05-30' },
    );
    expect(row.delta).toBeCloseTo(2);
    expect(row.deltaPct).toBeCloseTo(2);
    expect(row.status).toBe('ok');
  });

  it('returns null deltaPct when prior missing', () => {
    const row = buildMetricRow(
      dxy,
      { status: 'ok', level: 102, asOf: '2026-06-30' },
      { status: 'missing', level: null, asOf: null },
    );
    expect(row.deltaPct).toBeNull();
  });
});

describe('rankMovers', () => {
  it('only ranks status ok with finite deltaPct', () => {
    const board: MetricRow[] = [
      {
        id: 'a', name: 'A', section: 'us', level: 2, priorLevel: 1,
        delta: 1, deltaPct: 100, unit: '%', asOf: '2026-06-30',
        sourceFamily: 'x', status: 'ok',
      },
      {
        id: 'b', name: 'B', section: 'us', level: 90, priorLevel: 100,
        delta: -10, deltaPct: -10, unit: 'x', asOf: '2026-06-30',
        sourceFamily: 'x', status: 'ok',
      },
      {
        id: 'c', name: 'C', section: 'us', level: 50, priorLevel: 10,
        delta: 40, deltaPct: 400, unit: 'x', asOf: '2026-01-01',
        sourceFamily: 'x', status: 'stale',
      },
    ];
    const m = rankMovers(board, 5);
    expect(m.up.map((x) => x.id)).toEqual(['a']);
    expect(m.down.map((x) => x.id)).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/computeMom.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/features/regime-digest/lib/computeMom.ts
import type { MetricDef, MetricMove, MetricRow } from './types';
import type { ValidatedObservation } from './validateMetric';

export function buildMetricRow(
  def: MetricDef,
  current: ValidatedObservation,
  prior: ValidatedObservation,
): MetricRow {
  const level = current.level;
  const priorLevel = prior.level;
  let delta: number | null = null;
  let deltaPct: number | null = null;
  if (level != null && priorLevel != null && priorLevel !== 0) {
    delta = level - priorLevel;
    deltaPct = (delta / priorLevel) * 100;
  } else if (level != null && priorLevel != null && priorLevel === 0) {
    delta = level - priorLevel;
    deltaPct = null;
  }

  // Prefer current validation status; if current ok but we only have withheld level, status stays
  const status = current.status;

  return {
    id: def.id,
    name: def.name,
    section: def.section,
    level: status === 'failed_validation' ? null : level,
    priorLevel: prior.status === 'failed_validation' ? null : priorLevel,
    delta: status === 'ok' || status === 'stale' ? delta : null,
    deltaPct: status === 'ok' || status === 'stale' ? deltaPct : null,
    unit: def.unit,
    asOf: current.asOf,
    sourceFamily: def.sourceFamily,
    status,
    glossaryPath: def.glossaryPath,
  };
}

export function rankMovers(board: MetricRow[], n = 5): { up: MetricMove[]; down: MetricMove[] } {
  const eligible = board.filter(
    (r) => r.status === 'ok' && r.level != null && r.deltaPct != null && Number.isFinite(r.deltaPct),
  );
  const up = [...eligible]
    .filter((r) => (r.deltaPct as number) > 0)
    .sort((a, b) => (b.deltaPct as number) - (a.deltaPct as number))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      name: r.name,
      deltaPct: r.deltaPct as number,
      level: r.level as number,
      section: r.section,
    }));
  const down = [...eligible]
    .filter((r) => (r.deltaPct as number) < 0)
    .sort((a, b) => (a.deltaPct as number) - (b.deltaPct as number))
    .slice(0, n)
    .map((r) => ({
      id: r.id,
      name: r.name,
      deltaPct: r.deltaPct as number,
      level: r.level as number,
      section: r.section,
    }));
  return { up, down };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/computeMom.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/regime-digest/lib/computeMom.ts src/features/regime-digest/lib/__tests__/computeMom.test.ts
git commit -m "feat(regime-digest): MoM rows and biggest-movers ranking"
```

---

### Task 3: Thesis templates, positioning, watchlist

**Files:**
- Create: `src/features/regime-digest/lib/buildThesis.ts`
- Create: `src/features/regime-digest/lib/positioning.ts`
- Create: `src/features/regime-digest/lib/buildWatchlist.ts`
- Test: `src/features/regime-digest/lib/__tests__/buildThesis.test.ts`

**Interfaces:**
- Consumes: `MetricRow`, `NotebookRegime`
- Produces: `buildThesisLines`, `positioningForRegime`, `buildLevelWatchlist`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { buildThesisLines } from '../buildThesis';
import { positioningForRegime } from '../positioning';
import { buildLevelWatchlist } from '../buildWatchlist';
import type { MetricRow, NotebookRegime } from '../types';

const regime: NotebookRegime = {
  label: 'RISK_OFF',
  confidence: 82,
  daysInRegime: 12,
  compositeScore: 30,
};

function row(partial: Partial<MetricRow> & Pick<MetricRow, 'id' | 'name' | 'section'>): MetricRow {
  return {
    level: null,
    priorLevel: null,
    delta: null,
    deltaPct: null,
    unit: '',
    asOf: null,
    sourceFamily: 't',
    status: 'missing',
    ...partial,
  };
}

describe('buildThesisLines', () => {
  it('includes regime line and skips failed metrics', () => {
    const board: MetricRow[] = [
      row({
        id: 'DXY_INDEX', name: 'DXY', section: 'rates_usd',
        status: 'ok', level: 101, priorLevel: 100, delta: 1, deltaPct: 1, unit: 'index', asOf: '2026-06-30',
      }),
      row({
        id: 'US_CPI_YOY', name: 'US CPI YoY', section: 'us',
        status: 'failed_validation', level: null, unit: '%',
      }),
    ];
    const lines = buildThesisLines(regime, board);
    expect(lines.some((l) => l.includes('RISK_OFF'))).toBe(true);
    expect(lines.some((l) => l.includes('DXY'))).toBe(true);
    expect(lines.some((l) => l.includes('CPI'))).toBe(false);
    expect(lines.length).toBeLessThanOrEqual(5);
  });
});

describe('positioningForRegime', () => {
  it('returns framework bullets for RISK_OFF', () => {
    const bullets = positioningForRegime('RISK_OFF');
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets.join(' ')).toMatch(/defensive|gold|duration|cash/i);
  });
});

describe('buildLevelWatchlist', () => {
  it('creates level watches from largest movers', () => {
    const movers = {
      up: [{ id: 'GOLD_PRICE_USD', name: 'Gold', deltaPct: 5, level: 4200, section: 'metals' as const }],
      down: [{ id: 'BRENT_CRUDE_PRICE', name: 'Brent', deltaPct: -6, level: 90, section: 'energy' as const }],
    };
    const w = buildLevelWatchlist(movers);
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((x) => x.type === 'level')).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/buildThesis.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/features/regime-digest/lib/buildThesis.ts
import type { MetricRow, NotebookRegime } from './types';

function dirWord(deltaPct: number | null): 'rose' | 'fell' | 'was unchanged' {
  if (deltaPct == null || Math.abs(deltaPct) < 0.05) return 'was unchanged';
  return deltaPct > 0 ? 'rose' : 'fell';
}

export function buildThesisLines(regime: NotebookRegime, board: MetricRow[]): string[] {
  const lines: string[] = [];
  const conf = regime.confidence != null ? ` (confidence ${Math.round(regime.confidence)}%` : '';
  const days = regime.daysInRegime != null ? `; ${regime.daysInRegime} days in regime)` : conf ? ')' : '';
  lines.push(
    `Month-end regime: ${regime.label.replace('_', ' ')}${conf}${days || (conf ? ')' : '')}.`,
  );

  const byId = (id: string) => board.find((r) => r.id === id && r.status === 'ok');

  const liq = byId('BIS_GLOBAL_LIQUIDITY_USD_BN');
  if (liq?.deltaPct != null && liq.level != null) {
    const verb = liq.deltaPct >= 0 ? 'expanded' : 'contracted';
    lines.push(
      `Global net liquidity ${verb} MoM (${liq.deltaPct >= 0 ? '+' : ''}${liq.deltaPct.toFixed(2)}%) to ${liq.level.toFixed(0)} USD bn.`,
    );
  }

  const dxy = byId('DXY_INDEX');
  if (dxy?.level != null) {
    lines.push(
      `DXY ${dirWord(dxy.deltaPct)} MoM to ${dxy.level.toFixed(2)}, a ${
        (dxy.deltaPct ?? 0) > 0 ? 'tightening' : (dxy.deltaPct ?? 0) < 0 ? 'easing' : 'stable'
      } USD impulse.`,
    );
  }

  const gold = byId('GOLD_PRICE_USD');
  if (gold?.level != null && gold.deltaPct != null) {
    lines.push(
      `Gold ${dirWord(gold.deltaPct)} MoM to $${Math.round(gold.level).toLocaleString()} (${gold.deltaPct >= 0 ? '+' : ''}${gold.deltaPct.toFixed(2)}%).`,
    );
  }

  const indiaCpi = byId('IN_CPI_YOY');
  const indiaGdp = byId('IN_GDP_GROWTH_YOY');
  if (indiaCpi?.level != null || indiaGdp?.level != null) {
    const parts = [];
    if (indiaGdp?.level != null) parts.push(`GDP ${indiaGdp.level.toFixed(2)}%`);
    if (indiaCpi?.level != null) parts.push(`CPI ${indiaCpi.level.toFixed(2)}%`);
    lines.push(`India pulse: ${parts.join(' · ')}.`);
  }

  return lines.slice(0, 5);
}
```

```typescript
// src/features/regime-digest/lib/positioning.ts
import type { RegimeLabel } from './types';

const MAP: Record<RegimeLabel, string[]> = {
  RISK_ON: [
    'Framework: growth/risk assets historically favored when liquidity and risk appetite improve.',
    'Watch crowding and late-cycle inflation surprises.',
    'Cross-check with net-liquidity direction before extending duration risk.',
  ],
  NEUTRAL: [
    'Framework: mixed signals — prefer barbell risk and tighter position sizing.',
    'Wait for confirmation from liquidity + dollar + vol before rotating hard.',
    'Use regime history: neutral months often precede decisive breaks.',
  ],
  RISK_OFF: [
    'Framework: defensive tilt — quality duration, cash buffers, and real assets (gold) often lead.',
    'Reduce reliance on crowded equity beta until liquidity stabilizes.',
    'Monitor USD and VIX for confirmation or false breakdown.',
  ],
};

export function positioningForRegime(label: RegimeLabel): string[] {
  return MAP[label] ?? MAP.NEUTRAL;
}
```

```typescript
// src/features/regime-digest/lib/buildWatchlist.ts
import type { MetricMove, WatchItem } from './types';

export function buildLevelWatchlist(movers: {
  up: MetricMove[];
  down: MetricMove[];
}): WatchItem[] {
  const items: WatchItem[] = [];
  for (const m of movers.up.slice(0, 3)) {
    items.push({
      type: 'level',
      label: `${m.name} follow-through`,
      why: `Largest upside MoM move (+${m.deltaPct.toFixed(1)}%); watch whether level holds above ${m.level}.`,
    });
  }
  for (const m of movers.down.slice(0, 3)) {
    items.push({
      type: 'level',
      label: `${m.name} stabilization`,
      why: `Largest downside MoM move (${m.deltaPct.toFixed(1)}%); watch for base-building near ${m.level}.`,
    });
  }
  return items.slice(0, 8);
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/buildThesis.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/regime-digest/lib/buildThesis.ts src/features/regime-digest/lib/positioning.ts src/features/regime-digest/lib/buildWatchlist.ts src/features/regime-digest/lib/__tests__/buildThesis.test.ts
git commit -m "feat(regime-digest): rules thesis, positioning map, level watchlist"
```

---

### Task 4: `buildNotebookPayload` orchestrator + quality gate

**Files:**
- Create: `src/features/regime-digest/lib/buildNotebookPayload.ts`
- Test: `src/features/regime-digest/lib/__tests__/buildNotebookPayload.test.ts`

**Interfaces:**
- Consumes: all Task 1–3 helpers
- Produces: `buildNotebookPayload(input) → NotebookPayload`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { buildNotebookPayload } from '../buildNotebookPayload';
import type { RawMetricPoint } from '../buildNotebookPayload';

const samplePoints: RawMetricPoint[] = [
  { id: 'DXY_INDEX', value: 101, asOf: '2026-06-28' },
  { id: 'DXY_INDEX', value: 100, asOf: '2026-05-28' },
  { id: 'VIX_INDEX', value: 17, asOf: '2026-06-28' },
  { id: 'VIX_INDEX', value: 18, asOf: '2026-05-28' },
  { id: 'GOLD_PRICE_USD', value: 4200, asOf: '2026-06-28' },
  { id: 'GOLD_PRICE_USD', value: 4000, asOf: '2026-05-28' },
  { id: 'BIS_GLOBAL_LIQUIDITY_USD_BN', value: 25400, asOf: '2026-06-15' },
  { id: 'BIS_GLOBAL_LIQUIDITY_USD_BN', value: 25000, asOf: '2026-05-15' },
  { id: 'US_CPI_YOY', value: 2.7, asOf: '2026-06-12' },
  { id: 'US_CPI_YOY', value: 2.8, asOf: '2026-05-12' },
  // poison value must be withheld
  { id: 'US_CPI_YOY', value: 332.57, asOf: '2026-04-12' },
];

describe('buildNotebookPayload', () => {
  it('builds ok quality payload with thesis and board', () => {
    const payload = buildNotebookPayload({
      yearMonth: '2026-06',
      now: new Date('2026-07-01T12:00:00Z'),
      points: samplePoints,
      regime: { label: 'RISK_OFF', confidence: 80, daysInRegime: 10, compositeScore: 30 },
      history: [{ yearMonth: '2026-05', regime: 'NEUTRAL' }],
      briefLinks: [],
      editionNumber: 5,
    });
    expect(payload.generation.mode).toBe('notebook_v1');
    expect(payload.thesis.length).toBeGreaterThan(0);
    expect(payload.board.some((r) => r.id === 'DXY_INDEX' && r.deltaPct != null)).toBe(true);
    expect(payload.quality.overall).not.toBe('blocked');
  });

  it('withholds invalid CPI and never puts it on movers', () => {
    const payload = buildNotebookPayload({
      yearMonth: '2026-06',
      now: new Date('2026-07-01T12:00:00Z'),
      points: [
        { id: 'US_CPI_YOY', value: 332.57, asOf: '2026-06-30' },
        { id: 'DXY_INDEX', value: 101, asOf: '2026-06-28' },
        { id: 'DXY_INDEX', value: 100, asOf: '2026-05-28' },
      ],
      regime: { label: 'NEUTRAL', confidence: 50, daysInRegime: 1, compositeScore: 50 },
      history: [],
      briefLinks: [],
      editionNumber: 1,
    });
    const cpi = payload.board.find((r) => r.id === 'US_CPI_YOY');
    expect(cpi?.status).toBe('failed_validation');
    expect(payload.movers.up.every((m) => m.id !== 'US_CPI_YOY')).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/buildNotebookPayload.test.ts
```

- [ ] **Step 3: Implement orchestrator**

```typescript
// src/features/regime-digest/lib/buildNotebookPayload.ts
import { DIGEST_METRICS, CORE_METRIC_IDS } from './metricCatalog';
import { validateObservation } from './validateMetric';
import { buildMetricRow, rankMovers } from './computeMom';
import { buildThesisLines } from './buildThesis';
import { positioningForRegime } from './positioning';
import { buildLevelWatchlist } from './buildWatchlist';
import type { NotebookPayload, NotebookRegime, QualityOverall, RegimeLabel } from './types';

export interface RawMetricPoint {
  id: string;
  value: number;
  asOf: string;
}

export interface BuildNotebookInput {
  yearMonth: string;
  now: Date;
  points: RawMetricPoint[];
  regime: NotebookRegime;
  history: { yearMonth: string; regime: RegimeLabel }[];
  briefLinks: { date: string; url: string; title: string }[];
  editionNumber: number | null;
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  return d.toISOString().slice(0, 10);
}

function prevYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Latest point with asOf <= endDate inclusive */
function pickMonthEnd(points: RawMetricPoint[], metricId: string, endDate: string): RawMetricPoint | null {
  const eligible = points
    .filter((p) => p.id === metricId && p.asOf <= endDate)
    .sort((a, b) => (a.asOf < b.asOf ? 1 : -1));
  return eligible[0] ?? null;
}

export function buildNotebookPayload(input: BuildNotebookInput): NotebookPayload {
  const end = lastDayOfMonth(input.yearMonth);
  const prevYm = prevYearMonth(input.yearMonth);
  const prevEnd = lastDayOfMonth(prevYm);

  const board = DIGEST_METRICS.map((def) => {
    const curPt = pickMonthEnd(input.points, def.id, end);
    const prevPt = pickMonthEnd(input.points, def.id, prevEnd);
    const cur = validateObservation(def, curPt?.value, curPt?.asOf, input.now);
    const prev = validateObservation(def, prevPt?.value, prevPt?.asOf, input.now);
    return buildMetricRow(def, cur, prev);
  });

  const movers = rankMovers(board, 5);
  const thesis = buildThesisLines(input.regime, board);
  const positioning = positioningForRegime(input.regime.label);
  const watchlist = buildLevelWatchlist(movers);

  const okCount = board.filter((r) => r.status === 'ok').length;
  const staleCount = board.filter((r) => r.status === 'stale').length;
  const withheldCount = board.filter((r) => r.status === 'failed_validation').length;
  const missingCount = board.filter((r) => r.status === 'missing').length;
  const failedMetrics = board.filter((r) => r.status === 'failed_validation').map((r) => r.id);

  const core = board.filter((r) => (CORE_METRIC_IDS as readonly string[]).includes(r.id));
  const coreOk = core.filter((r) => r.status === 'ok' || r.status === 'stale').length;
  const coreRatio = core.length ? coreOk / core.length : 0;

  let overall: QualityOverall = 'ok';
  if (coreRatio < 0.5 || !input.regime.label) {
    overall = 'blocked';
  } else if (withheldCount > 0 || staleCount > 0 || coreRatio < 1) {
    overall = 'partial';
  }

  const asOfDates = board.map((r) => r.asOf).filter(Boolean) as string[];
  const asOf = asOfDates.length ? asOfDates.sort().slice(-1)[0] : null;

  return {
    yearMonth: input.yearMonth,
    editionNumber: input.editionNumber,
    publishedAt: input.now.toISOString(),
    asOf,
    regime: input.regime,
    thesis,
    movers,
    watchlist,
    positioning,
    board,
    history: input.history,
    briefLinks: input.briefLinks,
    quality: {
      okCount,
      staleCount,
      withheldCount,
      missingCount,
      failedMetrics,
      overall,
    },
    generation: { mode: 'notebook_v1', engine: 'rules' },
  };
}

export function subjectFromPayload(p: NotebookPayload): string {
  const liq = p.board.find((r) => r.id === 'BIS_GLOBAL_LIQUIDITY_USD_BN' && r.deltaPct != null);
  const liqBit = liq
    ? `Liquidity ${(liq.deltaPct as number) >= 0 ? '+' : ''}${(liq.deltaPct as number).toFixed(1)}%`
    : 'Liquidity & Prices';
  return `Regime Snapshot ${p.yearMonth}: ${p.regime.label.replace('_', ' ')} · ${liqBit}`;
}

export function plainTextFromPayload(p: NotebookPayload): string {
  return [
    `Monthly Regime Digest — ${p.yearMonth}`,
    `Regime: ${p.regime.label}`,
    ...p.thesis,
    '',
    'Biggest movers (up):',
    ...p.movers.up.map((m) => `  ${m.name}: +${m.deltaPct.toFixed(2)}%`),
    'Biggest movers (down):',
    ...p.movers.down.map((m) => `  ${m.name}: ${m.deltaPct.toFixed(2)}%`),
    '',
    'Framework implications:',
    ...p.positioning.map((x) => `  - ${x}`),
    '',
    'Watchlist:',
    ...p.watchlist.map((w) => `  - ${w.label}: ${w.why}`),
    '',
    `Quality: ${p.quality.overall} (ok=${p.quality.okCount} stale=${p.quality.staleCount} withheld=${p.quality.withheldCount})`,
  ].join('\n');
}

/** Minimal semantic HTML for email/legacy consumers — primary UI is React */
export function htmlFromPayload(p: NotebookPayload): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return [
    `<h2>Regime ${esc(p.regime.label)}</h2>`,
    `<ul>${p.thesis.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
    `<h3>Biggest movers</h3>`,
    `<ul>${[...p.movers.up, ...p.movers.down]
      .map((m) => `<li>${esc(m.name)}: ${m.deltaPct.toFixed(2)}%</li>`)
      .join('')}</ul>`,
    `<h3>Framework implications</h3>`,
    `<ul>${p.positioning.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
    `<h3>Watchlist</h3>`,
    `<ul>${p.watchlist.map((w) => `<li><strong>${esc(w.label)}</strong> — ${esc(w.why)}</li>`).join('')}</ul>`,
  ].join('\n');
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run src/features/regime-digest/lib/__tests__/buildNotebookPayload.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/regime-digest/lib/buildNotebookPayload.ts src/features/regime-digest/lib/__tests__/buildNotebookPayload.test.ts
git commit -m "feat(regime-digest): notebook payload orchestrator and quality gate"
```

---

### Task 5: DB migration — `notebook_payload`

**Files:**
- Create: `supabase/migrations/20260728000000_monthly_digest_notebook_payload.sql`

**Interfaces:**
- Produces: column `notebook_payload jsonb` on `monthly_regime_digests`

- [ ] **Step 1: Write migration**

```sql
-- Monthly Regime Notebook: frozen structured payload for edition pages
ALTER TABLE public.monthly_regime_digests
  ADD COLUMN IF NOT EXISTS notebook_payload JSONB;

COMMENT ON COLUMN public.monthly_regime_digests.notebook_payload IS
  'Structured Monthly Regime Notebook (v1): board, thesis, movers, regime, quality. Source of truth for UI.';

-- Optional helper index for quality ops queries
CREATE INDEX IF NOT EXISTS idx_monthly_regime_digests_notebook_quality
  ON public.monthly_regime_digests ((notebook_payload -> 'quality' ->> 'overall'));
```

- [ ] **Step 2: Apply**

```bash
# Prefer project automation:
npm run backend:migrate
# or: supabase db push / dashboard SQL for remote
```

Expected: column exists; existing rows have `notebook_payload` null until backfill.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260728000000_monthly_digest_notebook_payload.sql
git commit -m "feat(db): add notebook_payload to monthly_regime_digests"
```

---

### Task 6: Deno shared notebook + rewrite edge function (no LLM required)

**Files:**
- Create: `supabase/functions/_shared/regime-digest/notebook.ts`  
  Copy the pure functions from Tasks 1–4 (same exports: `DIGEST_METRICS`, `validateObservation`, `buildNotebookPayload`, `subjectFromPayload`, `plainTextFromPayload`, `htmlFromPayload`). Keep API identical so future sync is mechanical.
- Modify: `supabase/functions/generate-monthly-regime-digest/index.ts`

**Interfaces:**
- Consumes: `metric_observations`, optional `daily_signal` / morning brief regime, `daily_macro_briefs` for links
- Produces: upsert with `notebook_payload`, deterministic `subject_line` / `html_content` / `plain_text`, `metrics_snapshot` (compat)

- [ ] **Step 1: Port pure modules into `_shared/regime-digest/notebook.ts`**

Copy the full content of:
- types (as interfaces)
- metricCatalog
- validateMetric
- computeMom
- buildThesis
- positioning
- buildWatchlist
- buildNotebookPayload  

into one Deno file (or split under `_shared/regime-digest/`). No Node-only imports.

- [ ] **Step 2: Replace `doGenerateDigest` data path**

Key behavior (rewrite `doGenerateDigest`):

1. Resolve `year_month` (existing).
2. For each `DIGEST_METRICS` id, query `metric_observations` for last ~24 months of `(value, as_of_date)` ordered desc (enough for MoM + stale checks).  
   ```typescript
   const { data } = await supabase
     .from('metric_observations')
     .select('metric_id, value, as_of_date')
     .in('metric_id', DIGEST_METRICS.map((m) => m.id))
     .gte('as_of_date', /* year_month - 24 months */)
     .order('as_of_date', { ascending: false });
   ```
3. Map rows → `RawMetricPoint[]` (`id: metric_id`, `asOf: as_of_date`).
4. Regime freeze: read latest `daily_signal` (or whatever table `useDailyMacroSignal` uses) with `signal_date <= lastDayOfMonth(year_month)`; compute `daysInRegime` by walking consecutive days with same label; map to `NotebookRegime`. If missing, default `{ label: 'NEUTRAL', confidence: null, daysInRegime: null, compositeScore: null }` and let quality become `partial`.
5. History: last 12 months’ digests’ `notebook_payload.regime.label` if present, else skip.
6. Brief links:  
   ```typescript
   .from('daily_macro_briefs')
   .select('brief_date, ...')
   .gte('brief_date', `${year_month}-01`)
   .lte('brief_date', lastDay)
   ```
   Map to `{ date, url: `/macro-brief/${date}/`, title }`.
7. `editionNumber`: count of digests with `year_month <= target` (or null).
8. `payload = buildNotebookPayload(...)`.
9. If `payload.quality.overall === 'blocked'`:  
   - Do **not** upsert over an existing good row.  
   - Return `{ ok: false, error: 'blocked quality', meta: payload.quality }` for single-month runs.  
   - For catch-up, record error and continue.
10. Else upsert:

```typescript
await supabaseClient.from('monthly_regime_digests').upsert({
  year_month,
  subject_line: subjectFromPayload(payload),
  html_content: htmlFromPayload(payload),
  plain_text: plainTextFromPayload(payload),
  metrics_snapshot: /* compact legacy shape from board for MetricsStrip compat */,
  notebook_payload: payload,
  generated_at: new Date().toISOString(),
}, { onConflict: 'year_month' });
```

11. **Remove LLM as publish requirement.** Delete or gate OpenRouter/AIMLAPI loop behind `body.use_llm === true` (default false). Default path is rules-only.

- [ ] **Step 3: Local/typecheck edge mentally; run unit tests still pass**

```bash
npx vitest run src/features/regime-digest/lib
```

- [ ] **Step 4: Deploy function (when ready)**

```bash
# project convention
npm run backend:deploy
# or supabase functions deploy generate-monthly-regime-digest
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/regime-digest supabase/functions/generate-monthly-regime-digest/index.ts
git commit -m "feat(regime-digest): rules-only monthly notebook generator"
```

---

### Task 7: Frontend types + `useRegimeDigest`

**Files:**
- Modify: `src/features/regime-digest/hooks/useRegimeDigest.ts`

**Interfaces:**
- Produces: `Digest` with `notebook_payload: NotebookPayload | null`

- [ ] **Step 1: Update types and select**

```typescript
import type { NotebookPayload } from '@/features/regime-digest/lib/types';

export interface Digest {
  id: string;
  year_month: string;
  html_content: string;
  plain_text: string;
  subject_line: string;
  created_at?: string;
  generated_at?: string | null;
  metrics_snapshot?: MetricsSnapshot | null;
  notebook_payload?: NotebookPayload | null;
}
```

Keep regenerate mutation invoking the same edge function.

- [ ] **Step 2: Smoke import**

```bash
npx vitest run src/smoke.test.tsx
```

Fix mock in `src/smoke.test.tsx` if it asserts digest shape.

- [ ] **Step 3: Commit**

```bash
git add src/features/regime-digest/hooks/useRegimeDigest.ts src/smoke.test.tsx
git commit -m "feat(regime-digest): load notebook_payload in useRegimeDigest"
```

---

### Task 8: UI components (structured notebook)

**Files:**
- Create components under `src/features/regime-digest/components/`:
  - `EditionHeader.tsx`
  - `RegimeStrip.tsx`
  - `DeskBrief.tsx`
  - `Scoreboard.tsx`
  - `RegimeHistory.tsx`
  - `BriefIndex.tsx`
  - `QualityFooter.tsx`

**Interfaces:**
- Consumes: `NotebookPayload`
- Produces: presentational React trees only

- [ ] **Step 1: Implement components** (terminal dark, tabular nums, status chips)

Minimum props:

```typescript
// EditionHeader
{ yearMonth: string; publishedAt?: string; asOf: string | null; editionNumber: number | null }

// RegimeStrip
{ regime: NotebookRegime }

// DeskBrief
{ thesis: string[]; movers: NotebookPayload['movers']; positioning: string[]; watchlist: WatchItem[] }

// Scoreboard
{ board: MetricRow[] }  // group by section; table desktop / cards mobile

// RegimeHistory
{ history: { yearMonth: string; regime: RegimeLabel }[] }

// BriefIndex
{ links: NotebookPayload['briefLinks'] }

// QualityFooter
{ quality: NotebookPayload['quality']; asOf: string | null }
```

Rules:
- Status chips: OK / Stale / Missing / Withheld with icon + text
- No emoji
- Color not sole indicator
- Scoreboard hides empty sections
- Δ% use tabular-nums; green/red + arrow icon
- Positioning card includes one-line: “Framework implications — not personalized advice.”

- [ ] **Step 2: Optional lightweight render test** (if project patterns favor component tests)

```bash
npx vitest run src/features/regime-digest
```

- [ ] **Step 3: Commit**

```bash
git add src/features/regime-digest/components
git commit -m "feat(regime-digest): notebook UI components"
```

---

### Task 9: Rewrite `RegimeDigestPage`

**Files:**
- Modify: `src/pages/RegimeDigestPage.tsx`

- [ ] **Step 1: Prefer `notebook_payload` render path**

```tsx
const payload = digest.notebook_payload;
if (payload) {
  return (
    <>
      <EditionHeader ... />
      {payload.quality.overall === 'partial' && (
        <div className="...amber banner">Partial data quality — some metrics withheld or stale.</div>
      )}
      <RegimeStrip regime={payload.regime} />
      <DeskBrief ... />
      <Scoreboard board={payload.board} />
      <RegimeHistory history={payload.history} />
      <BriefIndex links={payload.briefLinks} />
      <QualityFooter ... />
      {/* keep archive link + share + subscribe CTA */}
    </>
  );
}
// Legacy fallback: existing html_content path for rows without notebook_payload
```

- [ ] **Step 2: SEO**

```tsx
const regimeLabel = payload?.regime.label?.replace('_', ' ') ?? 'Macro';
const metaFact =
  payload?.thesis[0] ??
  'Institutional monthly regime synthesis from GraphiQuestor telemetry.';
const title = `${formattedMonthYear} Macro Regime Digest: ${regimeLabel} | GraphiQuestor`;
// description: unique, ~150 chars from thesis + regime
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: title,
  datePublished: payload?.publishedAt ?? digest.generated_at ?? digest.created_at,
  dateModified: payload?.publishedAt ?? digest.generated_at ?? digest.created_at,
  author: { '@type': 'Organization', name: 'GraphiQuestor' },
  publisher: { '@type': 'Organization', name: 'GraphiQuestor', url: 'https://graphiquestor.com' },
  mainEntityOfPage: `https://graphiquestor.com/regime-digest/${year}/${month}/`,
  description: metaFact.slice(0, 160),
};

<SEOManager
  title={title}
  description={metaFact.slice(0, 160)}
  ogType="article"
  publishedTime={...}
  jsonLd={jsonLd}
  canonical={`https://graphiquestor.com/regime-digest/${year}/${month}/`}
  ogImage={...}
/>
```

- [ ] **Step 3: Remove dual H1 / “GraphiQuestor AI” / LLM language**  
  Single H1: `{Month} {Year} Macro Regime Digest`. Sub: “Desk brief · Scoreboard · Automated rules”.

- [ ] **Step 4: Manual check**

```bash
npm run dev
# open /regime-digest/2026/06/ after generating notebook payload
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/RegimeDigestPage.tsx
git commit -m "feat(regime-digest): render monthly notebook UI with unique SEO"
```

---

### Task 10: Rewrite archive page

**Files:**
- Modify: `src/pages/RegimeDigestArchivePage.tsx`

- [ ] **Step 1: Select fields including payload slice**

```typescript
.select('id, year_month, subject_line, generated_at, notebook_payload')
```

- [ ] **Step 2: Featured latest card**  
  Regime badge, thesis line 1, CTA “Read edition”.

- [ ] **Step 3: Grid cards** with regime badge; keep gap months list.

- [ ] **Step 4: SEO** unique archive description (not site-wide generic if possible).

- [ ] **Step 5: Commit**

```bash
git add src/pages/RegimeDigestArchivePage.tsx
git commit -m "feat(regime-digest): archive featured edition and regime badges"
```

---

### Task 11: Backfill + catch-up force refresh

**Files:**
- Modify: `supabase/functions/generate-monthly-regime-digest/index.ts` (catch_up)
- Optional: `scripts/backfill-monthly-notebook.ts` if project prefers scripted invoke

- [ ] **Step 1: Extend catch-up**  
  Support `body.force === true` to regenerate months even if row exists (rebuild notebook_payload).  
  Window: from `2026-02` (first archive edition) through current UTC month.

- [ ] **Step 2: Invoke**

```bash
# example
curl -X POST "$SUPABASE_URL/functions/v1/generate-monthly-regime-digest" \
  -H "Authorization: Bearer $SERVICE_ROLE" \
  -H "Content-Type: application/json" \
  -d '{"catch_up": true, "force": true}'
```

Expected: each month gets `notebook_payload.generation.mode === "notebook_v1"`; no CPI 332; quality not blocked for months with core data.

- [ ] **Step 3: Commit force flag**

```bash
git add supabase/functions/generate-monthly-regime-digest/index.ts
git commit -m "feat(regime-digest): force catch-up rebuild for notebook payloads"
```

---

### Task 12: Verification gate

**Files:** none new (commands only)

- [ ] **Step 1: Unit tests**

```bash
npx vitest run src/features/regime-digest
```

Expected: all pass.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

- [ ] **Step 3: Acceptance checklist (manual)**

| # | Check |
|---|--------|
| 1 | Edition shows single H1 |
| 2 | Regime strip visible |
| 3 | Thesis 3–5 lines, no LLM fallback copy |
| 4 | Movers show MoM % |
| 5 | Scoreboard has Prior / Δ / Δ% / Status |
| 6 | Invalidated numbers withheld |
| 7 | Unique title/meta; JSON-LD present in DOM |
| 8 | Archive featured + regime badge |
| 9 | Subscribe CTA still present |
| 10 | Legacy months without payload still don’t crash (fallback) |

- [ ] **Step 4: Final commit if any polish**

```bash
git add -A src/features/regime-digest src/pages/RegimeDigestPage.tsx src/pages/RegimeDigestArchivePage.tsx
git commit -m "chore(regime-digest): polish notebook verification fixes"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Hybrid desk brief + scoreboard | 8–9 |
| Fully automated / no LLM required | 6 |
| MoM % + prior | 2, 6, 8 |
| Next-month watch | 3, 6, 8 |
| Validation gates / no 332% CPI | 1, 4, 6 |
| Regime strip + history | 4, 6, 8–9 |
| Daily brief links | 6, 8 |
| Quality footer / partial banner | 4, 8–9 |
| Archive featured + gaps | 10 |
| Unique SEO + JSON-LD | 9 |
| Subscribe CTA | 9–10 (retain existing) |
| Backfill | 11 |
| No new vendors | Global + metric catalog |

## Sync note

`src/features/regime-digest/lib/*` and `supabase/functions/_shared/regime-digest/*` must stay API-compatible. Prefer changing pure logic in `src` first with tests, then port to `_shared`.

## Out of scope (do not implement in this plan)

- LLM narrative re-enable as default  
- New data feeds  
- CSV/PDF, interactive compare  
- Email provider changes  
- Paywall  

---

**Plan complete path:** `docs/superpowers/plans/2026-07-27-regime-digest-monthly-notebook.md`
