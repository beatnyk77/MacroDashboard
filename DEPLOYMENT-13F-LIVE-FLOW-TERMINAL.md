# Deployment Guide: 13-F Live Flow Terminal Upgrade

**Date:** 2026-03-31  
**Status:** Ready for Production  
**Component:** Smart Money 13-F Tracker → Live Flow Terminal

## Overview

This upgrade transforms the static 13-F tracker into a dynamic "Live Flow Terminal" with:
- **Trade Tape** - Scrolling marquee of high-conviction institutional trades
- **Sector Flow Heatmap** with directional arrows (↑/↓)
- **Enhanced regime indicators**
- Real data from SEC 13-F + Alpha Vantage enrichment

All changes are strictly additive. No existing functionality was removed.

---

## Files Changed

### New Files
- `supabase/migrations/20260331000003_institutional_trades_inferred.sql` - New database table
- `src/hooks/useSmartMoneyTradeTape.ts` - Frontend hook for trade tape
- `src/components/TradeTape.tsx` - Trade tape UI component
- `DEPLOYMENT-13F-LIVE-FLOW-TERMINAL.md` - This guide

### Modified Files
- `supabase/functions/ingest-institutional-13f/index.ts` - Enhanced with trade inference
- `src/components/InstitutionalHoldingsWall.tsx` - Integrated TradeTape + heatmap directions
- `src/hooks/useSmartMoneyHoldings.ts` - Added sector delta calculations

### Documentation
- `.claude/plans/calm-dazzling-wren.md` - Implementation plan
- `.claude/plans/enrich-13f-smart-money-tracker.md` - Original enhancement plan
- `.claude/plans/redesign-smart-money-13f-tracker.md` - UI redesign plan

---

## Pre-Deployment Checklist

- [x] Lint passed (`npm run lint` - zero warnings)
- [x] Build succeeded (`npm run build` - 5.87s)
- [x] TypeScript type check passed (`npx tsc --noEmit`)
- [x] All code changes committed to feature branch
- [ ]Supabase credentials configured (SUPABASE_URL, SUPABASE_ACCESS_TOKEN)
- [ ] Alpha Vantage API key present in Supabase Vault (`ALPHA_VANTAGE_API_KEY`)
- [ ] Service role key available for Edge Function

---

## Step-by-Step Deployment

### Step 1: Apply Database Migration

The migration creates the `institutional_trades_inferred` table with indexes and RLS policies.

**Option A: Using Supabase CLI (Recommended)**

```bash
cd /Users/kartikaysharma/Desktop/Projects/Vibecode\ /Macro/MacroDashboard

# Set Supabase credentials if not already
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ACCESS_TOKEN="your-access-token"

# Apply all pending migrations
npx supabase migration up

# Or apply specific migration
npx supabase migration up 20260331000003_institutional_trades_inferred
```

**Option B: Using Supabase Dashboard SQL Editor**

1. Open Supabase dashboard → Project → SQL Editor
2. Click "New query"
3. Copy contents of `supabase/migrations/20260331000003_institutional_trades_inferred.sql`
4. Paste and click "Run"
5. Verify: `SELECT * FROM institutional_trades_inferred LIMIT 1;` should return empty (no error)

### Step 2: Deploy Edge Function

**Option A: Supabase CLI**

```bash
cd /Users/kartikaysharma/Desktop/Projects/Vibecode\ /Macro/MacroDashboard

# Deploy the updated ingest-institutional-13f function
npx supabase functions deploy ingest-institutional-13f --no-verify

# Wait for deployment to complete (usually 30-60 seconds)
```

**Option B: Supabase Dashboard**

1. Go to Supabase dashboard → Functions
2. Find `ingest-institutional-13f` or create new if missing
3. Copy code from `supabase/functions/ingest-institutional-13f/index.ts`
4. Set environment variables:
   - `SUPABASE_URL` (auto-filled)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-filled)
   - `ALPHA_VANTAGE_API_KEY` (from your secrets)
   - `ALPHA_VANTAGE_DELAY_MS` (optional, default: 12000)
5. Deploy

### Step 3: Apply Weekly Cron Schedule (If Not Already)

The cron migration `20260331000002_schedule_13f_weekly.sql` should already exist. Apply if not:

```bash
npx supabase migration up 20260331000002_schedule_13f_weekly
```

Or via dashboard SQL:
- Run the SQL in `supabase/migrations/20260331000002_schedule_13f_weekly.sql`
- This schedules ingestion every Sunday 03:00 UTC

**Verify cron schedule:**
```sql
SELECT * FROM cron.job WHERE jobname = 'ingest-institutional-13f-weekly';
```

### Step 4: Push Frontend Changes to Remote

```bash
cd /Users/kartikaysharma/Desktop/Projects/Vibecode\ /Macro/MacroDashboard

# Ensure all changes are added
git add -A

# Create commit
git commit -m "feat(13F): upgrade to Live Flow Terminal with Trade Tape

- Add institutional_trades_inferred table for recent trade storage
- Enhance ingest-institutional-13f with trade inference from QoQ changes
- Create TradeTape component with marquee (desktop) & scroll (mobile)
- Integrate TradeTape into InstitutionalHoldingsWall hero section
- Add sector direction arrows (↑/↓) to heatmap with ±0.5% threshold
- Include disclaimer about 13-F quarterly lag
- Maintain glassmorphic dark terminal aesthetic
- All existing visualizations preserved and enhanced

Closes #<issue-number>"

# Push to main (or feature branch)
git push origin main

# If using feature branch, open PR to main
# git push origin feature/live-flow-terminal
```

### Step 5: Trigger Manual Ingestion (Optional for Testing)

To populate data immediately without waiting for Sunday cron:

**Via Supabase Dashboard:**
1. Go to Functions → `ingest-institutional-13f`
2. Click "Execute" → "Run"
3. Wait 1-2 minutes (the function processes 8 institutions with 240+ Alpha Vantage calls)

**Via cURL:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/ingest-institutional-13f \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Monitor logs:**
- Dashboard → Functions → `ingest-institutional-13f` → Logs
- Or check `ingestion_logs` table

### Step 6: Verify Data Population

After ingestion completes:

```sql
-- Check latest holdings
SELECT COUNT(*) FROM institutional_13f_holdings;
SELECT fund_name, total_aum, regime_z_score FROM institutional_13f_holdings ORDER BY total_aum DESC LIMIT 5;

-- Check inferred trades
SELECT COUNT(*) FROM institutional_trades_inferred;
SELECT fund_name, ticker, trade_type, delta_pct, conviction_score 
FROM institutional_trades_inferred 
ORDER BY inferred_at DESC, conviction_score DESC 
LIMIT 10;

-- Should see trade_type values: BUY, SELL, INITIATE, EXIT, INCREASE, DECREASE
-- conviction_score should be 1-10
```

### Step 7: Frontend Deployment

The frontend build should automatically deploy via your CI/CD (Vercel/Netlify/GitHub Pages) when you push to main.

**If deploying manually:**

```bash
# Build
npm run build

# Deploy dist/ folder to your hosting provider
# Example for Vercel:
vercel --prod
```

### Step 8: Verify in Production

1. Visit `https://your-domain.com/terminal` (or `/` if root)
2. **Check Trade Tape:** Should see scrolling marquee of trades with arrows, percentages, conviction badges
3. **Check disclaimer:** "Inferred from latest 13-F filings (quarterly, ~45-day lag)" visible below Trade Tape
4. **Check Sector Flow Heatmap:**
   - Cells show allocation %
   - ↑ (green) or ↓ (red) arrows for significant changes (>0.5%)
5. **Check regime gauge:** Still functional with score and RISK_ON/RISK_OFF/NEUTRAL label
6. **Check other sections:** All existing charts (allocation trend, institution cards, benchmarks) render correctly
7. **Mobile:** Resize browser <1024px, verify TradeTape becomes horizontal scroll (no marquee animation)

**Console should have zero errors.**

---

## Rollback Plan

If issues arise:

1. **Database:** No destructive changes made to existing tables. Can safely drop new table:
   ```sql
   DROP TABLE IF EXISTS institutional_trades_inferred;
   ```

2. **Code:** Revert commit on GitHub or rollback to previous release via CI/CD.

3. **Edge Function:** Redeploy previous version from `supabase/functions/ingest-institutional-13f` backup (commit history).

---

## Post-Deployment Monitoring

1. **Weekly cron check:** Monitor `ingestion_logs` for successful runs every Sunday 03:00 UTC
   ```sql
   SELECT * FROM ingestion_logs 
   WHERE function_name = 'ingest-institutional-13f' 
   ORDER BY completed_at DESC 
   LIMIT 5;
   ```

2. **Trade Tape freshness:** Should update weekly after ingestion. Verify `inferred_at` timestamps.

3. **Alpha Vantage quota:** If rate limits hit, consider:
   - Reducing top holdings to 15
   - Increasing `ALPHA_VANTAGE_DELAY_MS` to 15000
   - Caching price data longer

4. **Performance:** TradeTape marquee should be smooth. If janky, reduce number of visible items (slice to 10 in hook).

---

## Troubleshooting

### Trade Tape is empty
- ingestion may not have run yet. Check `institutional_trades_inferred` table has rows
- If empty, trigger manual ingestion

### Arrow directions not showing in heatmap
- Ensure `useSmartMoneyHoldings` hook computes deltas correctly. Check browser console for errors
- Verify `top_sectors` data exists in `institutional_13f_holdings`

### Ingestion fails with Alpha Vantage errors
- API key may be missing or rate-limited. Check Vault secret `ALPHA_VANTAGE_API_KEY`
- Increase `ALPHA_VANTAGE_DELAY_MS` in Edge Function env vars

### Build fails
- Ensure you're using Node 18+ (required for Deno-compatible syntax in Edge Functions)
- Run `npm ci` to reinstall dependencies
- Check TypeScript errors: `npx tsc --noEmit`

---

## Success Criteria

- ✅ Migration applied without errors
- ✅ Edge Function deployed and running
- ✅ Weekly cron scheduled (if desired)
- ✅ Frontend updated on production
- ✅ Trade Tape visible and animating (desktop) or scrolling (mobile)
- ✅ Sector Flow Heatmap shows ↑/↓ arrows
- ✅ All existing 13-F visualizations intact
- ✅ Zero console errors
- ✅ Lint & build clean

---

## Contact

For issues or questions, refer to:
- Implementation plan: `.claude/plans/calm-dazzling-wren.md`
- Original requirements: `CLAUDE.md`
- Code changes: Git commit history
