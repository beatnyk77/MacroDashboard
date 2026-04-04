# GraphiQuestor Deployment Guide

**Last Updated**: April 2026  
**Environment**: Production (Vercel + Supabase)  
**CI/CD**: GitHub Actions

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Flow](#deployment-flow)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Backend Deployment (Supabase)](#backend-deployment-supabase)
6. [Edge Functions Deployment](#edge-functions-deployment)
7. [Verification Checklist](#verification-checklist)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)
10. [Post-Deployment](#post-deployment)

---

## Overview

GraphiQuestor uses a **split deployment architecture**:

| Component | Platform | Trigger | Artifacts |
|-----------|----------|---------|-----------|
| Frontend (Next.js) | Vercel | Git push to `main` | Auto-deploy via Vercel Git integration |
| Database Schema | Supabase | Git push to `main` | SQL migrations in `supabase/migrations/` |
| Edge Functions | Supabase | Git push to `main` | Deno functions in `supabase/functions/` |
| Cron Jobs | Supabase | Migration deployment | `pg_cron` schedules defined in SQL |

**Deployment Philosophy**:
- All deployments are **automatic** via GitHub Actions
- Manual deployments only for emergency hotfixes
- Zero-downtime migrations (all changes are additive or safely idempotent)
- Full observability via Discord alerts and ingestion logs

---

## Prerequisites

### Required Access

- **GitHub**: Admin access to `MacroDashboard` repository
- **Vercel**: Owner/Admin access to GraphiQuestor project
- **Supabase**: Project owner access (`debdriyzfcwvgrhzzzre`)
- **Cloudflare**: DNS management (custom domain `graphiquestor.com`)
- **Discord**: Access to `#deployments` and `#ingestion-alerts` channels

### Local Tools

```bash
# Required CLI tools
node --version  # v18+ (recommended: v20)
npm --version
git --version
supabase --version  # v2.75+ (update to latest)

# Optional: Supabase CLI login (for local testing)
supabase login
```

### Environment Variables

Ensure these are set in your local shell (for manual testing):

```bash
# Supabase
export SUPABASE_URL="https://debdriyzfcwvgrhzzzre.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_ANON_KEY="your-anon-key"

# Third-party APIs (required by some Edge Functions)
export FRED_API_KEY="your-fred-api-key"
export ALPHA_VANTAGE_KEY="your-alpha-vantage-key"
export FINNHUB_KEY="your-finnhub-key"

# Discord Alerts (if testing webhooks)
export DISCORD_WEBHOOK_URL="your-webhook-url"
```

**Never commit `.env` files**. Use GitHub Secrets for CI/CD (already configured).

---

## Deployment Flow

### Standard Deployment (Automatic)

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the [Project Standards](CLAUDE.md):
   - Frontend components in `src/`
   - Backend logic in `supabase/functions/`
   - Database changes in `supabase/migrations/` (always additive, never destructive)
   - Update documentation in `docs/`

3. **Test locally**:
   ```bash
   # Frontend
   npm run dev
   npm run lint
   npm run test

   # Edge Functions (if modified)
   supabase functions serve ingest-us-macro

   # Migrations (dry-run)
   supabase migration list
   ```

4. **Commit with conventional commit message**:
   ```bash
   git add .
   git commit -m "feat: add new macro stress indicator with real-time telemetry"
   # or
   git commit -m "fix: resolve blank data in sovereign debt maturity wall"
   ```

5. **Push and create Pull Request**:
   ```bash
   git push -u origin feat/your-feature-name
   # Open PR on GitHub with detailed description
   ```

6. **CI/CD Checks** (automatic):
   - ESLint + TypeScript type checking
   - Unit tests (`npm test`)
   - Build verification (`npm run build`)
   - Edge Functions type-check (Deno lint)
   - **Required**: 2 approvals from maintainers

7. **Merge to `main`** (squash and merge):
   - GitHub Actions automatically:
     1. Deploys frontend to Vercel (production)
     2. Applies SQL migrations to Supabase
     3. Deploys Edge Functions to Supabase
     4. Posts deployment status to Discord `#deployments`

8. **Verify** using the [Verification Checklist](#verification-checklist).

---

### Hotfix Deployment (Emergency)

For critical production bugs only:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix-$(date +%Y%m%d)

# 2. Make the fix
# ... edit files ...

# 3. Commit and push
git add .
git commit -m "hotfix: critical fix for broken data ingestion"
git push -u origin hotfix/urgent-fix-$(date +%Y%m%d)

# 4. Open PR immediately with "[HOTFIX]" prefix in title
# 5. Get expedited approval (1 approiser is sufficient for hotfixes)
# 6. Merge to main
```

**Hotfix Rules**:
- Must be a genuine production-blocking issue
- Keep changes minimal and surgical
- Document the root cause in the commit message
- Add regression tests if applicable

---

## Frontend Deployment (Vercel)

Vercel is configured for **automatic deployments** from GitHub:

- **Production**: `main` branch → `graphiquestor.com`
- **Preview**: Any PR → automatic preview URL

### Manual Trigger (if needed)

```bash
# Via Vercel CLI
vercel --prod

# Or trigger via GitHub API
# (Use GitHub UI: Actions → "Deploy to Vercel" → Run workflow)
```

### Environment Variables (Vercel)

Already configured in Vercel dashboard:

| Key | Value | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://debdriyzfcwvgrhzzzre.supabase.co` | Supabase endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (secret) | Public Supabase key |
| `NEXT_PUBLIC_SITE_URL` | `https://graphiquestor.com` | Canonical URL |
| `NEXT_PUBLIC_GA_ID` | (optional) | Google Analytics |

---

## Backend Deployment (Supabase)

### SQL Migrations

All database changes must be in `supabase/migrations/` with timestamped filenames:

```sql
-- Example: 20260405000000_create_us_debt_maturities.sql
-- Must be idempotent (safe to run multiple times)
-- Use CREATE TABLE IF NOT EXISTS, ALTER TABLE ADD COLUMN IF NOT EXISTS, etc.
```

### Applying Migrations

Migrations are **automatically applied** on merge to `main` via GitHub Actions. Manual application:

```bash
# Push local migrations to remote (Git)
git add supabase/migrations/
git commit -m "mig: add new table for currency wars metrics"
git push

# Or apply a specific migration manually (not recommended for production)
supabase db push  # Sync local schema to remote
```

### Migration Best Practices

1. **Order matters**: Filename prefix `YYYYMMDDHHMMSS` ensures correct order
2. **Always backward compatible**: Never drop columns or tables in production migrations
3. **Additive only**: Add new tables/columns, create views, add constraints
4. **Idempotent**: Use `IF NOT EXISTS` / `IF EXISTS` guards
5. **Rollback plan**: Write a corresponding `down` migration in comments
6. **Test locally**:
   ```bash
   supabase db reset  # WARNING: destroys local data
   supabase migration up
   ```

---

## Edge Functions Deployment

### Structure

```
supabase/functions/
├── ingest-us-macro/          # US macro data (debt, yields, etc.)
│   ├── index.ts             # Entrypoint, orchestrates sub-functions
│   ├── maturities.ts        # Debt maturity processing
│   ├── fiscal.ts            # FiscalData API integration
│   ├── ust.ts               # UST yields
│   ├── fred.ts              # FRED metrics
│   └── auctions.ts          # Treasury auctions
├── ingest-india-macro/      # India-specific metrics
├── ingest-global-liquidity/ # Central bank balance sheets
└── ... (other functions)
```

### Deployment

Edge Functions are **automatically deployed** when files in `supabase/functions/` change. GitHub Actions workflow:

1. Builds each function (TypeScript → Deno)
2. Deploys to Supabase via Supabase CLI
3. Sets environment variables (secrets already configured in Supabase dashboard)

**Manual deployment** (rarely needed):

```bash
# Deploy all functions
npx supabase functions deploy ingest-us-macro --project-ref debdriyzfcwvgrhzzzre

# Deploy specific function with no-verify (use cautiously)
npx supabase functions deploy ingest-us-macro --no-verify

# List deployed functions
npx supabase functions list
```

### Environment Variables for Functions

These are set in the Supabase dashboard (`graphiquestor.com` → Settings → Edge Functions):

| Variable | Function(s) | Purpose |
|----------|-------------|---------|
| `FRED_API_KEY` | `ingest-us-macro`, others | FRED API key |
| `ALPHA_VANTAGE_KEY` | `ingest-market-pulse` | Stock prices |
| `FINNHUB_KEY` | `ingest-market-pulse` | Alternative market data |
| `DISCORD_WEBHOOK_URL` | All ingestion functions | Alert on failures/success |
| `SUPABASE_URL` | All functions | Self-reference for DB calls |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions | Service role auth |

**Important**: Do not commit API keys. Use GitHub Secrets + Supabase dashboard.

---

## Verification Checklist

After each deployment, run through this checklist:

### Frontend

- [ ] Visit `https://graphiquestor.com` - no build errors in console
- [ ] Navigate to **Terminal** → **US Debt Maturity Wall** - data loads
- [ ] Check Data Health Dashboard (`/admin/data-health`) - all metrics "Fresh" or "Lagged"
- [ ] Verify responsive design on mobile/tablet viewports
- [ ] Run visual regression test (if implemented): `npm run test:visual`

### Backend

- [ ] Check `ingestion_logs` table for latest runs (last 2 hours):
  ```sql
  SELECT function_name, status, completed_at, rows_inserted
  FROM ingestion_logs
  WHERE completed_at > NOW() - INTERVAL '2 hours'
  ORDER BY completed_at DESC;
  ```
- [ ] Verify Discord alerts sent to `#ingestion-alerts` (green checkmarks)
- [ ] Test affected Edge Function manually:
  ```bash
  supabase functions invoke ingest-us-macro
  ```

### Data Integrity

- [ ] Spot-check 3-5 key metrics for reasonableness
- [ ] Verify `us_debt_maturities` has today's date (if daily) or latest expected date
- [ ] Check for NULL spikes: run data health query
- [ ] Validate foreign key relationships (if added)

### Monitoring

- [ ] Check Sentry (if configured) for new errors
- [ ] Verify no 5xx errors in Vercel logs (last 30 min)
- [ ] Review Supabase `dashboard` metrics for query performance

---

## Rollback Procedures

### Frontend Rollback (Vercel)

Vercel keeps deployment history. Rollback via:

1. **Dashboard**: Go to Deployments → select previous deployment → "Promote to Production"
2. **CLI**:
   ```bash
   vercel rollback <deployment-id>
   ```

**Git-based rollback** (if Vercel unavailable):
```bash
git revert <commit-hash>
git push origin main
```

### Database Rollback (Supabase)

**No destructive migrations**: If you followed best practices (additive only), rollback is simple:

1. **Additive migration**: Nothing to rollback (new table/column stays)
2. **Constraint change**: Drop the new constraint
3. **Data migration**: Delete the inserted rows

**Manual rollback SQL** (run in Supabase SQL Editor):
```sql
-- Example: Remove a mistakenly added column
ALTER TABLE public.us_debt_maturities DROP COLUMN IF EXISTS test_column;

-- Example: Remove a new table
DROP TABLE IF EXISTS public.new_table CASCADE;
```

**Full database restore** (last resort):
- Supabase provides point-in-time recovery (PITR)
- Restore to a new project, then swap DNS
- Contact Supabase support for time-sensitive restores

### Edge Functions Rollback

```bash
# Redeploy previous version (if you kept it in git)
git checkout <previous-commit> -- supabase/functions/ingest-us-macro/
git commit -m "rollback: revert ingest-us-macro to previous stable version"
git push

# Or manually edit function in Supabase dashboard to restore code
```

---

## Troubleshooting

### Migration Fails to Apply

**Symptoms**: GitHub Actions shows `migration failed` or Supabase logs error.

**Diagnosis**:
```bash
# Check migration status
supabase migration list

# View failed migration details
supabase db remote execute "SELECT * FROM pg_cron.job_run_details WHERE job_name = '...';"
```

**Common causes & fixes**:

| Error | Cause | Fix |
|-------|-------|-----|
| `relation already exists` | Table already created manually | Use `CREATE TABLE IF NOT EXISTS` |
| `column already exists` | Column was added manually | Use `ADD COLUMN IF NOT EXISTS` |
| `permission denied` | Service role key missing | Check GitHub Secrets `SUPABASE_SERVICE_ROLE_KEY` |
| `function does not exist` | Edge Function not deployed | Check GitHub Actions `Deploy Edge Functions` job |

**Manual fix** (if CI/CD stuck):
```bash
# Apply migration directly
supabase migration up
# or
psql $DATABASE_URL -f supabase/migrations/20260405000000_....
```

### Edge Function Times Out

**Symptoms**: Ingestion logs show `timeout` status, Discord alerts with error.

**Diagnosis**:
- Check function logs in Supabase dashboard → Functions → Logs
- Verify API rate limits (FRED: 100/day, Alpha Vantage: 5/min)
- Check external API status

**Fix**:
- Increase timeout in `index.ts`:
  ```typescript
  await runIngestion(supabase, 'function-name', async (ctx) => {
    // ... add Timeout at Deno.serve level if needed
  }, { timeoutMs: 300000 }); // 5 minutes
  ```
- Add retry logic with exponential backoff (already implemented in `_shared/retry.ts`)
- Split large ingestion into smaller batches

### Data Not Updating

**Symptoms**: Component shows stale data, latest date in table is old.

**Checklist**:
1. [ ] Is the cron job scheduled? Verify in Supabase dashboard → Database → Cron:
   ```sql
   SELECT * FROM cron.job;
   ```
2. [ ] Did the function run? Check `ingestion_logs`:
   ```sql
   SELECT * FROM ingestion_logs
   WHERE function_name = 'ingest-us-macro'
   ORDER BY start_time DESC LIMIT 5;
   ```
3. [ ] Any errors in logs? Look for `status = 'failed'`
4. [ ] API quota exhausted? Check FRED/Alpha Vantage usage
5. [ ] Manual test:
   ```bash
   supabase functions invoke ingest-us-macro
   ```

**Fix**: Refer to [Edge Functions Timeout](#edge-functions-timeout) or [Migration Fails](#migration-fails-to-apply).

### Frontend Not Deploying

**Symptoms**: Git push to main doesn't update `graphiquestor.com`.

**Checklist**:
1. [ ] Vercel integration active? Check GitHub repo → Settings → Integrations → Vercel
2. [ ] Build passing? Check GitHub Actions → `Deploy to Vercel` job status
3. [ ] Correct branch configured? Vercel → Project Settings → Git
4. [ ] Manual trigger: `vercel --prod` or use Vercel dashboard

---

## Post-Deployment

### Immediate (0-30 min)

1. **Monitor ingestion logs**:
   ```sql
   SELECT function_name, status, rows_inserted
   FROM ingestion_logs
   WHERE completed_at > NOW() - INTERVAL '1 hour'
   ORDER BY completed_at DESC;
   ```
   All statuses should be `success`.

2. **Check Discord**:
   - `#deployments`: GitHub Actions workflow completion
   - `#ingestion-alerts`: Green checkmarks for all functions

3. **Quick smoke test**:
   - Homepage loads without JS errors
   - Navigate to 3-4 key sections (Terminal, Labs)
   - Data tables render with actual numbers (not "Loading...")

### Short-term (1-24 hours)

1. **Data Health Dashboard**: All metrics at least "Lagged" (not "Very Lagged")
2. **Sentry/Error Tracking**: No new recurring errors
3. **Performance**: Core Web Vitals stable (LCP < 2.5s, CLS < 0.1)
4. **User feedback**: Monitor Discord `#support` for reports

### Long-term (1 week)

1. **Trend analysis**:
   - Ingestion latency stable? (Check `ingestion_logs.api_latency_ms`)
   - Query performance maintained? (Check Supabase `dashboard` → Query Performance)
2. **Cost review**:
   - Supabase egress: Should be < 10 GB/day (CDN caching)
   - Function invocations: ~150/day (24 functions × daily runs)
3. **Documentation update**: If feature changed, update `docs/` and `CLAUDE.md`

---

## Emergency Contacts

| Issue | Channel | Response Time |
|-------|---------|---------------|
| Production outage | Discord `#urgent` @admin | < 15 min |
| Ingestion failure | Discord `#ingestion-alerts` (auto) | < 1 hour |
| Data corruption | Discord `#data-incident` | < 30 min |
| Platform issues | Supabase support portal | SLA-based |

---

## Appendix

### Migration Naming Convention

```
YYYYMMDDHHMMSS_short_description.sql
Examples:
20260405000000_create_us_debt_maturities.sql
20260405000001_schedule_ingest_us_macro.sql
```

**Rules**:
- Use UTC timestamp
- Underscore-separated, lowercase, descriptive
- Keep under 60 characters
- Group related migrations with sequential numbering

### Commit Message Format

```
type(scope): subject

body

footer
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `revert`

**Examples**:
```
feat(us-macro): ingest debt maturity wall daily at 03:00 UTC

- Create us_debt_maturities table with cost buckets
- Schedule ingest-us-macro via cron
- Update data_intervals.md documentation

Closes #123
```

```
hotfix: resolve blank data in US Debt Maturity Wall

The component was querying wrong column name. Fixed to use
`amount` instead of `maturity_amount`.

Rollback: git revert --no-commit d4e5f6a
```

### Useful CI/CD Commands

```bash
# View GitHub Actions workflow runs
gh run list --workflow=deploy.yml

# Rerun a failed workflow
gh run rerun <run-id>

# View Vercel deployments
vercel ls

# Supabase CLI shortcuts
supabase db remote execute "SELECT * FROM cron.job;"
supabase functions logs ingest-us-macro --tail
supabase projects list
```

---

**Deployment Responsibility**: All engineers are empowered to deploy. If you break it, you fix it. Use this guide. Ask in `#devops` if stuck.

**Last Deployment**: See [DEPLOYMENT-LOG.md](./DEPLOYMENT-LOG.md) for historical record.
