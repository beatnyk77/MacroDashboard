# Corporate Stress and Refinancing Signal Design

## Purpose

Extend Corporate Transmission with a dedicated Corporate Stress workspace. The workspace will show two evidence-linked families: liquidity and refinancing. Each signal must state its comparison frame, source facts, filing, freshness, and confidence.

The product question is: which tracked issuers are becoming more dependent on internal cash generation or functioning credit markets, and what filing evidence supports that assessment?

## Product structure

The `/corporate-transmission` surface will contain two top-level workspaces:

- Macro Transmission
- Corporate Stress

Corporate Stress will be organized by signal family, with the highest-priority family shown first. Priority is derived only from observed data using severity, confidence, freshness, and affected-issuer breadth. When evidence is insufficient, the interface will state that explicitly.

The Corporate Stress workspace will contain:

- Liquidity
- Refinancing
- Free cash flow and capex burden
- Working capital

The first implementation will build Liquidity and Refinancing. The existing capex signal remains available as context.

The scope is divided into two phases. MVP uses numeric SEC companyfacts and filing metadata. Phase 2 adds a separate filing-note parser for maturity schedules, covenants, revolvers, commercial paper, and commitments.

## Signal definitions

### Liquidity

Ingest SEC companyfacts for cash and equivalents, restricted cash, short-term investments, current assets, current liabilities, operating cash flow, capital expenditure, revenue, net income, interest paid, receivables, inventory, and payables. Concepts will be selected from the companyfacts taxonomy and stored with unit, period, form, filing date, and accession evidence.

Derived signals:

- Free cash flow: operating cash flow minus capital expenditure.
- FCF margin: free cash flow divided by revenue.
- Cash conversion: free cash flow divided by net income when net income is positive.
- Working-capital drag: change in inventory plus change in receivables minus change in payables.
- Cash balance trend: current cash and short-term investments versus the prior comparable observation.

The first version will not call cash divided by one quarter of operating cash flow “runway.” MVP will show cash balance trend and cash-flow metrics. Liquidity coverage, defined as cash and short-term investments divided by next-12-month cash obligations, is Phase 2 because the obligation denominator requires filing-note maturity data.

### Refinancing

Ingest numeric SEC facts for current debt, long-term debt, short-term borrowings, operating income, interest expense, interest paid, finance leases, operating leases, debt issuance, and debt repayment.

MVP ingests filing metadata and numeric companyfacts only. Phase 2 will add a separate filing-note extraction function for debt maturity schedules, revolver availability, commercial-paper dependence, covenant restrictions, variable-rate exposure, refinancing completed after period-end, and purchase commitments. Numeric values will only be derived when the filing text contains a parseable amount, year, and associated obligation label. Otherwise the evidence remains qualitative and is shown as such.

Derived signals:

- Interest coverage: operating income divided by interest expense.
- Debt burden trend: current debt balance and interest expense relative to the prior comparable observation.

MVP refinancing therefore reports interest coverage and debt-burden trend from numeric companyfacts. Near-term maturity coverage, refinancing dependence, and external-funding reliance are Phase 2 because they require maturity schedules or filing-note language.

## Comparison frames

Every derived value will expose its reference frame:

- Own history: latest comparable quarter versus the prior comparable quarter and a six-observation percentile in MVP, matching the bounded evidence retention policy.
- Peer group: issuer versus sector median and percentile when at least three comparable issuers have fresh observations.
- Obligation frame: available liquidity and free cash flow versus debt or commitment amounts in the filing.
- Filing change: new or changed language versus the previous filing for the same issuer.

The interface will suppress peer rankings when coverage is too thin. It will never substitute a broad market average for a missing peer group.

## Evidence contract

Each signal will retain the UUIDs of the numeric and text evidence that generated it. MVP will add these concrete fields to `sec_corporate_signals`:

- `calculation_inputs jsonb NOT NULL DEFAULT '{}'::jsonb`
- `confidence_reason text`
- `availability_status text NOT NULL DEFAULT 'available'` with values `available`, `insufficient_evidence`, and `unavailable`

The `vw_latest_corporate_signals` view will expose those fields plus the evidence parser-version array. The existing `state` field will retain its current observation-state constraint; evidence availability will live in `availability_status`.

The frontend will show:

- Signal value and unit
- Numerator and denominator
- Comparison frame
- Filing form and date
- Accession number and SEC document link
- Evidence excerpt for filing-note signals
- Freshness and parser version
- Confidence with a short reason

Qualitative filing-note findings will use a separate evidence kind from XBRL facts in Phase 2. Parser failures will be retained as unavailable evidence and will not create measured signals. Missing numeric facts will create an explicit `insufficient_evidence` state rather than silently disappearing.

## Data flow

SEC submissions and companyfacts are fetched by the existing bounded ingestion function. The ingestion layer will retain only concepts required by the signal families and six comparable observations in MVP. Phase 2 filing-note extraction will operate on the latest eligible 10-K and 10-Q documents through a separate function, with accession-level idempotency.

The compute function will normalize duration facts, pair comparable periods, calculate liquidity and refinancing metrics, and upsert immutable observations keyed by issuer, signal, and observation time. The existing latest-signal and summary views will expose the additional families to the frontend.

## Failure handling

- Missing companyfacts for a foreign private issuer is an unavailable enrichment, not a failed issuer ingestion.
- Missing maturity schedules produce an explicit “insufficient obligation data” state.
- Non-parseable filing text remains linked evidence without a numeric claim.
- Stale observations retain their prior value but receive a freshness state.
- One issuer failure must not abort a bounded ingestion batch.
- A parser version change creates a new observation and preserves prior evidence for auditability.

## Frontend design

The Corporate Stress tab will use the minimalist editorial treatment:

- Warm monochrome canvas and thin structural dividers
- Serif workspace title and monospace filing metadata
- Family sections with ranked issuer rows
- Muted pastel labels reserved for semantic state
- A compact detail panel for calculation inputs and filing evidence
- No decorative chart unless it shows a comparison frame or obligation timeline

The default family will be the highest-priority family with sufficient fresh evidence. MVP will implement family sections and an issuer detail panel. Peer percentiles, filing-language diffs, persistent cross-family ranking, and the full filing-note evidence panel are Phase 2.

## Verification

MVP tests will cover:

- Duration fact normalization and comparable-period pairing
- Unit and period deduplication
- FCF, cash-balance trend, interest, and debt-burden calculations
- Missing and unavailable evidence behavior
- Idempotent ingestion and signal upserts
- View shape and frontend rendering with empty, partial, and populated data

Production verification will confirm evidence counts, signal counts, latest timestamps, SEC document links, and that the frontend renders the same values returned by the public views.

Phase 2 tests will cover filing-note parsing, maturity schedule extraction, covenant evidence, peer percentiles, and filing-language diffs.
