# Authority Engine Scorecard & Operating Procedure

This scorecard tracks the institutional adoption, search visibility, citation footprint, and data quality across GraphiQuestor's flagship authority metrics.

## Flagship Metrics Monitored

1. **Net Liquidity (`net-liquidity`)** — Fed Balance Sheet - TGA - RRP
2. **Net Liquidity Z-Score (`net-liquidity-zscore`)** — 52-week normalized liquidity impulse
3. **Debt / Gold Coverage Ratio (`debt-gold-zscore`)** — US Federal Debt relative to Treasury Gold Reserve
4. **China Iceberg Debt Ratio (`china-iceberg-ratio`)** — Consolidated Public Debt vs Official Central Debt
5. **Global USD Reserve Share (`global-usd-reserve-share`)** — IMF COFER dollar reserve allocation %
6. **M2 / Gold Ratio (`m2-gold-ratio`)** — Global monetary base backed by physical bullion
7. **Fed Monetization Ratio (`fed-monetization-ratio`)** — Fed SOMA holdings as % of marketable debt
8. **India Credit Cycle Impulse (`india-credit-cycle`)** — RBI Repo Rate vs Commercial Credit Growth

---

## Weekly Review Cadence

The Research Desk reviews this telemetry every Monday morning alongside the macro regime update:

### 1. Search Engine & Discovery Footprint
- **Google Search Console Indexing Status**: Ensure 100% of canonical metric and history snapshot routes are indexed (`valid` state).
- **Search Impressions & CTR**: Track queries targeting proprietary metrics (e.g., "China iceberg debt ratio", "US debt to gold backing").
- **AI Engine Ingestion**: Monitor hits to `/llms.txt` and Edge export paths by verified LLM scrapers.

### 2. Research Artifact & Citation Telemetry
- **Citation Copy Events**: Count of APA, Chicago, and BibTeX citations copied via `AuthorityCitationBlock`.
- **Data Export Volume**: Number of CSV / JSON downloads per metric via Edge function endpoints.
- **Snapshot Navigation**: Ratio of live terminal views vs historical snapshot reviews.

### 3. Data Quality & Pipeline SLA
- **Freshness SLA**: % of observations marked `fresh` vs `lagged`/`very_lagged`.
- **Revision / Correction Log**: Any material methodology or source correction must increment `methodology_version` and record `revision_of` pointer.
- **Failures & Outages**: Zero tolerance for fabricated values or unhandled calculation gaps.

---

## Target Milestones (90-Day Authority Pilot)

| Metric | 90-Day Target | Year 1 Target | Current Status |
| :--- | :--- | :--- | :--- |
| **Indexed Canonical Routes** | 8 Flagship + Snapshots | All Metrics + Snapshots | Complete |
| **External Citations / Mentions** | 3 Verified | 12 Recurring Publications | In Progress |
| **Qualified Academic / Media Contacts** | 25 Qualified Contacts | 50 Active Desks | Initial Outreach |
| **Edge Function Export Latency** | < 200ms TTFB | < 150ms TTFB | Verified (<180ms) |
| **Mobile LCP on Authority Pages** | < 2.5s | < 2.0s | Compliant |
