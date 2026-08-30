# SEC EDGAR Strategic Exposure and Stress Monitor

**Status:** Draft for user review  
**Date:** 2026-08-30  
**Project:** GraphiQuestor

## Purpose

Add a corporate-disclosure intelligence layer to GraphiQuestor. The first release will cover S&P 500 issuers with material relevance to India, China, energy, defense, or strategic supply chains. The system will turn SEC filings and structured disclosures into timestamped, evidence-backed observations that connect company-level developments to macro transmission channels.

The product will describe structural conditions. It will not issue buy, sell, or price forecasts.

## Product decision

Use a hybrid adapter model.

- Production ingestion will use SEC-native public APIs and filing archives.
- The referenced `beatnyk77/sec-edgar-mcp` implementation, likely a fork of `stefanoamorelli/sec-edgar-mcp`, may be used for research, prototyping, and extraction comparison.
- GraphiQuestor will own the canonical schema, evidence store, signal logic, methodology versions, freshness state, and user-facing presentation.

The likely upstream project is AGPL-3.0 and built on `edgartools`. Its license and external runtime behavior should be treated as constraints for commercial production use. SEC public APIs provide submissions and XBRL facts without API keys, with real-time updates and bulk archives. Automated access requires a declared User-Agent and is subject to SEC fair-access limits.

References:

- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC Webmaster FAQ and fair-access guidance](https://www.sec.gov/about/webmaster-frequently-asked-questions)
- [Likely upstream SEC EDGAR MCP](https://github.com/stefanoamorelli/sec-edgar-mcp)

## Scope

### In scope

- Curated S&P 500 issuer universe with relevance tags and rationale.
- SEC submissions, XBRL company facts, selected filing documents, and relevant ownership filings.
- 10-K, 10-Q, 8-K, 20-F, DEF 14A, Forms 3/4/5, and Schedules 13D/13G as initial filing families.
- Historical, issuer-relative signal calculations.
- Evidence-linked terminal views.
- Parser health, freshness, unavailable states, and methodology versioning.

### Out of scope for the first release

- Full coverage of every SEC filer.
- Automated investment recommendations.
- An opaque single composite score.
- Replacing GraphiQuestor’s Corporate India Engine.
- Direct production dependence on a third-party MCP process.

## System boundary

### Universe registry

Create a registry of covered issuers containing CIK, ticker, exchange, SIC, sector, relevance tags, relevance rationale, and review status. Tags are:

- `india`
- `china`
- `energy`
- `defense`
- `supply_chain`

The registry is the control plane for coverage. It prevents accidental claims of broad market coverage and supports later analyst review.

### SEC evidence ingestion

Scheduled Supabase Edge Functions will retrieve submission histories, XBRL facts, filing metadata, and selected documents. Accession number is the idempotency key for filings. The adapter will honor User-Agent requirements, rate limits, retry-after responses, ETags, modified timestamps, and backoff.

The system will retain raw source references and immutable identifiers:

- CIK
- accession number
- form type
- filing date
- acceptance timestamp
- document URL
- section or exhibit
- taxonomy, concept, unit, period, and dimensions
- source hash
- ingestion timestamp

### Evidence normalization

Raw filings, extracted text spans, structured facts, and ownership records will be represented as evidence records. A signal cannot be published without at least one evidence record. Amendments and restatements remain distinct records and are linked to the original accession where applicable.

### Signal computation

Independent workers calculate signal observations from normalized evidence. Each observation includes signal family, signal ID, issuer, macro theme, value or state, baseline, comparison window, severity, confidence, evidence references, methodology version, and first/last observed timestamps.

The frontend will consume derived views through existing TanStack Query patterns. It will reuse `DataProvenanceBadge`, `FreshnessChip`, `DataHealthBanner`, and the existing metric-card conventions.

## Signal catalogue

The first release will expose component signals instead of one opaque composite.

### Liquidity and balance-sheet stress

- Cash runway from cash and equivalents divided by trailing quarterly operating cash burn.
- Debt maturity wall normalized against cash, free cash flow, and committed facilities.
- Revolver drawdowns, commercial-paper exposure, covenant references, and refinancing dependence.
- Receivables days, inventory days, payables days, and cash-conversion-cycle movement.

### Investment and industrial-cycle signals

- Capex growth relative to revenue growth, depreciation, backlog, and sector peers.
- Order backlog growth and cancellation language.
- Inventory build and capacity-expansion or capacity-reduction disclosures.
- Customer concentration and dependence on strategic counterparties.

### Geographic and strategic exposure

- Quantified revenue, assets, subsidiaries, suppliers, production, and capex tied to India or China.
- Narrative exposure to tariffs, sanctions, export controls, localization, and supply-chain relocation.
- Separate quantified exposure from narrative exposure so the user can see the evidence quality.

### Energy sensitivity

- Fuel and power-cost exposure.
- Hedging changes and commodity-linked input costs.
- Energy-intensive production and margin sensitivity.
- LNG, crude, electricity, or carbon-cost dependence where disclosed.

### Defense and strategic supply chains

- Government revenue, contract backlog, funded versus unfunded backlog, and contract concentration.
- Critical-mineral dependency, single-source suppliers, sanctions, export controls, and procurement risk.
- Classified-program references and program timing where disclosed.

### Disclosure and ownership events

- 8-K material events.
- Auditor changes, restatements, going-concern language, covenant events, litigation, cyber incidents, and delayed filings.
- Unusual open-market Form 4 buying or selling relative to issuer and insider history.
- 13F ownership changes, activist filings, ownership concentration, and crowding.

### Narrative drift

Compare filing language across sequential periods for references to China, India, sanctions, tariffs, energy, labor, supply constraints, AI capex, and geopolitical risk. Narrative drift is an observation layer. It does not become a material signal without a defined comparison window and evidence span.

## Signal states

- `observed`: relevant evidence is present.
- `measured`: evidence supports a numeric calculation.
- `changed`: the measure moved materially against its historical baseline.
- `confirmed`: multiple filings, metrics, or sources support the same condition.

Thresholds will be configuration data with methodology versions, not hardcoded UI behavior. Every displayed value will show its source, freshness, comparison window, and calculation context.

## User experience

Add a **Corporate Transmission** workspace to the existing terminal navigation.

### Workspace views

- **Strategic Exposure Monitor:** issuer exposure to India, China, energy, defense, and supply chains.
- **Corporate Stress Monitor:** liquidity, leverage, maturity, covenant, margin, and working-capital changes.
- **Filing Event Feed:** recent high-signal 8-K and ownership events ranked by macro relevance.
- **Issuer evidence page:** signal timeline, filing chronology, quantified exposure, narrative evidence, and source links.

The landing view will show issuer counts by signal state, theme and country distributions, newest disclosure shocks, debt-wall changes, sector heatmaps, and ingestion health. Signal cards will distinguish source evidence, calculated observations, and interpretation.

The evidence chain will be visible in this form:

`Signal → calculation → comparison window → filing → source excerpt → SEC URL`

Unavailable or low-confidence extraction will display an explicit unavailable state. No fabricated value will reach the UI.

## Data flow

`Universe registry → SEC submissions → filing evidence → normalized facts → signal calculations → latest-signal views → terminal surfaces`

The ingestion layer must be idempotent, retryable, observable, and safe under amended filings. Parsing failures enter a dead-letter record with the accession number, source URL, parser version, failure class, and retry status.

## Validation

### Extraction accuracy

Manually label a representative filing set across sectors and themes. Measure correct issuer, filing, section, concept, evidence span, and event classification.

### Signal stability

Run at least eight quarters of history. Test amended filings, restatements, fiscal-year differences, unit conversion, custom XBRL tags, duplicate facts, and nonstandard reporting periods.

### User usefulness

Review alerts with professional users. Track evidence click-through, dismissed alerts, repeated issuer searches, and whether users can explain why a signal appeared.

## Rollout gates

1. **Stage 1:** 50–100 issuers and structured facts.
2. **Stage 2:** narrative exposure and disclosure shocks.
3. **Stage 3:** insider and institutional positioning.
4. **Stage 4:** broader S&P 500 coverage and cross-issuer thematic aggregates.

The first release is ready when every displayed signal has traceable evidence, freshness metadata, a versioned methodology, and a visible unavailable state when extraction quality is insufficient.

## Risks and mitigations

### Third-party dependency and license

The MCP repository is useful for discovery and prototyping. Production data contracts remain GraphiQuestor-owned, and SEC-native adapters prevent the signal engine from depending on the repository’s transport or internal classes.

### SEC access limits

Use a centralized request scheduler, declared User-Agent, cache validators, bulk archives for backfills, and bounded concurrency. Keep raw filing URLs for verification.

### XBRL comparability

Prefer standard taxonomy facts, retain dimensions and units, track custom tags separately, and surface comparability limitations.

### Narrative extraction errors

Require source spans, confidence, parser version, and human-review sampling. A failed extraction produces an unavailable state rather than inferred content.

### Alert fatigue

Publish state changes and confirmations, preserve component evidence, and allow filtering by issuer, theme, severity, and freshness.

## Success criteria

- A professional user can identify the evidence behind every signal in one interaction.
- The system finds material filings for the covered universe within the ingestion freshness target.
- Historical calculations survive amendments, restatements, and issuer-specific reporting calendars.
- The terminal adds macro transmission intelligence without presenting unsupported forecasts.
- The same normalized signal contracts can later support GraphiQuestor’s MCP and Corporate India Engine.
