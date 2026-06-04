# Morning Macro Brief Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Morning Macro Brief" — a pre-generated, daily AI summary page at `/macro-brief` that serves both as the #1 daily-use product feature and as 365 permanent SEO pages/year.

**Architecture:** A Supabase Edge Function runs at 05:30 UTC daily, queries `vw_latest_metrics` + `vw_latest_daily_signal` for changed metrics and regime state, calls OpenRouter (nemotron-free), and stores the brief in `daily_macro_briefs`. The React page just fetches and renders the pre-generated content — no client-side AI calls. Focus area personalization is localStorage-only with no auth.

**Tech Stack:** React 18 + TypeScript, TanStack Query v5, Supabase (Postgres + Deno Edge Functions), React Router v7, MUI v5 / Tailwind / shadcn-ui, date-fns, vitest + jsdom for tests.

---

## File Map

**Create:**
- `supabase/migrations/20260604000000_daily_macro_briefs.sql` — table + index
- `src/hooks/useMacroBrief.ts` — TanStack Query hook fetching from `daily_macro_briefs`
- `src/components/brief/FocusAreaSelector.tsx` — localStorage-backed multi-select, max 3
- `src/pages/MacroBrief.tsx` — dated brief page, redirect logic, countdown timer
- `src/pages/MacroBriefArchive.tsx` — chronological archive list
- `supabase/functions/generate-morning-brief/index.ts` — daily edge function
- `src/components/brief/__tests__/FocusAreaSelector.test.tsx` — unit tests

**Modify:**
- `src/App.tsx` — add 3 new routes
- `src/layout/GlobalLayout.tsx` — add nav entry to `terminalNavItems`
- `public/sitemap.xml` — add `/macro-brief` and `/macro-brief/archive` entries
- `vite.config.ts` — add sitemap generator plugin that appends last-30-days brief URLs

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260604000000_daily_macro_briefs.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- ============================================================
-- Migration: daily_macro_briefs
-- Date: 2026-06-04
-- Purpose: Stores pre-generated morning macro briefs.
--   One row per (brief_date, focus_areas[]).
--   The Edge Function upserts daily at 05:30 UTC.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_macro_briefs (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_date      date        NOT NULL,
  focus_areas     text[]      NOT NULL DEFAULT '{}',
  content         jsonb       NOT NULL,
  regime_score    integer,
  regime_label    text,
  generated_at    timestamptz DEFAULT now(),
  model_used      text,
  tokens_used     integer,
  CONSTRAINT daily_macro_briefs_unique_date_focus
    UNIQUE (brief_date, focus_areas)
);

CREATE INDEX IF NOT EXISTS idx_daily_macro_briefs_date
  ON public.daily_macro_briefs (brief_date DESC);

-- RLS: read-only for anonymous (needed for client-side fetch)
ALTER TABLE public.daily_macro_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_macro_briefs_select"
  ON public.daily_macro_briefs
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

- [ ] **Step 2: Apply the migration locally**

```bash
supabase db diff --local
supabase migration up --local
```

Expected: Migration applied, table `daily_macro_briefs` visible in local DB.

If local Supabase isn't running, apply via the remote MCP tool or Supabase dashboard. The schema is idempotent (`IF NOT EXISTS`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260604000000_daily_macro_briefs.sql
git commit -m "feat(db): add daily_macro_briefs table for morning brief storage"
```

---

## Task 2: `useMacroBrief` Hook

**Files:**
- Create: `src/hooks/useMacroBrief.ts`

- [ ] **Step 1: Write the failing test first**

Create `src/hooks/__tests__/useMacroBrief.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before hook import
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import type { BriefContent, DailyMacroBrief } from '@/hooks/useMacroBrief';

describe('BriefContent type', () => {
  it('satisfies the expected shape', () => {
    const content: BriefContent = {
      what_changed: ['◆ US 10Y +8bps → Real yield positive'],
      regime_status: 'Fiscal dominance deepening.',
      focus_observations: ['India FX reserves under pressure'],
      watch_today: ['US CPI print at 14:30 ET'],
    };
    expect(content.what_changed).toHaveLength(1);
    expect(content.focus_observations).toHaveLength(1);
  });
});

describe('getFocusAreasKey', () => {
  it('sorts and joins focus areas into a canonical key', async () => {
    const { getFocusAreasKey } = await import('@/hooks/useMacroBrief');
    expect(getFocusAreasKey(['gold', 'us', 'india'])).toBe('gold,india,us');
    expect(getFocusAreasKey(['us', 'india', 'gold'])).toBe('gold,india,us');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/hooks/__tests__/useMacroBrief.test.ts
```

Expected: FAIL — `useMacroBrief` module not found.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useMacroBrief.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type FocusAreaCode = 'us' | 'india' | 'china' | 'africa' | 'energy' | 'sovereign' | 'gold' | 'trade';

export interface BriefContent {
  what_changed: string[];       // 3-5 bullet strings
  regime_status: string;        // 2-sentence paragraph
  focus_observations: string[]; // 3 bullets
  watch_today: string[];        // 2-3 bullets (scheduled events)
}

export interface DailyMacroBrief {
  id: string;
  brief_date: string;           // YYYY-MM-DD
  focus_areas: string[];
  content: BriefContent;
  regime_score: number | null;
  regime_label: string | null;
  generated_at: string;
  model_used: string | null;
  tokens_used: number | null;
}

export const DEFAULT_FOCUS_AREAS: FocusAreaCode[] = ['us', 'india', 'gold'];

/** Canonical sort + join so ['gold','us','india'] === ['us','india','gold'] */
export function getFocusAreasKey(areas: string[]): string {
  return [...areas].sort().join(',');
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetches the pre-generated brief for a given date and focus areas.
 * Falls back to the default focus areas (us,india,gold) if no exact match.
 * Falls back to yesterday's brief if today's hasn't been generated yet.
 */
export function useMacroBrief(
  focusAreas: FocusAreaCode[] = DEFAULT_FOCUS_AREAS,
  briefDate?: string
) {
  const targetDate = briefDate || todayISO();
  const focusKey = getFocusAreasKey(focusAreas);
  const defaultKey = getFocusAreasKey(DEFAULT_FOCUS_AREAS);

  return useQuery({
    queryKey: ['macro-brief', targetDate, focusKey],
    queryFn: async (): Promise<{ brief: DailyMacroBrief; isYesterday: boolean } | null> => {
      // 1. Try exact match for requested date + focus areas
      const { data: exact } = await supabase
        .from('daily_macro_briefs')
        .select('*')
        .eq('brief_date', targetDate)
        .contains('focus_areas', focusAreas)
        .containedBy('focus_areas', focusAreas)
        .maybeSingle();

      if (exact) return { brief: exact as DailyMacroBrief, isYesterday: false };

      // 2. Fall back to default focus areas for requested date
      if (focusKey !== defaultKey) {
        const { data: defaultBrief } = await supabase
          .from('daily_macro_briefs')
          .select('*')
          .eq('brief_date', targetDate)
          .contains('focus_areas', DEFAULT_FOCUS_AREAS)
          .containedBy('focus_areas', DEFAULT_FOCUS_AREAS)
          .maybeSingle();

        if (defaultBrief) return { brief: defaultBrief as DailyMacroBrief, isYesterday: false };
      }

      // 3. Today's brief not generated yet — fetch most recent available
      const { data: recent } = await supabase
        .from('daily_macro_briefs')
        .select('*')
        .order('brief_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent) {
        const isYesterday = recent.brief_date !== targetDate;
        return { brief: recent as DailyMacroBrief, isYesterday };
      }

      return null;
    },
    staleTime: 1000 * 60 * 60 * 4, // 4 hours — data is daily
    gcTime: 1000 * 60 * 60 * 8,
    retry: 1,
  });
}

/** Fetches all brief summaries for archive page — no content, just metadata */
export function useMacroBriefArchive() {
  return useQuery({
    queryKey: ['macro-brief-archive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_macro_briefs')
        .select('id, brief_date, regime_label, regime_score, generated_at, focus_areas')
        .order('brief_date', { ascending: false })
        .limit(90); // 3 months

      if (error) throw error;
      return (data ?? []) as Pick<DailyMacroBrief, 'id' | 'brief_date' | 'regime_label' | 'regime_score' | 'generated_at' | 'focus_areas'>[];
    },
    staleTime: 1000 * 60 * 15,
  });
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx vitest run src/hooks/__tests__/useMacroBrief.test.ts
```

Expected: PASS on both test cases.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMacroBrief.ts src/hooks/__tests__/useMacroBrief.test.ts
git commit -m "feat(hooks): add useMacroBrief and useMacroBriefArchive for daily brief data"
```

---

## Task 3: `FocusAreaSelector` Component

**Files:**
- Create: `src/components/brief/FocusAreaSelector.tsx`
- Create: `src/components/brief/__tests__/FocusAreaSelector.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/brief/__tests__/FocusAreaSelector.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusAreaSelector } from '../FocusAreaSelector';
import type { FocusAreaCode } from '@/hooks/useMacroBrief';

// localStorage mock is provided by jsdom

describe('FocusAreaSelector', () => {
  const noop = () => {};
  
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all 8 focus area options', () => {
    render(
      <FocusAreaSelector
        selected={['us', 'india', 'gold']}
        onChange={noop}
        open={true}
        onClose={noop}
      />
    );
    expect(screen.getByText('US Macro')).toBeInTheDocument();
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('Gold & De-Dollarization')).toBeInTheDocument();
    expect(screen.getByText('China')).toBeInTheDocument();
    expect(screen.getByText('Africa')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Sovereign Debt')).toBeInTheDocument();
    expect(screen.getByText('Trade Flows')).toBeInTheDocument();
  });

  it('marks selected areas as checked', () => {
    render(
      <FocusAreaSelector
        selected={['india', 'gold']}
        onChange={noop}
        open={true}
        onClose={noop}
      />
    );
    // The India and Gold buttons should have aria-pressed=true or data-selected
    const indiaBtn = screen.getByRole('button', { name: /India/i });
    expect(indiaBtn).toHaveAttribute('data-selected', 'true');
    const usBtn = screen.getByRole('button', { name: /US Macro/i });
    expect(usBtn).toHaveAttribute('data-selected', 'false');
  });

  it('calls onChange when toggling a selection', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us', 'india']}
        onChange={onChange}
        open={true}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Gold/i }));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['us', 'india', 'gold']));
  });

  it('enforces max 3 selections — 4th click does nothing', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us', 'india', 'gold']}
        onChange={onChange}
        open={true}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /China/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('allows deselection even when at max', () => {
    const onChange = vi.fn();
    render(
      <FocusAreaSelector
        selected={['us', 'india', 'gold']}
        onChange={onChange}
        open={true}
        onClose={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /US Macro/i }));
    expect(onChange).toHaveBeenCalledWith(expect.not.arrayContaining(['us']));
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/components/brief/__tests__/FocusAreaSelector.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/brief/FocusAreaSelector.tsx`:

```typescript
import React from 'react';
import type { FocusAreaCode } from '@/hooks/useMacroBrief';

interface FocusArea {
  code: FocusAreaCode;
  label: string;
  emoji: string;
}

export const FOCUS_AREAS: FocusArea[] = [
  { code: 'us',       label: 'US Macro',               emoji: '🇺🇸' },
  { code: 'india',    label: 'India',                  emoji: '🇮🇳' },
  { code: 'china',    label: 'China',                  emoji: '🇨🇳' },
  { code: 'africa',   label: 'Africa',                 emoji: '🌍' },
  { code: 'energy',   label: 'Energy',                 emoji: '⚡' },
  { code: 'sovereign',label: 'Sovereign Debt',         emoji: '🏦' },
  { code: 'gold',     label: 'Gold & De-Dollarization',emoji: '💛' },
  { code: 'trade',    label: 'Trade Flows',            emoji: '🔄' },
];

const MAX_SELECTIONS = 3;

interface FocusAreaSelectorProps {
  selected: FocusAreaCode[];
  onChange: (areas: FocusAreaCode[]) => void;
  open: boolean;
  onClose: () => void;
}

export const FocusAreaSelector: React.FC<FocusAreaSelectorProps> = ({
  selected,
  onChange,
  open,
  onClose,
}) => {
  if (!open) return null;

  const toggle = (code: FocusAreaCode) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else if (selected.length < MAX_SELECTIONS) {
      onChange([...selected, code]);
    }
    // Silent no-op if at max and trying to add
  };

  return (
    <div
      className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
          Focus Areas <span className="text-white/20">({selected.length}/{MAX_SELECTIONS})</span>
        </span>
        <button
          onClick={onClose}
          className="text-[10px] font-black uppercase text-white/30 hover:text-white/60 transition-colors"
        >
          Done
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {FOCUS_AREAS.map((area) => {
          const isSelected = selected.includes(area.code);
          const isDisabled = !isSelected && selected.length >= MAX_SELECTIONS;

          return (
            <button
              key={area.code}
              onClick={() => toggle(area.code)}
              data-selected={isSelected ? 'true' : 'false'}
              disabled={isDisabled}
              aria-pressed={isSelected}
              className={[
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-all',
                isSelected
                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                  : isDisabled
                  ? 'bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/[0.04] border border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80',
              ].join(' ')}
            >
              <span>{area.emoji}</span>
              <span className="leading-tight">{area.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[9px] text-white/20 text-center uppercase tracking-widest">
        Personalizes Section 3 of the brief. No login required.
      </p>
    </div>
  );
};
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx vitest run src/components/brief/__tests__/FocusAreaSelector.test.tsx
```

Expected: PASS on all 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/brief/FocusAreaSelector.tsx src/components/brief/__tests__/FocusAreaSelector.test.tsx
git commit -m "feat(ui): add FocusAreaSelector with localStorage-backed multi-select (max 3)"
```

---

## Task 4: `MacroBrief` Page

**Files:**
- Create: `src/pages/MacroBrief.tsx`

This page:
1. When rendered at `/macro-brief` (no URL params), redirects to today's dated URL `/macro-brief/2026/06/04`
2. When rendered at `/macro-brief/:year/:month/:day`, fetches and renders the brief
3. Reads focus areas from localStorage; updates on FocusAreaSelector change
4. Shows countdown to 9:30 AM ET
5. Shows "Today's brief generating..." when `isYesterday === true`

- [ ] **Step 1: Implement the page**

Create `src/pages/MacroBrief.tsx`:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useMacroBrief, DEFAULT_FOCUS_AREAS } from '@/hooks/useMacroBrief';
import type { FocusAreaCode, BriefContent } from '@/hooks/useMacroBrief';
import { FocusAreaSelector } from '@/components/brief/FocusAreaSelector';
import { Settings2, ChevronLeft, ChevronRight, AlertCircle, Clock, Zap } from 'lucide-react';
import { format, subDays, addDays, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const LS_KEY = 'gq_focus_areas';

function loadFocusAreas(): FocusAreaCode[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as FocusAreaCode[];
    }
  } catch {
    // ignore
  }
  return DEFAULT_FOCUS_AREAS;
}

function saveFocusAreas(areas: FocusAreaCode[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(areas));
}

/** Returns ms until next 9:30 AM ET from now */
function msUntilNYOpen(): number {
  const now = new Date();
  const nyNow = toZonedTime(now, 'America/New_York');
  const target = new Date(nyNow);
  target.setHours(9, 30, 0, 0);
  if (nyNow >= target) target.setDate(target.getDate() + 1);
  return target.getTime() - nyNow.getTime();
}

function useCountdown(): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const tick = () => {
      const ms = msUntilNYOpen();
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1_000);
      if (h > 23) {
        setLabel('Market Open');
        return;
      }
      setLabel(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return label;
}

// ── Redirect wrapper ──────────────────────────────────────────────────────
const MacroBriefRedirect: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    navigate(`/macro-brief/${y}/${m}/${day}`, { replace: true });
  }, [navigate]);
  return null;
};

// ── Skeleton loader ────────────────────────────────────────────────────────
const BriefSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-8 w-72 bg-white/5" />
    <Skeleton className="h-4 w-48 bg-white/5" />
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-full bg-white/5 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-24 w-full bg-white/5 rounded-xl" />
  </div>
);

// ── Section rendering helpers ─────────────────────────────────────────────
const BulletRow: React.FC<{ text: string; accent?: boolean }> = ({ text, accent }) => (
  <div
    className={[
      'flex items-start gap-3 rounded-lg px-4 py-3 border transition-colors',
      accent
        ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]',
    ].join(' ')}
  >
    <span className="text-blue-400/70 font-black text-sm mt-0.5 flex-shrink-0">◆</span>
    <p className="text-sm leading-relaxed text-white/80 font-medium">{text}</p>
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; tag?: string }> = ({ children, tag }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">
      {children}
    </span>
    {tag && (
      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/30 uppercase tracking-wider">
        {tag}
      </span>
    )}
    <div className="h-px flex-1 bg-white/5" />
  </div>
);

// ── Main brief content ────────────────────────────────────────────────────
interface BriefContentProps {
  content: BriefContent;
  regimeLabel: string | null;
  regimeScore: number | null;
  briefDate: string;
  isYesterday: boolean;
  focusAreas: FocusAreaCode[];
}

const BriefContentView: React.FC<BriefContentProps> = ({
  content,
  regimeLabel,
  regimeScore,
  briefDate,
  isYesterday,
  focusAreas,
}) => {
  const countdown = useCountdown();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [localFocusAreas, setLocalFocusAreas] = useState(focusAreas);

  // Sync external prop changes
  useEffect(() => { setLocalFocusAreas(focusAreas); }, [focusAreas]);

  const parsedDate = isValid(parseISO(briefDate)) ? parseISO(briefDate) : new Date();
  const dayLabel = format(parsedDate, 'EEEE, MMMM d, yyyy');
  const prevDate = subDays(parsedDate, 1);
  const nextDate = addDays(parsedDate, 1);
  const isToday = briefDate === new Date().toISOString().slice(0, 10);
  const regimeColor = regimeLabel?.toLowerCase().includes('expansion') ? 'text-emerald-400'
    : regimeLabel?.toLowerCase().includes('tight') ? 'text-rose-400'
    : 'text-blue-400';

  return (
    <div className="space-y-8">
      {/* Generating banner */}
      {isYesterday && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Zap size={14} className="text-amber-400 flex-shrink-0" />
          <span className="text-xs font-bold text-amber-400/90">
            Today&apos;s brief is generating — showing {format(prevDate, 'MMM d')} brief in the meantime.
          </span>
        </div>
      )}

      {/* Header bar */}
      <div
        className="rounded-2xl px-5 py-4 border border-white/8 flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'rgba(8,12,24,0.7)', backdropFilter: 'blur(12px)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/35 font-mono">
              Morning Macro Brief
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none">
            {dayLabel}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown */}
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-widest text-white/25 font-mono mb-0.5">
              Markets Open In
            </div>
            <div className="text-sm font-black text-white/70 font-mono tabular-nums flex items-center gap-1.5">
              <Clock size={12} className="text-white/30" />
              {countdown}
            </div>
          </div>

          {/* Regime badge */}
          {regimeLabel && (
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5`}
            >
              <span className={`text-xs font-black uppercase ${regimeColor}`}>
                {regimeLabel}
              </span>
              {regimeScore !== null && (
                <span className="text-[10px] font-mono text-white/30">{regimeScore}</span>
              )}
            </div>
          )}

          {/* Focus area gear */}
          <div className="relative">
            <button
              onClick={() => setSelectorOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Customize focus areas"
            >
              <Settings2 size={13} className="text-white/50" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40 hidden sm:block">
                Focus
              </span>
            </button>
            <FocusAreaSelector
              selected={localFocusAreas}
              onChange={(areas) => {
                setLocalFocusAreas(areas);
                saveFocusAreas(areas);
              }}
              open={selectorOpen}
              onClose={() => setSelectorOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Section 1: What Changed Overnight */}
      <section>
        <SectionLabel tag="3–5 signals">What Changed Overnight</SectionLabel>
        <div className="space-y-2">
          {content.what_changed.map((bullet, i) => (
            <BulletRow key={i} text={bullet} accent={i === 0} />
          ))}
        </div>
      </section>

      {/* Section 2: Regime Status */}
      <section>
        <SectionLabel>Regime Status</SectionLabel>
        <div
          className="rounded-xl px-5 py-4 border border-white/8 text-sm leading-relaxed text-white/75 font-medium"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          {content.regime_status}
        </div>
      </section>

      {/* Section 3: Focus Areas */}
      <section>
        <SectionLabel tag={localFocusAreas.join(' · ')}>Focus Areas</SectionLabel>
        <div className="space-y-2">
          {content.focus_observations.map((obs, i) => (
            <BulletRow key={i} text={obs} />
          ))}
        </div>
      </section>

      {/* Section 4: Watch Today */}
      {content.watch_today.length > 0 && (
        <section>
          <SectionLabel>Watch Today</SectionLabel>
          <div className="space-y-2">
            {content.watch_today.map((item, i) => (
              <BulletRow key={i} text={item} />
            ))}
          </div>
        </section>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between pt-6 border-t border-white/8">
        <Link
          to={`/macro-brief/${format(prevDate, 'yyyy/MM/dd')}`}
          className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={14} />
          {format(prevDate, 'MMM d')} Brief
        </Link>

        <Link
          to="/macro-brief/archive"
          className="text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
        >
          Archive →
        </Link>

        {!isToday && (
          <Link
            to={`/macro-brief/${format(nextDate, 'yyyy/MM/dd')}`}
            className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
          >
            {format(nextDate, 'MMM d')} Brief
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Methodology link */}
      <p className="text-center text-[10px] text-white/20 font-medium">
        <Link to="/methodology" className="hover:text-white/40 transition-colors underline-offset-2 underline decoration-white/10">
          How is this brief generated? →
        </Link>
      </p>
    </div>
  );
};

// ── Dated brief inner ─────────────────────────────────────────────────────
const MacroBriefInner: React.FC = () => {
  const { year, month, day } = useParams<{ year: string; month: string; day: string }>();
  const briefDate = year && month && day ? `${year}-${month}-${day}` : undefined;

  const [focusAreas, setFocusAreas] = useState<FocusAreaCode[]>(loadFocusAreas);

  const { data, isLoading, error } = useMacroBrief(focusAreas, briefDate);

  if (isLoading) return <BriefSkeleton />;

  if (error || !data) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle size={32} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-black text-white uppercase tracking-tight">
          Brief Unavailable
        </h2>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          No brief has been generated for this date yet. Check back after 05:30 UTC.
        </p>
        <Link
          to="/macro-brief"
          className="inline-block text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Latest Brief
        </Link>
      </div>
    );
  }

  const { brief, isYesterday } = data;
  const parsedDate = isValid(parseISO(brief.brief_date)) ? parseISO(brief.brief_date) : new Date();
  const displayDate = format(parsedDate, 'EEEE, MMMM d, yyyy');

  const description = brief.content.what_changed[0]?.slice(0, 155) || 'Daily institutional macro intelligence brief.';

  return (
    <>
      <SEOManager
        title={`Global Macro Brief — ${displayDate}`}
        description={description}
        ogType="article"
        publishedTime={brief.generated_at}
        canonicalUrl={`https://graphiquestor.com/macro-brief/${format(parsedDate, 'yyyy/MM/dd')}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: `Global Macro Brief — ${displayDate}`,
          description,
          datePublished: brief.generated_at,
          author: { '@type': 'Organization', name: 'GraphiQuestor' },
          publisher: {
            '@type': 'Organization',
            name: 'GraphiQuestor',
            logo: { '@type': 'ImageObject', url: 'https://graphiquestor.com/favicon.svg' },
          },
        }}
      />
      <BriefContentView
        content={brief.content}
        regimeLabel={brief.regime_label}
        regimeScore={brief.regime_score}
        briefDate={brief.brief_date}
        isYesterday={isYesterday}
        focusAreas={focusAreas}
      />
    </>
  );
};

// ── Public exports ─────────────────────────────────────────────────────────

/** Handles /macro-brief → redirects to today's dated URL */
export const MacroBriefToday: React.FC = () => <MacroBriefRedirect />;

/** Handles /macro-brief/:year/:month/:day */
export const MacroBrief: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <SectionErrorBoundary name="Morning Macro Brief">
        <MacroBriefInner />
      </SectionErrorBoundary>
    </div>
  );
};
```

**Important**: The `toZonedTime` import requires `date-fns-tz`. Check if it's already a dependency:

```bash
grep "date-fns-tz" /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard/package.json
```

If not present, install it:
```bash
npm install date-fns-tz
```

If `date-fns-tz` is unavailable or you want to avoid a new dep, replace `msUntilNYOpen` with this manual UTC offset approach:

```typescript
function msUntilNYOpen(): number {
  const now = new Date();
  // ET is UTC-4 (EDT) or UTC-5 (EST). Approximate with UTC-4 (EDT, valid Mar–Nov).
  const etOffsetHours = -4;
  const etNow = new Date(now.getTime() + etOffsetHours * 3_600_000);
  const target = new Date(etNow);
  target.setUTCHours(9 - etOffsetHours, 30, 0, 0); // 9:30 ET in UTC
  if (now >= target) target.setUTCDate(target.getUTCDate() + 1);
  return target.getTime() - now.getTime();
}
```
(Remove the `toZonedTime` import and use this version instead if `date-fns-tz` is not installed.)

- [ ] **Step 2: Commit**

```bash
git add src/pages/MacroBrief.tsx
git commit -m "feat(pages): add MacroBrief page with countdown, focus-area personalization, and dated URLs"
```

---

## Task 5: `MacroBriefArchive` Page

**Files:**
- Create: `src/pages/MacroBriefArchive.tsx`

- [ ] **Step 1: Implement the archive page**

Create `src/pages/MacroBriefArchive.tsx`:

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOManager } from '@/components/SEOManager';
import { useMacroBriefArchive } from '@/hooks/useMacroBrief';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

function briefPath(briefDate: string): string {
  const d = isValid(parseISO(briefDate)) ? parseISO(briefDate) : new Date();
  return `/macro-brief/${format(d, 'yyyy/MM/dd')}`;
}

function regimeColor(label: string | null): string {
  if (!label) return 'text-white/40';
  const l = label.toLowerCase();
  if (l.includes('expansion') || l.includes('recovery')) return 'text-emerald-400';
  if (l.includes('tight') || l.includes('slow')) return 'text-rose-400';
  return 'text-blue-400';
}

export const MacroBriefArchive: React.FC = () => {
  const { data: briefs, isLoading } = useMacroBriefArchive();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <SEOManager
        title="Morning Macro Brief Archive"
        description="Daily institutional macro intelligence briefs — what changed overnight, regime status, and focus area observations."
        canonicalUrl="https://graphiquestor.com/macro-brief/archive"
      />

      <div className="mb-10 space-y-2">
        <nav className="text-[10px] font-black uppercase tracking-widest text-white/25 flex items-center gap-2">
          <Link to="/" className="hover:text-white/50 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/macro-brief" className="hover:text-white/50 transition-colors">Brief</Link>
          <span>/</span>
          <span className="text-white/50">Archive</span>
        </nav>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Morning Brief Archive
        </h1>
        <p className="text-sm font-medium text-white/40 max-w-lg">
          Daily pre-market macro intelligence. Each brief is a permanent indexed page.
        </p>
      </div>

      <Card className="overflow-hidden bg-slate-950/50 border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : !briefs || briefs.length === 0 ? (
            <div className="p-12 text-center text-sm font-bold text-white/30 uppercase tracking-widest">
              No briefs published yet.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {briefs.map((brief, i) => {
                const parsedDate = isValid(parseISO(brief.brief_date))
                  ? parseISO(brief.brief_date)
                  : new Date();
                const isLatest = brief.brief_date === today;

                return (
                  <li key={brief.id} className="group">
                    <Link
                      to={briefPath(brief.brief_date)}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-white/50">
                          <Calendar size={12} className="text-white/25" />
                          {format(parsedDate, 'EEE, MMM d yyyy')}
                        </div>

                        {isLatest && (
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-[9px] font-black text-blue-400 uppercase tracking-wider">
                            Latest
                          </span>
                        )}

                        {brief.regime_label && (
                          <span className={`hidden sm:block text-xs font-black uppercase ${regimeColor(brief.regime_label)}`}>
                            {brief.regime_label}
                            {brief.regime_score !== null && (
                              <span className="ml-1.5 font-mono text-white/25">{brief.regime_score}</span>
                            )}
                          </span>
                        )}
                      </div>

                      <ChevronRight size={16} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/MacroBriefArchive.tsx
git commit -m "feat(pages): add MacroBriefArchive chronological list page"
```

---

## Task 6: Routes + Nav

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/layout/GlobalLayout.tsx`

- [ ] **Step 1: Add routes to App.tsx**

In `src/App.tsx`, after line 50 (the `NotFound` lazy import), add:

```typescript
const MacroBriefToday = lazy(() => import('@/pages/MacroBrief').then(module => ({ default: module.MacroBriefToday })));
const MacroBrief = lazy(() => import('@/pages/MacroBrief').then(module => ({ default: module.MacroBrief })));
const MacroBriefArchive = lazy(() => import('@/pages/MacroBriefArchive').then(module => ({ default: module.MacroBriefArchive })));
```

Then in the `<Routes>` block, before the catch-all `<Route path="*">`, add:

```tsx
{/* Morning Macro Brief */}
<Route path="/macro-brief" element={<MacroBriefToday />} />
<Route path="/macro-brief/archive" element={<MacroBriefArchive />} />
<Route path="/macro-brief/:year/:month/:day" element={<MacroBrief />} />
```

**Critical**: Place the `/macro-brief/archive` route BEFORE `/macro-brief/:year/:month/:day` — React Router matches top-down and "archive" must not be caught as a `year` param.

- [ ] **Step 2: Add nav entry to GlobalLayout.tsx**

In `src/layout/GlobalLayout.tsx`, the `terminalNavItems` array starts with `weekly-narrative`. Add the Morning Brief entry as the first item (highest priority in nav):

```typescript
const terminalNavItems = [
    { id: 'morning-brief', label: 'Morning Brief', path: '/macro-brief', icon: <FileText size={18} /> },
    // ... existing items unchanged ...
```

Add `Newspaper` to the lucide-react import if `FileText` feels too generic:
```typescript
import { ..., Newspaper } from 'lucide-react';
// Then:
{ id: 'morning-brief', label: 'Morning Brief', path: '/macro-brief', icon: <Newspaper size={18} /> },
```

- [ ] **Step 3: Verify lint passes**

```bash
npm run lint
```

Expected: 0 warnings, 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/layout/GlobalLayout.tsx
git commit -m "feat(routing): add /macro-brief routes and nav entry"
```

---

## Task 7: Sitemap + Vite Plugin

**Files:**
- Modify: `public/sitemap.xml`
- Modify: `vite.config.ts`

- [ ] **Step 1: Add static entries to sitemap.xml**

Open `public/sitemap.xml` and add these entries before the closing `</urlset>` tag. Find the block of "High-Level Sections" and insert after it:

```xml
  <!-- Morning Macro Brief -->
  <url>
    <loc>https://graphiquestor.com/macro-brief</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://graphiquestor.com/macro-brief/archive</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
```

- [ ] **Step 2: Add a Vite plugin to append last-30-days brief URLs at build time**

In `vite.config.ts`, add a new plugin function after `rssGeneratorPlugin`:

```typescript
function sitemapBriefPlugin(): Plugin {
    return {
        name: 'sitemap-brief-injector',
        closeBundle() {
            try {
                const sitemapPath = path.resolve(__dirname, 'public/sitemap.xml');
                if (!fs.existsSync(sitemapPath)) return;

                let sitemap = fs.readFileSync(sitemapPath, 'utf-8');

                // Generate last 30 days of brief URLs
                const today = new Date();
                const briefUrls: string[] = [];
                for (let i = 0; i < 30; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${y}-${m}-${day}`;
                    briefUrls.push(`  <url>
    <loc>https://graphiquestor.com/macro-brief/${y}/${m}/${day}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>never</changefreq>
    <priority>0.7</priority>
  </url>`);
                }

                // Remove any previously injected brief URLs (idempotent builds)
                sitemap = sitemap.replace(
                    /\s*<!-- AUTO:BRIEF_URLS -->[\s\S]*?<!-- \/AUTO:BRIEF_URLS -->/,
                    ''
                );

                // Inject before closing tag
                const injection = `\n  <!-- AUTO:BRIEF_URLS -->\n${briefUrls.join('\n')}\n  <!-- /AUTO:BRIEF_URLS -->`;
                sitemap = sitemap.replace('</urlset>', `${injection}\n</urlset>`);

                fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
                console.log(`✅ Sitemap brief URLs injected: last 30 days → public/sitemap.xml`);
            } catch (err) {
                console.warn('⚠️  Sitemap brief injection failed (non-fatal):', err);
            }
        },
    };
}
```

Then add it to the plugins array:

```typescript
export default defineConfig({
    plugins: [react(), rssGeneratorPlugin(), sitemapBriefPlugin()],
    // ...
```

- [ ] **Step 3: Test the build to confirm sitemap is updated**

```bash
npm run build 2>&1 | grep -E "(sitemap|brief|WARN|ERROR)" | head -20
```

Expected: `✅ Sitemap brief URLs injected: last 30 days → public/sitemap.xml`

- [ ] **Step 4: Verify sitemap contains brief URLs**

```bash
grep "macro-brief" /Users/kartikaysharma/Desktop/Work/Vibecode/MacroDashboard/public/sitemap.xml | head -10
```

Expected: Lines with `/macro-brief/2026/...` URLs.

- [ ] **Step 5: Commit**

```bash
git add public/sitemap.xml vite.config.ts
git commit -m "feat(seo): add macro-brief to sitemap with last-30-days auto-injection in vite plugin"
```

---

## Task 8: Edge Function `generate-morning-brief`

**Files:**
- Create: `supabase/functions/generate-morning-brief/index.ts`

This function is called by pg_cron at 05:30 UTC daily. It:
1. Fetches significantly-changed metrics from `daily_changes` (reusing existing data)
2. Fetches current regime from `vw_latest_daily_signal`
3. Calls OpenRouter (nemotron-free) with a structured prompt
4. Stores result in `daily_macro_briefs` via upsert
5. Falls back to template-based brief if API call fails

- [ ] **Step 1: Create the edge function**

Create `supabase/functions/generate-morning-brief/index.ts`:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyChange {
  metric_label: string;
  prev_value: number;
  curr_value: number;
  pct_delta: number;
  direction: "UP" | "DOWN" | "FLAT";
  interpretation: string;
  significance: "HIGH" | "MEDIUM";
}

interface DailySignal {
  regime: string;
  score: number;
  key_driver: string;
  watch_item: string;
  signal_date: string;
}

interface BriefContent {
  what_changed: string[];
  regime_status: string;
  focus_observations: string[];
  watch_today: string[];
}

// Default focus areas for the pre-generated daily brief
const DEFAULT_FOCUS_AREAS = ["us", "india", "gold"];
const DEFAULT_FOCUS_LABEL = "US Macro, India, and Gold/De-Dollarization";

// ── Fallback: template-based brief (used when OpenRouter call fails) ────────
function buildFallbackBrief(changes: DailyChange[], signal: DailySignal): BriefContent {
  const what_changed = changes
    .filter((c) => c.significance === "HIGH")
    .slice(0, 5)
    .map((c) => {
      const dir = c.direction === "UP" ? "+" : c.direction === "DOWN" ? "-" : "±";
      const pct = Math.abs(c.pct_delta).toFixed(2);
      return `◆ ${c.metric_label} ${dir}${pct}% — ${c.interpretation || "Monitoring for follow-through."}`;
    });

  if (what_changed.length === 0) {
    what_changed.push("◆ No significant metric movements detected overnight — regime steady.");
  }

  const regime_status =
    `Macro regime classified as ${signal.regime} (score: ${signal.score}). ` +
    `Key driver: ${signal.key_driver}. Watch: ${signal.watch_item}.`;

  const focus_observations = [
    `◆ US: Monitoring Fed balance sheet dynamics and Treasury issuance pace.`,
    `◆ India: RBI liquidity stance and current account trajectory remain the primary risk vectors.`,
    `◆ Gold: Central bank buying data and real yield spreads driving near-term price discovery.`,
  ];

  const watch_today = [
    `◆ Scheduled: Check US economic calendar for CPI, PCE, or Fed speaker events today.`,
    `◆ Markets: Monitor EUR/USD and EM FX for dollar-stress divergence at Asia open.`,
  ];

  return { what_changed, regime_status, focus_observations, watch_today };
}

// ── OpenRouter call ────────────────────────────────────────────────────────
async function callOpenRouter(
  apiKey: string,
  changes: DailyChange[],
  signal: DailySignal,
  focusLabel: string
): Promise<{ content: BriefContent; model_used: string; tokens_used: number } | null> {
  const changesText = changes
    .slice(0, 8)
    .map((c) => {
      const dir = c.direction === "UP" ? "▲" : c.direction === "DOWN" ? "▼" : "—";
      const pct = Math.abs(c.pct_delta).toFixed(2);
      return `${c.metric_label}: ${dir}${pct}% (${c.significance}) — ${c.interpretation || "No interpretation available."}`;
    })
    .join("\n");

  const prompt = `You are GraphiQuestor's macro intelligence system. Generate a concise morning macro brief for an institutional analyst focused on ${focusLabel}.

Current regime: ${signal.regime} (Score: ${signal.score}/100)
Key driver: ${signal.key_driver}
Watch item: ${signal.watch_item}

Metrics that moved significantly overnight:
${changesText || "No significant movements detected overnight — regime steady."}

Generate exactly:
1. 3-5 "What Changed" bullets (format: "◆ [Metric] [+/-][value] → [one-line interpretation]")
2. Regime status paragraph (2 sentences, no hedging)
3. 3 focus-area specific observations (format: "◆ [Area]: [observation]")
4. 2-3 "Watch Today" items (scheduled events or levels to monitor)

Style: institutional, terse, no hedging language, no filler. Write like a senior macro strategist, not a retail newsletter. No markdown headers. No intro/outro text.

Return ONLY valid JSON with this exact shape:
{
  "what_changed": ["string", "string"],
  "regime_status": "string",
  "focus_observations": ["string", "string", "string"],
  "watch_today": ["string", "string"]
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://graphiquestor.com",
      "X-Title": "GraphiQuestor Morning Brief",
    },
    body: JSON.stringify({
      model: "nvidia/llama-3.1-nemotron-70b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error("[generate-morning-brief] OpenRouter error:", response.status, await response.text());
    return null;
  }

  const result = await response.json();
  const raw = result.choices?.[0]?.message?.content ?? "";
  const tokens_used = result.usage?.total_tokens ?? 0;
  const model_used = result.model ?? "nvidia/llama-3.1-nemotron-70b-instruct:free";

  // Extract JSON from the response (model may wrap it in markdown code fences)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[generate-morning-brief] No JSON found in response:", raw.slice(0, 200));
    return null;
  }

  try {
    const content = JSON.parse(jsonMatch[0]) as BriefContent;
    // Basic validation
    if (!Array.isArray(content.what_changed) || typeof content.regime_status !== "string") {
      throw new Error("Invalid content shape");
    }
    return { content, model_used, tokens_used };
  } catch (e) {
    console.error("[generate-morning-brief] JSON parse failed:", e);
    return null;
  }
}

// ── Main handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startMs = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";
    const briefDate = new Date().toISOString().slice(0, 10);

    // 1. Fetch overnight changes
    const { data: changesData, error: changesErr } = await supabase
      .from("daily_changes")
      .select("metric_label, prev_value, curr_value, pct_delta, direction, interpretation, significance")
      .eq("signal_date", briefDate)
      .order("significance", { ascending: true }) // HIGH first
      .limit(10);

    if (changesErr) {
      console.warn("[generate-morning-brief] daily_changes fetch failed:", changesErr.message);
    }
    const changes: DailyChange[] = (changesData ?? []) as DailyChange[];

    // 2. Fetch current regime signal
    const { data: signalData } = await supabase
      .from("vw_latest_daily_signal")
      .select("regime, score, key_driver, watch_item, signal_date")
      .single();

    const signal: DailySignal = signalData ?? {
      regime: "Neutral Persistence",
      score: 50,
      key_driver: "Liquidity neutral",
      watch_item: "Fed balance sheet",
      signal_date: briefDate,
    };

    // 3. Generate brief content
    let content: BriefContent;
    let model_used = "fallback-template";
    let tokens_used = 0;

    if (openRouterKey) {
      const aiResult = await callOpenRouter(openRouterKey, changes, signal, DEFAULT_FOCUS_LABEL);
      if (aiResult) {
        content = aiResult.content;
        model_used = aiResult.model_used;
        tokens_used = aiResult.tokens_used;
      } else {
        // API call failed — use fallback
        content = buildFallbackBrief(changes, signal);
        model_used = "fallback-template";
      }
    } else {
      // No API key configured — use fallback
      content = buildFallbackBrief(changes, signal);
    }

    // 4. Upsert to daily_macro_briefs
    const { error: upsertErr } = await supabase
      .from("daily_macro_briefs")
      .upsert(
        {
          brief_date: briefDate,
          focus_areas: DEFAULT_FOCUS_AREAS,
          content,
          regime_score: signal.score,
          regime_label: signal.regime,
          generated_at: new Date().toISOString(),
          model_used,
          tokens_used,
        },
        { onConflict: "brief_date,focus_areas" }
      );

    if (upsertErr) throw upsertErr;

    const durationMs = Date.now() - startMs;
    console.log(`[generate-morning-brief] Done in ${durationMs}ms. Model: ${model_used}, tokens: ${tokens_used}`);

    return new Response(
      JSON.stringify({
        success: true,
        briefDate,
        model_used,
        tokens_used,
        durationMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[generate-morning-brief] Fatal error:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Add pg_cron schedule**

Create a new migration for the cron job:

```bash
cat > supabase/migrations/20260604000100_schedule_morning_brief_cron.sql << 'EOF'
-- Schedule daily morning brief generation at 05:30 UTC
-- (Before US markets open at 09:30 ET = 13:30 UTC)
SELECT cron.schedule(
  'generate-morning-brief',
  '30 5 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/generate-morning-brief',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
EOF
```

Note: The pg_cron invocation pattern may differ per project setup. If the project uses a different pattern (check other cron migrations in `supabase/migrations/`), follow that pattern instead.

- [ ] **Step 3: Test the edge function locally**

```bash
supabase functions serve generate-morning-brief --env-file .env.local
# In a second terminal:
curl -X POST http://localhost:54321/functions/v1/generate-morning-brief \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <anon-key>" \
  -d '{}'
```

Expected: `{"success":true,"briefDate":"...","model_used":"..."}` — even without `OPENROUTER_API_KEY`, the fallback should produce a brief.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-morning-brief/index.ts supabase/migrations/20260604000100_schedule_morning_brief_cron.sql
git commit -m "feat(edge): add generate-morning-brief daily edge function with OpenRouter + fallback"
```

---

## Task 9: Full Build + Lint Verification

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

If there are errors, fix them before proceeding. Common issues:
- Missing `React` import (not needed in React 18 with JSX transform, but some files may need it)
- `any` types where stricter types are expected — use `unknown` and narrow
- Unused imports

- [ ] **Step 2: Run the test suite**

```bash
npm run test
```

Expected: All existing tests pass + new tests from Tasks 2 and 3 pass.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds. Look for:
- `✅ Sitemap brief URLs injected` in build output
- No TypeScript errors (tsc runs as part of the build)
- `dist/` directory created

If build fails with TypeScript errors in the new files, fix each one, then re-run. Common fixes:
- `date-fns-tz` not installed → use manual UTC offset version of `msUntilNYOpen` (provided in Task 4)
- Import path issues → verify `@/hooks/useMacroBrief` resolves correctly

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Morning Macro Brief complete — daily SEO pages + personalized focus areas + edge function"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `/macro-brief` route → redirects to today's dated URL — Task 6
- [x] `/macro-brief/2026/06/04` permanent dated URL — Task 6
- [x] SEO title/description for dated pages — Task 4 (SEOManager in MacroBriefInner)
- [x] Indexable (no noindex, robots defaults to `index, follow`) — Task 4
- [x] Sitemap: last-30-days URLs + static hub entries — Task 7
- [x] Header bar: "MORNING MACRO BRIEF", date, countdown, regime badge — Task 4
- [x] Section 1: What Changed Overnight (from `daily_changes`) — Task 4
- [x] Section 2: Regime Status — Task 4
- [x] Section 3: Focus Areas (personalized) — Task 4
- [x] Section 4: Watch Today — Task 4
- [x] Footer: prev/next navigation, archive link, methodology link — Task 4
- [x] FocusAreaSelector: 8 areas, max 3, localStorage `gq_focus_areas` — Task 3
- [x] Default focus areas: US + India + Gold — Tasks 2, 3, 4
- [x] FocusAreaSelector placement: gear icon in header — Task 4
- [x] `daily_macro_briefs` table + migration — Task 1
- [x] `useMacroBrief` hook: exact match → default fallback → yesterday fallback — Task 2
- [x] Brief pre-generated (no client-side AI call) — Tasks 2, 8
- [x] "Today's brief generating..." indicator — Task 4 (isYesterday banner)
- [x] Edge function at 05:30 UTC — Task 8
- [x] OpenRouter nemotron-free call — Task 8
- [x] Fallback brief when API fails — Task 8
- [x] `/macro-brief/archive` page with chronological list — Task 5
- [x] `/macro-brief` added to sitemap priority 0.9 — Task 7
- [x] `/macro-brief/archive` added to sitemap priority 0.6 — Task 7
- [x] Nav entry in GlobalLayout — Task 6
- [x] Mobile: sections stack vertically (all flex-col by default in Tailwind) — Task 4

**Items not fully addressed:**
- FocusAreaSelector as bottom sheet on mobile: current implementation is a `position: absolute` dropdown. For a proper bottom sheet on mobile, wrap with a media-query check and use a separate mobile sheet component. This is a follow-up enhancement.
- Usage frequency tracking for edge function: currently hardcoded to default combo. Requires a separate analytics table to track which focus area combos users actually select.
- `OPENROUTER_API_KEY` env var: must be added to Supabase project secrets via `supabase secrets set OPENROUTER_API_KEY=...` before deploying the edge function.
