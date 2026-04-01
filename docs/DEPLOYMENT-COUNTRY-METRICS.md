# Deployment Guide: Country Metrics Programmatic Pages

This guide walks through deploying the `country_metrics` feature to production, including database migrations, Edge Function deployment, cron setup, and validation.

---

## Prerequisites

- Supabase CLI installed and authenticated (`supabase login`)
- Access to the target Supabase project (admin role)
- Local environment variables configured:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VITE_SUPABASE_URL` (for frontend)
  - `VITE_SUPABASE_ANON_KEY` (for frontend)

---

## Step 1: Deploy Database Migration

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"

# Push migration to production
supabase db push
```

This will:
- Create `public.country_metrics` table
- Apply primary key constraint on `(iso, metric_key)`
- Add table comments

**Verify migration**:
```bash
# Connect to database and verify table
supabase db remote sql "
  SELECT tablename, column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'country_metrics'
  ORDER BY ordinal_position;
"
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database → Migrations**
3. Click **New migration**
4. Copy contents of `supabase/migrations/20260402000000_create_country_metrics.sql`
5. Name: `20260402000000_create_country_metrics.sql`
6. Click **Save & Deploy**

---

## Step 2: Deploy Edge Function

### Verify `deno.json` Exists

Ensure `supabase/functions/ingest-country-metrics/deno.json` exists with:

```json
{
  "tasks": {
    "start": "deno run --allow-all index.ts"
  },
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.39.3",
    "@shared/": "../_shared/"
  }
}
```

### Deploy via CLI

```bash
# Deploy the function
supabase functions deploy ingest-country-metrics --no-verify-jwt

# Set environment variables (if not already in .env)
supabase secrets set SUPABASE_URL=$SUPABASE_URL --project-ref <your-project-ref>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY --project-ref <your-project-ref>

# View logs after deployment
supabase functions logs ingest-country-metrics
```

**Note**: `--no-verify-jwt` is needed because the function uses its own service role key, not the caller's JWT.

### Deploy via Dashboard

1. Go to **Edge Functions** in Supabase dashboard
2. Click **New function**
3. Name: `ingest-country-metrics`
4. Upload: Zip the `supabase/functions/ingest-country-metrics/` folder (include `deno.json`, `index.ts`, and any imports)
5. Set **JWT verification**: OFF (since it uses service role)
6. Add **Secrets**:
   - `SUPABASE_URL` (your project URL)
   - `SUPABASE_SERVICE_ROLE_KEY` (from project settings → API)
7. Click **Create**

---

## Step 3: Setup Cron Job

### Option A: CLI (Recommended)

Create and deploy the cron migration:

```bash
# The migration file is already at:
# supabase/migrations/20260402000001_country_metrics_cron.sql

# Push it
supabase db push
```

This will:
- Schedule `ingest-country-metrics-daily` to run daily at 3 AM UTC
- Uses `net.http_post` to trigger the Edge Function

**Verify cron schedule**:
```bash
supabase db remote sql "
  SELECT *
  FROM cron.job
  WHERE jobname = 'ingest-country-metrics-daily';
"
```

### Option B: Manual SQL in Dashboard

1. Go to **Database → SQL Editor**
2. Run this SQL:

```sql
SELECT cron.schedule(
  'ingest-country-metrics-daily',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      'https://your-project.functions.supabase.co/ingest-country-metrics',
      '{}',
      '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
    )
  $$
);
```

Replace:
- `your-project.functions.supabase.co` with your actual Edge Function URL
- `YOUR_SERVICE_ROLE_KEY` with your service role key (or use Supabase secrets)

---

## Step 4: Manual Test Run (Before Waiting for Cron)

Trigger the function manually to seed initial data:

```bash
# Using Supabase CLI
supabase functions invoke ingest-country-metrics

# Or via cURL
curl -X POST https://your-project.functions.supabase.co/ingest-country-metrics \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Check logs immediately**:
```bash
supabase functions logs ingest-country-metrics --limit 100
```

### Validate Data Insertion

```bash
# Check row count
supabase db remote sql "
  SELECT COUNT(*) FROM country_metrics;
"

# Expected: ~1,320 rows (40 countries × 33 metrics)

# Check for specific country
supabase db remote sql "
  SELECT metric_key, value, as_of, confidence
  FROM country_metrics
  WHERE iso = 'US'
  ORDER BY metric_key;
"
```

---

## Step 5: Deploy Frontend Changes

### Build & Deploy Frontend

```bash
# Install dependencies
npm ci

# Build the app
npm run build

# Preview locally (optional)
npm run preview

# Deploy to Vercel / your hosting
vercel --prod
```

### Required Frontend Files

Make sure these files exist and are committed:

1. **`src/lib/macro-metrics.ts`** — Shared constant with 33 metric keys
2. **`src/pages/countries/[iso]/page.tsx`** — Dynamic country page (if using App Router) or route file
3. **`src/App.tsx`** — Add route: `<Route path="/countries/:iso" element={<CountryProfilePage />} />`
4. **`src/pages/CountryProfilePage.tsx`** (for Pages Router) or `src/pages/countries/[iso]/page.tsx` (for App Router)

**Verify routing pattern**: The codebase uses Pages Router (`src/pages/`). Ensure you create:
- `src/pages/countries/[iso]/page.tsx` (if using App Router with Next.js 13+)
- OR `src/pages/countries/[iso].tsx` (if using Pages Router)

Check existing pages like `src/pages/GlossaryTermPage.tsx` to confirm pattern.

---

## Step 6: Validate SEO & Structured Data

1. Visit a country page in production: `https://yourdomain.com/countries/USA`
2. **View source** and verify:
   - JSON-LD script with `Country` or `Dataset` schema present
   - Canonical URL correct
   - Open Graph tags present
3. Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
4. Check SEO:
   - Title: `USA — Country Economic Profile | GraphiQuestor`
   - Meta description: Auto-generated
   - Keywords: appropriate

---

## Step 7: Monitor & Troubleshoot

### Monitor Data Freshness

```sql
-- Check latest update timestamps
SELECT 
  iso,
  COUNT(*) as metric_count,
  MAX(last_cron) as latest_update,
  MIN(last_cron) as oldest_update
FROM country_metrics
GROUP BY iso
ORDER BY latest_update DESC;
```

### Check Ingestion Logs

```bash
# CLI
supabase functions logs ingest-country-metrics --limit 50

# Or query database
SELECT *
FROM ingestion_logs
WHERE function_name = 'ingest-country-metrics'
ORDER BY start_time DESC
LIMIT 10;
```

### Common Issues

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Function deployment fails with "Relative import path not prefixed" | Missing `deno.json` | Add `deno.json` to function folder |
| 0 rows inserted | Countries list empty or API failures | Check logs; verify `COUNTRIES` array; test API endpoints |
| Table not found | Migration not applied | Run `supabase db push` again |
| Stale data | Cron not running or failed | Check cron job: `SELECT * FROM cron.job;`<br>Manually invoke to test |
| Page 404 | Frontend route not configured | Add Route to `App.tsx` and rebuild |
| No JSON-LD | SEOManager not rendering | Check `CountryProfilePage` includes `<SEOManager>` |

---

## Step 8: Production Checklist

- [ ] Database migration applied successfully
- [ ] Edge Function deployed without errors
- [ ] Cron job scheduled (runs daily 3 AM UTC)
- [ ] Manual test run inserts ~1,320 rows
- [ ] All 40 countries have at least 25/33 metrics populated
- [ ] Frontend route `/countries/:iso` works
- [ ] SEO metadata renders on page
- [ ] JSON-LD validates with Google Rich Results Test
- [ ] `revalidate` set to 3600 (1 hour ISR)
- [ ] Monitoring alerts set for ingestion failures
- [ ] `pg_stat_statements` shows low DB read load (< 1 query/sec)

---

## Rollback Procedure

If something goes wrong:

### Disable Cron (Stop Ingestion)
```sql
SELECT cron.unschedule('ingest-country-metrics-daily');
```

### Delete Data (if needed)
```sql
TRUNCATE TABLE country_metrics;
```

### Remove Function
```bash
supabase functions delete ingest-country-metrics
```

### Revert Migration
```bash
# Requires a new migration to drop the table
supabase migration new revert_country_metrics

# In the new migration file:
-- DROP TABLE IF EXISTS public.country_metrics;
-- (Also drop any RLS policies if created)

supabase db push
```

---

## Post-Deployment Monitoring (Weekly)

1. **Check cron health**: Verify last 7 runs successful
   ```sql
   SELECT * FROM ingestion_logs
   WHERE function_name = 'ingest-country-metrics'
     AND start_time > NOW() - INTERVAL '7 days'
   ORDER BY start_time DESC;
   ```

2. **Check stale data**: Any metrics older than 30 days?
   ```sql
   SELECT COUNT(*) FROM country_metrics
   WHERE as_of < CURRENT_DATE - INTERVAL '30 days';
   ```

3. **Review API quotas**: Ensure IMF/BIS/FRED calls within rate limits

4. **Monitor DB size**: Should stay at 1,320 rows (± small buffer)

---

## Expansion Path (Future)

To add more countries without code changes:

1. Create config table:
   ```sql
   CREATE TABLE IF NOT EXISTS data_sources.country_scope (
     iso TEXT PRIMARY KEY,
     is_active BOOLEAN DEFAULT true,
     added_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Insert new countries into `country_scope`
3. Update Edge Function to read active countries from this table instead of hardcoded `COUNTRIES`
4. Redeploy function

---

## Contact & Support

- **Infra questions**: Check `docs/architecture.md` and `docs/MAINTENANCE.md`
- **Data source issues**: Review `supabase/functions/ingest-*/` patterns
- **Supabase limits**: https://supabase.com/docs/guides/database/quotas
