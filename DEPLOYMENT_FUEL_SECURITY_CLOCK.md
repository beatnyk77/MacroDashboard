# Fuel Security Clock – India: Deployment Guide

**Status**: Ready for Production Deployment
**Date**: 2026-03-31
**Components**: Database tables, Edge Function, Cron job, Frontend UI

---

## Prerequisites

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Authenticated: `supabase login`
- [ ] Project access: `supabase projects list` shows your project
- [ ] Service role key available (from Supabase Dashboard → Project Settings → API)

---

## Step 1: Apply Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"

# Push all migrations in supabase/migrations/ directory
supabase db push
```

This will execute:
- `20260331000000_fuel_security_clock_india.sql` – Main table + metrics
- `20260331000001_geopolitical_risk_fuel.sql` – Events table + views
- `20260331000002_fuel_security_cron.sql` – Cron schedule

### Option B: Manual SQL (Supabase Dashboard)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of the three migration files above into the editor
3. Run the query

**Verify**:
```sql
SELECT tablename FROM pg_tables
WHERE tablename IN ('fuel_security_clock_india', 'geopolitical_risk_events');
-- Should return 2 rows
```

---

## Step 2: Deploy Edge Function

```bash
# From project root
supabase functions deploy ingest-fuel-security-india --no-verify-jwt
```

**Expected output**:
```
✓ Deployed ingest-fuel-security-india
Function URL: https://<project-ref>.functions.supabase.co/ingest-fuel-security-india
```

**Verify**: In Supabase Dashboard → Edge Functions → `ingest-fuel-security-india` should exist.

---

## Step 3: Configure Application Settings (Required for Cron)

The cron job uses these settings to authenticate to the edge function endpoint.

### Via Dashboard

1. Go to **Database** → **Settings** → **Application Settings**
2. Add/update these keys:

| Key | Value |
|-----|-------|
| `app.edge_function_url` | `https://<your-project>.functions.supabase.co` |
| `app.service_role_key` | `<your service role key>` |

### Via SQL (if you have superuser access)

```sql
SELECT set_config('app.edge_function_url', 'https://<your-project>.functions.supabase.co', false);
SELECT set_config('app.service_role_key', '<your_service_role_key>', false);
```

**Get service role key**: Dashboard → Project Settings → API → `service_role` key (reveal it).

---

## Step 4: Verify Cron Job Exists

```sql
SELECT
  jobid,
  schedule,
  command
FROM cron.job
WHERE command LIKE '%ingest-fuel-security-india%';
```

**Expected**:
- Job name: `ingest-fuel-security-india-daily`
- Schedule: `0 2 * * *` (daily at 02:00 UTC)

If missing after migrations, manually run the cron migration SQL again.

---

## Step 5: Trigger Initial Ingestion

Before waiting for the next cron run (02:00 UTC), manually trigger:

```bash
curl -X POST https://<your-project>.functions.supabase.co/ingest-fuel-security-india \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Expected response**:
```json
{
  "success": true,
  "processed": 1,
  "metadata": { "as_of_date": "2026-03-31" }
}
```

---

## Step 6: Verify Data Inserted

```sql
-- Check if row exists
SELECT
  as_of_date,
  reserves_days_coverage,
  daily_consumption_mbpd,
  active_tankers_count,
  geopolitical_risk_score,
  last_updated_at
FROM fuel_security_clock_india
ORDER BY as_of_date DESC
LIMIT 1;
```

**Expected**: Non-null values for core metrics.

If `reserves_days_coverage` is null or 0, check ingestion logs:
- Supabase Dashboard → Edge Functions → `ingest-fuel-security-india` → Logs

---

## Step 7: Test Frontend

1. Open your app: `https://<your-app>.vercel.app/macro-observatory`
2. Navigate to **Energy & Commodities Lab**
3. Scroll to **"Fuel Security Clock – India"** section

**Expected behaviors**:
- ✅ Section renders with countdown clock, tanker table, projections
- ✅ Data quality badge shows **"Live"** (green) if ingestion succeeded with real PPAC data
- ⚠️ Data quality badge shows **"Simulated"** (amber) if using placeholder PPAC values (this is expected until real PPAC integration is done)
- ❌ Error boundary with "Latency Breakdown" → DB table missing or no data (go back to Step 1)

---

## Step 8: Monitor Health

### Data Freshness Check

```sql
SELECT
  NOW() - last_updated_at AS age,
  reserves_days_coverage IS NULL AS missing_core
FROM fuel_security_clock_india
ORDER BY as_of_date DESC
LIMIT 1;
```

If `age > 24 hours`, cron may have failed. Check cron logs.

### Cron Job Logs

```sql
SELECT * FROM cron.job_run
WHERE jobid = (SELECT jobid FROM cron.job WHERE command LIKE '%ingest-fuel-security-india%')
ORDER BY start_time DESC
LIMIT 5;
```

---

## Troubleshooting

### Error: `relation "fuel_security_clock_india" does not exist`
**Fix**: Migrations not applied. Run Step 1.

### Edge Function returns 401/403
**Fix**: `app.service_role_key` not set or incorrect. Re-check Step 3.

### No rows in table after manual trigger
**Fix**: Check function logs in Supabase Dashboard → Edge Functions → Logs. Likely missing EIA_API_KEY or FRED_API_KEY in function secrets.

**Set secrets** (if missing):
```bash
supabase secrets set EIA_API_KEY=your_eia_key
supabase secrets set FRED_API_KEY=your_fred_key
```

### Tanker pipeline shows zeros or empty
**Fix**: Expected until real import data exists in `oil_imports_by_origin`. Ensure that table has India data (query: `SELECT COUNT(*) FROM oil_imports_by_origin WHERE importer_country_code = 'IN'`). If count = 0, run `ingest-oil-india-china` function first.

### Geopolitical risk score stuck at 50
**Fix**: Populate `geopolitical_risk_events` table with real OSINT data. For testing, insert sample events:
```sql
INSERT INTO geopolitical_risk_events (as_of_date, chokepoint, event_title, severity, source_type, event_type)
VALUES
  (CURRENT_DATE - 2, 'Hormuz', 'Naval exercise', 6, 'news', 'exercise'),
  (CURRENT_DATE - 1, 'Red Sea', 'Shipping disruption', 7, 'news', 'attack');
```

---

## Rollback

If issues arise:

1. **Disable cron** (temporarily):
   ```sql
   SELECT cron.unschedule('ingest-fuel-security-india-daily');
   ```

2. **Remove table** (if needed to re-migrate):
   ```sql
   DROP TABLE IF EXISTS fuel_security_clock_india CASCADE;
   DROP TABLE IF EXISTS geopolitical_risk_events CASCADE;
   ```

3. **Redeploy** from scratch.

---

## Next Steps (Post-Deployment)

- [ ] **PPAC Integration**: Replace placeholder values in `ingest-fuel-security-india/index.ts` with actual scraping/API calls to `https://ppac.gov.in`
- [ ] **AIS Data**: Upgrade tanker pipeline from heuristic to real AIS (integrate MarineTraffic/Spire API)
- [ ] **OSINT Feed**: Automate `geopolitical_risk_events` population via RSS/API feed
- [ ] **Alerting**: Configure Slack alerts for ingestion failures (add `_shared/slack.ts` calls)
- [ ] **Monitoring**: Add Grafana dashboard for `fuel_security_clock_india` freshness

---

## Contact

For issues or clarifications, reference this document and the spec:
`docs/superpowers/specs/2026-03-31-fuel-security-clock-india-design.md`
