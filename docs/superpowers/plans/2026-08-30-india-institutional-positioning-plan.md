# India Institutional Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a provenance-aware India Institutional Positioning module for global macro allocators inside `/intel/india`.

**Architecture:** Add a dedicated institutional-flow ingestion and calculation layer on top of GraphiQuestor’s existing Supabase metric model. Store daily scalar observations in `metric_observations`, sector dimensions in a dedicated table, calculate deterministic component scores in SQL or Edge Functions, and expose the results through a typed hook and `/intel/india` page section.

**Tech Stack:** React 18, TypeScript, MUI, Tailwind, TanStack Query, Supabase Postgres, Deno Edge Functions, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-30-india-institutional-positioning-design.md`

## Global Constraints

- Preserve GraphiQuestor’s pure-data terminal aesthetic and institutional tone.
- Every published observation includes source, as-of date, ingestion timestamp, provenance, and freshness.
- Missing, delayed, historical, or provisional values must remain explicit.
- Never emit fabricated values or treat absent F&O data as zero.
- Use `@/` imports in frontend code.
- Pages use named exports unless the edited page already uses a default export.
- Phase 1 and Phase 2 are in scope. F&O/Cash Conflict and global allocator integration remain out of scope.

### Task 1: Add canonical metric IDs and sector observation schema

**Files:**
- Modify: `src/constants/metricIds.ts`
- Modify: `src/types/database.types.ts`
- Create: `supabase/migrations/20260830000001_india_institutional_positioning.sql`
- Test: `supabase/functions/_shared/__tests__/india_institutional_schema.test.ts`

**Interfaces:**
- Produces canonical IDs for daily scalar metrics and a public-read sector observation table.
- Sector table columns: `sector_key`, `source_sector_label`, `report_period_end`, flow and AUM INR crore fields, `source_url`, `source_hash`, `ingested_at`, `parser_version`, `provenance`, `is_provisional`.

- [ ] Add the 13 metric IDs from the spec, including USD/INR, RBI liquidity impulse, and bank credit growth.
- [ ] Add the migration with unique keys on `(metric_id, as_of_date)` and `(sector_key, report_period_end)`.
- [ ] Add indexes for date, sector, provenance, and source hash.
- [ ] Add RLS policies for public reads and service-role writes.
- [ ] Add the table and row types to `database.types.ts` following generated-type conventions already present in the file.
- [ ] Add schema tests that verify required columns, uniqueness intent, and the no-fabricated-F&O coverage fields.
- [ ] Run the focused schema test.

### Task 2: Implement source parsers and validation

**Files:**
- Create: `supabase/functions/_shared/indiaInstitutionalSources.ts`
- Create: `supabase/functions/_shared/__tests__/indiaInstitutionalSources.test.ts`

**Interfaces:**
- `parseNseCashPayload(payload: unknown): ParsedCashFlow[]`
- `parseParticipantOiCsv(csv: string): ParsedParticipantOi`
- `parseNsdlSectorHtml(html: string, sourceUrl: string): ParsedSectorObservation[]`
- `validateCashFlow(row: ParsedCashFlow): ValidationResult`
- `validateSectorRows(rows: ParsedSectorObservation[]): ValidationResult`

- [ ] Define typed parser outputs with source field names, normalized values, source hash, and parser version.
- [ ] Parse NSE `category`, `buyValue`, `sellValue`, `netValue`, and `date` fields for FII/FPI and DII rows.
- [ ] Enforce reconciliation within `₹1 crore` or `0.10%` of gross value, whichever is larger.
- [ ] Parse participant CSV columns `Future Index Long`, `Future Index Short`, `Option Index Put Short`, and `Option Index Call Short` by header name.
- [ ] Return explicit F&O coverage metadata when rows or required fields are absent.
- [ ] Parse NSDL sector rows while preserving source labels and normalized sector keys.
- [ ] Reject duplicate sector keys within one report, invalid totals, malformed dates, and missing AUM values.
- [ ] Add fixtures for valid payloads, malformed payloads, late F&O, duplicate sectors, and changed sector labels.
- [ ] Run the parser test suite.

### Task 3: Add ingestion Edge Functions and freshness metadata

**Files:**
- Create: `supabase/functions/ingest-india-institutional-flows/index.ts`
- Create: `supabase/functions/ingest-india-sector-positioning/index.ts`
- Create: `supabase/functions/_shared/__tests__/indiaInstitutionalIngestion.test.ts`
- Modify: `src/lib/pipelineCatalog.ts`

**Interfaces:**
- `ingest-india-institutional-flows` writes daily cash and market observations and accepts late F&O updates without replacing cash values.
- `ingest-india-sector-positioning` writes validated NSDL sector observations with report URL and source hash.

- [ ] Implement NSE session acquisition, bounded retries, and the approved `fiidiiTradeReact` endpoint.
- [ ] Implement participant CSV lookup using the current report date and the documented filename variants.
- [ ] Write accepted observations with `source_name`, `source_ref`, `provenance: api_live`, `native_frequency`, and `is_provisional` metadata.
- [ ] Treat absent F&O rows as `unavailable` coverage and retain the last accepted cash observation.
- [ ] Implement NSDL report retrieval and parser invocation.
- [ ] Add date-aware refresh behavior so a failed refresh never overwrites accepted observations.
- [ ] Register both pipelines in `pipelineCatalog.ts` with source, cadence, and `/intel/india` surface metadata.
- [ ] Add ingestion unit tests for success, retry exhaustion, malformed source data, and late F&O.
- [ ] Run focused Deno tests or the repository’s available Edge Function test command.

### Task 4: Implement deterministic signal calculations

**Files:**
- Create: `supabase/functions/compute-india-institutional-positioning/index.ts`
- Create: `supabase/functions/_shared/indiaInstitutionalSignals.ts`
- Create: `supabase/functions/_shared/__tests__/indiaInstitutionalSignals.test.ts`
- Create: `supabase/migrations/20260830000002_india_institutional_signal_views.sql`

**Interfaces:**
- `computeIndiaInstitutionalSignals(input: SignalInput): PositioningSnapshot`
- `percentileRank(value: number, sample: number[]): number`
- `toSignedScore(percentile: number): number`
- `classifyPositioning(snapshot: PositioningSnapshot): PositioningRegime`

- [ ] Implement shared percentile ranking with finite-value filtering, average-rank ties, and winsorization at the 2nd and 98th percentiles.
- [ ] Implement Absorption Capacity using 20-session FII-negative windows and the `0.70 / 0.30` weights in the spec.
- [ ] Implement Foreign Exit Pressure using 20-session, 5-session, and capped 20-session streak inputs with `0.55 / 0.25 / 0.20` weights.
- [ ] Implement Flow-Price Divergence using the specified Nifty, FII flow, breadth, and VIX terms.
- [ ] Implement Sector Rotation Pressure using three-report current reads and twelve-report normalization, with explicit weighted-median, breadth, and top-five concentration definitions.
- [ ] Implement Market Confirmation using Nifty, breadth, VIX, USD/INR, RBI liquidity, and bank credit with missing-input rescaling.
- [ ] Implement the positioning score weights and regime precedence with `Synchronized Risk` first.
- [ ] Require two consecutive accepted observations for normal transitions and one complete observation for `Synchronized Risk`.
- [ ] Persist component inputs, dates, weights, normalization window, coverage mask, confidence, and calculation version.
- [ ] Add deterministic unit tests for every formula, missing inputs, ties, threshold boundaries, and transition hysteresis.
- [ ] Run the focused signal test suite.

### Task 5: Add typed data hook and `/intel/india` interface

**Files:**
- Create: `src/hooks/useIndiaInstitutionalPositioning.ts`
- Modify: `src/pages/IntelIndiaPage.tsx`
- Create: `src/pages/__tests__/indiaInstitutionalPositioning.test.tsx`

**Interfaces:**
- `useIndiaInstitutionalPositioning(): UseQueryResult<PositioningViewModel>`
- `PositioningViewModel` includes regime, score, confidence, component cards, cross-asset confirmation, sectors, coverage, and provenance.

- [ ] Query the positioning snapshot, scalar evidence, and sector observations through TanStack Query.
- [ ] Normalize freshness and coverage into the existing observed, lagged, historical, and unavailable states.
- [ ] Render the positioning header with regime, score, confidence, date, duration, and coverage.
- [ ] Render evidence cards for the four component signals with source and freshness.
- [ ] Render cross-asset confirmation with native cadence and carry-forward age for liquidity and credit.
- [ ] Render sector rotation with normalized flow, persistence, concentration, and report date.
- [ ] Render the historical regime chart with existing chart primitives and selectable overlays.
- [ ] Add methodology and provenance disclosure using existing shared components.
- [ ] Render `Mixed / Insufficient Coverage` with explicit unavailable states.
- [ ] Add component and page tests for loading, complete data, lagged data, unavailable F&O, and insufficient coverage.
- [ ] Run the focused frontend tests.

### Task 6: Wire schedules, data health, and public validation

**Files:**
- Create: `supabase/migrations/20260830000003_india_institutional_positioning_crons.sql`
- Modify: `docs/crons.md`
- Modify: `docs/data_intervals.md`
- Create: `supabase/functions/_shared/__tests__/indiaInstitutionalAcceptance.test.ts`

**Interfaces:**
- Daily cash refresh runs after NSE close, sector refresh runs after NSDL report availability, and signal computation follows accepted inputs.

- [ ] Add weekday cron for daily institutional flows after the NSE reporting window.
- [ ] Add fortnightly or safe daily cron for NSDL sector refresh with source-date deduplication.
- [ ] Add signal computation cron after raw ingestion.
- [ ] Add Data Health entries for both ingestion functions and the calculation function.
- [ ] Add acceptance tests for freshness thresholds: daily `2/7` days, weekly `9/21` days, monthly `45/90` days, and quarterly `120/240` days.
- [ ] Document source cadence, carry-forward rules, and Phase 1/2 coverage gates.
- [ ] Run the full test suite, lint, and production build.
- [ ] Review the final diff and commit the implementation in focused commits.

## Verification checklist

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Focused Edge Function parser and signal tests pass.
- [ ] `/intel/india` renders complete, lagged, historical, and unavailable states.
- [ ] No F&O zero value is shown as verified neutral positioning without source coverage.
- [ ] Every displayed value exposes source, as-of date, ingestion time, and freshness.
- [ ] The positioning score can be reproduced from stored inputs and calculation version.
