# Government Financial Position (GFP) Design Spec

**Date:** 2026-07-31  
**Status:** Approved (product decisions + architecture + schema + UI modules)  
**Product:** GraphiQuestor — institutional macro surveillance terminal  
**Related surface:** US Macro & Fiscal Lab (`/labs/us-macro-fiscal`)

---

## Goal & Background

Extend GraphiQuestor with a high-signal **Government Financial Position** board that surfaces:

1. **Financial Report of the U.S. Government (FRUSG)** — GAAP accrual statements: Net Cost by agency, Balance Sheet, Operations & Changes in Net Position, Reconciliations of Net Operating Cost to Budget Deficit, and Changes in Cash Balance.
2. **Agency-level cash flows** — monthly outlays by agency/program (MTS Table 5) and annual receipts by department.

The existing US Macro & Fiscal Lab covers debt maturity walls, auction demand, TGA/plumbing, and fiscal dominance ratios. It does **not** cover consolidated GAAP financial position or granular agency cash composition. GFP fills that gap without creating a disconnected silo.

**Core philosophy:** Observe structural reality. Do not forecast. No mock data. Every number traceable to official Fiscal Data endpoint + date. Ship ugly-but-correct first.

---

## Product Decisions (Locked)

| Decision | Choice |
|----------|--------|
| Monthly agency cash outflows | **MTS Table 5** (`/v1/accounting/mts/mts_table_5`) JSON API only |
| Monthly Treasury Disbursements dataset | **Out of v1** — no JSON API exists; only XLSX published report |
| Placement | **Hybrid**: full board at `/labs/gov-financial-position` + teaser strip on US Macro & Fiscal Lab |
| FRUSG scope | **Full accrual set** (5 statements); sustainability statements later |
| Receipts | **Annual** Receipts-by-Department + MTS outlays (no MTS monthly receipts in v1) |
| Architecture | Domain raw tables + precomputed SQL views + Edge Function ingest |
| Narrative | Deterministic rule-based insights only (no LLM in v1) |

---

## Accounting Basis Rule (Non-Negotiable)

| Layer | Basis | Source |
|-------|-------|--------|
| FRUSG | **Accrual / GAAP** | Financial Report of the U.S. Government |
| MTS outlays | **Cash / budget** | Monthly Treasury Statement Table 5 |
| Receipts by Department | **Cash / budget** | Combined Statement (annual) |

UI must label basis on every panel. Never compute a mixed-basis ratio without explicit dual-basis labeling.

---

## Data Sources (Verified Live)

**Base URL:** `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/`

### FRUSG — Accrual (annual)

| Statement | Endpoint | Approx rows |
|-----------|----------|-------------|
| Statements of Net Cost | `/v2/accounting/od/statement_net_cost` | ~1,947 |
| Balance Sheets | `/v2/accounting/od/balance_sheets` | ~1,330 |
| Ops & Changes in Net Position | `/v1/accounting/od/net_position` | ~863 |
| Reconciliations (NOC ↔ Budget Deficit) | `/v1/accounting/od/reconciliations` | ~594 |
| Changes in Cash Balance | `/v1/accounting/od/cash_balance` | ~514 |

**Net Cost key fields:**  
`record_date`, `stmt_fiscal_year`, `restmt_flag` (`Y`/`N`), `agency_nm`, `gross_cost_bil_amt`, `earned_revenue_bil_amt`, `change_assumptions_bil_amt`, `net_cost_bil_amt`, `src_line_nbr`  
**Units:** billions USD.

**Balance Sheet key fields:**  
`account_desc` (Assets / Liabilities / Net position buckets), `line_item_desc`, `position_bil_amt`, `restmt_flag`, `stmt_fiscal_year`.

**Restatement policy:** Store all rows. Serving views default to `restmt_flag = 'N'` (original published). Optional UI toggle for restated prior-year connect is v1.1.

**FY2024 Net Cost sanity check (live API):** HHS ~$1.74T net, SSA ~$1.53T, DoD ~$1.23T, Interest on Treasury Securities held by the public ~$0.91T.

### Cash series

| Dataset | Endpoint | Cadence | Notes |
|---------|----------|---------|-------|
| Outlays of the U.S. Government | `/v1/accounting/mts/mts_table_5` | Monthly | Hierarchical agency/program outlays; filter detail rows; exclude total/subtotal aggregates when computing shares |
| Receipts by Department | `/v1/accounting/od/receipts_by_department` | Annual | Line-item grain; rollup by `aid_cd` |

**MTS Table 5 key fields:**  
`record_date`, `parent_id`, `classification_id`, `classification_desc`, `current_month_net_outly_amt`, `current_fytd_net_outly_amt`, `prior_fytd_net_outly_amt`, `data_type_cd`, `record_type_cd`, `sequence_level_nbr`, `line_code_nbr`, `src_line_nbr`.

**Receipts key fields:**  
`record_date`, `receipt_line_item_nm`, `aid_cd`, `a_cd`, `main_cd`, `sub_cd`, `receipt_amt`, `src_line_nbr`.

### Explicitly out of scope (v1)

- Monthly Treasury Disbursements XLSX (`published-reports/mtd/…`) — no documented JSON endpoint
- FRUSG sustainability: Social Insurance, Long-Term Projections, Changes in Social Insurance Amounts
- Scraping fiscaldata HTML

---

## Architecture

```
Fiscal Data API (JSON, paginated)
  → ingest-gov-financial-position (Supabase Edge Function)
    → raw domain tables (full grain + provenance)
      → SQL views (ranks, shares, HHI, YoY, narrative scalars)
        → TanStack Query hooks
          → /labs/gov-financial-position (full board)
          → US Macro & Fiscal Lab teaser + deep-dive CTA
```

**Rationale:** Agency/line-item grain does not fit `metric_observations` scalars. Matches existing domain-table pattern (`us_debt_maturities`). Precomputed views keep the board fast; browser never fans out to Treasury at render time.

### Integration points

| Touchpoint | Action |
|------------|--------|
| `src/App.tsx` | Lazy route `/labs/gov-financial-position` |
| `src/layout/GlobalLayout.tsx` | `terminalNavItems` entry near US fiscal |
| `src/pages/labs/USMacroFiscalLab.tsx` | Teaser section + deep-dive button |
| `src/lib/pipelineCatalog.ts` | Register `ingest-gov-financial-position` |
| `src/pages/DataSourcesPage.tsx` | Document FRUSG + MTS-5 + Receipts-by-Dept |
| Supabase migrations | Tables, RLS, views, optional cron |
| Edge functions | New `ingest-gov-financial-position` |

---

## Schema

### Raw tables

#### `public.frusg_net_cost`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| record_date | date | API publish date |
| stmt_fiscal_year | int | Statement FY |
| restmt_flag | text | `Y` or `N` |
| agency_nm | text | Agency name |
| gross_cost_bil | numeric | billions |
| earned_revenue_bil | numeric | nullable |
| change_assumptions_bil | numeric | nullable |
| net_cost_bil | numeric | billions |
| src_line_nbr | text | source line |
| source_endpoint | text | full path |
| ingested_at | timestamptz | now() |

**Unique:** `(stmt_fiscal_year, restmt_flag, agency_nm, src_line_nbr)`

#### `public.frusg_balance_sheet`

Unique: `(stmt_fiscal_year, restmt_flag, account_desc, line_item_desc, src_line_nbr)`  
Columns: `record_date`, `position_bil`, `source_endpoint`, `ingested_at`.

#### `public.frusg_net_position`

Line items for Statement of Operations & Changes in Net Position.  
Columns include: `stmt_fiscal_year`, `restmt_flag`, `account_desc`, `line_item_desc`, `non_dedicated_funds_bil`, `dedicated_funds_bil`, `eliminations_bil`, `consolidated_bil`, `src_line_nbr`, provenance.

#### `public.frusg_reconciliations`

NOC ↔ budget deficit bridge lines.  
Columns: `stmt_fiscal_year`, `restmt_flag`, `account_desc`, `component_desc`, `line_item_desc`, `position_bil`, `src_line_nbr`, provenance.

#### `public.frusg_cash_balance`

Changes in cash balance lines. Same general shape as reconciliations.

#### `public.mts_agency_outlays`

| Column | Type | Notes |
|--------|------|-------|
| record_date | date | Month-end |
| classification_id | text | |
| parent_id | text | hierarchy |
| classification_desc | text | Agency/program label |
| current_month_net_outly | numeric | cash $ |
| current_fytd_net_outly | numeric | |
| prior_fytd_net_outly | numeric | |
| data_type_cd | text | prefer detail `D` where applicable |
| record_type_cd | text | |
| sequence_level_nbr | text/int | hierarchy depth |
| line_code_nbr | text | |
| src_line_nbr | text | |
| source_endpoint | text | |
| ingested_at | timestamptz | |

**Unique:** `(record_date, classification_id, src_line_nbr)` (adjust if API identity requires `line_code_nbr` instead)

#### `public.treasury_receipts_by_dept`

Unique: `(record_date, aid_cd, main_cd, sub_cd, receipt_line_item_nm, src_line_nbr)`  
Columns: `a_cd`, `receipt_amt`, provenance.

#### `public.agency_code_map`

| Column | Type |
|--------|------|
| aid_cd | text PK |
| agency_name | text |
| notes | text nullable |

Static seed from OMB Circular A-11 Appendix C subset covering codes present in receipts data.

### RLS

For every public table:

- `ENABLE ROW LEVEL SECURITY`
- Policy: public `SELECT` using `true`
- Policy: `service_role` full access

### Serving views

| View | Purpose |
|------|---------|
| `vw_frusg_net_cost_yearly` | Agency net cost by FY; default non-restated; exclude pure “Total” row from share denominators carefully (Total row kept for KPI) |
| `vw_frusg_net_cost_concentration` | Top-5 share, top-10 share, HHI by FY |
| `vw_frusg_balance_sheet_summary` | Total assets, total liabilities, net position by FY |
| `vw_frusg_bs_line_items` | Line items for drill |
| `vw_frusg_net_position_summary` | Key SOCNP consolidated lines by FY |
| `vw_frusg_reconciliation_summary` | Bridge lines by FY |
| `vw_frusg_cash_balance_summary` | Cash change lines by FY |
| `vw_mts_agency_outlays_monthly` | Cleaned monthly series for chartable agencies/programs |
| `vw_mts_agency_outlays_rank` | Latest month rank, share of total, YoY, 12m volatility |
| `vw_receipts_by_agency_yearly` | `sum(receipt_amt)` by `aid_cd` / FY joined to `agency_code_map` |
| `vw_gfp_narrative_inputs` | Scalar snapshot for rule-based insights |

**HHI definition:** sum of squared agency shares (0–1 scale shares → HHI in 0–1, or ×10,000 for standard index — pick one, document in UI as “Herfindahl (0–1)” or “HHI ×10k”).

---

## Ingestion

### Function

`supabase/functions/ingest-gov-financial-position/index.ts`

- Use `serveIngest` from `_shared/handler.ts`
- Use `fetchWithRetry` from `_shared/ingest_utils.ts`
- Paginate: `page[size]=10000`, increment `page[number]` until empty/short page
- Follow redirects on Fiscal Data API
- Idempotent upserts on unique keys
- Return per-source counts in `IngestResult`
- Support query flags: `?backfill=true` for full history, default recent window for MTS

### Refresh cadence

| Source | Cadence | Cron suggestion |
|--------|---------|-----------------|
| FRUSG | Annual (re-ingest nightly is cheap) | Nightly with other fiscal jobs |
| MTS Table 5 | Monthly (new data ~monthly) | Nightly |
| Receipts by Department | Annual | Nightly |

### Failure handling

- Partial success allowed: one endpoint failure must not roll back others
- Log endpoint + HTTP status + message
- Never invent values on failure; UI shows empty/unavailable states

---

## Frontend

### Route & page

- **Path:** `/labs/gov-financial-position`
- **File:** `src/pages/labs/GovFinancialPositionLab.tsx`
- **Export:** named `GovFinancialPositionLab`
- Lazy-loaded in `App.tsx`
- SEO via `SEOManager` (title, description, Dataset JSON-LD)

### Navigation

- Add to `terminalNavItems` near US Macro & Fiscal
- Teaser on `USMacroFiscalLab`: KPI strip summary + “Deep Dive: Government Financial Position” CTA (same pattern as Foreign Holders deep-dive)

### Board modules (v1 — full set)

1. **KPI strip** — latest FY total net cost, net position, total assets, total liabilities, top-5 net cost share; `FreshnessChip`
2. **Net Cost by Agency** — multi-year lines (top N) + stacked composition
3. **Balance Sheet trend** — assets / liabilities / net position
4. **Accrual bridges** — compact tables for Net Position, Reconciliations, Cash Balance
5. **Agency Outlays ranking** — MTS sortable table: size, YoY, share, 12m volatility
6. **Agency Outlays time series** — multi-select agencies
7. **Receipts by agency** — annual ranking + multi-year bars
8. **Concentration** — HHI + top-5/10 share over time
9. **Insights** — 3–6 rule-based bullets
10. **Export** — CSV + JSON of currently filtered cleaned series (client-side)
11. **Provenance footer** — endpoints, record dates, units, accrual vs cash labels

### Filters

- FRUSG fiscal year (single or multi)
- MTS date range
- Agency multi-select
- Section anchors / tabs
- Restatement: default original (`N`)

### Hooks

Domain hooks under `src/hooks/`:

- `useFrusgNetCost`
- `useFrusgBalanceSheet`
- `useFrusgBridges` (net position / reconciliations / cash balance summaries)
- `useMtsAgencyOutlays`
- `useReceiptsByAgency`
- `useGfpInsights`

Use TanStack Query with specific `queryKey`s (e.g. `['gfp', 'net-cost', fiscalYear]`). Read from views, not raw tables, where possible.

### Components

Prefer `src/features/gfp/` or `src/components/gfp/`:

- `GfpKpiStrip`
- `NetCostByAgencyChart`
- `BalanceSheetTrendChart`
- `AccrualBridgeTables`
- `AgencyOutlaysRankTable`
- `AgencyOutlaysSeriesChart`
- `ReceiptsByAgencyPanel`
- `ConcentrationPanel`
- `GfpInsightList`
- `GfpExportButton`
- `GfpProvenanceFooter`
- `GfpTeaserCard` (for Fiscal Lab)

Reuse existing terminal card shells, Recharts patterns, `SectionErrorBoundary`, `LazyRender`, `SectionLoadingFallback`.

### Empty / loading / error

- Skeleton or explicit “unavailable” — **never** placeholder numbers
- Surface staleness via existing freshness patterns where applicable

### Insight rules (deterministic examples)

- “Top 5 agencies account for {x}% of net cost in FY{y} (prior FY: {z}%).”
- “Consolidated net position changed by ${delta}B YoY.”
- “Largest MoM outlay increase: {agency} ({pct}%).”
- “Agency outlay concentration (HHI) {rose|fell} vs prior year.”
- “Top receipt agencies FY{y}: {a}, {b}, {c}.”

All values from views / loaded series only.

---

## Documentation Deliverable

Create `docs/gfp-fiscal-data-endpoints.md` (or section in Data Sources page) covering:

1. Endpoint list + field mappings  
2. Restatement policy  
3. Accrual vs cash labeling  
4. Refresh cadence  
5. Agency code map source  
6. Explicit note: MTD XLSX not used in v1  

---

## Testing

| Layer | Test |
|-------|------|
| Unit | Insight rule pure functions; concentration/HHI math; export serialization |
| Smoke | `GovFinancialPositionLab` renders without crash (extend `smoke.test.tsx`) |
| Ingest | Optional Deno tests for pagination/mapping if pattern exists |
| Manual | With real Supabase data after first ingest |

---

## CI / Deploy

1. Migration applied via Supabase CLI  
2. Edge function deployed  
3. `npm run lint` clean (`--max-warnings 0`)  
4. `npm run test` green  
5. `npm run build` green  
6. Netlify deploy on commit (existing pipeline)  

---

## Non-Goals (v1)

- Monthly Treasury Disbursements XLSX parse  
- LLM narrative generation  
- Sustainability FRUSG statements  
- Forecasting / regime scoring beyond descriptive concentration  
- Redesign of entire US Macro & Fiscal Lab  
- Browser-side full historical MTS dump  

---

## Success Criteria

1. Every displayed number traceable to Fiscal Data endpoint + date  
2. No mock/stale fabricated values  
3. Board serves from Supabase views (sub-second typical query)  
4. Tightly linked from US Macro & Fiscal Lab  
5. Lint, tests, and production build pass on commit  

---

## Implementation Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Schema migration + RLS + agency map seed |
| 2 | Ingest FRUSG five statements |
| 3 | Ingest MTS-5 + receipts_by_department |
| 4 | Views + TypeScript types + hooks |
| 5 | GFP board page + route + nav |
| 6 | Fiscal Lab teaser |
| 7 | Insights + export + provenance footer |
| 8 | Endpoint docs + CI verification + deploy |

---

## Spec Self-Review

- [x] No TBD/TODO placeholders in requirements  
- [x] MTD non-API constraint explicit  
- [x] Accrual vs cash rule explicit  
- [x] Architecture matches UI modules  
- [x] Scope bounded to one shippable v1  
- [x] Ambiguities resolved: MTS-5 for monthly cash; hybrid placement; full accrual five statements  
