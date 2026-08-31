# Corporate Stress and Refinancing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add evidence-linked liquidity and numeric refinancing signals to the Corporate Transmission workspace while preserving explicit comparison frames, freshness, and no-fabrication behavior.

**Architecture:** Extend the existing SEC evidence table with a broader, bounded companyfacts concept map. Compute issuer-level MVP signals from comparable SEC observations, storing calculation inputs and availability metadata alongside evidence UUIDs. Present the new signal families in the existing Corporate Transmission page with a Corporate Stress tab and a minimalist editorial detail view.

**Tech Stack:** Supabase Postgres migrations, Deno Edge Functions, `@supabase/supabase-js`, React 18, TypeScript, TanStack Query, Tailwind CSS, Vitest, MUI shell.

**Spec:** `docs/superpowers/specs/2026-08-31-corporate-stress-refinancing-design.md`

## Global Constraints

- MVP uses numeric SEC companyfacts and filing metadata; filing-note extraction is Phase 2.
- Retain six comparable observations per concept/unit in MVP.
- Never create measured signals when required source facts are missing.
- Missing numeric facts use `availability_status = 'insufficient_evidence'`; the existing `state` constraint remains unchanged.
- Every displayed signal exposes its evidence IDs, filing date, accession, SEC URL, freshness, parser/methodology version, and comparison window.
- SEC requests must use the existing `fetchSecJson` client and configured `SEC_USER_AGENT`.
- Edge Function deployments must use `--import-map supabase/functions/deno.json`.
- Preserve unrelated worktree changes and use `@/` imports in frontend code.

## File Map

- Create: `supabase/migrations/20260831000004_corporate_stress_signal_contract.sql` for signal metadata columns, checks, and view exposure.
- Modify: `supabase/functions/_shared/secCorporateConcepts.ts` for the required XBRL concept families.
- Modify: `supabase/functions/ingest-sec-corporate/index.ts` for bounded evidence ingestion and comparable-period identity.
- Modify: `supabase/functions/compute-corporate-signals/index.ts` for liquidity and refinancing MVP calculations.
- Modify: `supabase/functions/_shared/corporateSignalMath.ts` for pure calculation helpers.
- Modify: `src/hooks/useCorporateTransmission.ts` for workspace/family filtering and typed metadata.
- Modify: `src/pages/CorporateTransmissionPage.tsx` for Macro Transmission and Corporate Stress tabs, family sections, priority state, and detail panel.
- Test: `supabase/functions/_shared/corporateSignalMath.test.ts`.
- Test: `supabase/functions/ingest-sec-corporate/index.test.ts`.
- Test: `supabase/functions/compute-corporate-signals/index.test.ts`.
- Test: `src/pages/CorporateTransmissionPage.test.tsx` or the existing page test location discovered before implementation.
- Modify: `OPERATIONS.md` with deployment, migration, backfill, and verification commands.

### Task 1: Add the signal metadata contract

**Files:**
- Create: `supabase/migrations/20260831000004_corporate_stress_signal_contract.sql`
- Modify: `src/types/database.types.ts` using the repository’s schema-generation workflow, or update the generated view type if that workflow is unavailable.
- Test: `supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts`

**Interfaces:**
- Produces `sec_corporate_signals.calculation_inputs jsonb NOT NULL DEFAULT '{}'::jsonb`.
- Produces `sec_corporate_signals.confidence_reason text`.
- Produces `sec_corporate_signals.availability_status text NOT NULL DEFAULT 'available'` with `available`, `insufficient_evidence`, and `unavailable` values.
- Extends `vw_latest_corporate_signals` with those fields and `evidence_parser_versions`.

- [ ] **Step 1: Write the failing schema assertions.** Assert the migration contains the three columns, the availability check, and view projection. Assert `state` remains limited to `observed`, `measured`, `changed`, and `confirmed`.
- [ ] **Step 2: Add the migration.** Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, add the check constraint only when absent, and replace the latest-signal view while preserving its existing columns. Build parser-version arrays from the evidence UUID join.
- [ ] **Step 3: Update generated TypeScript types.** Ensure `calculation_inputs`, `confidence_reason`, `availability_status`, and `evidence_parser_versions` are represented as nullable/required types matching Postgres.
- [ ] **Step 4: Run the schema test.** Run `npx vitest run supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts --pool=threads --maxWorkers=1` and expect PASS.
- [ ] **Step 5: Commit.** `git add supabase/migrations/20260831000004_corporate_stress_signal_contract.sql src/types/database.types.ts supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts && git commit -m "feat: add corporate stress signal metadata"`

### Task 2: Expand bounded SEC evidence ingestion

**Files:**
- Modify: `supabase/functions/_shared/secCorporateConcepts.ts`
- Modify: `supabase/functions/ingest-sec-corporate/index.ts`
- Test: `supabase/functions/ingest-sec-corporate/index.test.ts`

**Interfaces:**
- Produces `SEC_CORPORATE_SIGNAL_CONCEPTS` arrays for cash, operating cash, revenue, net income, capex, operating income, debt, interest, receivables, inventory, and payables.
- `factRows()` stores section identity as `${namespace}:${concept}:${unit}:${periodKey}` and keeps six comparable periods.
- `ingest-sec-corporate?limit=8&offset=N` processes one bounded issuer batch and returns accurate `meta.processedIssuers`.

- [ ] **Step 1: Add failing fixtures.** Include duration facts with `start` and `end`, duplicate facts from one accession, irrelevant concepts, multiple units, a 404 companyfacts response, and a batch query with eight issuers.
- [ ] **Step 2: Extend the concept map.** Include the exact concepts required by MVP calculations, with ordered fallback concepts for US GAAP and IFRS where applicable.
- [ ] **Step 3: Preserve duration identity.** Store `start`, `end`, `frame`, `form`, `fp`, and `periodKey` in `structured_payload.fact`; use unit and period in `section_name`; retain only six periods per concept/unit.
- [ ] **Step 4: Make foreign issuer enrichment resilient.** If companyfacts returns `SecClientError` status 404 after submissions succeed, retain filing metadata and return an empty facts payload. Preserve other errors as issuer-level unavailable evidence.
- [ ] **Step 5: Verify bounded batches.** Parse `limit` and `offset`, cap limit at 10, process sequentially, return issuer counts before queue draining, and return failures in `meta.failedIssuers` without aborting successful issuers.
- [ ] **Step 6: Run ingestion tests.** Run `npx vitest run supabase/functions/ingest-sec-corporate/index.test.ts --pool=threads --maxWorkers=1` and expect PASS.
- [ ] **Step 7: Commit.** `git add supabase/functions/_shared/secCorporateConcepts.ts supabase/functions/ingest-sec-corporate/index.ts supabase/functions/ingest-sec-corporate/index.test.ts && git commit -m "feat: ingest corporate stress facts"`

### Task 3: Implement pure liquidity and refinancing calculations

**Files:**
- Modify: `supabase/functions/_shared/corporateSignalMath.ts`
- Modify: `supabase/functions/compute-corporate-signals/index.ts`
- Test: `supabase/functions/_shared/corporateSignalMath.test.ts`
- Test: `supabase/functions/compute-corporate-signals/index.test.ts`

**Interfaces:**
- `calculateFreeCashFlow(operatingCashFlow: number, capex: number): number | null`.
- `calculateFcfMargin(freeCashFlow: number, revenue: number): number | null`.
- `calculateCashConversion(freeCashFlow: number, netIncome: number): number | null`.
- `calculateInterestCoverage(operatingIncome: number, interestExpense: number): number | null`.
- `calculateDebtBurdenTrend(currentDebt: number, priorDebt: number, currentInterest: number, priorInterest: number): { debtGrowth: number; interestGrowth: number } | null`.
- `computeIssuerSignals(issuerId, evidence)` returns MVP liquidity/refinancing observations with `calculationInputs`, `confidenceReason`, and `availabilityStatus`.

- [ ] **Step 1: Write failing math tests.** Cover finite positive/negative values, zero denominators, missing inputs, negative net income, and comparable-period debt/interest changes. Assert no NaN or Infinity.
- [ ] **Step 2: Add pure helpers.** Reject invalid denominators and return null when the source facts cannot support a meaningful ratio. Keep units and sign conventions explicit in helper names and tests.
- [ ] **Step 3: Normalize SEC duration facts.** Preserve `start`, classify comparable quarterly/annual windows, deduplicate by unit/period, and select latest plus prior observations from the same series.
- [ ] **Step 4: Add liquidity observations.** Emit FCF, FCF margin, cash conversion, cash-balance trend, and working-capital drag only when their required facts exist. Store the exact inputs and source evidence IDs in `calculation_inputs`.
- [ ] **Step 5: Add numeric refinancing observations.** Emit interest coverage and debt-burden trend. Mark missing required inputs with `availabilityStatus: 'insufficient_evidence'` in the compute model without violating the database `state` constraint.
- [ ] **Step 6: Preserve current capex behavior.** Keep `capex_impulse` evidence-linked and comparable, and mark the existing `cash_runway_quarters` identifier as deprecated context or migrate it to the approved liquidity naming in the same contract change.
- [ ] **Step 7: Upsert new fields.** Map calculation inputs, confidence reason, and availability status into the new columns and keep `onConflict: 'issuer_id,signal_id,observed_at'`.
- [ ] **Step 8: Run signal tests.** Run `npx vitest run supabase/functions/_shared/corporateSignalMath.test.ts supabase/functions/compute-corporate-signals/index.test.ts --pool=threads --maxWorkers=1` and expect PASS.
- [ ] **Step 9: Commit.** `git add supabase/functions/_shared/corporateSignalMath.ts supabase/functions/compute-corporate-signals/index.ts supabase/functions/_shared/corporateSignalMath.test.ts supabase/functions/compute-corporate-signals/index.test.ts && git commit -m "feat: compute corporate liquidity and refinancing signals"`

### Task 4: Build the two-workspace frontend

**Files:**
- Modify: `src/hooks/useCorporateTransmission.ts`
- Modify: `src/pages/CorporateTransmissionPage.tsx`
- Test: `src/pages/CorporateTransmissionPage.test.tsx` or the repository’s discovered equivalent.

**Interfaces:**
- Hook filters support workspace/family, severity, and issuer ID while querying `vw_latest_corporate_signals`.
- Page renders `Macro Transmission` and `Corporate Stress` tabs, family sections, current priority family, and a signal detail panel.

- [ ] **Step 1: Add failing page tests.** Assert tabs render, Corporate Stress filters to liquidity/refinancing families, empty evidence shows “insufficient evidence,” and a populated row exposes calculation inputs, comparison window, freshness, filing date, and SEC link.
- [ ] **Step 2: Extend hook types and filters.** Use generated view types; add family/workspace filtering without weakening query keys or error handling.
- [ ] **Step 3: Add tab state.** Default to the highest-priority family with fresh available signals, falling back to the first family with data, then an explicit no-data state.
- [ ] **Step 4: Render family sections.** Group rows by `signal_family`, rank by severity/confidence/freshness/breadth, and show only semantic pastel status labels.
- [ ] **Step 5: Render detail evidence.** Show numerator, denominator, comparison window, calculation inputs, confidence reason, parser/methodology version, source filing, accession, freshness, and evidence excerpt where available.
- [ ] **Step 6: Apply minimalist UI rules.** Use warm monochrome surfaces, one-pixel dividers, serif workspace headings, monospace metadata, crisp small-radius cards, no gradients, no heavy shadows, and no decorative chart without a comparison or obligation timeline.
- [ ] **Step 7: Run frontend tests and typecheck.** Run the focused page test and `npx tsc --noEmit`.
- [ ] **Step 8: Commit.** `git add src/hooks/useCorporateTransmission.ts src/pages/CorporateTransmissionPage.tsx src/pages/CorporateTransmissionPage.test.tsx && git commit -m "feat: add corporate stress workspace"`

### Task 5: Deploy, backfill, and verify production

**Files:**
- Modify: `OPERATIONS.md`
- Test: production HTTP and PostgREST verification commands below.

**Interfaces:**
- Migration is applied with `supabase db push --linked --include-all` because the repository has newer remote migrations.
- Functions deploy with the shared import map.

- [ ] **Step 1: Run the full focused test suite.** `npx vitest run supabase/functions/_shared/corporateSignalMath.test.ts supabase/functions/ingest-sec-corporate/index.test.ts supabase/functions/compute-corporate-signals/index.test.ts --pool=threads --maxWorkers=1`.
- [ ] **Step 2: Apply migrations.** `supabase db push --linked --include-all`.
- [ ] **Step 3: Deploy functions.** Deploy both SEC ingestion and compute functions using `--import-map supabase/functions/deno.json --use-api --no-verify-jwt`.
- [ ] **Step 4: Backfill bounded issuer batches.** POST ingestion for offsets `0, 8, 16, 24, 32`, record each response, and confirm no batch returns a worker-resource error.
- [ ] **Step 5: Compute signals.** POST the compute function and confirm the response includes upserted liquidity/refinancing or explicit insufficient-evidence rows.
- [ ] **Step 6: Verify database views.** Query `vw_corporate_transmission_summary` and `vw_latest_corporate_signals`; confirm evidence counts, signal families, latest timestamps, availability status, calculation inputs, and SEC document URLs.
- [ ] **Step 7: Verify the frontend.** Open `/corporate-transmission/`, switch between both tabs, select the highest-priority family, open an issuer detail, and confirm the displayed values match PostgREST.
- [ ] **Step 8: Document operations.** Add the migration, deployment, bounded backfill, and verification commands to `OPERATIONS.md`.

## Plan Self-Review

- Spec coverage: MVP numeric liquidity/refinancing, explicit comparison frames, metadata contract, failure handling, minimalist frontend, tests, and production verification are covered by Tasks 1–5. Filing-note parsing, peer percentiles, filing-language diffs, and maturity schedules are explicitly Phase 2 and excluded from implementation tasks.
- Placeholder scan: no task depends on an unspecified file, unnamed function, or invented external service. The generated-type workflow must be discovered from the existing repository before Task 1 edits, as stated in that task.
- Type consistency: Task 1 produces the signal metadata consumed by Task 3 and Task 4. Task 2 produces normalized evidence consumed by Task 3. Task 5 deploys the exact functions modified in Tasks 2 and 3.
