# MacroDashboard – Architecture & Project Layout

This document describes the proposed architecture, file/folder structure, data flow, and state model for the **MacroDashboard** project, built with **Antigravity IDE** and **Supabase MCP** as the backend.[page:1][memory:2]

The goal is to keep this **bootstrapped, robust, and boringly reliable**: clear separation between data ingestion, metrics engine, and UI; minimal moving parts in production.

---

## 1. High-level architecture

### 1.1 Components

- **Frontend app (MacroDashboard)**  
  - Next.js/React (or similar) UI built in Antigravity, talking to Supabase MCP via typed SDK.[page:1]  
  - Renders macro views (Macro Orientation, Dollar System, Sovereign Stress, Hard Asset Surface).

- **Backend data layer (Supabase MCP)**  
  - Postgres as time-series warehouse (metrics, series, observations, composites).  
  - Edge Functions / cron jobs to ingest FRED, UST, IMF, BIS and compute ratios.[memory:2][memory:10]  

- **Ingestion & compute workers**  
  - Scripts (TypeScript/Node or Python) invoked via Supabase Edge Functions or scheduled runners.  
  - Responsibilities: pull raw data, normalize, upsert, compute composites, update staleness flags.[memory:10][memory:12]

- **Antigravity IDE skills**  
  - Use `database-design`, `backend-dev-guidelines`, `frontend-dev-guidelines`, `nextjs-supabase-auth` skills to enforce style and patterns.[page:1]  
  - Keep all AI/agent usage **dev-only**; production runtime is pure data + charts.

---

## 2. Repository layout (MacroDashboard)

Assuming `MacroDashboard/` is the repo root.

```txt
MacroDashboard/
├── apps/
│   └── web/
│       ├── app/                 # Next.js App Router pages/layouts
│       │   ├── (dashboard)/
│       │   │   ├── page.tsx
│       │   │   ├── macro-orientation/
│       │   │   │   └── page.tsx
│       │   │   ├── dollar-system/
│       │   │   │   └── page.tsx
│       │   │   ├── sovereign-stress/
│       │   │   │   └── page.tsx
│       │   │   └── hard-asset-surface/
│       │   │       └── page.tsx
│       │   ├── api/
│       │   │   └── charts/
│       │   │       └── route.ts  # thin proxy if needed
│       │   └── layout.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Shell.tsx
│       │   │   └── Navigation.tsx
│       │   ├── dashboard/
│       │   │   ├── StateCard.tsx
│       │   │   ├── HistoryChart.tsx
│       │   │   ├── ForensicTable.tsx
│       │   │   ├── MacroRegimeStrip.tsx
│       │   │   ├── StressStrip.tsx
│       │   │   └── RatioGrid.tsx
│       │   └── ui/              # shared UI primitives (buttons, cards, badges)
│       ├── lib/
│       │   ├── supabase-client.ts
│       │   ├── metrics-query.ts  # typed queries for metrics/series
│       │   ├── chart-config.ts   # chart presets & color scales
│       │   └── types.ts          # shared TypeScript types
│       ├── styles/
│       │   └── globals.css
│       ├── public/
│       └── next.config.mjs
│
├── packages/
│   ├── metrics-engine/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── metrics-schema.ts   # metric + composite definitions
│   │   │   ├── frequency.ts        # staleness + frequency logic
│   │   │   ├── composites.ts       # Liquidity / Funding indices
│   │   │   └── transforms.ts       # ratio math, z-scores, percentiles
│   │   └── package.json
│   └── shared-types/
│       ├── src/index.ts            # MetricId, CompositeId, EntityId, etc.
│       └── package.json
│
├── supabase/
│   ├── migrations/
│   │   └── ...                     # SQL migrations (metrics, series, composites)
│   ├── seed/
│   │   └── metrics_seed.sql
│   └── README.md
│
├── functions/                      # Supabase Edge Functions
│   ├── ingest-fred/
│   │   └── index.ts
│   ├── ingest-ust/
│   │   └── index.ts
│   ├── ingest-imf/
│   │   └── index.ts
│   ├── ingest-bis/
│   │   └── index.ts
│   ├── compute-ratios/
│   │   └── index.ts
│   └── compute-composites/
│       └── index.ts
│
├── config/
│   ├── metrics.config.json         # list of all metrics & sources
│   ├── composites.config.json      # LiquidityIndex v1, FundingStress v1
│   └── dashboard-layout.json       # mapping of views -> metric ids
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── METRICS_CATALOG.md
│   └── CONTRIBUTING.md
│
├── .env.example
├── package.json
└── turbo.json / pnpm-workspace.yaml (if monorepo tooling)
```

---

## 3. What each part does

### 3.1 `apps/web` – frontend app

- **`app/(dashboard)/page.tsx`**  
  - Landing dashboard: stitches Macro Orientation, Dollar System, Sovereign Stress, Hard Asset sections into one screen using layout components.  
  - Uses server components to query Supabase for **current values** and **chart series** via `metrics-query.ts`.[memory:2]

- **`app/(dashboard)/macro-orientation/page.tsx` etc.**  
  - Route‑level pages for each deep-dive view if a user wants a full-screen chart/table experience.  
  - Each view is a composition of `StateCard`, `HistoryChart`, and `ForensicTable` components.

- **`components/layout`**  
  - `Shell.tsx`: main layout shell (sidebar, header, timestamp display, theme).  
  - `Navigation.tsx`: left nav with sections/views; can later support workspace presets.

- **`components/dashboard`**  
  - `StateCard.tsx`:  
    - Shows one metric’s **current state**: latest value, percentile, staleness_flag badge, minimal sparkline.  
    - No heavy history; acts as the hero summary.[memory:5]
  - `HistoryChart.tsx`:  
    - Renders full time-series plots for one or more metrics over a given range.  
    - Knows about `native_frequency` vs `display_frequency` to avoid misleading resampling.[memory:10]
  - `ForensicTable.tsx`:  
    - Renders cross-sectional tables (e.g., G20 sovereign stress grid).  
    - Used only in deep-dive or bottom sections, not in top hero zones.
  - `MacroRegimeStrip.tsx`, `StressStrip.tsx`, `RatioGrid.tsx`:  
    - Higher-level containers that assemble several `StateCard`s and `HistoryChart`s into a section (e.g., Macro Orientation header).

- **`lib/supabase-client.ts`**  
  - Creates Supabase client instances for server and client environments, using Supabase MCP config.[memory:2]  
  - Hides raw connection details; everything else uses this wrapper.

- **`lib/metrics-query.ts`**  
  - Typed query functions: `getLatestMetricSnapshot(metricId, entityId)`, `getMetricSeries(metricId, entityId, range)` etc.  
  - Does joins on `metrics`, `series_metadata`, `observations`, `composite_series` in Supabase.  
  - Implements staleness rules and throws if data is too stale for the requested view.

- **`lib/chart-config.ts`**  
  - Central place for chart palettes, axis formats, legend behavior per metric category.

- **`lib/types.ts`**  
  - Shared UI‑side types (e.g. `MetricSnapshot`, `ChartSeriesPoint`), kept in sync with `shared-types` package.

---

### 3.2 `packages/metrics-engine`

- **`metrics-schema.ts`**  
  - Defines **canonical metric IDs** (e.g. `USD_RESERVE_SHARE`, `NET_DURATION_TO_PRIVATE_SECTOR_US`, `SPX_GOLD_RATIO`) and their metadata: source, tier, native_frequency, unit, category.[memory:12]  
  - Exports helpers for ingestion and for UI to understand what each metric is.

- **`frequency.ts`**  
  - Implements `staleness_flag` logic: given `native_frequency`, `expected_interval_days`, and `last_updated_at`, returns `fresh | lagged | very_lagged`.  
  - Ensures consistent staleness classification across ingestion and UI.[memory:10]

- **`transforms.ts`**  
  - Contains pure functions for computing ratios, z-scores, percentiles, duration-weighted measures.  
  - No I/O; operates on in-memory arrays of `{ date, value }`.

- **`composites.ts`**  
  - Reads composite definitions from `config/composites.config.json` and applies them.  
  - Functions like `computeLiquidityComposite(series: Map<MetricId, Series>)` returning a time series tagged with `composite_version`.[memory:11]

- **Usage**  
  - Shared by Edge Functions (for ingestion/compute) and possibly tests in the frontend to ensure UI and backend agree on metric definitions.

---

### 3.3 `supabase` – database & migrations

- **Schema highlights** (simplified):

  ```sql
  -- metrics catalog
  create table metrics (
    id text primary key,
    name text not null,
    description text,
    source text not null,         -- FRED, UST, IMF, BIS, DERIVED
    source_tier text not null,    -- tier_1/2/3
    native_frequency text not null,
    default_display_frequency text not null,
    unit text,
    unit_label text,
    category text not null        -- liquidity, valuation, funding, de_dollarization, sovereign
  );

  -- series per entity (e.g., US, EA, CN)
  create table series_metadata (
    id uuid primary key default gen_random_uuid(),
    metric_id text references metrics(id),
    entity_id text not null,      -- ISO code or bloc id
    expected_interval_days int,
    last_updated_at timestamptz,
    staleness_flag text,          -- fresh/lagged/very_lagged
    unique (metric_id, entity_id)
  );

  -- time-series values
  create table observations (
    series_id uuid references series_metadata(id),
    date date not null,
    value double precision not null,
    primary key (series_id, date)
  );

  -- composite definitions
  create table composites (
    composite_id text,
    composite_version int,
    name text,
    component_metrics jsonb,
    normalization_window text,
    status text,
    primary key (composite_id, composite_version)
  );

  -- composite time-series
  create table composite_series (
    composite_id text,
    composite_version int,
    entity_id text,
    date date,
    value double precision,
    primary key (composite_id, composite_version, entity_id, date)
  );
  ```

- Migrations live in `supabase/migrations`; `metrics_seed.sql` seeds initial metrics & composites.[memory:2]

---

### 3.4 `functions` – Supabase Edge Functions

Each folder is one Edge Function:

- **`ingest-fred`**  
  - Pulls FRED series (M2, CPI, policy rates, yields, equity indexes, gold, etc.).[memory:10]  
  - Upserts into `metrics`, `series_metadata`, `observations` using `metrics-engine` helpers.

- **`ingest-ust`**  
  - Pulls UST FiscalData: auctions, debt outstanding, SOMA (via Fed), TIC basic.[web:18][web:19]  
  - Computes basic net issuance, refinancing schedules at the raw level.

- **`ingest-imf`**  
  - Pulls IMF IFS/WEO/COFER: GDP, debt, reserves, reserve currency shares.[memory:12]  

- **`ingest-bis`**  
  - Pulls BIS banking/securities/basis series where feasible; tags them as Tier 3 if laggy/fragile.[memory:12]

- **`compute-ratios`**  
  - Reads raw series and computes all derived ratios: equity/gold, housing/gold, M2/gold, GDP/M2, etc.[memory:11]  
  - Updates corresponding `observations` entries for derived metrics.

- **`compute-composites`**  
  - Computes Liquidity Composite Index and Dollar Funding Stress Index based on current `composites` config and metric inputs.[memory:11]  
  - Inserts into `composite_series`.

- All functions are wired to Supabase Cron for appropriate cadence (FRED/UST daily, IMF/BIS monthly/quarterly).

---

### 3.5 `config` – static configuration

- **`metrics.config.json`**  
  - Catalog of all metrics: ids, descriptions, sources, tiers, default entity coverage.

- **`composites.config.json`**  
  - Versioned specs for composites, e.g.:

    ```json
    {
      "liquidity_composite": {
        "version": 1,
        "components": [
          { "metric_id": "US_M2_GROWTH", "weight": 0.3 },
          { "metric_id": "US_REAL_POLICY_RATE", "weight": 0.3 },
          { "metric_id": "US_CREDIT_SPREAD", "weight": 0.4 }
        ],
        "normalization_window": "10y_z_score",
        "frequency": "monthly_end",
        "status": "active"
      }
    }
    ```

- **`dashboard-layout.json`**  
  - Declarative mapping from views/sections to metric IDs, e.g.:

    ```json
    {
      "macro_orientation": {
        "hero_cards": ["MACRO_REGIME_SCORE_US", "LIQUIDITY_COMPOSITE_US"],
        "charts": ["US_GDP_GROWTH", "US_CPI_YOY", "FED_FUNDS_RATE"],
        "tables": []
      }
    }
    ```

UI components can read this to build sections, keeping layout config out of code.

---

## 4. Where state lives & how services connect

### 4.1 State ownership

- **Authoritative data state:**  
  - Lives in Supabase Postgres (`metrics`, `series_metadata`, `observations`, `composite_series`).  
  - Ingestion and compute functions are the only writers.[memory:2]

- **Derived/in‑memory state (frontend):**  
  - Light React state for UI concerns: selected entity (US vs EA vs CN), date ranges, toggled ratios.  
  - Global UI state via a small context or Zustand store (e.g., `useDashboardStore`) – **no business logic here**, only selection/filtering.

- **Composite and metric definitions:**  
  - Live in `packages/metrics-engine` + `config/*.json`.  
  - Both ingestion and frontend treat these as read-only contracts.

### 4.2 Data flow

1. **Ingestion**  
   - Cron triggers `ingest-fred`, `ingest-ust`, `ingest-imf`, `ingest-bis` on schedule.  
   - Each function: call upstream API → normalize → upsert `series_metadata` and `observations` → update `last_updated_at` and `staleness_flag`.[web:18][web:19][memory:10]

2. **Computation**  
   - Cron triggers `compute-ratios` and `compute-composites` after ingestion.  
   - Uses `metrics-engine` to compute derived ratios and composites, writes to `observations` / `composite_series` with a known `composite_version`.[memory:11]

3. **Frontend queries**  
   - Next.js server components call `metrics-query` helpers, which:  
     - Fetch latest snapshots for hero `StateCard`s.  
     - Fetch historical arrays for `HistoryChart`.  
     - Fetch cross-sectional slices for `ForensicTable`.  
   - Responses are shaped into UI‑friendly DTOs (value, percentile, staleness_flag, tier).

4. **Rendering**  
   - `StateCard` consumes snapshot DTOs.  
   - `HistoryChart` consumes time-series arrays.  
   - `ForensicTable` consumes cross-sectional arrays (e.g., G20 sovereign stress at latest date).

No direct calls from the frontend to FRED/UST/IMF/BIS; everything goes through Supabase.

---

## 5. How this fits with Antigravity & awesome-skills

- Use the **antigravity-awesome-skills** repo as your **skills catalog** while working in `MacroDashboard`:[page:1]  
  - `frontend-dev-guidelines`, `react-ui-patterns`, `nextjs-best-practices` to scaffold `apps/web`.  
  - `database-design`, `backend-dev-guidelines`, `api-patterns` for `supabase/` and `functions/`.  
- In Antigravity IDE, you can:  
  - Point the agent at `MacroDashboard` and ask it to apply “nextjs-supabase-auth” or “database-design” to specific folders.  
  - Keep skills as **development accelerators**; they should not introduce runtime AI dependencies into the MacroDashboard app.

---

