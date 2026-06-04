# Global Import Data Automation — Design Spec
**Date:** 2026-06-05  
**Scope:** Populate `import_value_usd` in `trade_global_aggregates` for all 17 reporter countries via UN Comtrade, scheduled weekly.

---

## Problem

`trade_global_aggregates.import_value_usd` is populated for only **IND** and **USA** (97 rows each). All other 15 countries have `NULL` — so `GlobalImportPulse` shows "Import data not yet available" when users select CHN, DEU, JPN, GBR, FRA, KOR, etc. on the `/trade` page.

The `vw_country_trade_imports` view filters on `import_value_usd > 0`, so any NULL country returns zero rows to the frontend.

---

## Solution

New Supabase edge function **`ingest-trade-imports`** that calls UN Comtrade with:
- `flowCode=M` (imports)
- `cmdCode=AG2` (HS2-level chapter aggregates — one call returns all 97 chapters)
- `period=2023,2024` (two years per reporter)

**34 API calls total** (17 reporters × 2 years). Each call returns ~97 rows (one per HS2 chapter). Results upserted into `trade_global_aggregates.import_value_usd`.

Scheduled weekly via pg_cron. Backfill fired immediately on migration apply.

---

## ISO3 → Comtrade M49 Reporter Code Map

| ISO3 | M49  | ISO3 | M49  |
|------|------|------|------|
| AUS  | 36   | ITA  | 381  |
| BRA  | 76   | JPN  | 392  |
| CAN  | 124  | KOR  | 410  |
| CHN  | 156  | MEX  | 484  |
| DEU  | 276  | NLD  | 528  |
| ESP  | 724  | SAU  | 682  |
| FRA  | 251  | TUR  | 792  |
| GBR  | 826  | USA  | 842  |
| IND  | 699  |      |      |

---

## New Files

### `supabase/functions/ingest-trade-imports/index.ts`

**Parameters (URL query string):**
- `reporterISO` — ISO3 code (e.g. `CHN`). If omitted, processes all 17 countries.
- `force` — `"true"` to re-ingest IND/USA even though they already have data.
- `year` — Override year (default: `2023,2024`).

**Logic:**

```
1. Build reporter list (all 17, or single from ?reporterISO)
2. If !force, skip reporters where import_value_usd is already populated
3. For each reporter:
   a. Map ISO3 → M49 code
   b. Call Comtrade: GET /data/v1/get/C/A/HS
        ?flowCode=M
        &cmdCode=AG2
        &reporterCode=<m49>
        &period=<year>
        &subscription-key=<COMTRADE_API_KEY>
   c. Parse records: { cmdCode (HS2, already zero-padded e.g. "01"), primaryValue (USD) }
   d. For each record: UPDATE trade_global_aggregates
        SET import_value_usd = primaryValue,
            fetched_at = now()
        WHERE reporter_iso3 = <iso3>
          AND hs_code = cmdCode   -- direct match, both are zero-padded 2-char strings
          AND year = <period>
   e. Log: { reporter, rows_updated, status }
   f. Sleep 200ms (rate limit)
4. Return: { success, summary: [...per-reporter status], total_rows_updated }
```

**Error handling:**
- Per-reporter try/catch — one country failing does not abort the batch
- Log to `ingestion_logs` table (`function_name`, `start_time`, `completed_at`, `status`) — one row per invocation with `status = 'success'` or `'partial_failure'`. Per-reporter errors logged to console only (table has no payload column).
- Return partial success with failed reporters listed in response

**Comtrade `cmdCode=AG2` note:**  
The AG2 aggregate returns 2-digit HS chapter codes (e.g. `"01"`, `"02"`, ... `"97"`). The `trade_global_aggregates.hs_code` column stores zero-padded 2-digit strings (`"01"`–`"97"`). Direct match — no transformation needed beyond `LPAD` safety.

**HS code matching:**  
Confirmed: `trade_global_aggregates.hs_code` stores zero-padded 2-digit strings (`"01"`–`"97"`). Comtrade `cmdCode=AG2` returns the same format. Direct string match — no transformation needed.

**Update vs. insert:**  
Existing rows have `import_value_usd = NULL`. The function uses `supabase.from('trade_global_aggregates').update({import_value_usd, fetched_at}).eq('reporter_iso3', ...).eq('hs_code', ...).eq('year', ...)` — targeting the unique constraint `UNIQUE (reporter_iso3, hs_code, year)`. Does **not** insert new rows; only fills the NULL column on existing export rows. Rows not returned by Comtrade (zero-trade chapters) are left NULL — the view already filters `import_value_usd > 0`.

---

### `supabase/migrations/20260605000000_schedule_trade_imports_cron.sql`

1. Unschedule any existing `ingest-trade-imports` cron (idempotent)
2. Schedule weekly: `0 7 * * 0` (Sunday 07:00 UTC, after existing Comtrade job at 06:00)
3. Fire immediate one-time backfill via `SELECT net.http_post(...)` for all 17 countries
4. Log the immediate trigger to `ingestion_logs`

---

## No Frontend Changes Required

`GlobalImportPulse` → `useGlobalImports` → `vw_country_trade_imports` → `trade_global_aggregates`

Once `import_value_usd` is populated, the existing view and hook return data automatically. The "Refresh" button in `GlobalImportPulse` already calls `ingest-trade-global-pulse` — we do **not** change that call; the weekly cron handles freshness for most cases, and the manual refresh is for on-demand updates.

---

## No Schema Changes Required

`trade_global_aggregates` already has `import_value_usd NUMERIC`, `yoy_growth_pct NUMERIC`, `share_of_total_pct NUMERIC`, and `fetched_at TIMESTAMPTZ`. The view `vw_country_trade_imports` already computes YoY growth inline via self-join. No new columns or views needed.

---

## Cron Schedule Summary (post-migration)

| Job name | Schedule | Function |
|---|---|---|
| `ingest-un-comtrade-weekly` | Sun 06:00 UTC | `ingest-un-comtrade` (exports, semiconductors) |
| `ingest-trade-imports-weekly` | Sun 07:00 UTC | `ingest-trade-imports` (imports, all reporters) |
| `ingest-trade-intelligence-pulse` | Sun 05:00 UTC | `ingest-trade-global-pulse` |

---

## Success Criteria

- `SELECT reporter_iso3, COUNT(*) FROM trade_global_aggregates WHERE import_value_usd > 0 GROUP BY reporter_iso3` returns all 17 reporters with ≥ 90 rows each.
- `GlobalImportPulse` renders a populated chart for CHN, DEU, JPN, GBR, FRA, KOR without requiring a manual refresh.
- `FreshnessChip` shows `fresh` for all reporters immediately after backfill.
- Weekly cron re-runs without creating duplicate rows (upsert is idempotent).
