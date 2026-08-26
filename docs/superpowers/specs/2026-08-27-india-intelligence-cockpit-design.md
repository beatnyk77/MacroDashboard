# India Intelligence Cockpit Design

## Objective

Rework `/intel/india/` into an evidence-first India macro intelligence surface with a transparent daily regime classification. The page must not display mock, fabricated, provisional, or stale values as current observations. It must serve a cross-domain cockpit covering growth, inflation, liquidity, fiscal capacity, credit transmission, external funding, market flows, RBI FX defense, and state fiscal quality.

The primary audience is an institutional macro user who needs a fast read on India’s current regime and a direct path into the evidence behind it.

## Product decisions

- The cockpit has equal cross-domain coverage rather than a single thematic center.
- “Current” means the latest published observation for statistical series, with a separate freshness layer for market data.
- Verified historical observations may appear only when explicitly labelled historical and only as context when a current observation is unavailable.
- Missing, provisional, or failed-provenance feeds are hidden from the primary cockpit and listed in a coverage register.
- The daily regime classification is fully decomposed. Every input, weight, threshold, and missing-data effect is visible.
- State-level fiscal intelligence remains a secondary module with explicit geographic coverage, fiscal-year dates, and source cadence.
- The product presents observed relationships and methodology. It does not present forecasts or trading-entry language.

## Information architecture

The page order becomes:

1. India regime cockpit
2. Domain evidence grid
3. RBI liquidity and FX defense
4. Growth and inflation
5. Fiscal and sovereign funding
6. Credit transmission
7. External sector and flows
8. State fiscal intelligence
9. Historical context and methodology

The first screen contains the regime label, domain states, usable observation count, lagged count, unavailable count, latest published date, and market freshness date. It also contains an expandable regime formula panel.

## Regime engine

The regime engine consumes normalized domain inputs rather than raw component state. A domain can be observed, lagged, historical, or unavailable. The engine must record the input state used for every calculation.

The engine returns:

- `REGIME`: a daily classification when minimum domain coverage is met
- `INSUFFICIENT COVERAGE`: when required domains are absent or fail provenance checks
- `COVERAGE DEGRADED`: when a classification is possible but one or more optional domains are missing or lagged

The classification must expose the contributing domain score, metric values, weight, threshold, observation date, source, and any coverage adjustment. A score must never be silently computed from a zero placeholder.

### Initial regime registry

The first implementation uses seven equally weighted domains. Each domain contributes one normalized score in the range `-1` to `+1`; positive means expansion or improving funding conditions for that domain, while negative means contraction or worsening conditions. The registry is explicit and lives beside the engine so it can be reviewed without reading chart components.

| Domain | Required input | Initial metric families | Direction | Classification thresholds |
| --- | --- | --- | --- | --- |
| Growth | Yes | IIP, GDP, PMI, labor, activity | higher growth is positive | `>= 0.35` expansion, `<= -0.35` contraction |
| Inflation | Yes | CPI, WPI, core inflation | lower inflation within the policy band is positive | `>= 0.35` benign, `<= -0.35` adverse |
| Liquidity | Yes | RBI liquidity position, call rate, WACR, LAF | surplus and orderly rates are positive | `>= 0.35` easy, `<= -0.35` tight |
| Fiscal | Yes | interest-to-revenue, fiscal deficit, debt-to-GDP, receipts | lower burden and deficit are positive | `>= 0.35` improving, `<= -0.35` deteriorating |
| Credit | Yes | bank credit growth, credit impulse, banking stress | higher healthy credit transmission is positive | `>= 0.35` expanding, `<= -0.35` impaired |
| External | Yes | FX reserves, import cover, current account, external debt | stronger buffer is positive | `>= 0.35` resilient, `<= -0.35` pressured |
| Market flows | No | FII flows, G-Sec yield, India-US spread | lower funding stress and positive flows are positive | `>= 0.35` supportive, `<= -0.35` adverse |

Each metric is transformed using its documented sign and a trailing-history percentile or z-score already available in the metric layer. A domain score is the mean of available transformed inputs. A required domain is missing when none of its approved current inputs are usable. The overall regime is the mean of required domain scores plus the optional market-flow score when available. `INSUFFICIENT COVERAGE` is returned when any required domain is missing. Verified historical inputs remain context-only and never satisfy required current coverage.

For reproducibility, the first version uses the latest 20 valid observations within each metric’s native cadence. A metric requires at least 5 valid observations; otherwise it is unavailable for scoring. Percentile rank uses midpoint ties across the selected window and maps to `2 * percentile - 1`. A z-score uses the sample mean and sample standard deviation of the same window and maps to `clamp(z / 2, -1, 1)`. The metric registry chooses the explicitly listed primary input first, then the next listed input only when the primary is unavailable. No interpolation is performed across mixed frequencies. The overall score boundaries are `>= 0.35` for `IMPROVING`, `<= -0.35` for `DETERIORATING`, and between those bounds for `MIXED`; boundary values belong to the named improving or deteriorating regime. A missing optional market-flow domain does not change the denominator. The registry version is stored as `india-regime-v1` with the calculation timestamp.

Initial domain inputs should reuse live metric IDs already represented in the repository where source metadata is present:

- Growth: IIP, GDP, PMI, labor, and activity series
- Inflation: CPI and WPI series with publication dates
- Liquidity: RBI liquidity position, call rate, WACR, and related money-market observations
- Fiscal: interest-to-revenue, fiscal deficit, debt-to-GDP, receipts, and borrowing observations
- Credit: bank credit growth, credit impulse, and banking-stress observations
- External: FX reserves, import cover, current account, and external-debt observations
- Market flows: FII flows, G-Sec yield, and India-US yield spread
- RBI defense: reserves, intervention posture, and reserve composition where available

## Data architecture

Add a route-level India cockpit hook that queries `vw_latest_metrics`, normalizes rows, and preserves query errors. The normalized contract includes:

- metric ID and display label
- numeric value or null
- observation date
- ingestion timestamp
- native and display frequency
- source name and source reference
- provenance
- provisional flag
- freshness status
- availability reason

Approved live provenance is deterministic in the first implementation. `source_ref` must equal `live_api:rbi`, `live_api:mospi`, `live_api:fred`, `live_api:treasury`, or `live_api:fed`, or begin with one of those tokens followed by `:`. Live records must also have `provenance = api_live`. Verified historical records must begin with `verified_historical:` and have `provenance = verified_historical`; they remain context-only. Manual seeds, fallback snapshots, unrecognised provenance, null values, and future-dated records are unavailable for current display. Extending the allowlist requires a code change and a test.

The current database view remains the source of truth for the latest row. `as_of_date` represents the source publication or observation date and determines statistical age. `last_updated_at` represents pipeline ingestion age and diagnoses feed health. The frontend must not infer freshness from one representative metric for the whole page. Statistical freshness is based on the observation’s publication cadence. Market freshness is based on its market-data update cadence.

The default freshness thresholds are defined in the registry: daily or market data is fresh through 48 hours, lagged through 7 days, and overdue after 7 days; weekly data is fresh through 9 days, lagged through 21 days, and overdue after 21 days; monthly data is fresh through 45 days, lagged through 90 days, and overdue after 90 days; quarterly data is fresh through 120 days, lagged through 240 days, and overdue after 240 days. The metric registry can narrow a threshold for a named source contract. Ingestion age is shown separately as pipeline health and never substitutes for publication age.

## UI state rules

Every domain card shows its value only when the normalized record is usable. It also shows source, observation date, cadence, provenance, and freshness. Native units remain visible. Derived ratios show their source series and formula.

Fallback `0` values must be removed from visible India modules. Missing fields remain null and render as unavailable or cause the affected module to be hidden. Existing deep-dive modules retain their own error and loading boundaries.

The coverage register lists hidden modules and explains whether the reason is missing observation, stale publication, provisional state, invalid date, or failed provenance. It is accessible from the cockpit without interrupting the primary read.

## Existing module hardening

Audit and update the visible India modules that currently use fallback values or unsupported claims, including fiscal stress, fiscal allocation, digitization, debt maturity, and liquidity components. Remove hardcoded fiscal-year labels where the data row provides the period. Replace manually supplied provenance labels with observation metadata. Remove language that presents a historical value as real-time.

The current modules map into the new order as follows: `IndiaMacroPulseSection` and `IndiaInflationPulseMonitor` become the Growth and Inflation evidence sections; `IndiaLiquidityStressMonitor`, `RBIFXDefenseMonitor`, and `RBIMoneyMarketMonitor` become the RBI liquidity and FX section; `IndiaFiscalStressMonitor` and `IndiaDebtMaturityWall` become the Fiscal and sovereign funding section; `IndiaCreditCycleClock` becomes Credit transmission; `IndiaExternalSectorPanel` and `IndiaFIIFlowsMonitor` become External sector and flows; `IndiaFiscalAllocationTracker` renders once under State fiscal intelligence and supplies a compact fiscal-allocation summary to the Fiscal domain; `StateFiscalHeatmap` remains in State fiscal intelligence; `IndiaDigitizationPremiumMonitor` moves to a secondary structural context module. No existing module is silently removed. Modules without current usable data remain hidden from the primary cockpit and visible through the coverage register.

The state fiscal module remains below the main cockpit. It must report the states and fiscal years actually covered by the current query. Any missing state or period remains absent from the calculation rather than treated as zero.

## SEO and structured data

Use the page title:

`India Macro Intelligence Dashboard | RBI, Fiscal, Credit & FX`

The description should describe published India macro observations, source metadata, regime methodology, and coverage state. Remove unsupported phrases such as “zero-lag,” “real-time” for slow statistical data, “entry and exit windows,” and unqualified growth superlatives.

Structured data includes:

- `CollectionPage`
- separate `BreadcrumbList`
- `Dataset` without an unverified license
- `Dataset.variableMeasured`
- `Dataset.measurementTechnique`

Visible methodology copy must match the structured data. Add crawlable links to India credit-cycle methodology, RBI liquidity methodology, fiscal-data sources, and glossary definitions.

## Testing and acceptance criteria

- Provenance acceptance tests cover approved live references, verified historical references, rejected manual seeds, fallback snapshots, and unknown references.
- Normalization tests reject null, non-numeric, and future-dated records without converting them to zero.
- Regime tests cover complete coverage, optional missing domains, required missing domains, lagged inputs, and historical-only inputs.
- Component tests verify that unavailable and missing values do not render as observed numbers.
- SEO tests verify title, description, canonical path, breadcrumb schema, dataset schema, and visible methodology language.
- Existing India module tests continue to pass.
- `npm run lint`, `npx tsc --noEmit`, targeted Vitest tests, and `npm run build` pass.

## Implementation boundary

This work focuses on the India intelligence route and its existing data modules. It does not add new upstream providers, create a new backend scoring table, or redesign unrelated country pages. New metrics are added only when an existing ingestion path and provenance contract can supply them.
