# India Macro Weekly Ingestion — Design Spec

**Date:** 2026-06-08  
**Status:** Approved

---

## Problem

`ingest-india-macro-snapshot` hard-codes all metric values in its function body. Every monthly update requires a manual code edit and redeploy.

## Goal

Fully automate monthly ingestion of 8 India macro metrics via a weekly pg_cron sweep, using the best available free API or scraping source for each metric. The existing `india_macro_snapshots` JSONB structure and frontend are unchanged.

---

## Architecture

One new edge function `ingest-india-macro-weekly`:
- Runs every Sunday 06:00 UTC via pg_cron.
- Fetches all 8 metrics in parallel (`Promise.allSettled` — partial failure is fine).
- Reads the latest `india_macro_snapshots` row.
- Merges fetched values into `metrics_data` JSONB: non-null fetched values win; null fetches fall back to last stored value.
- Upserts on `snapshot_date` (first day of current month). Narrative fields (geopolitical_summary, insights_*) are inherited unchanged — they remain manually curated.

`ingest-india-macro-snapshot` stays untouched as a one-time historical bootstrap tool.

---

## Data Source Map

| Metric (snapshot name) | Source | Method | Key |
|---|---|---|---|
| `CPI (retail inflation)` | FRED | JSON API | `INDCPIALLMINMEI` → compute YoY % |
| `WPI` | FRED | JSON API | `INDWPIALLMINMEI` → compute YoY % |
| `PMI-Manufacturing` | FRED | JSON API | `INDPMIMANMFOB` |
| `PMI-Services` | FRED | JSON API | `INDPMISERVBUS` |
| `Forex Reserves` | World Bank | JSON API | `FI.RES.TOTL.CD` for IND |
| `GST Collections` | gst.gov.in | cheerio scrape | Latest "GST Revenue Collection" press release |
| `Vehicle Registrations` | VAHAN portal | JSON API | Dashboard POST endpoint |
| `Naukri Job Index` | naukri.com/jobspeak | cheerio scrape | JobSpeak landing page |

`GST Collections` (₹tn) and `Forex Reserves` ($bn) are new metrics not in the existing snapshot; `mergeIntoSnapshot` adds them if absent.

---

## Merge Logic

```
mergeIntoSnapshot(metricsData, metricName, monthKey, value)
  if value === null or monthKey === '' → no-op
  if metric not found in array → append new entry
  if values[monthKey] already non-null → no-op (never overwrite)
  else → set values[monthKey] = value
```

---

## Scheduling

New migration `20260608000000_india_macro_weekly_cron.sql`:
```sql
SELECT cron.schedule('india-macro-weekly', '0 6 * * 0', $$...$$);
```

---

## Error Handling

- `Promise.allSettled` — 1 failing source never aborts the others.
- `runWithRetry` (2 retries, 15s backoff, 5min timeout per attempt).
- `runIngestion` from `_shared/logging.ts` — writes to `ingestion_logs` table.
- Each metric logs resolved/rejected individually.

---

## Deliverables

1. `supabase/functions/ingest-india-macro-weekly/index.ts`
2. `supabase/migrations/20260608000000_india_macro_weekly_cron.sql`
