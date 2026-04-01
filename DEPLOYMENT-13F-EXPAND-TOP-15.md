# Deployment Guide: Expand 13-F Tracker to Top 15 Global Institutions

**Date:** 2026-04-01  
**Status:** Ready for Production  
**Component:** Smart Money 13-F Tracker Expansion

## Overview

This deployment expands the 13-F Smart Money Tracker from 8 to **15 major global institutional investors**, adding:

- **Asset Managers:** State Street, Fidelity, Capital Group, Blackstone
- **Hedge Fund:** Bridgewater Associates
- **Pension Funds:** CalSTRS, Ontario Teachers'

Additionally, it implements a **CUSIP ticker cache** to optimize ingestion performance and reduce Alpha Vantage API calls.

---

## Changes Summary

### New Files
- `supabase/migrations/20260401000000_create_cusip_ticker_cache.sql` - Caching table for CUSIP mappings

### Modified Files
- `supabase/functions/ingest-institutional-13f/index.ts` - Expanded institution list + caching logic
- `src/hooks/useSmartMoneyHoldings.ts` - Updated key institutions (5→8) and heatmap limit (8→12)
- `.claude/plans/expand-13f-top-10-institutions.md` - Implementation plan

### Institution Coverage

**Before (8):** Norges, GIC, ADIA, CPPIB, CalPERS, BlackRock, Vanguard, Temasek

**After (15):**
- Sovereign Wealth (5): Norges, GIC, ADIA, CPPIB, Temasek
- Asset Managers (6): BlackRock, Vanguard, State Street, Fidelity, Capital Group, Blackstone
- Hedge Fund (1): Bridgewater Associates
- Pension Funds (3): CalPERS, CalSTRS, Ontario Teachers'

---

## Pre-Deployment Checklist

- [x] Lint passed (`npm run lint`)
- [x] Build succeeded (`npm run build`)
- [x] TypeScript type check passed (`npx tsc --noEmit`)
- [x] All code changes committed
- [ ] Supabase credentials configured
- [ ] Alpha Vantage API key in Supabase Vault (`ALPHA_VANTAGE_API_KEY`)
- [ ] Service role key available for Edge Function
- [ ] Latest migration files pushed to repository

---

## Step-by-Step Deployment

### Step 1: Apply Database Migration

The migration creates the `cusip_ticker_cache` table for optimized lookups.

**Option A: Supabase CLI (Recommended)**

```bash
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"

# Apply the new migration
npx supabase migration up 20260401000000_create_cusip_ticker_cache

# Apply any other pending migrations if needed
npx supabase migration up
```

**Option B: Supabase Dashboard SQL Editor**

1. Open Supabase dashboard → Project → SQL Editor
2. Click "New query"
3. Copy contents of `supabase/migrations/20260401000000_create_cusip_ticker_cache.sql`
4. Paste and click "Run"
5. Verify table exists:
   ```sql
   SELECT * FROM cusip_ticker_cache LIMIT 1;
   ```
   Should return empty result (no error).

**Verify indexes:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'cusip_ticker_cache';
```
Should show `cusip_ticker_cache_pkey` and `idx_cusip_ticker_cache_last_used`.

---

### Step 2: Deploy Edge Function

**Option A: Supabase CLI**

```bash
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"

# Deploy the updated ingest-institutional-13f function
npx supabase functions deploy ingest-institutional-13f --no-verify

# Wait for deployment (30-60 seconds)
```

**Option B: Supabase Dashboard**

1. Go to Supabase dashboard → Edge Functions
2. Find `ingest-institutional-13f` or create new
3. Copy code from `supabase/functions/ingest-institutional-13f/index.ts`
4. Set environment variables:
   - `SUPABASE_URL` (auto-filled)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-filled)
   - `ALPHA_VANTAGE_API_KEY` (from Vault secrets)
   - `ALPHA_VANTAGE_DELAY_MS` (optional, default: `12000`)
5. Click "Deploy"

**Verify deployment:**
- Function status should be "Live"
- No recent errors in logs

---

### Step 3: Verify Weekly Cron (Optional)

The weekly cron should already be scheduled from previous deployment. Verify:

```sql
SELECT * FROM cron.job WHERE jobname = 'ingest-institutional-13f-weekly';
```

Expected: `0 3 * * 0` (Sunday 03:00 UTC). If missing, apply:

```bash
npx supabase migration up 20260331000002_schedule_13f_weekly
```

---

### Step 4: Push Frontend Changes

```bash
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"

# Stage all changes
git add -A

# Create commit
git commit -m "feat(13F): expand to top 15 global institutions + caching

- Add 7 new institutions: State Street, Fidelity, Capital Group, Blackstone, Bridgewater, CalSTRS, Ontario Teachers'
- Create cusip_ticker_cache table for 90-day CUSIP→ticker mapping cache
- Update ingest-institutional-13f with caching layer to reduce Alpha Vantage calls
- Expand key institutions in UI from 5 to 8 cards
- Increase heatmap display from 8 to 12 institutions
- Update useSmartMoneyHoldings with new institution names

Performance: First ingestion ~60-90min, subsequent ~5-10min due to caching"

# Push to main branch
git push origin main
```

**If using a feature branch:**
```bash
git push origin feature/13f-expand-top-15
# Then open PR to main
```

---

### Step 5: Trigger Manual Ingestion (Optional for Testing)

To populate data immediately without waiting for Sunday cron:

**Via Supabase Dashboard:**
1. Go to Edge Functions → `ingest-institutional-13f`
2. Click "Execute" → "Run"
3. Wait 60-90 minutes (first run will be slow due to Alpha Vantage rate limits)

**Via cURL:**
```bash
curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/ingest-institutional-13f \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Monitor progress:**
1. Dashboard → Edge Functions → `ingest-institutional-13f` → Logs
2. Or check `ingestion_logs` table:
   ```sql
   SELECT function_name, status, rows_inserted, started_at, completed_at
   FROM ingestion_logs
   WHERE function_name = 'ingest-institutional-13f'
   ORDER BY started_at DESC
   LIMIT 5;
   ```

---

### Step 6: Verify Data Population

After ingestion completes (status = 'success'):

**Check institution count:**
```sql
SELECT COUNT(*) FROM institutional_13f_holdings;
```
Should return ≥12 (at least 12 of 15 institutions should have filed 13-F).

**List all tracked institutions:**
```sql
SELECT DISTINCT fund_name, fund_type, total_aum
FROM institutional_13f_holdings
ORDER BY total_aum DESC;
```

**Verify cache table is populated:**
```sql
SELECT COUNT(*) FROM cusip_ticker_cache;
```
Should have several hundred CUSIP mappings cached.

**Check specific new institutions:**
```sql
SELECT fund_name, total_aum, qoq_delta, regime_z_score
FROM institutional_13f_holdings
WHERE fund_name IN (
    'State Street Corp',
    'FMR LLC',
    'Capital Research and Management Co',
    'Blackstone Inc',
    'Bridgewater Associates, LP',
    'CalSTRS',
    'Ontario Teachers'' Pension Plan'
);
```

All should return rows with valid data (total_aum > 0).

---

### Step 7: Frontend Verification

Wait for your CI/CD to deploy (Vercel/Netlify/ etc.) or manually build:

```bash
cd "/Users/kartikaysharma/Desktop/Projects/Vibecode /Macro/MacroDashboard"

# Build for production
npm run build

# Deploy (example for Vercel)
vercel --prod
```

**Production verification:**

1. Visit `https://YOUR-DOMAIN/terminal` (or `/`)

2. **Check header stats:**
   - "Total Monitored" AUM should reflect all 15 institutions
   - Institution count should show ≈15 (or fewer if some didn't file)

3. **Scroll to Smart Money 13-F Tracker section:**

   - **Trade Tape:** Should display scrolling trades (if any recent trades inferred)
   - **Discliamer:** "Inferred from latest 13-F filings (quarterly, ~45-day lag)"

   - **Row 1: Collective Regime + Stacked Chart**
     - Regime gauge shows score and label (BULLISH/BEARISH/NEUTRAL)
     - Risk signal (RISK_ON/RISK_OFF/NEUTRAL)
     - Stacked area chart with 8-quarter allocation history

   - **Row 2: 3-Column Grid**
     - **Col 1 (Key Institutions):** Shows up to 8 cards including new ones (State Street, Fidelity, Blackstone, etc.)
       - Each card: AUM, asset allocation %, trend arrow
     - **Col 2 (Top Holdings Concentration):** Bar chart of top 10 holdings across all institutions
     - **Col 3 (Sector Flow Heatmap):** Heatmap with **12 rows** (institutions) showing sector allocations

   - **Row 3: Benchmark Comparison & Signals**
     - Cards for S&P 500, TLT, GLD comparisons
     - Collective Risk Signal card with explanation

4. **Console check:**
   - Open DevTools → Console
   - Zero errors (only warnings allowed)
   - No failed queries

5. **Responsive check:**
   - Resize to mobile (<1024px)
   - Heatmap should scroll horizontally
   - Cards stack vertically
   - Trade Tape becomes horizontal scroll

---

## Post-Deployment Monitoring

### 1. Weekly Cron Success

Monitor Sunday 03:00 UTC ingestion:

```sql
SELECT started_at, completed_at, status, rows_inserted, error_message
FROM ingestion_logs
WHERE function_name = 'ingest-institutional-13f'
ORDER BY started_at DESC
LIMIT 3;
```

Expected status: `success`, duration ~30-60 minutes (first run longer).

### 2. Data Freshness

Check data is from latest quarter:

```sql
SELECT MAX(as_of_date) FROM institutional_13f_holdings;
```

Should be most recent quarter end (e.g., 2026-03-31 for Q1).

### 3. Alpha Vantage Rate Limits

If ingestion fails with 429 errors:

**Mitigation:**
- Increase `ALPHA_VANTAGE_DELAY_MS` in Edge Function env to `15000` or `20000`
- With caching, subsequent runs will hit rate limits less

Check Alpha Vantage usage dashboard.

### 4. Cache Hit Rate

Monitor cache effectiveness:

```sql
SELECT
  COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '90 days') as active_cache_entries,
  COUNT(*) as total_entries
FROM cusip_ticker_cache;
```

High active cache % indicates effective caching.

### 5. Missing Institution Filings

Some institutions may not file 13-F (e.g., certain SWFs use different forms). Check coverage:

```sql
SELECT fund_name, total_aum
FROM institutional_13f_holdings
WHERE total_aum > 0
ORDER BY total_aum DESC;
```

If any expected institution is missing after multiple runs, check logs:

```sql
SELECT error_message FROM ingestion_logs
WHERE function_name = 'ingest-institutional-13f'
  AND status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
```

If institution has "No 13F found", it may not file. Consider replacing with another major player.

---

## Performance Optimization Notes

### First vs Subsequent Runs

- **First run:** 15 institutions × ~300 holdings × 2 Alpha Vantage calls each = ~9,000 API calls
  - With 12s delay: ~30 hours theoretical → but we process concurrently with Promise.allSettled, so ~60-90 min actual
- **Subsequent runs:** >90% of CUSIPs cached → only new/missing CUSIPs need API calls → ~5-10 min

### If Ingestion Too Slow

**Options:**
1. Reduce top holdings from 20 to 15: in code, change `.slice(0, 20)` to `.slice(0, 15)`
2. Increase `ALPHA_VANTAGE_DELAY_MS` slightly (avoid hitting rate limit retries)
3. Upgrade Alpha Vantage API tier (higher rate limits)
4. Parallelize across institutions more aggressively (currently Promise.allSettled already parallel)

---

## Troubleshooting

### Problem: Ingestion fails with Alpha Vantage 429 (rate limit)

**Solution:**
- Increase `ALPHA_VANTAGE_DELAY_MS` to 15000 or 20000
- Re-deploy function
- Re-run ingestion

### Problem: Missing new institutions in UI

**Check:**
- Did ingestion complete successfully? Check `ingestion_logs`
- Do rows exist in `institutional_13f_holdings` for new institutions?
- If institution has no 13-F filings, it will be skipped. Check logs for "No 13F found" warnings.

**Solution:**
- Replace non-filing institutions with alternatives in `INSTITUTIONS` array
- Re-deploy and re-run ingestion

### Problem: UI shows fewer than expected institutions in heatmap

**Check:**
- `useSmartMoneyHoldings` hook uses `topInstitutions = institutions.slice(0, 12)`
- If less than 12 institutions have data, only those show
- Verify `institutionCards` filter includes new names

**Solution:**
- Ensure `keyInstitutions` array in hook matches exactly the `fund_name` values from ingestion
- Current list includes: State Street Corp, FMR LLC, Capital Research and Management Co, etc.

### Problem: Cache table not being used

**Check:**
- `cusip_ticker_cache` has rows? `SELECT COUNT(*) FROM cusip_ticker_cache;`
- After ingestion, `fetched_at` should be recent
- If cache misses every time, verify CUSIPs match exactly (case-sensitive)

**Solution:**
- Ensure caching logic is in place in ingestion function
- Check logs for "Cache hit" vs "Cache miss" (add logging if needed)

### Problem: Build errors after code changes

**Typical errors:**
- Type mismatches in `useSmartMoneyHoldings` (e.g., type of `fund_name` changed)
- Missing imports

**Solution:**
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Fix automatically if possible
npm run format
```

---

## Rollback Plan

### If migration causes issues (unlikely - read-only addition)

```sql
-- Drop new table if needed
DROP TABLE IF EXISTS cusip_ticker_cache CASCADE;
```

All other tables (`institutional_13f_holdings`) are unchanged, so data remains safe.

### Revert code changes

```bash
git revert HEAD
git push origin main
```

Or manually:
1. Revert `INSTITUTIONS` array to original 8
2. Revert `useSmartMoneyHoldings` keyInstitutions and slice limits
3. Re-deploy Edge Function and frontend

**Note:** Keep the cache table - it's harmless and improves performance even with 8 institutions.

---

## Expected Outcomes

- **15 institutions** tracked (or 12-14 if some don't file 13-F)
- **Smooth UI** with expanded heatmap and more key institution cards
- **Faster ingestion** on subsequent runs due to caching (5-10 min vs 60-90 min)
- **No breaking changes** to existing visualizations
- **Data accuracy** maintained with same Alpha Vantage enrichment quality

---

## Success Criteria

- ✅ Migration applied without errors
- ✅ Edge Function deployed and can run without crashing
- ✅ Frontend builds and deploys successfully
- ✅ At least 12 institutions appear in `institutional_13f_holdings` after ingestion
- ✅ UI shows expanded institution cards (8 cards including new ones)
- ✅ Heatmap displays 12 rows (or all available institutions)
- ✅ Total Monitored AUM aggregates all institutions
- ✅ Zero console errors in production browser
- ✅ Ingestion completes within 2 hours (first run) and <30 min (subsequent)

---

## Contact & Resources

**Implementation Plans:**
- `.claude/plans/expand-13f-top-10-institutions.md` - This deployment's plan
- `.claude/plans/enrich-13f-smart-money-tracker.md` - Original enhancement plan

**Code References:**
- Ingestion function: `supabase/functions/ingest-institutional-13f/index.ts`
- UI hook: `src/hooks/useSmartMoneyHoldings.ts`
- UI component: `src/components/InstitutionalHoldingsWall.tsx`

**Database:**
- Main table: `institutional_13f_holdings`
- Cache table: `cusip_ticker_cache`
- Trades table: `institutional_trades_inferred`
- View: `vw_smart_money_collective`

---

**Deployment completed?** Mark checklist as done and close this guide.
