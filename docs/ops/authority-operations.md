# Authority Engine Operations & Performance Manual

This guide documents the performance standards, edge caching policies, rate limiting, and incident handling for GraphiQuestor's Authority Engine.

## Performance & Service-Level Objectives

1. **Mobile LCP Budget**: Under 2.5 seconds on a throttled 4G mobile connection for all canonical and historical snapshot metric pages.
2. **TTFB on Edge Function Exports**: Under 200ms globally via Netlify Edge Functions.
3. **Data Availability**: Zero-downtime metric observation retrieval; transparent fallback to the latest verified snapshot if live ingestion fails.

---

## Edge Caching Strategy

- **Live Canonical Pages (`/metrics/:id`)**: Prerendered HTML served instantly from CDN. Live TanStack Query queries hydrate with a 30-minute stale time (`staleTime: 1000 * 60 * 30`).
- **Historical Snapshots (`/metrics/:id/history/:snapshotId`)**: Immutable historical records. Safe to cache indefinitely (`max-age=31536000, immutable`).
- **Data Export Endpoints (`/api/v1/metrics/:slug/export`)**: Cached with `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400` to protect database IOPS from scrape bursts while preserving intraday freshness.

---

## Service Limits & Protection Gates

### 1. API & Export Rate Limits
- Unauthenticated requests to `/api/v1/metrics/*/export` are served via Netlify Edge Functions with cached headers.
- Rate spikes are mitigated via edge caching and CDN edge response coalescing.

### 2. Embed Security
- Interactive embed widgets (`/tools/*?embed=true`) are sandboxed from authenticated cookies and administrative mutations.
- Clickjacking and framing are permitted strictly on designated embed routes while canonical pages maintain strict Content Security Policies.

---

## Operational Incident Procedures

### A. Upstream Data Source Failure
- If an official data provider (e.g., FRED, IMF, BIS) is delayed or fails:
  1. The pipeline marks the latest observation as `lagged` or `very_lagged`.
  2. The page renders the `FreshnessChip` warning with source provenance.
  3. No unverified or placeholder data is ever rendered.

### B. Material Methodology Correction
- If a calculation formula or historical source requires a correction:
  1. Trigger `publish-metric-snapshot` with `data_status: 'corrected'` or `data_status: 'revised'`.
  2. Set `revision_of` to the affected prior snapshot ID.
  3. Increment `methodology_version` (e.g., `1.0.0` → `1.1.0`).
  4. The previous snapshot becomes `superseded` in the timeline while remaining permanently accessible via its direct UUID URL for external citation integrity.
