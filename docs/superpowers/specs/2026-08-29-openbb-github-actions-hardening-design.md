# OpenBB GitHub Actions Market Data Hardening

**Date:** 2026-08-29
**Status:** Approved scope, implementation pending

## Objective

Make the current cross-asset, COT, and sovereign desk additions safe for production while keeping GitHub Actions as the only ingestion runner. The terminal must show observed warehouse data, explicit unavailable states, real freshness, and source provenance. No synthetic fallback observations will enter `metric_observations`.

## Scope

The change covers the existing market-data workflow, the CFTC COT script, metric registration, and the three new terminal hooks/cards.

It will:

- register every new market and COT metric in a migration;
- install and invoke OpenBB explicitly in the GitHub Actions job;
- retain provider fallback only when the fallback instrument has equivalent semantics and units;
- reject mismatched proxy instruments rather than writing them under canonical IDs;
- convert provider-specific units such as Yahoo `^TNX` into the warehouse unit;
- fail or partially report a run when required sources are unavailable;
- mark provider, source URL, observed date, retrieval time, and fallback status in observation metadata;
- calculate deltas and rolling percentiles from stored observations;
- wire real TIC observations into the sovereign desk;
- use the existing freshness and provenance components with valid props;
- render unavailable states when data is absent or stale;
- pass workflow inputs correctly and prohibit anon-key write fallbacks;
- add focused tests and make TypeScript validation pass.

## Non-goals

This slice will not add a private OpenBB API container, user watchlists, alert delivery, event studies, or transmission analytics. Those features can consume the hardened canonical data contract later.

## Data contract

`metrics` remains the registry and `metric_observations` remains the canonical time-series table. New rows will use the existing columns plus `metadata` for provider-specific details. A valid observation contains:

```text
metric_id
as_of_date
value
last_updated_at
source_ref
is_provisional
provenance
metadata.provider
metadata.source_url
metadata.observed_at
metadata.retrieved_at
metadata.fallback
```

The workflow will use `SUPABASE_SERVICE_ROLE_KEY` only. Missing credentials fail the job before network calls.

## Provider and instrument rules

OpenBB with the yfinance extension is the primary implementation path. The workflow installs pinned runtime dependencies and verifies that the OpenBB call succeeds for a smoke-test symbol before ingestion.

Equivalent provider symbols can be retried. ETF proxies such as GLD, UUP, BNO, VIXY, IEF, SPY, and BITO are not silently substituted for futures, indices, yields, or spot assets. If a canonical series fails, the metric receives no observation and the run reports the failure.

The ingestion adapter normalizes dates to UTC calendar dates and values to the metric’s registered unit. Yahoo `^TNX` is divided by ten when stored as a percentage yield. Every fallback attempt is retained in run output and metadata.

## Hook and card behavior

The cross-asset hook will read latest observations and sufficient history per metric. It will derive 1D, 5D, 30D changes and 52-week percentile ranks from observations. Regime probabilities and allocator returns remain unavailable until a server-side derived-metric producer exists; the UI will label those panels as methodology/data unavailable instead of displaying constants.

The sovereign hook will map live TIC rows and existing registered debt, auction, and funding metrics into the desk. Any absent family is shown as unavailable with its expected source and freshness state.

The COT hook will derive weekly changes and three-year percentile ranks from CFTC observations. The COT source parser will never generate data. COT fields not present in the stored source, such as commercial hedge totals, will be unavailable.

Cards will use `MetricFreshnessChip` with a real metric ID and `DataProvenanceBadge` with the repository’s current `source`, `methodology`, and `lastVerified` props. Fixed “live” badges will be removed.

## Error handling

Source failure is observable and non-destructive. A failed provider does not overwrite the last good observation, create a fabricated row, or reset freshness. The job exits non-zero if all providers fail for a required metric, while allowing other successful metrics to be persisted. The summary lists successes, failures, selected provider, and retrieval timestamp.

## Validation

- Python dry runs exercise success, provider failure, unit conversion, and proxy rejection.
- Hook tests cover empty data, stale data, multi-row history, and provenance mapping.
- TypeScript compilation must pass.
- ESLint must pass with zero warnings.
- Git diff checks must pass.
- Workflow YAML must include the declared inputs and service-role secret contract.

