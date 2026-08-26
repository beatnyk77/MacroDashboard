# De-Dollarization Live Evidence Library

**Date:** 2026-08-26  
**Status:** Design approved by user; implementation not started

## Objective

Turn `/labs/de-dollarization-gold/` into the primary research surface for monitoring de-dollarization evidence. The page should serve an investor-first blended audience of macro investors, portfolio managers, researchers, journalists, and analysts. Its first-minute job is to let a user see whether the available evidence is strengthening, weakening, mixed, or insufficient.

The product direction is a live evidence library. It will prioritize independent, auditable indicators over a synthetic de-dollarization score. Family-level evidence states may summarize the available indicators, but the page will not convert unlike measures into a single headline score.

## Product principles

- Every displayed value has provenance, observation date, cadence, freshness, and a visible evidence class.
- Observed data, derived calculations, estimates, and scenarios remain separate.
- Missing, stale, revised, or unavailable observations remain visible with an explanation.
- The page distinguishes reserve composition, settlement usage, and market pricing. None is treated as proof of the others.
- The page follows GraphiQuestor’s evidence-first terminal posture and avoids unsupported forecasts or probabilities.

## Information architecture

### Entry layer

The canonical URL remains `/labs/de-dollarization-gold/`. The page opens with a short indexable introduction followed by six family cards:

1. Reserve composition
2. Official gold accumulation
3. Sovereign collateral demand
4. Settlement and payment rails
5. Market confirmation
6. Country and bloc exposure

Each card displays its evidence state, number of live indicators, latest observation window, source quality, freshness, and a short description of what the evidence can establish. Cards link to filtered library views through query parameters.

Family state is a presentation summary, not a composite score. The default comparison window is one native reporting period for quarterly or monthly series, 90 calendar days for daily or weekly market series, and one year for annual series. Each family has one registry-defined primary indicator and, where available, confirmation indicators. Only observed or high-confidence derived indicators can determine state; estimated and scenario indicators are display-only. Revised observations remain eligible and carry a revision badge. Very-lagged and unavailable observations are ineligible. A family is **strengthening** when the primary moves in its defined direction over the window and at least one fresh confirmation agrees. It is **weakening** when both move in the opposite direction. It is **mixed** when the primary and confirmations disagree. It is **insufficient** when the primary is unavailable, the primary has fewer than two observations, or more than half of eligible indicators are stale. A family with no confirmation series may show only “direction observed.” Direction rules are registry fields: falling USD reserve share, rising official gold purchases, falling foreign Treasury holdings, and rising market-confirmation ratios are the initial rules.

### Library layer

The filterable library lists indicators with:

- Name and definition
- Latest value and unit
- Change over a selected window
- Direction
- Source and source URL
- As-of date
- Cadence and expected publication lag
- Evidence class
- Freshness and coverage state

Filters include family, country, bloc, currency, source type, cadence, evidence class, and time window. Query parameters control the view without producing separate indexable pages.

### Detail layer

Selecting an indicator opens an anchored detail panel or dedicated internal detail state containing:

- Historical chart
- Current reading
- Definition
- Formula and transformations
- Source link
- Observation date and publication lag
- Revision behavior
- Coverage limits
- “What this does not show” guidance
- Related indicators and methodology pages

## Evidence families and metrics

### Reserve composition

Core series include IMF COFER currency shares for USD, EUR, RMB, yen, sterling, and other currencies. The UI must identify the current IMF treatment of the historical unallocated bucket and state that COFER measures foreign-exchange reserves, excluding monetary gold. COFER country-level composition must not be implied because IMF country data is confidential.

### Official gold accumulation

Core series include central-bank holdings, purchases, sales, changes in tonnes, and gold as a share of reserves. The UI should show WGC/IMF provenance and the typical reporting lag. National central-bank releases may supplement the aggregate series when their definitions are compatible.

### Sovereign collateral demand

Core series include foreign Treasury holdings, Treasury transactions where available, and buyer-base measures. TIC-derived country readings must carry an ownership caveat because custodial and intermediary structures limit ultimate-owner attribution. A panel that infers reserve selling from TIC holdings, FX reserves, and oil prices must be classified as derived and confidence-scored.

### Settlement and payment rails

Only sourced measures of currency use in payments, trade invoicing, bilateral settlement, or payment-system activity qualify as live indicators. The current static deal list and hardcoded non-USD settlement estimate require a named methodology and source before inclusion. Unsupported aggregate estimates should render as methodology-pending or unavailable.

### Market confirmation

Market series may include gold/USD, gold/oil, copper/gold, cross-currency basis, FX volatility, and related prices. They are confirmation or context, not direct measurements of reserve or settlement behavior. Hardcoded historical observations must not be presented as live history. Scenario levels such as 500x or 1,000x belong in a separate scenario tool.

### Country and bloc exposure

Country and bloc views may include reported gold reserves, FX reserves, external debt currency, trade concentration, and reported local-currency settlement when coverage and definitions are comparable. Missing country coverage must be explicit. BRICS+ aggregation must document membership, date, and calculation rules.

## Evidence classes and states

Evidence classes:

- **Observed:** directly reported by an authoritative source.
- **Derived:** calculated from named observed series.
- **Estimated:** modelled or reported with incomplete coverage.
- **Scenario:** hypothetical stress test, never presented as current evidence.

Display states:

- Loading
- Fresh
- Lagged
- Very lagged
- Revised
- Unavailable
- Methodology pending

No component may silently replace missing data with a fallback value. If a series has no current observation, its family card and detail view must expose the reason.

## Evidence registry

Create a central registry for display and research metadata. Each entry should include:

- Metric ID
- Family
- Display label
- Unit
- Source and source URL
- Formula
- Evidence class
- Frequency
- Expected lag
- Coverage
- Revision behavior
- Status
- Source type: official, market, research organization, or internal calculation
- Publication date and observation date
- Country and bloc dimensions, when applicable
- Primary or confirmation role within its family
- Direction rule and eligible comparison window
- Confidence basis for derived or estimated signals
- Related methodology and glossary pages

The first implementation stores this registry in TypeScript beside the existing metric metadata. Supabase remains authoritative for observations and derived values. A later migration to a database registry requires a separate design because it changes the operational ownership of provenance metadata.

## First-release inventory

The first release is bounded to existing data paths and does not add new ingestion.

| Family | First-release series or surface | Existing path | Evidence class | Source/status |
| --- | --- | --- | --- | --- |
| Reserve composition | `GLOBAL_USD_SHARE_PCT`, `GLOBAL_RMB_SHARE_PCT`, `GLOBAL_EUR_SHARE_PCT` | `useDeDollarization` and `vw_dedollarization` | Observed | IMF COFER; verify current post-2025Q3 treatment |
| Official gold | `cb_gold_net` period rows | `useCentralBankGoldNet` | Observed/compiled | WGC/IMF; expose reporting lag |
| Sovereign collateral | TIC holders and FX-reserve rows | `useReserveSellerData` | Observed plus derived | US Treasury TIC and country reserve tables; country inference caveat |
| Market confirmation | `GOLD_PRICE_USD`, `BRENT_CRUDE_PRICE`, `RATIO_M2_GOLD`, `RATIO_DEBT_GOLD`, `RATIO_SPX_GOLD`, `RATIO_GOLD_SILVER` | `useLatestMetric`, `useGoldOilPrices`, `useGoldRatios` | Observed/derived | Market and named calculation paths |
| Settlement rails | No first-release live series | Existing `PetrodollarVsPetroyuan` is retained only as a pending research placeholder | Methodology pending | Excluded from phase one until sourced |
| Country/bloc exposure | BRICS aggregate rows and G20 coverage rows | `useBricsTracker`, `useGoldDebtCoverageG20` | Derived | Phase two pending definition and coverage audit |

`GLOBAL_GOLD_SHARE_PCT` and `GLOBAL_GOLD_HOLDINGS_USD` remain excluded from the first-release core until their source metadata is corrected. Monetary gold is not part of COFER.

For planning purposes, the first-release field mappings are fixed. COFER rows use `metric_id`, `value`, and `as_of_date` from `vw_dedollarization` and `metric_observations`. Central-bank gold rows use `period_start_year`, `period_label`, `buyers_tonnes`, `sellers_tonnes`, `net_tonnes`, and `updated_at` from `cb_gold_net`. TIC rows use `country_name`, `as_of_date`, and `holdings_usd_bn` from `tic_foreign_holders`; reserve rows use `country_code`, `as_of_date`, and `fx_reserves_usd` from `country_reserves`; Brent uses `BRENT_CRUDE_PRICE` observations. The existing reserve-seller calculation is descriptive only: four-period TIC and reserve percentage changes are shown, while an active selling signal requires a separate approved formula and is out of phase one. Gold ratio rows are read from `get_latest_gold_ratios` and their history from `metric_observations`; the registry records the underlying formula for each ratio before it is labeled derived.

The registry becomes the single metadata source for family cards, library rows, detail panels, provenance badges, and SEO text. Existing scattered component labels should be migrated only where needed for this lab.

## Data flow

```text
authoritative source
  → ingestion function
  → raw observation
  → derived metric, when applicable
  → evidence registry metadata
  → family card, library row, and detail view
```

The implementation should reuse the existing canonical metric hooks and Supabase observation tables. New ingestion should be added only for a defined evidence gap with a primary source and documented cadence.

The first release uses an anchored detail panel for the selected indicator. Dedicated indexable metric routes are a later phase after an indicator has a complete definition, methodology, and enough standalone content.

The anchored detail state is shareable through a `metric` query parameter. Opening a metric updates browser history; back navigation restores the prior family or library state. The base lab path remains canonical for every query state.

## SEO and discovery

### Search positioning

Target the combined intent around “de-dollarization indicators,” “central-bank gold purchases,” “COFER dollar share,” “BRICS settlement,” and “is de-dollarization happening now?” The lab is the live surface. The methodology guide remains the explanatory article and links into the lab.

Suggested metadata:

- **Title:** De-Dollarization Indicators: Live Gold, Reserves & Settlement Data | GraphiQuestor
- **H1:** De-Dollarization Indicators and Gold Reserve Monitor
- **Description:** Live de-dollarization indicators covering IMF COFER reserve shares, central-bank gold purchases, Treasury holdings, currency settlement, and market confirmation. See sources, freshness, methodology, and data limits for every series.

### Indexable content

Render an indexable introduction before the interactive library. It should define de-dollarization, distinguish reserve diversification from payment settlement, explain why gold accumulation is evidence rather than proof, and state the limits of COFER, WGC, TIC, and payment data.

Each family card should contain an indexable heading, summary, source family, and link to a glossary or methodology page. Add an FAQ section covering the definition of de-dollarization, COFER scope, dollar reserve share, central-bank gold buying, Treasury ownership limits, and settlement interpretation.

### Structured data

Emit separate `WebPage`, `BreadcrumbList`, `Dataset`, and `FAQPage` nodes. The Dataset node should include temporal coverage, update frequency, measurement methods, variables, source organizations, and known limitations. The existing Creative Commons license claim should remain only if a matching data-license policy exists.

Update `public/llms.txt` and `public/llm.txt` to name the lab as the primary live surface, link the methodology guide, and provide a citation-ready description that distinguishes observed, derived, estimated, and scenario evidence.

The sitemap and robots policy already permit discovery. The repository already runs `scripts/prerender.mjs` and `scripts/validate-prerender-seo.mjs` during production builds. The implementation should add the lab’s static content contract to that existing route validation rather than introduce a new prerender system. Acceptance requires generated lab HTML to contain the introduction, six family headings, family summaries, evidence labels, source names, and unavailable-state copy, plus unique title, description, canonical, and JSON-LD. Live values remain client-hydrated. The canonical URL is always the slash-terminated base lab path. All query-parameter states use that base path as canonical and are excluded from the sitemap.

## Existing metric disposition

| Existing surface | Disposition |
| --- | --- |
| COFER reserve composition | Core observed evidence; update unallocated-bucket language |
| Central-bank gold net purchases | Core observed evidence; expose WGC/IMF lag |
| Gold price and gold/oil price series | Market confirmation |
| Treasury foreign holdings | Core observed/derived evidence with TIC caveat |
| Reserve-seller tracker | Derived signal with confidence and limitation text |
| Petrodollar vs. petroyuan panel | Rebuild around sourced live data |
| Hardcoded Gold/Oil historical chart | Separate scenario or replace with sourced history |
| 500x/1,000x revaluation levels | Scenario tool, outside evidence library |
| Probability-based scenarios | Remove from evidence library unless a documented model exists |
| Predictive or systemic-floor language | Replace with observation-led language |

## Quality and testing

Tests should cover:

- Evidence registry completeness and required metadata
- Metric-to-source mappings
- Formula, unit, and transformation correctness
- COFER gold exclusion and revision notes
- WGC publication lag display
- TIC ultimate-owner caveat
- Freshness-state transitions
- Loading, stale, error, unavailable, revised, and methodology-pending states
- Family filters, search, and query-parameter behavior
- Canonical URL stability
- JSON-LD validity
- Prerendered indexable content
- Mobile family-card and detail-panel behavior

## Release boundary

Phase one includes the library shell, TypeScript evidence registry, six family cards, the first-release inventory above, search/filtering over registered indicators, anchored detail metadata, provenance display, and SEO content/schema. Family cards for excluded families must render a methodology-pending or unavailable state rather than placeholder data.

Phase two covers a sourced replacement for the petrodollar/petroyuan placeholder, country/bloc exposure, dedicated metric routes, downloads, and any new ingestion required by those surfaces. It is outside the first implementation plan unless separately approved.

## Primary source references

- IMF COFER FAQ: https://data.imf.org/en/Datasets/COFER/Frequently-Asked-Questions
- IMF COFER technical note: https://www.imf.org/en/publications/tnm/issues/2025/11/26/improving-the-analytical-usefulness-of-the-imfs-cofer-data-571706
- World Gold Council gold reserves data: https://www.gold.org/goldhub/data/gold-reserves-by-country
- US Treasury TIC system: https://home.treasury.gov/data/treasury-international-capital-tic-system-home-page/description-of-TIC-system
- US Treasury TIC data note: https://home.treasury.gov/system/files/136/Press-notice-TIC-for-Feb-2026.pdf
