# Priority 1 — Data Staleness Root Cause & Honest Messaging

**Date:** 2026-08-01
**Product:** GraphiQuestor MacroDashboard
**Status:** Design approved by user — proceeding to implementation plan
**Trigger:** Homepage header showed "22 feeds lagged · 22h ago" and a STALE badge on the US Macro & Fiscal Lab, visible to every visitor.
**Related:** `2026-07-27-data-integrity-terminal-investigation.md` covers a different set of surfaces (auctions, crude, corp debt, digests, brief) — already implemented in `caddbe2` and follow-up commits. No overlap with this doc.

---

## Executive summary

The visible "22 feeds lagged" undercounts the real problem. Across all 321 tracked metrics, **172 are `lagged` or `very_lagged`** in `vw_latest_metrics`. Investigation of the live Supabase project (`debdriyzfcwvgrhzzzre`) found two distinct, unrelated root causes — not "a cron job is broken":

1. **62 active metrics are silently orphaned from ingestion.** They're registered with `source = FRED` but `metadata` has no `fred_id`. `ingest-fred` only processes metrics where `metadata->>'fred_id'` exists, so these rows have been skipped by every single ingest run since they were bulk-registered (timestamps cluster at 2026-02-05, 02-13, 02-14). No error is ever logged — the function never attempts them, so there's nothing to fail. pg_cron shows 100% "succeeded" for 95 days straight because it only records whether the HTTP dispatch happened, not whether the function wrote data.
2. **Three edge functions fabricate data on a live schedule.** `ingest-major-economies`, `ingest-imf-current-account`, and `ingest-imf-brics` write hardcoded literal values with no external API call. `ingest-major-economies` restamps them with `new Date()` on every monthly run, so they show a green FRESH badge while the number itself never changes. This violates the project's own CLAUDE.md rule: *"No fabricated data: if real data isn't available, show a skeleton or explicit 'unavailable' state — never placeholder numbers."*

A secondary bug and a messaging gap compound both:
- `ingest-fred` bumps `metrics.updated_at` even when a series returns zero observations (only the catch/error path correctly skips this), which masks real breakage from the ingest function's own "prioritize stalest first" ordering.
- `useDataIntegrity.ts` (the hook behind the homepage banner) reimplements its own crude "high-frequency prefix list + flat 7-day threshold" check instead of reading `vw_latest_metrics.staleness_flag`, which is already correctly computed per-metric from each metric's registered `expected_interval_days`. This is why the header shows a vague, occasionally wrong count instead of an honest one.

---

## Track 1 — Ingestion gap (mechanical, low risk)

### 1a. Metadata recovery — no research needed
~16 of the 62 orphaned metrics already document their correct FRED series ID inside the `description` column, e.g.:

| Metric | Documented FRED ID |
|---|---|
| `HOUSING_MORTGAGE_RATE_30Y` | `MORTGAGE30US` |
| `HOUSING_PRICE_INDEX` | `CSUSHPISA` |
| `LABOR_VACANCIES_JOLTS` | `JTSJOL` |
| `LABOR_UNEMPLOYMENT_RATE` | `UNRATE` |
| `INFLATION_HEADLINE_YOY` | `CPIAUCSL` |
| `INFLATION_CORE_YOY` | `CPILFESL` |
| `INFLATION_EXPECTATIONS_UM` | `MICH` |
| `INFLATION_BREAKEVEN_5Y` | `T5YIFR` |
| `LABOR_WAGE_GROWTH_YOY` | `CES0500000003` |
| `CAPITAL_FROM_TREASURIES_BN` | `FDHBFRBN` |
| `BOP_CURRENT_ACCOUNT_GDP` | `BOPGSTB` |
| `HOUSING_MEDIAN_INCOME_RATIO` | `MSPUS` |
| `COPPER_PRICE_USD` | `PCOPPUSDM` |
| `COPPER_GOLD_RATIO` | `PCOPPUSDM / GOLDAMGBD228NLBM` (ratio — needs a special-case branch like the existing `SOFR_OIS_SPREAD` handler) |
| `CAPITAL_FROM_EQUITY_ETF_BN` | `WLODLL` (documented as a scaled proxy — needs the same scaling logic noted in its description) |

Fix: a single SQL migration setting `metadata = metadata || jsonb_build_object('fred_id', '<id>')` for each, sourced only from what's already written in `description`. Zero external verification needed — this is data recovery, not new research.

### 1b. Metadata research — verify before writing
The remaining ~46 metrics (28 country GDP annual series for AR/AU/BR/CA/DE/FR/ID/IT/KR/MX/SA/TR/UK/ZA, BIS global liquidity ×2, BOJ balance sheet ×3, CN CGB yields ×2, US GFCF ×2, a handful of FX pairs, and a few internally-derived indices mislabeled as FRED-sourced) have no documented series ID. For each:
- Verify a real, current FRED series ID via FRED's public site (no API key needed to browse/search) before writing anything to `metadata`.
- Where no real FRED equivalent exists (BIS and BOJ series generally are not mirrored on FRED — likely candidates for this), do not force a fake mapping. Set `is_active = false` with a `metadata.orphan_reason` note, or point the metric at whichever ingestion path genuinely can serve it (e.g. `BOJ_JGB_HOLDINGS_TRJPY` may belong to the already-existing `ingest-boj-balance-sheet-weekly` job rather than FRED — needs checking that function's actual write target).
- `FLOW_TENSION_INDEX`, `RUPEE_PRESSURE_SCORE`, `POLICY_DIVERGENCE_INDEX`, `CNY_INR_RATE` look like internally-derived/computed values mislabeled with `source = FRED` — these need their `source_id` corrected to reflect how they're actually meant to be produced, not a `fred_id`.

### 1c. Code fix — stop masking failure
In `supabase/functions/ingest-fred/index.ts`, the branch that handles zero returned observations (around line 174) currently still bumps `metrics.updated_at`. Change it to only touch `updated_at` on an actual successful write of ≥1 observation, matching the discipline already applied on the error/catch path (which has an explicit comment about avoiding this exact anti-pattern).

### 1d. Messaging fix — use the data that's already correct
Rewrite `useDataIntegrity.ts` to read `vw_latest_metrics.staleness_flag` directly (grouped into counts) instead of reimplementing a flat 7-day threshold over a hardcoded prefix list. This is a strict improvement: `staleness_flag` is already computed per-metric against `expected_interval_days`, so quarterly/annual series that are within their own normal cadence stop being miscounted as lagged, and the banner's copy becomes accurate rather than vague. `DataHealthBanner` / `DataFreshnessFooterChip` keep their existing weekend-aware / threshold copy structure — only the underlying count source changes.

---

## Track 2 — Fabricated data (stricter fix, per user direction)

User decision: **pull fabricated values entirely rather than keep them as labeled manual snapshots.** No number is shown unless it comes from a real, traceable source.

For each hardcoded metric in `ingest-major-economies`, `ingest-imf-current-account`, and `ingest-imf-brics`:
1. Check whether a genuine FRED (or other already-integrated) equivalent exists. If yes, redirect the metric through the existing `ingest-fred` pipeline (set `source_id` + `metadata.fred_id`) and delete the hardcoded write for that metric from the bespoke function.
2. If no real automated source exists, stop writing that metric from the fabricating function. Set `is_active = false` (or otherwise let it fall out of the active metric set) so the frontend's existing `no_data` / unavailable state renders honestly, per CLAUDE.md's explicit rule — no placeholder number, ever.
3. Once a function has nothing left to legitimately write, unschedule its cron job rather than leaving a no-op running.

This needs the same per-metric verification discipline as Track 1b — no FRED ID goes into `metadata` without being checked against FRED's real listings first.

---

## Non-goals (this cycle)

- Fixing the ~110 stale metrics outside the 62-metric FRED-orphan set (e.g. India MoSPI series, EIA oil series with their own dedicated ingest functions, OECD CLI, REER indices) — these have different, unexamined root causes and are out of scope for this pass. Worth a follow-up investigation, not blocking this fix.
- Building new bespoke API clients for IMF/BRICS/WGC data. Per "smallest diff" and "no heavy new dependencies," Track 2 prefers redirecting to the already-tested `ingest-fred` pipeline or an honest "unavailable" state over new integration code.
- Touching the six surfaces already covered and shipped by the 2026-07-27 investigation.

---

## Verification plan

- `npm run lint && npm run build` after each batch of changes (metadata migration, code fix, messaging fix, Track 2 changes) — not one giant atomic commit.
- After the metadata migration, manually invoke `ingest-fred` (service role) for the newly-mapped metric IDs and confirm `metric_observations` gets fresh rows.
- Browser-preview check: header banner and `/data-health` page before/after, confirm the lagged count drops and reads specifically rather than vaguely.
- Spot-check a previously-fabricated metric (e.g. one from `ingest-major-economies`) shows either real data or an explicit unavailable state, never the old hardcoded number under today's date.

## Acceptance criteria

- [ ] All ~16 description-documented FRED IDs recovered into `metadata.fred_id`; confirmed ingesting on next scheduled run.
- [ ] Remaining orphaned metrics either get a verified real `fred_id`, a corrected `source_id`, or `is_active = false` with a documented reason — none stay silently orphaned.
- [ ] `ingest-fred` no longer bumps `updated_at` on zero-observation responses.
- [ ] `useDataIntegrity` reads `vw_latest_metrics.staleness_flag`; header banner count reflects genuinely-overdue feeds only.
- [ ] `ingest-major-economies` / `ingest-imf-current-account` / `ingest-imf-brics` write only real, sourced data or nothing (explicit unavailable) — zero hardcoded literals restamped with `new Date()`.
- [ ] `npm run lint && npm run build` clean after every batch.
