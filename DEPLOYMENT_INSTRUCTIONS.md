# RBI Money Market: Deployment Steps

## ✅ Automated via CI/CD
- [x] Edge function code pushed to `supabase/functions/ingest-rbi-money-market/`
- [x] GitHub Actions workflow will deploy function automatically on push to main
- [x] Cron job definition already present in repo migrations

## ⚠️ Manual Steps Required

### 1. Apply Database Migration
The migration adds `msf_rate` and `sdf_rate` columns to `rbi_liquidity_ops`.

**Option A: Supabase Dashboard (SQL Editor)**
```sql
-- Run in Supabase Dashboard > SQL Editor
ALTER TABLE public.rbi_liquidity_ops
ADD COLUMN IF NOT EXISTS msf_rate numeric,
ADD COLUMN IF NOT EXISTS sdf_rate numeric;
```

**Option B: Supabase CLI**
```bash
supabase db push
```
(Only if you have the migration file in `supabase/migrations/` locally)

### 2. Verify Cron Job Settings (pg_cron)
The cron job uses these database settings:
- `app.edge_function_url` (e.g., `https://your-project.functions.supabase.co`)
- `app.service_role_key` (the service role API key)

In **Supabase Dashboard** > **Database** > **Settings** > **Application Settings**, set:

| Key | Value |
|-----|-------|
| `app.edge_function_url` | `https://<your-project>.functions.supabase.co` |
| `app.service_role_key` | `<your service_role key>` |

Alternatively, set via SQL (needs superuser):
```sql
SELECT set_config('app.edge_function_url', 'https://your-project.functions.supabase.co', false);
SELECT set_config('app.service_role_key', 'your_service_role_key', false);
```

To verify the cron job exists:
```sql
SELECT * FROM cron.job WHERE command LIKE '%ingest-rbi-money-market%';
```

### 3. Run Migration and Deploy Edge Function
If not using GitHub Actions auto-deploy, manually deploy:
```bash
supabase functions deploy ingest-rbi-money-market --no-verify-jwt
```

### 4. Test Ingestion
```bash
# Using the provided script (set env vars first)
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
./scripts/verify-deployment.sh
```

Or manually trigger:
```bash
curl -X POST https://your-project.functions.supabase.co/ingest-rbi-money-market \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### 5. Verify Data in Dashboard
- **Data Health Dashboard** (`/data-health`) should show recent dates for:
  - `rbi_money_market_ops`
  - `rbi_liquidity_ops`
- **RBI Money Market Monitor** section should display:
  - Non-zero volumes in Segment Allocation (Call Money, Triparty, Market Repo)
  - Real interest rates (SDF, MSF, WACR) from the data source
  - Interest Rate Corridor chart with full historical series

## 🐛 Troubleshooting

### Cron job not running
- Check `cron.job` table
- Ensure `pg_cron` extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- Verify settings `app.edge_function_url` and `app.service_role_key` are set

### Edge function errors
- Check **Supabase Dashboard** > **Functions** > `ingest-rbi-money-market` > **Logs**
- PDF parsing may fail if RBI structure changes; check logs for "PDF extraction failed"
- HTML parsing fallback may yield zeros if overnight segment data not in page

### Frontend shows zeros or dashes
- Data may not have been ingested yet; wait for cron or trigger manually
- Confirm `rbi_money_market_ops` has rows with `call_money_vol > 0`
- Verify network tab for failed API calls to `metric_observations` (policy rate)

## 📝 Notes
- The ingestion now parses the linked PDF to get actual overnight segment volumes/rates, as the HTML page shows `0.00` for those columns.
- Policy Repo Rate is fetched from `metric_observations` table (ingested by `ingest-major-economies`). Ensure that function runs daily to keep the rate fresh.
- The Interest Rate Corridor chart now shows the full historical series (up to 1000 days) instead of 30 days.
