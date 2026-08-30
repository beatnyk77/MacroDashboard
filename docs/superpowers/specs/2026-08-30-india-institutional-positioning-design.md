# India Institutional Positioning

## Status

Design approved in brainstorming on 2026-08-30. This document defines the product and data design. It does not authorize implementation yet.

## Context

GraphiQuestor serves global macro allocators who assess India over six-to-24-month horizons. The referenced `beatnyk77/fii-dii-data` repository provides a useful raw feed pattern for NSE FII/FPI and DII cash flows, participant F&O open interest, and NSDL sector allocation. Its current alert agents use fixed thresholds and JSON-backed state. GraphiQuestor will use the raw observations as an input to an auditable institutional-positioning layer.

The existing application already has India macro telemetry, `market_pulse_daily`, the canonical `metric_observations` model, `vw_latest_metrics`, freshness handling, data-health surfaces, and `/intel/india` integration points.

## Product boundary

`/intel/india` becomes the source-of-truth workspace for India Institutional Positioning. It will explain India’s structural capital-allocation regime for global macro allocators.

Initial regime vocabulary:

- `Foreign Accumulation`
- `Domestic Cushion`
- `Distribution`
- `Synchronized Risk`
- `Mixed / Insufficient Coverage`

Initial signals:

1. Institutional Absorption Capacity
2. Foreign Exit Pressure
3. Flow-Price Divergence
4. Sector Rotation Pressure
5. India Institutional Positioning Regime

F&O/Cash Conflict is a later extension, gated on reliable historical F&O coverage. The module describes conditions and exposure sensitivity. It does not publish directional trade recommendations.

## Data architecture

```text
NSE cash flows
NSE participant F&O data
NSDL sector allocation
        ↓
India institutional-flow ingestion
        ↓
Validated raw observations
        ↓
metric_observations + provenance
        ↓
Derived India positioning signals
        ↓
/intel/india
```

The existing `market_pulse_daily` table remains an operational compatibility layer. Canonical metric IDs allow the new observations to use `vw_latest_metrics`, freshness chips, sparklines, and API surfaces.

Proposed raw metrics:

- `IN_FII_CASH_NET`
- `IN_DII_CASH_NET`
- `IN_FII_INDEX_FUTURE_NET`
- `IN_FII_INDEX_FUTURE_LONG_SHORT_RATIO`
- `IN_FII_PUT_CALL_POSITIONING`
- `IN_INDIA_VIX`
- `IN_NSDL_SECTOR_FLOW`
- `IN_NSDL_SECTOR_AUM`
- `IN_MARKET_BREADTH`
- `IN_NIFTY_RETURN`
- `IN_USD_INR_RETURN`
- `IN_RBI_LIQUIDITY_IMPULSE`
- `IN_BANK_CREDIT_GROWTH_YOY`

### Metric contracts

| Metric | Source | Unit | Native cadence | Date semantics | Minimum coverage | Failure behavior |
|---|---|---:|---|---|---|---|
| `IN_FII_CASH_NET` | `https://www.nseindia.com/api/fiidiiTradeReact` | INR crore | Trading day | NSE session date | FII/FPI row: `buyValue`, `sellValue`, `netValue`, `date` | Mark unavailable; preserve last accepted observation |
| `IN_DII_CASH_NET` | `https://www.nseindia.com/api/fiidiiTradeReact` | INR crore | Trading day | NSE session date | DII row: `buyValue`, `sellValue`, `netValue`, `date` | Mark unavailable; preserve last accepted observation |
| `IN_FII_INDEX_FUTURE_NET` | `https://nsearchives.nseindia.com/content/nsccl/fao_participant_oi_DDMMYYYY_b.csv` | Contracts | Trading day | Report date | FII row with index-future long and short fields | Mark unavailable; exclude from score |
| `IN_FII_INDEX_FUTURE_LONG_SHORT_RATIO` | NSE participant OI CSV | Ratio | Trading day | Report date | `Future Index Long`, `Future Index Short` | Mark unavailable; exclude from score |
| `IN_FII_PUT_CALL_POSITIONING` | NSE participant OI CSV | Ratio | Trading day | Report date | `Option Index Put Short`, `Option Index Call Short` | Mark unavailable; exclude from score |
| `IN_INDIA_VIX` | NSE India VIX daily close | Index points | Trading day | Close date | Valid close | Exclude flow-price and market-confirmation components |
| `IN_NSDL_SECTOR_FLOW` | `https://www.fpi.nsdl.co.in/web/StaticReports/Fortnightly_Sector_wise_FII_Investment_Data/FIIInvestSector_<period>.html` | INR crore by sector | Fortnightly | Report period end | Sector row with equity and total net flow | Mark affected sectors lagged or unavailable |
| `IN_NSDL_SECTOR_AUM` | NSDL fortnightly sector report | INR crore by sector | Fortnightly | Report period end | Sector row with equity or total AUM | Mark affected sectors lagged or unavailable |
| `IN_MARKET_BREADTH` | NSE market breadth close | Advances / declines | Trading day | NSE session date | Both counts present | Exclude flow-price and market-confirmation components |
| `IN_NIFTY_RETURN` | NSE Nifty 50 close | Percent | Trading day | Close date | Current and prior valid close | Exclude flow-price and market-confirmation components |
| `IN_USD_INR_RETURN` | RBI reference rate or approved market close | Percent | Trading day | Close date | Current and prior valid close | Exclude market-confirmation component |
| `IN_RBI_LIQUIDITY_IMPULSE` | RBI money-market and liquidity observations already ingested by GraphiQuestor | Percentile score | Weekly | Observation week | At least 12 valid weekly observations | Exclude market-confirmation component and reduce coverage |
| `IN_BANK_CREDIT_GROWTH_YOY` | RBI DBIE bank credit series already ingested by GraphiQuestor | Percent | Monthly | Release month | At least 12 valid monthly observations | Exclude market-confirmation component and reduce coverage |

Sector metrics use a dedicated `india_institutional_sector_observations` table with `sector_key`, `source_sector_label`, `report_period_end`, `equity_flow_inr_crore`, `total_flow_inr_crore`, `equity_aum_inr_crore`, `total_aum_inr_crore`, `source_url`, `source_hash`, `ingested_at`, and `parser_version`. Daily scalar observations use the Asia/Kolkata trading date. Fortnightly observations use the NSDL report period end and retain the report URL.

Each observation retains the native reporting date, ingestion timestamp, source URL or endpoint, source name, native frequency, parser or transformation version, provisional status, coverage status, and freshness classification.

Cash data remains intact when F&O arrives late. The later F&O observation receives its own ingestion timestamp. A zero F&O value is `unavailable` unless the source explicitly reports a verified zero.

## Signal construction

Signals use rolling historical distributions, with separate windows for tactical observations and structural interpretation.

### Institutional Absorption Capacity

For each 20-session window where cumulative FII flow is negative:

```text
DII absorption ratio = DII net flow / absolute FII net flow
```

The raw score is `0.70 × percentile(absorption ratio) + 0.30 × percentile(change in absorption ratio over 20 sessions)`. Percentiles are computed only against historical windows where cumulative FII flow is negative. The final component score is `2 × raw score - 1`. Windows with non-negative FII flow receive a neutral component score of `0` and remain eligible for coverage.

### Foreign Exit Pressure

The supportive-flow component score is `0.55 × percentile(FII 20-session cumulative flow) + 0.25 × percentile(FII 5-session cumulative flow) + 0.20 × (1 - percentile(consecutive FII selling sessions))`, transformed to `[-1, +1]`. A positive score indicates lower foreign exit pressure. The selling streak is capped at 20 sessions for normalization.

### Flow-Price Divergence

The raw divergence score is `0.50 × (percentile(Nifty 20-session return) - percentile(FII 20-session flow)) + 0.30 × percentile(20-session breadth) + 0.20 × (1 - percentile(India VIX))`. It is transformed to `[-1, +1]` and winsorized at the 2nd and 98th percentiles.

- FII outflows with rising prices indicate distribution risk.
- FII inflows with weak prices indicate absorption or accumulation.
- FII and DII selling with falling breadth and rising VIX indicate synchronized risk.

### Sector Rotation Pressure

For each NSDL sector:

```text
normalized sector flow = sector net flow / sector AUM
```

The current sector read uses the latest three available NSDL reports. Its percentile normalization uses the latest 12 valid reports, with the oldest nine reports supplying the reference distribution. The sector component score is `0.50 × percentile(weighted median sector flow / AUM) + 0.30 × percentile(inflow-sector breadth minus outflow-sector breadth) + 0.20 × (1 - percentile(top-five absolute-flow concentration))`. It requires at least 12 valid reports for publication. A single large sector move receives lower confidence than broad rotation across multiple reporting periods.

### India Institutional Positioning Regime

```text
positioning score =
  0.25 × foreign-flow pressure
  0.20 × domestic absorption
  0.15 × flow-price divergence
  0.15 × sector rotation
  + 0.25 × market confirmation
```

Daily components are normalized to `[-1, +1]` using a trailing 5-year percentile where at least 252 valid sessions exist. The sector component uses at least 12 valid fortnightly reports. Percentiles are winsorized at the 2nd and 98th percentile before conversion to score. A positive score represents supportive conditions for India exposure.

Market confirmation is defined as `0.25 × percentile(Nifty 20-session return) + 0.15 × percentile(20-session breadth) + 0.15 × (1 - percentile(India VIX)) + 0.20 × (1 - percentile(USD/INR 20-session return)) + 0.15 × percentile(RBI liquidity impulse) + 0.10 × percentile(bank credit growth)`, transformed to `[-1, +1]`. Its required inputs are Nifty return, breadth, VIX, USD/INR, RBI liquidity impulse, and bank credit growth. A missing input removes the corresponding weight and rescales the remaining weights; fewer than three available inputs, including at least one of Nifty return or breadth, makes the component unavailable. Liquidity and credit retain their native weekly or monthly dates and are carried forward only until their freshness thresholds expire.

The default regime thresholds, evaluated in this order, are:

- `Synchronized Risk`: score `< -0.35`, with foreign-flow pressure `< -0.35`, domestic absorption `< -0.25`, flow-price divergence `< -0.25`, and market confirmation `< -0.35`.
- `Foreign Accumulation`: score `>= +0.35`, with foreign-flow pressure `>= +0.35`, flow-price divergence `>= 0`, and market confirmation `>= -0.25`.
- `Domestic Cushion`: score `>= -0.20`, with domestic absorption `>= +0.35` and foreign-flow pressure `< +0.35`.
- `Distribution`: score `< -0.20`, with foreign-flow pressure `< -0.35` and market confirmation `>= -0.35`.
- `Mixed / Insufficient Coverage`: fewer than three available components, fewer than two required market-flow components, or no qualifying regime condition.

Regime changes require two consecutive accepted observations, except a transition into `Synchronized Risk`, which publishes after one accepted observation when all three component conditions are met. A state must persist for two observations before its duration clock advances. Component scores remain inspectable so allocators can trace the state to its observations.

## Interface

The page uses a dense terminal layout:

1. Positioning header with regime, score, confidence, observation date, and duration.
2. Evidence matrix for foreign pressure, domestic absorption, flow-price divergence, and sector rotation.
3. Cross-asset confirmation for INR, India VIX, breadth, liquidity, and credit.
4. Sector allocation panel with AUM-normalized pressure, persistence, and concentration.
5. Historical regime chart with selectable FII flow, DII absorption, INR, and VIX overlays.
6. Methodology and provenance drawer with formulas, source documents, cadence, limitations, and calculation version.

The cross-asset confirmation panel displays liquidity and credit as scored inputs alongside INR, VIX, breadth, and Nifty return. It shows their native cadence and carry-forward age so a monthly credit observation cannot appear equivalent to a current market close.

The regime header may later appear as a compact card on the main terminal and in the morning brief. Existing India macro charts remain linked rather than duplicated.

## Reliability and validation

A raw observation is publishable only when:

- The reporting date is valid.
- Buy, sell, and net values reconcile within `₹1 crore` or `0.10%` of gross buy/sell value, whichever is larger.
- Expected participant categories exist in the source response.
- The observation is newer than the latest accepted record, or is a documented correction.
- The parser identifies the source schema version.
- F&O coverage is independently confirmed by the presence of the participant row and all required fields; zero values are valid only when explicitly reported by the source.
- Sector totals and duplicate classifications pass validation.

Signal behavior:

- Missing data produces `unavailable`.
- Delayed data produces `lagged`.
- Historical data remains visible with a historical label.
- Insufficient domain coverage produces `Mixed / Insufficient Coverage`.
- A failed refresh preserves the last accepted observation and appears in Data Health.
- Every derived score stores its input metric IDs, input dates, weight set, normalization window, and calculation version.

Historical corrections are accepted only when the source report date matches an existing observation and the incoming payload has a new source hash. The prior row remains audit-visible with a superseded status.

Testing covers NSE and NSDL parser fixtures, reconciliation, late F&O backfill, duplicate and missing sector rows, freshness and coverage states, absorption and divergence edge cases, regime transitions, `vw_latest_metrics` regressions, and historical signal stability. Stability acceptance requires that a component score move of less than `0.10` cannot change regime by itself when the coverage mask and other components remain unchanged.

An internal validation view will support review before public exposure.

## Phasing

### Phase 1

- Establish the ingestion contract and provenance model.
- Load daily FII/DII cash observations.
- Implement Absorption Capacity and Foreign Exit Pressure.
- Expose freshness and coverage states.

Phase 1 is an internal validation release. It includes backend ingestion, the raw observation tables, component calculation jobs, and the internal validation view. It does not publish the institutional regime until the daily cash-flow history reaches 252 accepted observations.

### Phase 2

- Add Flow-Price Divergence.
- Add NSDL sector history and Sector Rotation Pressure.
- Add the `/intel/india` evidence matrix and regime chart.

Phase 2 is the first public module release. It publishes the regime only after the required history and coverage rules pass. Cross-asset confirmation uses INR, breadth, VIX, liquidity, credit, and Nifty return inputs already available in GraphiQuestor; unavailable inputs reduce the coverage mask.

The first implementation plan covers Phase 1 and Phase 2 only. F&O/Cash Conflict and global allocator integration remain outside that plan.

### Phase 3

- Add validated participant F&O history.
- Add F&O/Cash Conflict.
- Feed the validated India regime into the global allocator layer.

## Success criteria

- Every published value has source, as-of date, ingestion time, and freshness state.
- The page can explain every regime state through inspectable components.
- A failed or stale upstream cannot silently produce a neutral-looking signal.
- Signal states remain stable under ordinary daily noise.
- Historical review can reproduce a published score from stored inputs and calculation version.
- The India module can later provide a validated regime input to GraphiQuestor’s global macro surfaces.
