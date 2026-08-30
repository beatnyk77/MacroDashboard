# GraphiQuestor Authority Engine

**Status:** Approved for implementation planning  
**Date:** 2026-08-31  
**Primary outcome:** Institutional authority, citations, and strategic partnerships

## Objective

Build a public research system that can support 10,000 daily visitors within one year while making GraphiQuestor a cited reference for macro data across financial media, buy-side research, academic and policy work, and AI research workflows.

Traffic is an outcome. The durable asset is a trusted, versioned measurement layer around GraphiQuestor's proprietary indicators.

## Initial scope

The first authority cohort contains eight flagship metrics:

1. Net Liquidity Index
2. Fiscal Dominance Meter
3. Sovereign Stress Index
4. M2/Gold Ratio
5. Global USD Reserve Share
6. Central Bank Gold Purchases
7. India Credit Cycle
8. China Debt Iceberg Ratio

The Research Desk publishes under the name **GraphiQuestor Research Desk**. Morning Brief, Weekly Narrative, and Regime Digest remain the publishing infrastructure. Their pages stay fully public and indexable.

## Metric authority contract

Each flagship metric has one canonical page at `/metrics/<metric-slug>/`. The page must expose:

- Current value, observation date, freshness state, and publication timestamp.
- Formula, input components, source ledger, and update cadence.
- Historical series with CSV and JSON downloads.
- A short citation block and stable page URL.
- Embeddable chart or table with attribution.
- Machine-readable metadata for search engines and AI systems.
- Methodology version and a public corrections log.

The page is the citation source. Lab pages provide thematic context. Method pages explain calculation. Glossary pages capture definition-led discovery. Reports link back to the canonical metric page rather than becoming competing sources of truth.

### Data contract

Every metric record uses the existing metric identifier and includes `metric_id`, `slug`, `label`, `value`, `unit`, `observed_at`, `published_at`, `source_name`, `source_ref`, `native_frequency`, `staleness_flag`, `data_status`, `methodology_version`, and `revision_of` where applicable. `staleness_flag` follows the existing `fresh`, `lagged`, and `very_lagged` values. `data_status` follows `verified`, `provisional`, `revised`, `unavailable`, and `corrected`.

The eight initial records map to the existing catalog IDs: `net-liquidity`, `fiscal-dominance-meter`, `sovereign-stress-index`, `m2-gold-ratio`, `global-usd-reserve-share`, `CB_GOLD_NET`, `india-credit-cycle`, and `china-iceberg-ratio`. The central-bank-gold record is sourced from the existing `cb_gold_net` table and its `CB_GOLD_NET` metric registration. The implementation must reuse the freshness thresholds already defined by the existing staleness helpers and views.

| Metric | Formula inputs and source ledger | Storage and calculation path |
| --- | --- | --- |
| Net Liquidity Index | FRED `WALCL`, `WTREGEN`, `RRPONTSYD` | `metric_observations` → `vw_latest_metrics`; Fed assets less TGA and ONRRP |
| Fiscal Dominance Meter | FRED interest expense, Treasury FiscalData revenue and deficit, BEA/FRED GDP | `metric_observations` → `vw_latest_metrics`; fiscal-dominance computation |
| Sovereign Stress Index | Registered sovereign debt, reserves, fiscal, FX, and external-balance inputs | `metric_observations` → `vw_latest_metrics`; derived composite computation |
| M2/Gold Ratio | US, Eurozone, China, Japan, and UK M2; XAU/USD; above-ground gold stock | `metric_observations` → `vw_latest_metrics`; `RATIO_M2_GOLD` calculation |
| Global USD Reserve Share | IMF COFER allocated reserve shares | `metric_observations` → `vw_latest_metrics`; USD-share calculation |
| Central Bank Gold Purchases | IMF IFS `RAXG_FO`; WGC context; period data | `cb_gold_net` plus `CB_GOLD_NET`; `ingest-cb-gold-net` |
| India Credit Cycle | RBI bank credit, formal employment, and related India inputs | `metric_observations` → `vw_latest_metrics`; India credit-cycle computation |
| China Debt Iceberg Ratio | China local-government and broader debt inputs | `metric_observations` → `vw_latest_metrics`; China debt-iceberg computation |

The implementation plan must resolve source-specific table names against the live schema before coding. A new source or calculation path requires a documented contract change.

CSV exports use one row per observation with the fields above. JSON exports use `{ metric, observations, methodology, sources }`, with ISO-8601 timestamps and explicit nulls for unavailable values. Source snapshots store the source URL or identifier, retrieval timestamp, and content hash where the source permits it.

### Citation durability

The canonical page shows the latest verified state. Each published report and metric snapshot is stored in the append-only `metric_publication_snapshots` record with an immutable UUID `snapshot_id`. Stable snapshot URLs use `/metrics/<metric-slug>/history/<snapshot-id>/`. A snapshot contains the observation timestamp, publication timestamp, methodology version, source snapshot hash, serialized public payload, and `revision_of` pointing from a new snapshot to the older snapshot it replaces. Existing snapshots are never edited or deleted.

## Publishing flow

```text
verified observation
  -> canonical metric page and research timeline
  -> Morning Brief daily movement
  -> Weekly Narrative structural interpretation
  -> Regime Digest monthly reference record
  -> external citation, embed, or research workflow
```

Each publication keeps the metric URLs, methodology version, source references, and observation dates visible. A report can be read and cited without requiring a product account.

### Verification states

Ingestion writes observations as `provisional` until the existing pipeline health checks pass. A publication job promotes them to `verified` when required inputs are present, freshness rules are satisfied, and the calculation completes without validation errors. `revised`, `unavailable`, and `corrected` states remain visible to readers. Failed jobs leave the last verified observation in place, mark the page with the appropriate freshness state, and create an operational alert. Corrections update the metric page, affected snapshot relationship, and future report references in one transaction or an explicitly replayable job.

When a source correction changes a published value, the current canonical page adopts a new `revised` snapshot and the previous snapshot becomes `superseded` while remaining publicly retrievable. When the issue concerns a published interpretation or provenance statement, the replacement snapshot is `corrected` and points to the affected snapshot through `revision_of`. `verified` is the normal publish state; `provisional` is visible but cannot be used as the verified value in a new report; `unavailable` preserves the last verified reading and explains the gap. The latest canonical value replaces the current display, while historical snapshots preserve what readers previously saw.

## Distribution system

Distribution starts from zero and uses public, reusable research assets:

- RSS and email-ready publication output.
- Short excerpts and chart cards for professional social channels.
- Researcher and journalist citation kits.
- Dataset pages, API documentation, and embeddable charts.
- Direct outreach to macro newsletters, financial media, policy researchers, and buy-side analysts.
- Machine-readable indexes such as `llms.txt`, structured data, and stable metadata.

The distribution system should measure who uses a research artifact, where it is cited, and which metric or report created the reference.

Collection sources are Search Console, site analytics, download events, embed loads, API request logs, referral URLs, newsletter analytics, and a manually maintained citation register. Each event records `event_type`, `metric_id` or `report_id`, timestamp, referrer or source, and an anonymized identifier where permitted. The Research Desk reviews the data monthly and records partnership prospects, outreach status, resulting citations, and qualified introductions.

## Measurement and governance

The weekly operating review tracks:

- Impressions, clicks, CTR, rank, and indexed status by flagship metric and query.
- External links, citations, mentions, embeds, downloads, API calls, and returning visitors.
- Report-to-metric referral paths and research artifact usage.
- Freshness failures, source outages, unexplained revisions, and corrections.

Each metric publishes its own quality record with `data_status`, `observed_at`, `published_at`, `methodology_version`, source snapshot, and correction history.

The Research Desk owns editorial approval. Data pipeline owners own ingestion and calculation. A correction is `minor` when wording or presentation changes, `material` when a published value or interpretation changes, and `critical` when a source or calculation error could mislead readers. Material and critical corrections require a visible note, affected snapshot links, and a revised methodology or source record where relevant. Audit records are retained with the observation history. Public readers receive the status and explanation; administrative credentials control writes.

## Phased delivery

### Foundation MVP

Standardize the metric authority contract across the eight pages. Confirm canonical routes, existing Supabase mappings, schemas, historical downloads, citation text, methodology versions, corrections logs, and source ledgers. Deliver one fully instrumented metric page as the reference implementation, then apply the contract to the remaining seven.

### Publication integration MVP

Connect the reference metric and then the remaining metrics to Morning Brief, Weekly Narrative, and Regime Digest. Preserve report history, create automatic links from each publication to affected metrics, and prove that a failed ingestion cannot publish an unverified value.

### Discovery system MVP

Build the lab, metric, methodology, glossary, and report link graph. Ensure each flagship route is represented in the sitemap, prerendered by the existing Vite/Puppeteer pipeline, served through Netlify’s SPA and static-route rules, and emits one canonical URL plus valid JSON-LD. Expand only where the content deepens a flagship authority cluster or satisfies verified search demand.

### Authority distribution pilot

Package Weekly Narrative and Regime Digest for external citation. Build a structured outreach list and run a time-boxed pilot with journalists, newsletters, researchers, and buy-side analysts. Track external usage by recipient, metric, and report. Manual outreach remains a separate workstream from the technical MVP.

### Compounding loop

Use Search Console, citation data, and research usage to identify rising queries, missing definitions, weak pages, stale content, and the next high-value historical analyses.

## Success criteria

The first implementation cycle is complete when all eight flagship metrics have the authority contract, all three publication surfaces link to them, public research artifacts carry versioned provenance, and the monitoring layer can report search, citation, and data-quality signals per metric.

The initial implementation cycle has these testable gates:

- Eight metric pages resolve to unique canonical URLs and expose the required data contract fields.
- Eight CSV and JSON downloads validate against the documented schemas.
- Each page exposes visible source, freshness, methodology, correction, and citation sections.
- Each page emits valid JSON-LD and is present in the generated sitemap.
- One Morning Brief, one Weekly Narrative, and one Regime Digest record link to the affected metric pages.
- A simulated stale input, failed ingestion, provisional value, revision, and correction produce the documented public states.
- Search, download, embed, API, referral, and citation events appear in the monitoring report without storing unnecessary personal data.
- Historical snapshot retrieval returns the original payload, timestamp, methodology version, source hash, and `revision_of` relationship after a revision.
- A production-like mobile run keeps the public metric summary within the 2.5-second LCP budget; immutable snapshots and downloads return cacheable responses from Netlify; configured API and download rate limits reject excess traffic predictably; embeds cannot access authenticated surfaces; service-limit alerts fire in a staging test.

## Rendering and performance requirements

The site remains a Vite SPA with the existing prerender pipeline. Public metric and report routes must produce route-specific HTML, title, description, canonical, visible text, and JSON-LD in the prerendered output. Client-side data loading may enhance the page after first paint, while the public summary and provenance cannot depend on a successful client request.

For the 10,000 daily visitor target, the implementation should establish a 2.5-second mobile LCP budget for the public metric summary, cache immutable snapshots and downloads at the Netlify edge, apply Supabase query and API rate limits, isolate embeds from authenticated surfaces, and alert when traffic or query volume threatens service limits.

The year-one authority target is a growing portfolio of independently cited GraphiQuestor research objects across the four selected audiences. The 10,000 daily visitor goal remains a business target, supported by this system rather than treated as its only validation.

Partnership success means qualified research relationships, not logo collection. The 90-day distribution pilot targets 25 qualified contacts, 5 substantive conversations, 3 external citations, and 1 recurring citing publication. The year-one review targets 12 recurring citing publications, 4 active collaborations, 12 inbound data requests, 4 invited briefings, and 10 documented analyst workflows that use GraphiQuestor as a source. The targets are reviewed quarterly against editorial capacity and source quality.

## Risks and decisions

- Public research must preserve source accuracy and disclose lagged or provisional data.
- Structured data enables discovery signals but does not guarantee rich-result placement.
- Google sitemap pinging is excluded because the endpoint is deprecated. Sitemap submission and accurate `lastmod` values remain the supported path.
- The system must avoid creating thin programmatic pages that compete with the canonical metric pages.
- Any material methodology change requires a version increment and a public correction or change note.
- The implementation plan must define source-specific retention, licensing, and rate-limit rules before public downloads or embeds launch.
