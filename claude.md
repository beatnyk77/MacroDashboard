# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**GraphiQuestor** (graphiquestor.com) is an institutional-grade macro intelligence terminal for professional capital allocators. It surfaces real-time telemetry on global liquidity, sovereign risk, de-dollarization, energy security, and India/China macro dynamics. It is a **pure data terminal** — no marketing on the main experience, no mock/stale values.

**Core philosophy**: "Observe structural reality. Do not forecast — provide the raw intelligence required for informed decision-making."

---

## Commands

```bash
npm run dev        # Vite dev server (hot reload)
npm run build      # tsc + vite build → dist/
npm run lint       # ESLint with --max-warnings 0 (must be clean)
npm run test       # vitest run (jsdom environment)
npm run preview    # Serve the built dist/
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.tsx
```

Supabase Edge Function development:
```bash
supabase start                        # Start local Supabase stack
supabase functions serve <name>       # Serve a single edge function locally
supabase db diff                      # Diff migrations
```

---

## Environment Variables

Create `.env.local`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The app degrades gracefully with console warnings if these are missing.

---

## Architecture

### Stack
- **Frontend**: Vite + React 18 + TypeScript (SPA, deployed to Netlify via `dist/`). Despite the brief mentioning Next.js, the actual stack is Vite.
- **UI**: MUI v5 (dark theme, layout/structure) + Tailwind CSS (utility classes) + shadcn/ui (Radix primitives in `src/components/ui/`).
- **Routing**: React Router v7. All routes are lazy-loaded, defined in `src/App.tsx`.
- **Data fetching**: TanStack Query v5. Default: 30 min `staleTime`, 2h `gcTime`, no refetch on window focus.
- **Backend**: Supabase (Postgres + Deno Edge Functions + pg_cron). All ingestion is fully automated.
- **Charts**: Recharts (primary), `@nivo/sankey` for flow charts, `react-simple-maps`/Leaflet for maps.

### Path Alias
`@/` resolves to `src/`. Always use `@/` imports.

### Directory Layout

```
src/
  App.tsx                  # All routes (lazy-loaded, named exports pattern)
  layout/
    GlobalLayout.tsx       # Shell: sidebar nav, regime ticker, cmd+k palette, mobile nav, footer
  pages/
    Terminal.tsx           # Home (/) — main macro overview
    labs/                  # Thematic deep-dive lab pages
    methods/               # Methodology explainer articles
    tools/                 # Embeddable tools (iframe-safe via ?embed=true)
  features/                # Domain feature slices (blog, trade, CIE, energy, regime-digest, etc.)
    dashboard/components/  # Reusable dashboard cards, charts, widgets, sections
  components/              # Shared primitives (MetricCard, Sparkline, DataHealthBanner, etc.)
  hooks/                   # 100+ domain-specific data hooks
  lib/
    supabase.ts            # Supabase client singleton
    queryClient.ts         # TanStack Query client config
    utils.ts               # cn() and general helpers
  context/
    ViewContext.tsx         # Global view state

supabase/
  functions/               # Deno Edge Functions (one directory per function)
    _shared/               # Shared utilities across functions
    ingest-*/              # Data ingestion workers (FRED, RBI, EIA, Comtrade, etc.)
    compute-*/             # Derived metric computation (signals, scores, composites)
    generate-*/            # Report/digest generation (weekly regime, monthly)
  migrations/              # Postgres schema migrations
```

### Data Flow

```
External APIs (FRED, RBI DBIE, EIA, UN Comtrade, Alpha Vantage, GDELT, etc.)
  → Supabase Edge Functions (scheduled via pg_cron)
    → metric_observations table (raw time-series)
      → vw_latest_metrics view (staleness flags + latest values)
        → useLatestMetric(metricId) hook (TanStack Query)
          → React component
```

**The canonical data hook** is `src/hooks/useLatestMetric.ts`. It reads from `vw_latest_metrics` (current state + staleness_flag) and `metric_observations` (history for sparklines). All domain hooks follow the same pattern but may query different tables or views.

Staleness is surfaced via `staleness_flag`: `'fresh'` → safe (green), `'lagged'` → warning (amber), `'very_lagged'` → danger (red). Display this via the `FreshnessChip` and `DataHealthBanner` components.

### Adding a New Lab or Feature

1. Create the page in `src/pages/labs/MyLab.tsx` (named export).
2. Add a lazy import + `<Route>` in `src/App.tsx`.
3. Add to `terminalNavItems` in `src/layout/GlobalLayout.tsx` to appear in the sidebar.
4. Create domain hooks in `src/hooks/` using `useQuery` from TanStack Query.
5. If new data is needed, add a Supabase Edge Function in `supabase/functions/ingest-<source>/`.

### Coding Conventions

- Pages use **named exports** (`export const MyLab = ...`). A few newer pages (TradeIntelligencePage, HSCodeOverviewPage, MarketDeepDivePage) use default exports — match the existing pattern of the file you're editing.
- TanStack Query `queryKey` arrays must be specific enough to isolate cache entries (e.g., `['metric', metricId]`).
- The `GlobalLayout` renders without chrome when `?embed=true` is in the URL — keep all iframe-embedded tools compatible with this.
- Vite generates `public/rss.xml` at build time via `rssGeneratorPlugin` in `vite.config.ts` — don't break the `blogArticles` named export from `src/features/blog/blogData.ts`.

---

## Design Rules

- **Terminal aesthetic**: dark glassmorphic, high information density. No hero sections, no pricing, no marketing copy on the main experience.
- **Data credibility**: every metric must show source, freshness, and methodology. Use `DataProvenanceBadge`, `FreshnessChip`, and `DataHealthBanner`.
- **No fabricated data**: if real data isn't available, show a skeleton or explicit "unavailable" state — never placeholder numbers.
- **Institutional tone**: all labels, tooltips, and narrative copy must match the precision expected by macro hedge funds and central bank research desks.
