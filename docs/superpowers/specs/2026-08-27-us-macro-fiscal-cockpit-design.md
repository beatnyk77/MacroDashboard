# US Macro & Fiscal Cockpit

**Date:** 2026-08-27  
**Route:** `/labs/us-macro-fiscal/`  
**Status:** Design approved in conversation, awaiting written-spec review

## Objective

Turn the US Macro & Fiscal Lab into a daily Treasury and liquidity cockpit. The first viewport must answer:

1. What is the current Treasury liquidity state?
2. Which observed driver changed most recently?
3. Which readings are delayed, unavailable, or errored?

The lab must never render mock values, silent fallbacks, stale values presented as live, or narrative claims unsupported by the available observations.

## Product direction

Use the fiscal cockpit layout. The top of the page is a compact operational monitor. Existing deep-dive modules remain available below the cockpit or through linked detail pages.

The first implementation will not publish a single synthetic sovereign-stress score. Driver families remain independently inspectable until every component has a maintained source, cadence, coverage, and formula.

## Data contract

The cockpit uses five families:

- Treasury liquidity: TGA, RRP, SRF usage, and FX swap-line activity
- Debt burden: federal interest payments, interest-to-receipts, and interest-to-GDP
- Rollover pressure: 3M, 6M, and 12M maturity buckets
- Market demand: auction bid-to-cover, indirect participation, dealer absorption, tail status, and demand score
- Policy transmission: Fed Treasury holdings, 10Y yield, real yield, and curve spread

Each visible metric needs:

`value`, `unit`, `observation date`, `publication cadence`, `source`, and `freshness state`.

The freshness model has four states:

- `Observed`: value exists and is within the expected source cadence
- `Lagged`: value exists and the expected publication window has passed
- `Unavailable`: no value exists
- `Error`: source or query failed

The UI maps the existing data architecture as follows: `fresh` maps to `Observed`; `lagged` and `very_lagged` map to `Lagged`; a null observation maps to `Unavailable`; and a query or source failure maps to `Error`. Query failures must preserve error identity rather than becoming empty data.

Only observations with one of the approved provenance prefixes `live_api:fred`, `live_api:fiscaldata`, `live_api:treasury`, `live_api:nyfed`, `live_api:fed`, or `verified_historical:` and `is_provisional = false` may enter live status cards or narrative calculations. Prefix matching is case-sensitive and anchored at the start of the provenance value. Values marked `fallback_snapshot`, `manual_seed`, or another provenance are excluded. An older approved observation may remain in history as lagged, but it never replaces an excluded latest row in the current-value slot.

Metric values remain `number | null` through normalization. Null, NaN, infinite, invalid, or future-dated values never enter calculations. `src/lib/dataFreshness.ts` owns the cadence algorithm. Each feed declares `expected_interval_days`, `grace_period_days`, `timezone`, `calendar`, and optionally `expected_next_at`. The evaluator uses UTC `now` and the observation timestamp. With `expected_next_at`, the reading is `Observed` when `now <= expected_next_at + grace_period`; without it, the reading is `Observed` when `now - observed_at <= expected_interval + grace_period`. Boundary equality is current. Calendar metadata is used upstream to calculate `expected_next_at`; weekends and holidays never rely on browser-local time.

The page shows separate timestamps for fiscal data and market data. Annual and quarterly fiscal observations remain labeled with their real cadence. Market and auction observations use their own timestamps.

The first implementation exposes a deterministic data-health state rather than a synthetic risk regime. Family aggregation follows this algorithm: any `Error` produces `Error`; when there are zero `Observed` readings, any `Lagged` reading produces `Lagged`, otherwise the family is `Unavailable`; when there is at least one `Observed` reading and any `Unavailable` reading exists, the family is `Coverage degraded`; otherwise any `Lagged` reading produces `Lagged`; all readings observed produces `Observed`. “Most recently changed” means the valid observed metric with the newest observation date, with ties resolved by the published metric order. A future risk-regime score is a separate design.

## Page structure

### Header

Use a plain-language status line beneath the title. Example:

> Latest fiscal observations: lagged by publication cadence. Market telemetry: updated recently.

The header freshness chip must derive from the data family it represents. A single federal-interest timestamp must not imply that every module is current.

### Live status strip

Show TGA, RRP, 12M Treasury maturities, latest auction demand, federal interest payments, and coverage count when observed data exists. Unavailable metrics are excluded from the strip and listed in the coverage drawer.

Each card displays its value, unit, observation date, cadence, and state.

### Primary liquidity panel

Combine TGA, RRP, SRF usage, and FX swap-line activity in a time-series panel. Preserve each series’ unit and show observation-date markers when cadences differ. If a series is absent, omit that line and state the coverage gap in the panel legend.

Series are grouped by native unit. Each unit group receives its own y-axis and tooltip group; a separate plot is used when scale or cadence makes a shared panel unreadable. The panel must not imply that unlike balances are directly comparable without an explicit normalization.

### Treasury demand panel

Show the latest auction by tenor and a history of bid-to-cover, indirect bidder share, dealer absorption, tail status, auction date, and demand score. Thresholds must be documented beside the metric or in a methodology disclosure.

Derived demand scores display their component fields, formula version, valid-row requirements, and source dates.

### Debt rollover panel

Show 3M, 6M, and 12M maturity buckets with source dates and rolling totals. The copy describes refinancing exposure. It must not equate every maturity with new issuance.

### Fiscal burden panel

Show interest payments, tax receipts, interest-to-receipts, and interest-to-GDP. Historical comparison claims are calculated from overlapping valid observations. Fixed “critical” labels are removed unless a documented rule is met.

### Coverage drawer

List unavailable, delayed, and errored feeds with the reason, last successful observation, expected source, and expected cadence. The drawer is reachable from the coverage count.

`DataCoverageDrawer` consumes a typed feed-health contract supplied by `useCockpitCoverage`. Phase 1 derives the contract from `vw_latest_metrics` for observation state and `ingestion_runs` for job state. The contract includes nullable `lastSuccessfulRun`, `latestObservationDate`, `sourceResponseStatus`, `rowsReceived`, `rowsRejected`, and `revisionStatus`; an absent field renders as `Not reported`, never as a fabricated value. Retry behavior is owned by the relevant TanStack Query hook.

## Data behavior

Every module follows the same states:

- Loading: final-height skeleton
- Observed: values with provenance and freshness
- Lagged: values remain visible with an amber state
- Unavailable: module is omitted from the cockpit and listed in coverage
- Error: source/query failure with retry

Narrative insights are conditional on valid observations. An interest-versus-defense claim requires overlapping valid dates for both series. A recent auction statement requires recent auction rows. Empty data never becomes zero.

Ingestion health should expose last successful run, latest observation date, source response status, row count received, rejected-row count, and revision/restatement status where available.

Hooks must return distinct `{ data, isLoading, isError, error }` states for every cockpit feed. Partial family failure remains visible in coverage and does not invalidate successfully loaded families. `useCockpitCoverage` owns the family aggregation and status precedence described above.

## Discovery and methodology

Use metadata aligned to the actual product:

- Title: `US Treasury Liquidity & Fiscal Monitor | GraphiQuestor`
- Description covering TGA, RRP, auctions, maturities, interest burden, and freshness
- Standalone `BreadcrumbList` structured data
- Dataset metadata with measured variables, temporal coverage, and measurement technique

The visible methodology section explains live series, fiscal versus market cadence, rolling maturity calculations, auction demand scoring, freshness states, and source coverage. Add a crawlable data-coverage page listing feed, source, cadence, and current availability.

Internal links should connect the cockpit to Treasury auction, debt maturity, liquidity, fiscal-dominance, and methodology pages.

## Components and boundaries

- `USMacroFiscalLab`: route composition, page metadata, global status, and section ordering
- `FiscalCockpitStatus`: top-level family timestamps, coverage, and status cards
- `TreasuryLiquidityPanel`: TGA, RRP, SRF, and swap-line chart
- `TreasuryDemandPanel`: auction table, tenor history, and demand diagnostics
- `DebtRolloverPanel`: maturity buckets and dates
- `FiscalBurdenPanel`: interest and receipts comparison
- `DataCoverageDrawer`: unavailable, lagged, and errored feed inventory
- Existing deep-dive modules: retained as separately bounded sections with their own data states

Domain hooks remain responsible for fetching and normalizing data. Components consume typed observations and do not invent defaults. Derived calculations live in domain hooks or pure utilities with unit tests.

## Testing

Add tests for:

- missing observations rendering `—` or an unavailable state
- stale fiscal data and fresh market data displaying separate timestamps
- no narrative insight when required series do not overlap
- auction thresholds using documented inputs
- date-based maturity aggregation
- retry states for query failures
- metadata and breadcrumb schema shape
- responsive table and keyboard access for country or metric controls
- fallback, manual-seed, provisional, null, NaN, infinite, and future-dated observations being excluded
- partial family failure while healthy families remain visible
- mixed cadence boundaries, calendar grace periods, and revised observations
- empty auction history and missing ingestion-health fields
- keyboard and screen-reader access for the actual cockpit controls
- deterministic liquidity-status precedence across observed, lagged, unavailable, and error inputs
- provenance allowlisting and latest-row selection when the newest observation is excluded
- cadence evaluation across grace periods, calendar boundaries, and future timestamps
- typed coverage-contract behavior when ingestion-health fields are null
- native-unit grouping, independent axes, and unit-scoped tooltips

Run:

```bash
npm run lint
npm run test -- --run
npm run build
```

## Acceptance criteria

- The first viewport identifies Treasury liquidity state and data coverage.
- No visible value comes from a hardcoded fallback or zero default.
- Fiscal and market freshness are displayed separately.
- Missing modules are omitted from the primary cockpit and discoverable in coverage.
- Every visible metric exposes source and observation date.
- Narrative claims are generated only from valid overlapping observations.
- SEO metadata matches the live data contract.
- Existing deep dives continue to work independently.
- The Phase 1 implementation owns the cockpit route, its hooks, panels, coverage drawer, tests, and page metadata.
- Phase 1 owns the `vw_latest_metrics` and `ingestion_runs` adapters needed by `useCockpitCoverage`; missing health fields remain nullable. A new ingestion-health schema is not required for Phase 1.
- The data-coverage route, source onboarding, and deep-dive refactors remain separate deliverables.
