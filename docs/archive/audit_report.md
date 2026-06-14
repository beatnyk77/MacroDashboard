# GraphiQuestor — Technical Audit & Improvement Plan

**Audited:** 2026-06-10 · Repo: `MacroDashboard` (graphiquestor.com) · Auditor scope: full repo, depth-weighted to `supabase/functions/`, `supabase/migrations/`, `src/hooks/`, and the SEO pipeline. Page components received lighter review (sampled, not exhaustively read).

> This file replaces a prior pre-launch audit dated 2026-02-18 (superseded; its P1 items concerned Finnhub 403s and feed staleness as of February).

**Method note:** All counts below were produced by scripted analysis of the working tree (105 edge-function `index.ts` files, 372 migration files, 80+ hooks), not estimation. Live database / live cron state was **not** inspected — anywhere live state matters it is flagged as an open question. Per the brief, the six known issues are not re-reported; their root-cause patterns are quantified instead.

---

## 1. Executive Summary

**Overall health grade: C+.** The product surface is impressive and the core ingestion contract (`metric_observations` upsert keyed on `metric_id, as_of_date`) is sound, but the backend is ~105 independently-evolved copies of an ingest script rather than one pipeline with 105 configs, and nothing in CI prevents the known failure classes from recurring. The deploy pipeline covers only 28 of 105 functions and zero migrations, so repo-vs-production drift is structural, not accidental — a serious problem for a solo-dev, acquisition-track project. The SEO pipeline — the business model — ships **invalid nested `<html>` markup on every prerendered page** and build-dated `lastmod` on every sitemap entry, and canonical emission is opt-in per page (39 of 94 page components never render `SEOManager`).

**Top 3 risks:** (1) every edge function is invocable by anyone holding the public anon key, which is committed verbatim in 9 migration files — ingest storms can exhaust third-party API quotas and overwrite live data; (2) the swallow-and-return-200 pattern exists in 19 more functions beyond the known instances, and `ingest-fred` *bumps the freshness timestamp inside its error handler*, so the staleness monitor can be blind exactly when it matters; (3) no generated DB types and no shared metric-ID registry means the metric_id-mismatch bug class has no compile-time guard and will recur.

**Top 3 opportunities:** (1) a one-day SEO-correctness batch (nested-html fix, real lastmod, canonical coverage) directly serves the organic-traffic strategy; (2) consolidating all functions onto the existing — and well-written — `_shared` utilities collapses five known-issue classes into one enforced code path; (3) a deploy-everything CI workflow plus generated types makes the repo a faithful description of production, which is most of acquisition readiness.

---

## 2. Repo Map

**Purpose:** Free institutional macro-intelligence terminal (global liquidity, sovereign stress, India/China granular data, trade flows, energy). Solo developer, production at graphiquestor.com on Netlify + Supabase. Strategy: organic SEO discovery → newsletter capture → acquisition readiness.

**Stack:** React 18 + Vite + TypeScript + Tailwind (with residual MUI), TanStack Query, react-helmet-async, Recharts/Leaflet. Backend: Supabase Postgres + 105 Deno Edge Functions + pg_cron via `net.http_post`. Build: `generate-sitemap → tsc → vite build → puppeteer prerender` (`package.json:12`). Hosting: Netlify with SPA catch-all and security headers (`netlify.toml`).

**Architecture flow:** pg_cron (≈120 `cron.schedule` statements across 68 migration files) → `net.http_post` → ingest edge functions → upsert into `metric_observations` (+ ~70 specialized tables) → frontend hooks query via anon-key Supabase client → pages/feature components → prerendered for crawlers.

| Area | Description |
|---|---|
| `supabase/functions/` (105 dirs) | 92 ingest + compute/generate/digest/health functions. `_shared/` has 9 utility modules (job-runner, ingest_utils, logging, fallback-system…) with **partial adoption** |
| `supabase/migrations/` (372 files) | Schema + RLS + cron schedules + seed data, mixed numbering (14 legacy `NNN_`, 356 timestamped), plus `migrations_backup/` (11 files) |
| `src/hooks/` (80+ files) | Data layer; 56 on TanStack Query, 12 on raw useEffect; string-literal table/metric queries |
| `src/pages/` (39+), `src/features/` (12 domains) | Route components; SEO via `SEOManager` (opt-in, 55 of 94 page-level components) |
| `scripts/` (53 files) | Sitemap/RSS/prerender plus ~40 one-off debug/backfill/test scripts |
| `.github/workflows/` | `deploy.yml` (lint+test+build — good) and `deploy-supabase-functions.yml` (28-function hand-maintained allowlist) |
| Repo root | **84 loose files** — status reports, debug scripts, test outputs, prior audit docs |

**Surprises:** (a) good shared utilities exist but most functions don't use them; (b) an `api-auth-middleware` function exists and is imported by **zero** functions; (c) `execute-restoration-sql/index.ts` is a 1-line stub (dead, but its name will alarm any acquirer's security review); (d) `fix-deno*.cjs` codemod scripts live inside `supabase/functions/` itself.

---

## 3. Audit Report

Severity: **C**ritical / **H**igh / **M**edium / **L**ow. Each finding labeled **[fact]** (verified in files) or **[judgment]**.

### 3.1 Security

**S1 (High) [fact] — All ~105 edge functions are publicly invocable with the anon key, and the anon key is committed.**
`verify_jwt` is disabled for only 2 functions (`supabase/config.toml:387-390`), but JWT verification accepts the *anon* key — and cron migrations embed it verbatim as the Bearer token (20 occurrences across 9 files, e.g. `supabase/migrations/20260204000005_data_refresh_fixes_consolidated.sql:31`), proving anon suffices. The same JWT also appears in `scripts/trigger_backfill.js`, `scripts/automate-backfill.sh`, `scripts/audit-metrics.mjs`, `test_view.mjs`. No function checks an internal secret (grep for `INGEST_SECRET`/`CRON_SECRET`/`x-api-key` → only the unused `api-auth-middleware` plus partial checks in 2 functions). **Consequence:** anyone can trigger ingest storms — exhausting AlphaVantage/FRED/Comtrade quotas (several are rate-limited free tiers), inflating Supabase compute cost, and forcing upserts of partial upstream data over good data. The anon key is public by design; turning it into the *only* gate on 105 write-path functions is the actual weakness.

**S2 (High) [fact] — The vault-secret-into-`::json`-cast injection pattern (known issue #1's root cause) appears ~33 times across 35 migration files.**
Three competing styles coexist: string-concat of `decrypted_secret` inside a `::json(b)` cast (e.g. `supabase/migrations/012_brics_cron.sql:20`, `20260204000001_fix_cron_jobs.sql:9`), a GUC read (`current_setting('vault.service_role_key')`, `20260203000002_ecb_cron.sql:12`), and the safe `jsonb_build_object(...)` (95 occurrences). Roughly **a quarter of header constructions use the unsafe pattern**; a future key rotation to a value containing `"` or `\` breaks all of them simultaneously. Which pattern each *live* cron job currently uses cannot be confirmed from the repo (see Open Questions).

**S3 (High, pending live verification) [fact in repo] — 11 tables are created without RLS in any migration:** `ingestion_logs, upcoming_events, tic_foreign_holders, gold_historical_shocks, india_asi, latest_metrics, cusip_ticker_cache, cie_bulk_block_deals, cie_upcoming_ipos, ingestion_runs, comtrade_cache` (scripted scan of all 372 migrations). With Supabase's default grants, **no RLS = anon can write**, not just read. If true live, anyone can poison `comtrade_cache` or fabricate `ingestion_logs` rows. Core tables are correct — `004_rls_policies.sql:62-140` restricts writes to `service_role`.

**S4 (Medium) [fact] — Dependency CVEs:** `npm audit --omit=dev` reports 5 high (d3-color ReDoS via the unmaintained `react-simple-maps` chain) + 1 moderate (`yaml` stack overflow). Client-side ReDoS, so exploitability is low, but it will light up any acquirer's scan.

**S5 (Low) [fact] — CSP allows `'unsafe-inline'` scripts** (`netlify.toml` headers) — currently necessary for GTM/inline JSON-LD; XSS impact is low on a no-auth, read-mostly site.

### 3.2 Error handling & correctness (root-cause spread of known issues #2/#4)

**E1 (High) [fact] — The swallow-and-return-200 pattern exists in 19 functions** (1 explicit `status: 200` in catch; 18 returning a `Response` from catch with no status, which defaults to 200): `compute-hs-opportunity-scores, fetch-hs-demand, generate-export-scout, ingest-china-macro, ingest-cie-deals, ingest-cie-fundamentals, ingest-cie-promoters, ingest-commodity-terminal, ingest-eurostat-debt, ingest-fred, ingest-geopolitical-osint, ingest-imf-brics, ingest-imf-sdr, ingest-nyfed-markets, ingest-oil-eia, ingest-trade-global-pulse, ingest-us-debt-maturities, ingest-yield-curves`. **Consequence:** pg_cron's `net.http_post` records success; `cron.job_run_details` is useless for these 19; failures surface only as eventual staleness. (51 functions do return 5xx correctly — the codebase knows the right pattern; it just isn't enforced.)

**E2 (High) [fact] — `ingest-fred` bumps the freshness timestamp inside its error handler** (`supabase/functions/ingest-fred/index.ts:202-205`): on per-metric failure it runs `metrics.update({ updated_at: now() })`. Presumably this rotates retry priority (`getActiveMetricsBySource` orders by `updated_at`), but it means **a failing FRED metric looks freshly updated** to `check-data-health`/`vw_data_staleness_monitor`. This is a concrete mechanism by which silent staleness (known-issue class #5) survives an otherwise-working monitor. The idiom should be audited for reuse elsewhere.

**E3 (Medium) [fact] — 22 functions have no top-level try/catch at all** (incl. `ingest-gold`, `ingest-cofer`, `ingest-india-inflation`, `ingest-oecd-cli`, `refresh-gold-ratios`, `ingest-rbi-fx-defense`…). Unhandled throws return 500 — visible to cron, better than E1 — but write no `ingestion_logs` failure row and skip any cleanup.

**E4 (Medium) [fact] — 37 functions contain inner catch blocks that log-and-continue** (`console.error`/`warn` with no rethrow, no status, no log row) — e.g. `ingest-macro-events` (3 such blocks), `ingest-macro-news-headlines` (3), `generate-morning-brief` (2). Partial-failure runs report overall success; one of N sub-sources can die permanently with no signal anywhere.

**E5 (High) [fact] — Shared utilities exist but adoption is fragmentary — the structural answer to "shared template or 92 divergent copies?":** of 105 functions, **8** import `ingest_utils`, **37** use `job-runner`, **51** use `logging`; `validateNumericData` (the input guard in `_shared/ingest_utils.ts:58-63`) is imported by **0** functions; zod appears in **0** functions; only ~30 do ad-hoc `isNaN`/`Number.isFinite` checks before INSERT. The utilities themselves are well-designed (`_shared/job-runner.ts` — timeout + exponential backoff + never-throws contract; `_shared/ingest_utils.ts:68-90` — canonical upsert). The codebase is divergent copies *around* a good template, with no lint/CI rule pushing convergence.

**E6 (High) [fact] — No compile-time data contract between backend and frontend.** The Supabase client is untyped (`src/lib/supabase.ts:10-13` — no `createClient<Database>`); no generated `database.types.ts` exists anywhere in `src/`. Metric IDs are raw string literals on both sides (21 `.eq('metric_id', '…')` + 19 `.in('metric_id', […])` calls in hooks, e.g. `src/hooks/useCopperGoldRatio.ts:21`); no shared registry is consumed by both functions and hooks (`src/lib/metricLabels.ts` is display-only). This is what makes known issue #2 a recurring *class* rather than an incident. `scripts/audit-metrics.mjs` exists as a runtime checker but is not wired into CI.

### 3.3 Data integrity & provenance

**D1 (High) [fact] — Seeded/fabricated data is indistinguishable from ingested data.** No `is_provisional` column exists anywhere (0 hits across migrations, functions, src). **43 migration files INSERT literal data rows**, including into observation tables (`016_us_debt_gold_backing.sql`, `20260206000000_audit_cleanup.sql`). Two ingest functions carry hardcoded fallback datasets that get upserted on API failure (`ingest-trade-gravity/index.ts:83-85` — "Using fallback hardcoded 2023 data" — and `ingest-china-macro`). `_shared/fallback-system.ts:9` defines a provenance enum including `'mock_baseline'` — but provenance lives only in the in-memory return value and is never persisted. **Consequence:** neither you nor an acquirer can prove which rows came from a real source — directly at odds with README's "no mock or stale data" claim and the "authenticity scores / data provenance tracking" positioning.

**D2 (Medium) [fact] — Staleness surfacing in UI is partial:** `FreshnessChip` appears in 13 of ~36 top-level pages; `useStaleness` in 8 files. Server-side monitoring exists and is good (`check-data-health` querying `vw_data_staleness_monitor`, emailing on >30-day staleness, also surfacing failed ingestions and failed crons) — but the alert sender is `alerts@resend.dev` (`check-data-health/index.ts:79`), Resend's shared test domain, which is deliverability-fragile for the single most important alert in the system.

**D3 (Medium) [fact] — Upsert discipline is mostly good, with a tail risk:** 85/105 functions use `.upsert` with explicit `onConflict`; only 2 use bare insert (append-only tables — appropriate); 4 use delete-then-insert. The tail: **30+ distinct `onConflict` key shapes**, each a hand-maintained assumption about a unique index, with nothing verifying they match actual constraints (a mismatch = runtime error or silent duplicates).

### 3.4 Operations, deploy & migration hygiene

**O1 (High) [fact] — The function deploy pipeline covers 28 of 105 functions.** `.github/workflows/deploy-supabase-functions.yml` uses a hand-maintained `paths-filter` allowlist; the other 77 functions deploy only when you remember to run `supabase functions deploy …` manually (`DEPLOYMENT_INSTRUCTIONS.md:53` — which documents `--no-verify-jwt`, so live verify-jwt state may diverge from config.toml). **There is no migration deployment workflow at all.** Repo↔live drift is therefore guaranteed by construction — the structural root of "stale tables" and "live cron state unknown."

**O2 (Medium) [fact] — Cron schedule state is unreconstructable from the repo:** 120 `cron.schedule` + 54 `cron.unschedule` across 68 migration files; 8 job names are scheduled in two different migrations each (`ingest-fred-daily`, `ingest-market-pulse-daily`, `ingest-boj-weekly`, …). Net live state equals the fold of 372 migrations *only if* all were applied in order, which cannot be verified offline. There is no single canonical cron definition.

**O3 (Medium) [fact] — Migration hygiene:** mixed numbering schemes (14 legacy `NNN_` + 356 timestamped), a `migrations_backup/` directory with 11 files inside `supabase/`, and individual migrations mixing schema, seed data, and cron management.

**O4 (Medium) [fact + judgment] — Repo root has 84 loose files:** 28 markdown status/audit reports, ~20 one-off debug scripts (`analyze_crons*.mjs`, `test-nse*.ts`), test outputs (`ingestion_result_v9.json`, `tsc_errors.txt`, `lint-errors.txt`), and codemod scripts inside `supabase/functions/`. [judgment] For acquisition optics this reads as "nobody could find anything either" — and several committed scripts embed the anon JWT + project URL, making abuse turnkey for anyone who clones.

### 3.5 SEO infrastructure (strategic dimension)

**SEO1 (High) [fact] — Every prerendered page ships invalid nested `<html>` markup.** `scripts/prerender.mjs:181-182` wraps `document.documentElement.outerHTML` (which already includes `<html>…</html>`) in another `<html>` tag. Verified in output: `dist/demo/index.html` begins `<!DOCTYPE html>\n<html><html lang="en" class="dark">`. Parsers tolerate it, but it degrades rendering confidence and trips every HTML validator — an unacceptable ambient risk when organic search is the business model.

**SEO2 (High) [fact] — Canonical emission is opt-in, and 39 of 94 page-level components never render `SEOManager`** (`src/components/SEOManager.tsx:42-46` auto-generates a correct self-referencing canonical — *when mounted*). Pages that skip it get no canonical, or a stale one carried over from the previously rendered page via react-helmet. This is the root-cause pattern behind known issue #6; the durable fix is structural (canonical at the layout/router level with per-page override), not page-by-page patching.

**SEO3 (Medium) [fact] — Sitemap `lastmod` is the build date for every URL** (`scripts/prerender.mjs:74,82`), and priority is a path-depth heuristic. Google distrusts uniformly fresh lastmod; you forfeit crawl prioritization on a 111-URL sitemap where briefs/digests genuinely change daily and methodology pages don't.

**SEO4 (Medium) [fact] — Title double-branding:** `titleTemplate: '%s | GraphiQuestor'` (`src/config/brandConfig.ts:17`) is applied to titles that already contain the brand — 8 page components pass "… GraphiQuestor" titles; the live homepage `<title>` contains "| GraphiQuestor" twice (verified in `dist/index.html:73`). Sloppy SERP presentation on the most important pages.

**SEO5 (Medium) [fact] — Soft 404s:** the Netlify SPA catch-all returns HTTP 200 + the `NotFound` component for any unknown URL (`netlify.toml` redirects; `src/App.tsx:165`). Crawlable garbage URLs get indexed and then flagged as soft 404s in GSC.

**SEO6 (Medium) [judgment] — No internal-linking architecture.** No related-content/see-also component exists (grep for RelatedLinks/RelatedContent/SeeAlso → 0 hits); internal links are nav plus ad-hoc. Glossary (`src/features/glossary/glossaryLiveMap.ts`) and blog exist but don't systematically cross-link to data pages. For a 100+ page site chasing organic discovery, link-equity distribution is currently accidental.

**SEO7 (Low) [fact] — Prerender robustness:** a permanently failing route is re-queued forever (`scripts/prerender.mjs:198-200` removes it from visited and re-adds it) — one broken page can hang production builds. Prerendered HTML also snapshots whatever data state existed at build time; an upstream outage during build bakes empty states into crawled pages with no detection.

### 3.6 Testing

**T1 (Medium/High) [fact] — 25 test files, well-aimed but thin over the core:** 9 hook tests (of 80+), good utility coverage (`formatMetric`, `ticCountryMapping`, `exportCSV`…), some component tests including `SEOManager.test.tsx`. **Edge functions: zero tests** — 17,946 lines of ingestion logic (the part that produced every known production incident) is verified only in production. CI runs `lint && test && build` on every push/PR (`.github/workflows/deploy.yml`) — the gate exists; it currently guards the wrong 20%.

### 3.7 Dependencies & code quality

**Q1 (Medium) [fact] — Dead production dependencies:** `openai`, `pg`, `yahoo-finance2`, `dotenv`, `yaml`, `@nivo/sankey` have zero imports in `src/` (edge functions use Deno URL imports, so these serve nothing in `package.json`). `@emotion/*` exists only as MUI's peer.

**Q2 (Medium) [fact] — Triple UI stack mid-migration:** 62 files still import `@mui/material` alongside Radix + Tailwind (root-level `migrate-mui-*.py` scripts indicate an in-flight, stalled migration). Cost: bundle weight (`dist/assets` = 4.4 MB; charts chunk 544 KB) and two design languages to maintain.

**Q3 (Low) [fact] — Type-safety erosion exactly at the data boundary:** 34 hook files use `: any`/`as any`; every `_shared` module opens with `/* eslint-disable @typescript-eslint/no-explicit-any … */`. The lint gate is real but selectively disarmed where data enters the system.

### 3.8 Documentation

**Doc1 (Medium) [fact + judgment] — README is marketing copy, not an engineering on-ramp.** `README.md` claims "no mock or stale data displayed on the live terminal" (contradicted by the known stale tables and D1) and contains no setup instructions. Real engineering docs exist (`architecture.md`, `supabase/ER_DIAGRAM.md`, `DESIGN_SYSTEM.md`, `claude.md`, `AGENTS.md`) but are buried among 28 root-level status reports of unclear currency. [judgment] A buyer's engineer could stand up the *frontend* from the repo (CI proves the build) but could **not** reconstruct the backend: secrets inventory, live cron state, deployed-function flags, and the external API account list are all undocumented. 30-day-untouched survivability currently hinges on one email alert sent from a shared test domain (D2).

### 3.9 Strengths (preserve these)

1. **Idempotent ingestion discipline:** 85/105 functions upsert with explicit conflict keys — re-runs are safe by default. The single most important correctness property is already in place.
2. **The `_shared` utilities are genuinely good** — `job-runner.ts` (timeout + backoff + never-throws contract), `fetchWithRetry` with jitter and 4xx/5xx discrimination, structured `logging.ts`. The fix is adoption, not redesign.
3. **CI quality gate exists and bites:** lint (`--max-warnings 0`) + tests + full build including prerender, on every push and PR.
4. **RLS on core tables is correct:** anon reads, service-role-only writes (`004_rls_policies.sql`), ~100 policies total.
5. **SEO infrastructure exists end-to-end** — prerender, sitemap, RSS, JSON-LD (Organization/WebSite/SoftwareApplication), robots.txt, `llms.txt`, a GSC-sync function. It needs correctness fixes, not construction.
6. **Operational monitoring exists:** `check-data-health` + `vw_data_staleness_monitor` + `ingestion_logs` + email alerting — ahead of most solo projects.
7. **Mature touches:** `useSubscribe` (honeypot, double opt-in, duplicate-as-success UX), Netlify security headers incl. HSTS/CSP, trailing-slash 301s, deploy-preview prerender skip with explanatory comments.

---

## 4. Improvement Strategy

### Theme A — One pipeline, not 105 scripts
**Explains:** E1–E5, D1; known issues #2/#3/#4/#5. **Target state:** every ingest function is a thin config wrapper around a shared `serveIngest()` harness that owns: top-level catch → correct status code + `ingestion_logs` failure row, numeric validation before upsert, provenance stamping, and freshness updates *only on success*. **Principle:** the six known issues are not six bugs; they are one missing abstraction observed six times. Fix the abstraction once, then migrate functions in batches.

### Theme B — The repo must be a faithful description of production
**Explains:** O1–O3, S2, stale tables, live-cron uncertainty. **Target state:** `supabase db push` and full-function deploys run from CI; one canonical, idempotent `crons.sql` (unschedule-all-then-schedule) replaces 68 scattered cron migrations; vault access uses exactly one safe pattern. **Principle:** for a solo dev, anything not deployed by CI eventually drifts; for an acquirer, the repo *is* the asset.

### Theme C — Make the data contract compile-time
**Explains:** E6, the metric_id-mismatch class. **Target state:** generated `database.types.ts` wired into `createClient<Database>`; a single typed `metricIds.ts` registry imported by hooks (and mirrored/codegen'd for functions); `scripts/audit-metrics.mjs` running in CI as the runtime cross-check. **Principle:** string contracts between 105 producers and 80 consumers cannot be maintained by memory.

### Theme D — SEO correctness as a product feature
**Explains:** SEO1–SEO6; known issue #6. **Target state:** valid HTML on every prerendered page; canonical emitted at the router/layout level (default-on, per-page override); honest per-route `lastmod`; deliberate internal-linking component on data pages. **Done =** zero canonical/duplicate-title issues in GSC and validator-clean prerendered output.

### Theme E — Acquisition-readiness hygiene
**Explains:** O4, Doc1, S4, Q1–Q2. **Target state:** repo root ≤15 files; one `OPERATIONS.md` (secrets inventory by name, external API accounts and quota tiers, deploy story, alert runbook, restore-from-zero); README split into marketing vs. engineering; dead deps removed.

### Explicitly NOT recommended now (trade-offs)
- **Completing the MUI→Radix migration (Q2):** 62 files of UI churn with zero data/SEO payoff. Finish opportunistically per-page; don't schedule it.
- **Per-hook test-coverage targets:** display hooks are low-risk; testing effort belongs on the ingest harness and contract checks.
- **Eliminating `'unsafe-inline'` CSP and replacing react-simple-maps:** real but low-exploitability; batch into a later hardening pass (task 3.6).
- **Building out per-function auth via the dormant `api-auth-middleware`:** the right *minimal* fix is one shared `CRON_SECRET` check inside the Theme-A harness; a separate gateway adds latency and a new failure mode for no additional protection.

### "Done" signals (measurable)
- 0 functions whose catch path returns 2xx (scripted CI check).
- 105/105 functions covered by the deploy workflow; migrations deployed by CI; `supabase migration list` shows repo == live.
- 0 active `::json`-cast vault concatenations; `crons.sql` is the single cron source of truth.
- `createClient<Database>` compiles; metric-ID audit passes in CI.
- Prerendered HTML passes validation; GSC duplicate-canonical issues trend to zero over 60 days.
- All 11 RLS-less tables either RLS-enabled or documented as service-role-only with revoked anon grants.

---

## 5. Task Plan

Effort = Claude Code prompt-batch size per the brief (S = single small batch, M = one focused batch, L = 1–2 large batches, XL = needs decomposition). One commit per batch after `npm run lint && npm run build` passes.

### Milestone 0 — Safety net (before touching ingest code)

| # | Task | Files/areas | Acceptance criteria | Effort | Risk | Deps |
|---|---|---|---|---|---|---|
| 0.1 | **CI pattern guards.** Script that fails CI on: catch-returning-2xx (or statusless Response in catch) in any function; `decrypted_secret` concatenated into a `::json(b)` cast in migrations. Codifies this audit's scans; existing violations go in an allowlist burn-down file. | `scripts/ci-guards.mjs`, `.github/workflows/deploy.yml` | CI red on a synthetic violation; green on current allowlisted state | S | None (analysis-only) | — |
| 0.2 | **Snapshot live state.** Via Supabase MCP/CLI: dump `cron.job`, deployed-function list + verify_jwt flags, `pg_policies`, table grants → commit `docs/live-state-2026-06.md`. | `docs/` | Every repo-vs-live mismatch enumerated in one document | S | None | Live access |
| 0.3 | **Characterization tests for `_shared`.** Vitest (node env) for `job-runner`, `ingest_utils.upsertObservations`, `fetchWithRetry` with mocked Supabase/fetch — lock behavior before Theme A builds on them. | `supabase/functions/_shared/__tests__/` | Success, retry, timeout, and upsert-error paths covered and passing | M | Low | — |

### Milestone 1 — Critical correctness & security

| # | Task | Files/areas | Acceptance criteria | Effort | Risk | Deps |
|---|---|---|---|---|---|---|
| 1.1 | **Fix prerender nested-html + double-brand titles + retry cap.** Emit `'<!DOCTYPE html>\n' + outerHTML` without the extra `<html>` wrapper; de-brand the 8 page titles (or make SEOManager strip a pre-existing brand suffix); cap per-route prerender retries at 3. | `scripts/prerender.mjs:181-182,198-200`, 8 page components | Each `dist/**/index.html` contains exactly one `<html`; no title contains the brand twice; build completes despite a known-bad route | S | Low — eyeball 3 sample pages | — |
| 1.2 | **Shared error contract + cron auth.** `_shared/handler.ts` exporting `serveIngest(name, jobFn)`: CORS/OPTIONS → optional `CRON_SECRET` header check (enforced only when env var set, so rollout is non-breaking) → `logIngestionStart` → `runWithRetry` → failure ⇒ log row + HTTP 500; success ⇒ 200 with `{ok, counts}`. Migrate the 19 swallow-200 + 22 no-catch functions (batches of ~10). | `_shared/handler.ts`, 41 function dirs | 0.1 burn-down empty for these 41; forced-error invocation returns 500 and writes an `ingestion_logs` row | L | Medium — per-function behavior change; mitigate with batch deploys + next-morning `cron.job_run_details` check | 0.1, 0.3 |
| 1.3 | **Stop bumping `updated_at` on failure.** Replace `ingest-fred`'s error-path freshness bump with a `last_attempt_at` column (or metadata retry cursor); audit other functions for the same idiom. | `ingest-fred/index.ts:202-205`, one migration | A failing metric no longer reads as fresh in `vw_data_staleness_monitor`; retry rotation preserved | S | Low | — |
| 1.4 | **Canonical `crons.sql` + one safe vault pattern.** Single idempotent migration: unschedule every known job name, reschedule all jobs with `jsonb_build_object(...)` headers (vault subselect as a function argument, never string-concat into a cast); add the `CRON_SECRET` header for 1.2. | new migration, `docs/crons.md` | Live `cron.job` matches `crons.sql` 1:1 (vs. 0.2 snapshot); zero active unsafe patterns | M | Medium — touches ~99 live jobs; verify next-day run logs | 0.2 |
| 1.5 | **RLS the 11 uncovered tables.** Enable RLS + anon-read/service-write, or REVOKE anon entirely for internal tables (`ingestion_logs`, `comtrade_cache`, `cusip_ticker_cache`, `ingestion_runs`). | 1 migration | No anon write path on any of the 11; pages reading `latest_metrics`/`tic_foreign_holders` still render | S | Medium — could break reads; smoke-test each table's consuming hook | 0.2 |

### Milestone 2 — High-leverage improvements

| # | Task | Files/areas | Acceptance criteria | Effort | Risk | Deps |
|---|---|---|---|---|---|---|
| 2.1 | **Full deploy automation.** Replace the 28-entry allowlist with dynamic changed-directory detection deploying any changed function; add a migrations job (`supabase db push` on main; `--dry-run` on PRs). | `.github/workflows/deploy-supabase-functions.yml` | Editing any function dir deploys it; a no-op test migration applies via CI | M | Medium — bad migrations now auto-apply; the PR dry-run is the guardrail | 0.2 |
| 2.2 | **Generated DB types + typed client.** `supabase gen types typescript` → `src/types/database.types.ts`; `createClient<Database>`; fix/triage the resulting error tail. | `src/lib/supabase.ts`, `src/types/`, many hooks | `tsc` clean; CI regenerates types and fails on schema drift | L | Medium — surfaces latent mismatches (desired); escape-hatch casts carry `TODO(types)` | after 1.5/2.1 settle schema |
| 2.3 | **Metric-ID registry.** Typed `src/constants/metricIds.ts`; replace the 40 string-literal usages in hooks; wire `scripts/audit-metrics.mjs` into CI (scheduled) to cross-check registry vs. live `metrics` table. | hooks, constants, CI | Zero raw metric_id literals in `src/hooks` (greppable lint rule); audit script green | M | Low | 2.2 |
| 2.4 | **Persisted provenance.** Add nullable `source_ref` + `is_provisional` to `metric_observations`; harness stamps them on every upsert; mark hardcoded-fallback writes in `ingest-trade-gravity`/`ingest-china-macro` provisional; surface in FreshnessChip tooltip. | migration, `_shared/handler.ts`, 2 functions, FreshnessChip | New rows carry provenance; all seeded/fallback rows queryable via `is_provisional = true` | M | Low (additive) | 1.2 |
| 2.5 | **Default-on canonical + honest lastmod.** Emit canonical/robots at the route-layout level (SEOManager becomes the override); derive sitemap `lastmod` from real content dates (brief/digest publish dates; git mtime for static pages). | layout, `SEOManager.tsx`, `prerender.mjs`, `generate-sitemap.ts` | Every prerendered page has exactly one correct canonical; ≤10% of sitemap entries share a lastmod | M | Low | 1.1 |

### Milestone 3 — Quality & polish

| # | Task | Files/areas | Acceptance criteria | Effort | Risk | Deps |
|---|---|---|---|---|---|---|
| 3.1 | Migrate remaining ~64 functions onto the shared harness | function dirs | 105/105 on harness; 0.1 allowlist empty | XL → 6–7 batches | Medium | 1.2 |
| 3.2 | Repo hygiene: one-off scripts → `scripts/oneoff/`; status docs → `docs/archive/`; delete test outputs and `fix-deno*.cjs`; move `migrations_backup/` out of `supabase/`; drop dead deps (`openai`, `pg`, `yahoo-finance2`, `dotenv`, `yaml`, `@nivo/sankey`) | root, package.json | Root ≤15 entries; lint+build green | S | Low | — |
| 3.3 | `OPERATIONS.md`: secrets inventory (names only), external API accounts + quota tiers, deploy story, alert runbook, restore-from-zero; switch alert sender off `alerts@resend.dev` to a verified domain | docs, `check-data-health` | A cold reader can enumerate every credential and cron dependency; test alert lands in inbox | S | None | 0.2 |
| 3.4 | Internal-linking component (related metrics/glossary per data page) + FreshnessChip on the remaining ~23 data pages | features, pages | Every data page links ≥3 related pages; chip on 100% of data pages | M | Low | 2.4 |
| 3.5 | Soft-404 mitigation: prerendered NotFound carries `noindex`; Netlify 404 for asset-like unknown paths | NotFound, netlify.toml, prerender | GSC soft-404 count trends down over 60 days | S | Low | 1.1 |
| 3.6 | Dependency hardening: resolve or pin-with-rationale the npm-audit highs; evaluate react-simple-maps replacement; revisit CSP `'unsafe-inline'` | package.json, netlify.toml | `npm audit --omit=dev --audit-level=high` clean | M | Medium (map swap) | — |

### Quick wins (high impact, S effort — do immediately)
1. **1.1 prerender nested-html fix** — a one-line-class bug degrading every page of an SEO-first product.
2. **1.3 `updated_at`-on-failure fix** — restores trust in the staleness monitor.
3. **0.1 CI pattern guards** — freezes the spread of all three known bug classes the same day.
4. **3.3 OPERATIONS.md + alert-sender fix** — the highest-leverage acquisition-readiness artifact, and 5 minutes to protect the one signal guarding ~99 cron jobs.
5. **3.2 root cleanup** — cheap, and removes committed-JWT scripts from casual reach.

### Implementation sketches — top 3 tasks

**1.2 Shared error contract (`_shared/handler.ts`).** Compose the existing pieces: `serveIngest(name, jobFn, opts)` does CORS/OPTIONS → `CRON_SECRET` check (no-op when env unset) → `logIngestionStart` → `runWithRetry(name, jobFn)` → `!result.ok` ⇒ failure log row + `Response(status: 500)`; success ⇒ 200 `{ok, counts}`. Steps: write handler + tests against the 0.3 mocks; migrate the 19 swallow-200 functions first (highest signal gain), then the 22 no-catch; deploy ~10 per batch and check `cron.job_run_details` next morning — **expect new failures to become visible; that is the feature, not a regression**. Gotchas: keep the response body shape `{ok, counts, error}` stable (the admin/system-health page may parse it); `net.http_post` is fire-and-forget so cron won't retry 500s — `runWithRetry`'s internal retries already cover transient failures; ship the `CRON_SECRET` header in crons (1.4) *before* setting the env var that enforces it.

**1.4 Canonical `crons.sql`.** Generate from the 0.2 **live snapshot** (authoritative — not the migration fold): one migration with a `DO $$` block unscheduling every name in `cron.job`, then `cron.schedule(...)` per job with `headers := jsonb_build_object('Content-Type','application/json', 'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='CRON_SERVICE_KEY'), 'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='CRON_SECRET'))` — jsonb built by function call, never a concatenated string cast. Gotchas: don't rely on same-name `cron.schedule` replacing silently across pg_cron versions — unschedule explicitly; preserve the existing time-slot stagger (it encodes upstream rate-limit knowledge); the 8 duplicate-named jobs may be live with the *earlier* migration's schedule — reconcile against the snapshot, not assumptions; after merge, diff `cron.job` against `crons.sql` and check the next 24h of `job_run_details`.

**2.2 Typed Supabase client.** `supabase gen types typescript --project-id <ref> > src/types/database.types.ts`; switch `src/lib/supabase.ts` to `createClient<Database>(...)` (and make the `placeholder.supabase.co` fallback at line 11 a hard failure in production builds while you're in the file). Run `tsc`; triage errors: (a) genuine contract bugs → fix now (this is the payoff), (b) views like `latest_metrics` missing from generated types → add view typings or `--schema` flags, (c) legitimately dynamic queries → narrow `as` casts tagged `TODO(types)`. Land types + client in one commit even with escape hatches; burn the tail down per-hook in follow-up batches; add a CI job that regenerates types and fails on diff — that diff is your permanent schema-drift tripwire. Gotcha: do this after 1.5/2.1 so the schema being codified is the corrected one.

---

## 6. Open Questions (need a human / live-system answer)

1. **Live cron state (flagged, not guessed):** does `cron.job` match the fold of 372 migrations? Which schedule won for the 8 duplicate-named jobs? Are any live jobs undocumented by any migration (created via SQL editor)? → Task 0.2 answers this definitively.
2. **Live RLS/grants on the 11 uncovered tables:** are they actually anon-writable in production, or were policies/revokes applied outside migrations?
3. **Deployed-function flags:** were functions deployed with `--no-verify-jwt` (per `DEPLOYMENT_INSTRUCTIONS.md:53`) beyond the 2 declared in config.toml? Is the 1-line `execute-restoration-sql` stub deployed live?
4. **Product intent — gated content:** README advertises "Shadow System Signals (restricted access)" but the app has no auth. Is gating a roadmap item? (It changes the RLS design in 1.5.)
5. **Deprecation candidates:** confirm `api-auth-middleware`, `execute-restoration-sql`, `cache-comtrade-data`, and the robots-disallowed `/us-equities/` routes are dead before the 3.2 deletion batch.
6. **MUI migration:** finish it or freeze the hybrid? Affects whether a UI milestone gets scheduled at all.
7. **Acquisition timeline:** if a data-room review is <6 months out, pull 3.2/3.3 (hygiene + OPERATIONS.md) ahead of Milestone 2; if >12 months, current ordering stands.
8. **Performance budget:** no Core Web Vitals target is stated anywhere; the 544 KB charts chunk suggests one is needed. What's acceptable, given SEO is the channel?
