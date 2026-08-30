# SEC EDGAR Strategic Exposure and Stress Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first GraphiQuestor corporate-transmission vertical slice for a curated S&P 500 universe, with SEC evidence ingestion, structured stress signals, and a provenance-first terminal workspace.

**Architecture:** Add domain tables for issuer coverage, SEC evidence, and derived corporate signals. Ingest SEC-native submissions and company facts through a Supabase Edge Function, normalize evidence with immutable accession identifiers, compute issuer-relative liquidity, debt-wall, working-capital, and capex signals, then expose them through typed hooks and a lazy-loaded React page. Keep the external SEC EDGAR MCP as a research adapter only; production data contracts remain GraphiQuestor-owned.

**Tech Stack:** Supabase Postgres migrations, Deno Edge Functions, TypeScript, React 18, React Router v7, TanStack Query v5, existing GraphiQuestor provenance and freshness components, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-30-sec-edgar-strategic-exposure-design.md`

## Global Constraints

- Production ingestion uses SEC-native public APIs and filing archives.
- Every displayed signal must have traceable evidence, freshness metadata, and a methodology version.
- No fabricated values; unavailable or low-confidence extraction renders an explicit unavailable state.
- The product describes structural conditions and does not issue buy, sell, or price forecasts.
- Accession number is the filing idempotency key.
- SEC requests use a declared User-Agent, bounded concurrency, retry backoff, and cache validators where available.
- Existing `@/` imports, named page exports, TanStack Query conventions, and terminal provenance components remain in use.
- The external MCP repository is not a production runtime dependency.

## File map

- Create `supabase/migrations/20260830000000_sec_corporate_transmission.sql` for issuer, evidence, and signal tables, indexes, RLS, and read views.
- Create `supabase/functions/ingest-sec-corporate/index.ts` for SEC submissions and company-facts ingestion.
- Create `supabase/functions/compute-corporate-signals/index.ts` for structured stress signal calculations.
- Create `src/hooks/useCorporateTransmission.ts` for typed workspace queries.
- Create `src/pages/CorporateTransmissionPage.tsx` for the user-facing workspace.
- Modify `src/App.tsx` to add a lazy route.
- Modify `src/layout/GlobalLayout.tsx` to add terminal navigation.
- Modify `src/types/database.types.ts` if generated types are maintained manually in this repository.
- Add unit tests beside each domain module and function, plus page mount coverage.

### Task 1: Domain schema and issuer registry

**Files:**
- Create: `supabase/migrations/20260830000000_sec_corporate_transmission.sql`
- Modify: `src/types/database.types.ts`
- Test: `supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts`

**Interfaces:**
- Produces table `sec_corporate_issuers` with columns `id uuid`, `cik text`, `ticker text`, `issuer_name text`, `exchange text`, `sic text`, `sector text`, `relevance_tags text[]`, `relevance_rationale text`, `is_active boolean`, `created_at timestamptz`, and `updated_at timestamptz`.
- Produces table `sec_filing_evidence` with columns `id uuid`, `issuer_id uuid`, `cik text`, `accession_number text`, `form_type text`, `filing_date date`, `acceptance_timestamp timestamptz`, `document_url text`, `section_name text`, `evidence_kind text`, `evidence_text text`, `structured_payload jsonb`, `source_hash text`, `parser_version text`, `freshness_status text`, `created_at timestamptz`.
- Produces table `sec_corporate_signals` with columns `id uuid`, `issuer_id uuid`, `signal_id text`, `signal_family text`, `macro_theme text`, `state text`, `numeric_value numeric`, `unit text`, `baseline_value numeric`, `comparison_window text`, `severity text`, `confidence numeric`, `methodology_version text`, `evidence_ids uuid[]`, `observed_at timestamptz`, `created_at timestamptz`.
- Produces views `vw_latest_corporate_signals` and `vw_corporate_transmission_summary`.

- [ ] **Step 1: Write the failing schema contract test**

Assert the migration text contains the three tables, the unique constraint on `(cik, accession_number, section_name, evidence_kind)`, the unique constraint on `(issuer_id, signal_id, observed_at)`, RLS enablement, and both read-view names.

- [ ] **Step 2: Run the focused test**

Run: `npx vitest run supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts`

Expected: FAIL because the migration and test file do not exist.

- [ ] **Step 3: Implement the migration and typed records**

Add enum checks for evidence freshness (`fresh`, `lagged`, `very_lagged`, `unavailable`), signal state (`observed`, `measured`, `changed`, `confirmed`), and severity (`info`, `watch`, `elevated`, `high`). Add indexes on issuer, accession, form type, signal ID, macro theme, and observed timestamp. Enable RLS and create authenticated read policies consistent with existing public metric tables.

- [ ] **Step 4: Run the focused test and type check**

Run: `npx vitest run supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts && npx tsc --noEmit`

Expected: PASS with no TypeScript errors from the new types.

- [ ] **Step 5: Commit**

Run: `git add supabase/migrations/20260830000000_sec_corporate_transmission.sql src/types/database.types.ts supabase/functions/_shared/__tests__/sec_corporate_schema.test.ts && git commit -m "feat: add SEC corporate transmission schema"`

### Task 2: SEC-native evidence ingestion

**Files:**
- Create: `supabase/functions/ingest-sec-corporate/index.ts`
- Create: `supabase/functions/ingest-sec-corporate/index.test.ts`
- Create: `supabase/functions/_shared/secClient.ts`
- Create: `supabase/functions/_shared/secClient.test.ts`

**Interfaces:**
- `fetchSecJson(path: string, userAgent: string, fetchImpl?: typeof fetch): Promise<unknown>` returns parsed SEC JSON and throws typed errors for 429, 5xx, malformed JSON, or missing User-Agent.
- `ingestIssuer(cik: string, supabase: SupabaseClient, fetchImpl?: typeof fetch): Promise<{ filings: number; evidence: number }>` reads the active issuer, fetches submissions and company facts, and upserts by accession and evidence identity.
- The Edge Function handler accepts the existing cron authentication pattern and processes active issuers with bounded concurrency.

- [ ] **Step 1: Write failing client tests**

Cover User-Agent rejection, successful JSON response, retryable 429, retryable 503, and malformed JSON. Assert no request is made when the User-Agent is empty.

- [ ] **Step 2: Run the client tests**

Run: `npx vitest run supabase/functions/_shared/secClient.test.ts`

Expected: FAIL because the SEC client does not exist.

- [ ] **Step 3: Implement the SEC client**

Use `https://data.sec.gov/submissions/CIK##########.json` and `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json`. Set `User-Agent` and `Accept-Encoding: gzip, deflate`. Retry 429 and 5xx with capped exponential backoff, honoring `Retry-After` when present. Do not retry 4xx errors other than 429.

- [ ] **Step 4: Write failing ingestion tests**

Use fixture JSON for one issuer with one 10-Q, one 8-K, and two XBRL facts. Assert filing metadata and structured facts are upserted, duplicate accession numbers are idempotent, and a failed document creates an unavailable evidence record.

- [ ] **Step 5: Implement ingestion**

Resolve the issuer from `sec_corporate_issuers`, fetch submissions and company facts, retain source URLs and hashes, create evidence records for filing metadata and standard facts, and record ingestion failures with `freshness_status = 'unavailable'`. Use the shared handler and job-runner patterns already present in `supabase/functions/_shared`.

- [ ] **Step 6: Run function tests**

Run: `npx vitest run supabase/functions/_shared/secClient.test.ts supabase/functions/ingest-sec-corporate/index.test.ts`

Expected: PASS with all fixture assertions green.

- [ ] **Step 7: Commit**

Run: `git add supabase/functions/ingest-sec-corporate supabase/functions/_shared/secClient.ts supabase/functions/_shared/secClient.test.ts && git commit -m "feat: ingest SEC corporate evidence"`

### Task 3: Structured stress signal computation

**Files:**
- Create: `supabase/functions/compute-corporate-signals/index.ts`
- Create: `supabase/functions/compute-corporate-signals/index.test.ts`
- Create: `supabase/functions/_shared/corporateSignalMath.ts`
- Create: `supabase/functions/_shared/corporateSignalMath.test.ts`

**Interfaces:**
- `calculateCashRunway(cash: number, quarterlyOperatingCashFlow: number): number | null` returns quarters of runway when operating cash flow is negative and `null` when the denominator is non-negative or unavailable.
- `calculateDebtWall(maturities: Array<{ year: number; amount: number }>, cash: number): Array<{ year: number; amount: number; cashCoverage: number | null }>` returns year-level maturity and cash coverage.
- `calculateWorkingCapitalDays(receivables: number, inventory: number, payables: number, revenue: number, cogs: number): { receivableDays: number; inventoryDays: number; payableDays: number; cashConversionDays: number } | null` returns null for missing or non-positive denominators.
- `calculateCapexImpulse(capexGrowth: number, revenueGrowth: number): number | null` returns capex growth minus revenue growth.
- Defines `NormalizedEvidence = { id: string; issuerId: string; kind: 'xbrl_fact' | 'filing_metadata' | 'filing_text'; payload: Record<string, unknown>; observedAt: string; sourceUrl: string }` and `SignalObservation = { issuerId: string; signalId: string; signalFamily: string; macroTheme: string; state: 'observed' | 'measured' | 'changed' | 'confirmed'; numericValue: number | null; unit: string | null; baselineValue: number | null; comparisonWindow: string; severity: 'info' | 'watch' | 'elevated' | 'high'; confidence: number; methodologyVersion: string; evidenceIds: string[]; observedAt: string }`.
- `computeIssuerSignals(issuerId: string, evidence: NormalizedEvidence[], priorSignals: SignalObservation[]): SignalObservation[]` emits component signals with evidence IDs, comparison windows, severity, confidence, and methodology version.

- [ ] **Step 1: Write failing math tests**

Cover negative operating cash flow, non-negative cash flow, missing values, debt maturity cash coverage, zero denominators, working-capital day calculations, and capex impulse.

- [ ] **Step 2: Run math tests**

Run: `npx vitest run supabase/functions/_shared/corporateSignalMath.test.ts`

Expected: FAIL because the math module does not exist.

- [ ] **Step 3: Implement pure calculations**

Keep calculations free of Supabase and network calls. Return `null` for unavailable data. Use explicit units and preserve the source period in the normalized evidence passed to the functions.

- [ ] **Step 4: Write failing signal orchestration tests**

Assert that a fixture issuer produces liquidity runway, debt wall, working-capital, and capex impulse observations; each observation contains at least one evidence ID, a methodology version, and a comparison window. Assert that missing evidence produces no fabricated observation.

- [ ] **Step 5: Implement signal orchestration**

Read normalized evidence and prior observations, calculate the four structured signal families, assign descriptive states and severity from configuration constants, and upsert observations by issuer, signal ID, and observed timestamp. Do not emit an aggregate score.

- [ ] **Step 6: Run signal tests**

Run: `npx vitest run supabase/functions/_shared/corporateSignalMath.test.ts supabase/functions/compute-corporate-signals/index.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

Run: `git add supabase/functions/compute-corporate-signals supabase/functions/_shared/corporateSignalMath.ts supabase/functions/_shared/corporateSignalMath.test.ts && git commit -m "feat: compute corporate stress signals"`

### Task 4: Corporate Transmission terminal workspace

**Files:**
- Create: `src/hooks/useCorporateTransmission.ts`
- Create: `src/hooks/useCorporateTransmission.test.ts`
- Create: `src/pages/CorporateTransmissionPage.tsx`
- Create: `src/pages/__tests__/CorporateTransmissionPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/layout/GlobalLayout.tsx`

**Interfaces:**
- `useCorporateTransmission(filters?: { theme?: string; severity?: string; issuerId?: string }): { data: CorporateSignalRow[]; isLoading: boolean; isError: boolean }` reads `vw_latest_corporate_signals`.
- `useCorporateTransmissionSummary(): { data: CorporateTransmissionSummary | undefined; isLoading: boolean }` reads `vw_corporate_transmission_summary`.
- `CorporateTransmissionPage` is a named export and renders the workspace with explicit loading, error, empty, and unavailable states.

- [ ] **Step 1: Write failing hook tests**

Mock Supabase responses for latest signals and summary counts. Assert filters map to query predicates and returned rows preserve evidence IDs, severity, freshness, and methodology version.

- [ ] **Step 2: Run hook tests**

Run: `npx vitest run src/hooks/useCorporateTransmission.test.ts`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the typed hooks**

Use query keys `['corporate-transmission', filters]` and `['corporate-transmission-summary']`, with the repository’s default TanStack Query behavior. Do not query raw tables from the page.

- [ ] **Step 4: Write failing page mount tests**

Assert the page renders the workspace label, summary counts, signal-family sections, source and freshness metadata, an unavailable state for a signal with no evidence, and no investment recommendation copy.

- [ ] **Step 5: Implement the page**

Build a dense terminal view with summary cards, theme filters, signal-family sections, issuer rows, severity state, comparison window, evidence count, methodology version, and links to source URLs. Reuse `DataProvenanceBadge`, `FreshnessChip`, existing card primitives, and the established dark terminal styling.

- [ ] **Step 6: Add route and navigation**

Add a lazy import and route at `/corporate-transmission` in `src/App.tsx`. Add one terminal navigation item in `GlobalLayout.tsx` with a suitable existing icon and the label `Corporate Transmission`.

- [ ] **Step 7: Run page tests and build**

Run: `npx vitest run src/hooks/useCorporateTransmission.test.ts src/pages/__tests__/CorporateTransmissionPage.test.tsx && npm run build`

Expected: PASS and a successful Vite build.

- [ ] **Step 8: Commit**

Run: `git add src/hooks/useCorporateTransmission.ts src/hooks/useCorporateTransmission.test.ts src/pages/CorporateTransmissionPage.tsx src/pages/__tests__/CorporateTransmissionPage.test.tsx src/App.tsx src/layout/GlobalLayout.tsx && git commit -m "feat: add corporate transmission terminal"`

### Task 5: Integration verification and operational documentation

**Files:**
- Modify: `OPERATIONS.md`
- Create: `supabase/functions/ingest-sec-corporate/README.md`
- Create: `supabase/functions/compute-corporate-signals/README.md`
- Test: existing full test suite and lint/build commands

**Interfaces:**
- Documents required `SEC_USER_AGENT`, schedule expectations, retry behavior, unavailable-state semantics, and manual replay procedure.
- Documents signal methodology version `v1.0.0` for liquidity runway, debt wall, working capital, and capex impulse.

- [ ] **Step 1: Add operational documentation**

Document environment variables, deployment commands, monitoring fields, dead-letter handling, and the exact source URLs used by the ingestion adapter.

- [ ] **Step 2: Run the complete verification suite**

Run: `npm run lint && npm run test && npm run build`

Expected: zero lint warnings, all Vitest tests passing, and a successful production build.

- [ ] **Step 3: Review data-contract coverage**

Check that every page signal includes evidence IDs, a source URL, freshness status, comparison window, and methodology version. Check that missing evidence renders unavailable and that no placeholder numbers were introduced.

- [ ] **Step 4: Commit**

Run: `git add OPERATIONS.md supabase/functions/ingest-sec-corporate/README.md supabase/functions/compute-corporate-signals/README.md && git commit -m "docs: document SEC corporate signal operations"`
