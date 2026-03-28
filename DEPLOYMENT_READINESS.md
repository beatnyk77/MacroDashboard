# Deployment Readiness Checklist
**Target:** Production Stabilization for Institutional Sale
**Date:** 2026-03-28

---

## Changes Requiring Deployment

### 1. Finnhub Ingestion (Critical)
**File:** `supabase/functions/ingest-macro-events/index.ts`
**Action:** Deploy to Supabase Edge Functions
**Verify:** Runs daily at 8am UTC; check `ingestion_logs` for success
**Test:** Ensure `FINNHUB_API_KEY` valid; economic calendar shows real events (not all mocks)

---

### 2. IMF Ingestion (Critical)
**File:** `supabase/functions/ingest-imf/index.ts`
**Action:** Deploy to Supabase
**Added:** Fallback data for `EU_DEBT_GDP_PCT` (unblocks 5892-day gap)
**Verify:** Metric now has values for 2020-2024
```sql
SELECT * FROM metric_observations WHERE metric_id='EU_DEBT_GDP_PCT' ORDER BY as_of_date DESC LIMIT 5;
```

---

### 3. Eurostat Debt Ingestion (Optional but Recommended)
**File:** `supabase/functions/ingest-eurostat-debt/index.ts` (NEW)
**Action:** Deploy and schedule monthly `0 6 1 * *`
**Purpose:** More authoritative EU debt data than IMF fallback
**Consider:** If running, will overwrite fallback with real Eurostat values

---

### 4. PMI Metrics Metadata Fix
**File:** `supabase/migrations/20260328000001_add_fred_id_to_pmi_metrics.sql`
**Action:** Run migration in Supabase SQL editor
**Effect:** Adds `fred_id` to PMI_US_SERVICES (USSLIND) and PMI_US_MFG (MANEMP)
**Verify:** `SELECT metadata FROM metrics WHERE id IN ('PMI_US_SERVICES','PMI_US_MFG');` shows fred_id
**Deploy:** After migration, `ingest-fred` will automatically fetch these (previously stale 2209 days)

---

### 5. Metric Definitions (Already applied)
- `TED_SPREAD` deprecated in metrics seed (use SOFR_OIS)
- `SOFR_OIS_SPREAD` added (already ingested by ingest-fred)
- View `vw_offshore_dollar_stress` updated to use SOFR_OIS

No action needed if migrations already run in dev. For production, ensure migrations are applied.

---

### 6. Frontend Code Changes
**Files:**
- `src/features/dashboard/components/sections/OffshoreDollarStressCard.tsx`
- `src/hooks/useInstitutionalFeatures.ts`
- `src/features/dashboard/components/sections/SovereignRiskMatrix.tsx`
- `src/features/dashboard/components/sections/TodaysBriefPanel.tsx`

**Action:** Rebuild and redeploy frontend (Vercel/Netlify)
**Verify:** Build succeeds with 0 lint errors (run `npm run lint` locally first)

---

## Post-Deployment Verification

### 1. Check Ingestion Health
```sql
-- Recent ingestion logs (last 24h)
SELECT function_name, status, COUNT(*) as count
FROM ingestion_logs
WHERE start_time >= NOW() - INTERVAL '24 hours'
GROUP BY function_name, status
ORDER BY count DESC;
```
**Expect:** Mostly `success`, no repeated `failed`

---

### 2. Check Data Freshness (Top 20 Terminal Metrics)
Create a query to list latest observation dates for key metrics:

```sql
WITH key_metrics AS (
  SELECT UNNEST(ARRAY[
    'NET_LIQUIDITY', 'SOFR_OIS_SPREAD', 'EU_DEBT_GDP_PCT',
    'PMI_US_SERVICES', 'GOLD_PRICE_USD', 'MOVE_INDEX',
    'US_CREDIT_TOTAL', 'IN_CREDIT_TOTAL', 'OIL_REFINERY_UTILIZATION_US',
    'OIL_SPR_LEVEL_US'
  ]) as metric_id
)
SELECT
  m.id,
  m.name,
  MAX(o.as_of_date) as latest_date,
  CASE WHEN MAX(o.as_of_date) >= CURRENT_DATE - INTERVAL '7 days' THEN 'FRESH' ELSE 'STALE' END as status
FROM metrics m
LEFT JOIN metric_observations o ON m.id = o.metric_id
WHERE m.id IN (SELECT metric_id FROM key_metrics)
GROUP BY m.id, m.name
ORDER BY latest_date DESC;
```

**Expect:** All `FRESH` (within 7 days)

---

### 3. DataHealthBanner
- Load terminal homepage
- Should **not** show "Data Sync Delayed" banner (or show minimal)
- If banner appears, click "Details" to see which feeds are stale

---

### 4. Terminal Component Spot Checks
- **Global Liquidity Monitor** renders
- **Offshore Dollar Stress** shows value (not "-"), colored appropriately
- **Sovereign Risk Matrix** expandable, tooltips work
- **Todays Brief** headlines show readable text (no tiny fonts)
- **Weekly Narrative** loads

---

### 5. Cron Schedule Verification
```sql
SELECT jobname, schedule, command FROM cron.job;
```
**Expect:** See all expected ingestions with correct schedules (see MAINTENANCE.md)

If `ingest-eurostat-debt` missing, add:
```sql
SELECT cron.schedule(
  'ingest-eurostat-debt',
  '0 6 1 * *',
  'curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/ingest-eurostat-debt -H "Authorization: Bearer YOUR_ANON_KEY"'
);
```

---

## Rollback Plan

If any deployment causes issues:

1. **Edge Functions:** In Supabase dashboard, go to Edge Functions → select function → "Delete" → redeploy previous version from git
2. **Database migrations:** `DROP Migration IF EXISTS <migration_name>;` (only if not in production with data)
3. **Frontend:** Redeploy previous git commit

---

## Notes for Production

- **Secrets Management:** Ensure all API keys are stored in Supabase Secrets (not in code):
  - `FINNHUB_API_KEY`
  - `FRED_API_KEY`
  - `EIA_API_KEY`
  - `RESEND_API_KEY` (for newsletter)
- **Monitoring:** Set up Sentry or Logflare for error aggregation
- **Alerting:** Configure webhook for `ingestion_logs` failures → Slack/Discord
- **Backups:** Consider daily logical backups of `metric_observations` table (large)

---

## Institutional Saleability: Remaining Gaps

After this deployment, re-audit. Still likely needed:

1. **PMI_US_SERVICES freshness:** Verify ingest-fred actually fetches USSLIND. If not, debug why.
2. **BR_DEBT_GDP_PCT / TR_DEBT_GDP_PCT:** If these appear in terminal, need to create similar fallbacks or real integrations.
3. **Global Refining Utilization:** Currently simulated; consider hiding if showing misleading data.
4. **Mobile responsiveness:** Test at 375px width; fix any broken layouts.
5. **Full typography sweep:** Reduce overall use of tiny fonts for consistency.

---

**Deploy order recommended:**
1. Database migration (PMI FRED IDs)
2. Edge Functions (ingest-macro-events, ingest-imf, optionally ingest-eurostat-debt)
3. Frontend rebuild
4. Verify via SQL and terminal UI

---

**Once these steps are complete, the platform should achieve:**
- ✅ 0 critical data gaps in visible terminal
- ✅ 0 lint errors
- ✅ WCAG-compliant typography
- ✅ Modernized liquidity metrics (SOFR-OIS)
- ✅ Resilient ingestion with fallbacks and alerts

**Next phase:** P1-P2 polish (mobile, component organization, labs consolidation)
