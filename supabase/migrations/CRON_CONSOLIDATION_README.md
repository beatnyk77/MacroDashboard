# Cron Job Consolidation - Master Migration

**Created**: 2026-04-08  
**Migration**: `20260408000000_cron_jobs_consolidated.sql`  
**Purpose**: Centralize and standardize all cron job scheduling

---

## Problem Addressed

The codebase had **30+ cron-related migrations** with:
- Hardcoded secrets (security risk)
- Duplicate/conflicting schedules
- Missing timeouts (risk of function timeouts)
- Inconsistent authentication patterns
- No idempotency (causing duplicates)

---

## Solution

Single unified migration that:
1. **Unschedules all existing jobs** first (ensures clean state)
2. **Uses vault-based authentication** consistently:
   ```sql
   'Authorization', 'Bearer ' || COALESCE(
       (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
       (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY' LIMIT 1)
   )
   ```
3. **Sets 55-second timeout** on all jobs (within Supabase 60s limit)
4. **Idempotent scheduling** - `schedule_standard_cron()` unschedules before scheduling
5. **Documents all jobs** with comments by category

---

## Deprecated Migrations

The following migrations have been **superseded** by the master cron migration:

### Early Migrations (Placeholder Auth)
- `007_cofer_cron.sql` - Contains `'YOUR_SERVICE_ROLE_KEY'` placeholder
- `012_brics_cron.sql` - Inconsistent auth pattern
- `20260128000001_cron_schedule.sql` - Hardcoded project ref and placeholder token
- `20260129000001_tic_foreign_holders.sql` - Auth issues
- `20260130000005_upi_autopay_cron.sql` - Auth issues
- `20260131000002_precious_divergence_cron.sql` - Auth issues

### Auth Standardization Attempts (Now Superseded)
- `20260203000002_ecb_cron.sql`
- `20260204000001_fix_cron_jobs.sql`
- `20260204000002_create_missing_crons.sql`
- `20260208000001_institutional_loans_cron.sql`
- `20260210000001_energy_cron.sql`
- `20260214000003_nse_ingest_cron.sql`
- `20260215000003_us_treasury_auctions_cron.sql`
- `20260215000005_us_fiscal_stress_cron.sql`
- `20260215000007_india_fiscal_stress_cron.sql`
- `20260215000009_cb_gold_net_cron.sql`
- `20260216195501_standardize_cron_auth_v2.sql`
- `20260217000000_india_market_pulse_cron.sql`
- `20260301000001_fix_india_crons.sql`
- `20260330000001_corporate_debt_cron.sql`
- `20260404000000_add_energy_commodities_cron.sql`

**Note**: These migrations should **NOT** be applied to new databases. They either:
- Created duplicate jobs
- Used inconsistent auth
- Hardcoded secrets (security vulnerability)

---

## Current Schedule (All Times UTC)

| Job Name | Schedule | Function | Purpose |
|----------|----------|----------|---------|
| `ingest-fred-daily` | 0 6 * * * | ingest-fred | FRED economic data |
| `ingest-fiscaldata-daily` | 30 6 * * * | ingest-fiscaldata | US Treasury debt |
| `ingest-nyfed-markets-daily` | 0 12 * * * | ingest-nyfed-markets | Money markets |
| `ingest-market-pulse-daily` | 0 1 * * * | ingest-market-pulse | Global macro pulse |
| `ingest-nse-flows-daily` | 30 13 * * 1-5 | ingest-nse-flows | India FII/DII flows |
| ... and ~40 more (see migration file) |

---

## Required Vault Secrets

Before applying this migration, ensure these secrets exist in Supabase Vault:

| Secret Name | Purpose |
|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Primary service role key (preferred) |
| `SERVICE_ROLE_KEY` | Fallback (maintains compatibility) |
| `RESEND_API_KEY` | Health alerts (check-data-health function) |
| `FRED_API_KEY` | FRED economic data |
| Various API keys | Alpha Vantage, Finnhub, EIA, etc. |

---

## Deployment Instructions

1. **Verify Vault Secrets** (SQL Editor):
   ```sql
   SELECT name FROM vault.decrypted_secrets;
   ```
   Ensure at least `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY` exists.

2. **Apply the Master Migration**:
   ```bash
   supabase db push
   # OR manually in SQL Editor:
   \i supabase/migrations/20260408000000_cron_jobs_consolidated.sql
   ```

3. **Verify Cron Jobs**:
   ```sql
   -- List all jobs
   SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname;
   
   -- Check status
   SELECT * FROM public.vw_cron_job_status 
   WHERE last_run_status = 'failed' 
   ORDER BY last_run_at DESC;
   
   -- Count active jobs
   SELECT COUNT(*) FROM cron.job WHERE active = true;
   ```

4. **Test Critical Jobs Manually** (optional):
   ```sql
   -- Trigger a job immediately
   SELECT cron.trigger('ingest-fred-daily');
   ```

5. **Monitor Health**:
   - Check `check-data-health` endpoint daily
   - Review Resend email alerts
   - Monitor `vw_data_staleness_monitor` for fresh data

---

## Rollback Plan

If issues arise:

1. **Disable all jobs**:
   ```sql
   UPDATE cron.job SET active = false;
   ```

2. **Restore from backup** (if taken before migration):
   ```bash
   supabase db restore
   ```

3. **Or unschedule all and revert to individual migrations**:
   ```sql
   DO $$ 
   DECLARE r RECORD; 
   BEGIN 
     FOR r IN SELECT jobname FROM cron.job LOOP 
       PERFORM cron.unschedule(r.jobname); 
     END LOOP; 
   END $$;
   ```

---

## Maintenance

### Monthly Checklist
- [ ] Verify all cron jobs ran successfully (check `cron.job_run_details`)
- [ ] Review `ingestion_logs` for failures
- [ ] Check data freshness in `vw_data_staleness_monitor`
- [ ] Rotate `SERVICE_ROLE_KEY` if any hardcoded tokens found in Git history
- [ ] Monitor Resend email quota for health alerts

### Quarterly
- Review and optimize schedules based on API rate limits
- Audit vault secrets and rotate keys
- Clean up old migration files (after confirming production stability)

---

## Security Notes

⚠️ **CRITICAL**: If any hardcoded secrets were ever committed to Git:
1. Rotate the compromised API keys immediately
2. Update vault secrets with new keys
3. Verify no old tokens exist in migration files (search for `Bearer eyJ`)

All cron jobs now use `vault.decrypted_secrets` for auth - **NO** hardcoded tokens.

---

## Support

For questions or issues:
- Check `vw_cron_job_status` for job health
- Review `ingestion_logs` for detailed error messages
- Examine Edge Function logs in Supabase Dashboard → Functions
