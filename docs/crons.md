# Canonical Cron Job Reference

**Source of truth**: [`supabase/migrations/20260613000000_canonical_crons.sql`](../supabase/migrations/20260613000000_canonical_crons.sql)  
**Generator**: [`scripts/generate-canonical-crons.mjs`](../scripts/generate-canonical-crons.mjs)  
**Snapshot date**: 2026-06-12 · Project: `debdriyzfcwvgrhzzzre`  
**Job count**: 101

---

## Auth Pattern (all HTTP jobs)

```sql
headers := jsonb_build_object(
  'Content-Type',  'application/json',
  'Authorization', 'Bearer ' || COALESCE(
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
  ),
  'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
)
```

`x-cron-secret` enforcement is **header-first, enforcement-second** — the header is sent with every request; the functions only reject on mismatch once `CRON_SECRET` is set to a non-empty value in vault (Task 1.2).

---

## Job Table

| jobname | schedule | function slug | cadence | notes |
|---|---|---|---|---|
| `cache-comtrade-weekly` | `0 18 * * 6` | `cache-comtrade-data` | Sat 18:00 | |
| `check-data-health-daily` | `0 7 * * *` | `check-data-health` | Daily 07:00 | |
| `check-fomc-minutes-daily` | `0 6 */2 * *` | `check-fomc-minutes` | Every 2 days 06:00 | |
| `compute-cie-macro-scores-weekly` | `0 12 * * 0` | `compute-cie-macro-scores` | Sun 12:00 | |
| `compute-daily-macro-signal-daily` | `30 6 * * *` | `compute-daily-macro-signal` | Daily 06:30 | |
| `compute-zscores-daily` | `0 6 * * *` | SQL: `compute_rolling_z_scores()` | Daily 06:00 | SQL-direct — no HTTP |
| `generate-monthly-regime-digest-job` | `30 0 1 * *` | `generate-monthly-regime-digest` | 1st of month 00:30 | Was GUC vault pattern — fixed |
| `generate-morning-brief` | `45 6 * * *` | `generate-morning-brief` | Daily 06:45 | Runs after signal compute |
| `generate-newsletter-monthly` | `30 0 1 * *` | `generate-newsletter` | 1st of month 00:30 | **ORPHAN?** function not confirmed deployed |
| `generate-weekly-regime-digest-job` | `0 23 * * 0` | `generate-weekly-regime-digest` | Sun 23:00 | |
| `gsc-sync-daily` | `0 6 * * *` | `gsc-sync` | Daily 06:00 | Orphan? — ran successfully (parse gap likely) |
| `ingest-africa-macro-pulse-job` | `0 0 5 * *` | `ingest-africa-macro` | 5th of month 00:00 | Was GUC vault pattern — fixed |
| `ingest-bis-reer-monthly` | `0 6 15 * *` | `ingest-bis-reer` | 15th of month 06:00 | |
| `ingest-boj-balance-sheet-weekly` | `5 10 * * 1` | `ingest-boj-balance-sheet` | Mon 10:05 | |
| `ingest-capital-flows-monthly` | `0 14 1 * *` | `ingest-capital-flows` | 1st of month 14:00 | **ORPHAN?** function not in deployed list |
| `ingest-cb-gold-net-quarterly` | `0 2 1 1,4,7,10 *` | `ingest-cb-gold-net` | Quarterly 1st 02:00 | |
| `ingest-china-energy-weekly` | `0 7 * * 0` | `ingest-china-energy` | Sun 07:00 | |
| `ingest-china-macro-daily` | `0 3 * * *` | `ingest-china-macro` | Daily 03:00 | |
| `ingest-china-real-economy-monthly` | `0 11 1 * *` | `ingest-china-real-economy` | 1st of month 11:00 | |
| `ingest-cie-deals-daily` | `0 20 * * 1-5` | `ingest-cie-deals` | Weekdays 20:00 | |
| `ingest-cie-fundamentals-daily` | `0 18 * * 1-5` | `ingest-cie-fundamentals` | Weekdays 18:00 | |
| `ingest-cie-ipos-daily` | `0 22 * * 1-5` | `ingest-cie-ipos` | Weekdays 22:00 | |
| `ingest-cie-promoters-daily` | `0 19 * * 1-5` | `ingest-cie-promoters` | Weekdays 19:00 | |
| `ingest-cie-short-selling-daily` | `0 21 * * 1-5` | `ingest-cie-short-selling` | Weekdays 21:00 | |
| `ingest-cofer-monthly` | `0 2 1 * *` | `ingest-cofer` | 1st of month 02:00 | |
| `ingest-commodity-imports-monthly` | `0 7 1 * *` | `ingest-commodity-imports` | 1st of month 07:00 | |
| `ingest-commodity-reserves-weekly` | `0 0 * * 0` | `ingest-commodity-reserves` | Sun 00:00 | |
| `ingest-commodity-terminal` | `30 8 * * 0` | `ingest-commodity-terminal` | Sun 08:30 | |
| `ingest-copper-gold-ratio-daily` | `0 15 * * *` | `ingest-copper-gold-ratio` | Daily 15:00 | |
| `ingest-corporate-debt-maturity-daily` | `0 2 * * *` | `ingest-corporate-debt-maturities` | Daily 02:00 | **SLUG FIX**: live used `ingest-corporate-debt-maturity` (no 's') |
| `ingest-country-gmd-supplement-quarterly` | `0 4 1 1,4,7,10 *` | `ingest-country-gmd-supplement` | Quarterly 1st 04:00 | **ORPHAN?** + **URL FIX**: live called wrong project |
| `ingest-currency-wars-monthly` | `0 16 1 * *` | `ingest-currency-wars` | 1st of month 16:00 | |
| `ingest-ecb-balance-sheet-weekly` | `0 10 * * 1` | `ingest-ecb-balance-sheet` | Mon 10:00 | |
| `ingest-energy-global-monthly` | `30 2 1 * *` | `ingest-energy-global` | 1st of month 02:30 | |
| `ingest-events-markers-daily` | `0 11 * * *` | `ingest-events-markers` | Daily 11:00 | |
| `ingest-fiscaldata` | `0 7 * * *` | `ingest-fiscaldata` | Daily 07:00 | **F6 DUPLICATE** — fires same fn 30 min after `ingest-fiscaldata-daily` |
| `ingest-fiscaldata-daily` | `30 6 * * *` | `ingest-fiscaldata` | Daily 06:30 | **F6 DUPLICATE** — see above |
| `ingest-fred-daily` | `0 6 * * *` | `ingest-fred` | Daily 06:00 | |
| `ingest-fuel-security-india-daily` | `0 2 * * *` | `ingest-fuel-security-india` | Daily 02:00 | |
| `ingest-g20-sovereign-monthly` | `0 13 1 * *` | `ingest-g20-sovereign` | 1st of month 13:00 | **ORPHAN?** function not in deployed list |
| `ingest-geopolitical-osint` | `0 */6 * * *` | `ingest-geopolitical-osint` | Every 6 h | Orphan? — ran 28×/week (parse gap likely) |
| `ingest-gfcf` | `30 5 * * *` | `ingest-gfcf` | Daily 05:30 | |
| `ingest-global-liquidity-weekly` | `15 10 * * 1` | `ingest-global-liquidity` | Mon 10:15 | |
| `ingest-global-refining-weekly` | `0 3 * * 0` | `ingest-global-refining` | Sun 03:00 | |
| `ingest-gold-daily` | `0 4 * * *` | `ingest-gold` | Daily 04:00 | |
| `ingest-gold-debt-coverage-monthly` | `0 8 15 * *` | `ingest-gold-debt-coverage` | 15th of month 08:00 | |
| `ingest-gold-history-daily` | `0 5 * * *` | `ingest-gold-history` | Daily 05:00 | |
| `ingest-imf` | `0 8 * * 0` | `ingest-imf` | Sun 08:00 | |
| `ingest-imf-brics-monthly` | `0 3 1 * *` | `ingest-imf-brics` | 1st of month 03:00 | |
| `ingest-imf-current-account-monthly` | `0 8 20 * *` | `ingest-imf-current-account` | 20th of month 08:00 | |
| `ingest-imf-sdr-monthly` | `0 8 1 * *` | `ingest-imf-sdr` | 1st of month 08:00 | |
| `ingest-india-credit-cycle-weekly` | `30 5 * * 0` | `ingest-india-credit-cycle` | Sun 05:30 | |
| `ingest-india-debt-maturities-monthly` | `0 6 1 * *` | `ingest-india-debt-maturities` | 1st of month 06:00 | |
| `ingest-india-digitization-monthly` | `0 8 1 * *` | `ingest-india-digitization` | 1st of month 08:00 | |
| `ingest-india-energy-weekly` | `0 0 * * 0` | `ingest-energy` | Sun 00:00 | NOTE: calls `ingest-energy` (not `ingest-india-energy`) |
| `ingest-india-fiscal-allocation-monthly` | `0 9 1 * *` | `ingest-india-fiscal-allocation` | 1st of month 09:00 | |
| `ingest-india-fiscal-stress-monthly` | `0 11 5 * *` | `ingest-india-fiscal-stress` | 5th of month 11:00 | |
| `ingest-india-inflation-monthly` | `0 7 1 * *` | `ingest-india-inflation` | 1st of month 07:00 | |
| `ingest-india-liquidity-daily` | `0 15 * * 1-5` | `ingest-india-liquidity` | Weekdays 15:00 | |
| `ingest-india-macro-snapshot-job` | `0 0 4 * *` | `ingest-india-macro-snapshot` | 4th of month 00:00 | Was GUC vault pattern — fixed |
| `ingest-india-market-pulse-daily` | `0 14 * * 1-5` | `ingest-market-pulse` | Weekdays 14:00 | NOTE: calls `ingest-market-pulse` (not `ingest-india-market-pulse`) |
| `ingest-institutional-13f-weekly` | `0 3 * * 0` | `ingest-institutional-13f` | Sun 03:00 | Orphan? — ran successfully (parse gap likely) |
| `ingest-institutional-loans-monthly` | `0 4 1 * *` | `ingest-institutional-loans` | 1st of month 04:00 | **ORPHAN?** function not in deployed list |
| `ingest-institutional-loans-weekly` | `0 1 * * 0` | `ingest-institutional-loans` | Sun 01:00 | **ORPHAN?** function not in deployed list |
| `ingest-macro-news-headlines` | `0 */6 * * *` | `ingest-macro-news-headlines` | Every 6 h | |
| `ingest-major-economies-monthly` | `0 12 1 * *` | `ingest-major-economies` | 1st of month 12:00 | |
| `ingest-market-pulse-daily` | `0 1 * * *` | `ingest-market-pulse` | Daily 01:00 | |
| `ingest-mospi` | `0 7 * * *` | `ingest-mospi` | Daily 07:00 | |
| `ingest-mutual-funds-daily` | `30 14 * * *` | `ingest-mutual-funds` | Daily 14:30 | Orphan? — ran successfully (parse gap likely) |
| `ingest-nse-flows-daily` | `30 13 * * 1-5` | `ingest-nse-flows` | Weekdays 13:30 | Orphan? — ran successfully (parse gap likely) |
| `ingest-nyfed-markets-daily` | `0 12 * * *` | `ingest-nyfed-markets` | Daily 12:00 | |
| `ingest-oecd-cli-monthly` | `0 9 10 * *` | `ingest-oecd-cli` | 10th of month 09:00 | |
| `ingest-oil-eia-weekly` | `30 16 * * 3` | `ingest-oil-eia` | Wed 16:30 | EIA publishes Wednesdays |
| `ingest-oil-global-weekly` | `0 5 * * 0` | `ingest-oil-global` | Sun 05:00 | |
| `ingest-oil-india-china-weekly` | `0 6 * * 0` | `ingest-oil-india-china` | Sun 06:00 | |
| `ingest-oil-spread-daily` | `0 5 * * 1-5` | `ingest-oil-spread` | Weekdays 05:00 | |
| `ingest-pboc-liquidity-daily` | `0 2 * * *` | `ingest-pboc-liquidity` | Daily 02:00 | |
| `ingest-precious-divergence-daily` | `0 19 * * *` | `ingest-precious-divergence` | Daily 19:00 | |
| `ingest-rbi-money-market-daily` | `0 15 * * 1-5` | `ingest-rbi-money-market` | Weekdays 15:00 | |
| `ingest-state-fiscal-health-monthly` | `0 10 1 * *` | `ingest-state-fiscal-health` | 1st of month 10:00 | **ORPHAN?** function not in deployed list |
| `ingest-tic-foreign-holders` | `0 10 * * 0` | `ingest-tic-foreign-holders` | Sun 10:00 | |
| `ingest-trade-global-monthly` | `30 6 15 * *` | `ingest-trade-global` | 15th of month 06:30 | |
| `ingest-trade-imports-weekly` | `0 7 * * 0` | `ingest-trade-imports` | Sun 07:00 | Was `SERVICE_ROLE_KEY`-only — normalised to COALESCE |
| `ingest-trade-intelligence-pulse` | `0 5 * * 0` | `ingest-trade-global-pulse` | Sun 05:00 | |
| `ingest-un-comtrade-weekly` | `0 6 * * 0` | `ingest-un-comtrade?hsCode=8542&category=Semiconductors` | Sun 06:00 | URL query params; was `SERVICE_ROLE_KEY`-only |
| `ingest-upi-autopay-daily` | `30 8 * * *` | `ingest-upi-autopay` | Daily 08:30 | |
| `ingest-us-debt-maturities-monthly` | `0 14 8 * *` | `ingest-us-debt-maturities` | 8th of month 14:00 | |
| `ingest-us-debt-maturities-monthly-retry` | `0 14 10 * *` | `ingest-us-debt-maturities` | 10th of month 14:00 | Idempotent retry |
| `ingest-us-fiscal-stress-monthly` | `0 10 5 * *` | `ingest-us-fiscal-stress` | 5th of month 10:00 | **ORPHAN?** function not in deployed list |
| `ingest-us-macro-auctions-daily` | `30 2 * * *` | `ingest-us-macro?task=auctions` | Daily 02:30 | URL query params |
| `ingest-us-macro-daily` | `0 3 * * *` | `ingest-us-macro` | Daily 03:00 | |
| `ingest-us-macro-fiscal-daily` | `0 2 * * *` | `ingest-us-macro?task=fiscal` | Daily 02:00 | URL query params |
| `ingest-us-macro-fred-daily` | `20 2 * * *` | `ingest-us-macro?task=fred` | Daily 02:20 | URL query params |
| `ingest-us-macro-ust-daily` | `10 2 * * *` | `ingest-us-macro?task=ust` | Daily 02:10 | URL query params |
| `ingest-us-macro-weekly` | `0 0 * * 1` | `ingest-us-macro` | Mon 00:00 | **F3 FIX**: had hardcoded JWT — replaced with vault |
| `ingest-us-treasury-auctions-monthly` | `0 10 5 * *` | `ingest-us-treasury-auctions` | 5th of month 10:00 | |
| `ingest-us-treasury-auctions-weekly` | `0 9 * * 1` | `ingest-us-treasury-auctions` | Mon 09:00 | |
| `ingest-weekly-narrative-weekly` | `30 23 * * 0` | `ingest-weekly-narrative` | Sun 23:30 | **ORPHAN?** function not in deployed list |
| `ingest-yield-curves-daily` | `0 2 * * *` | `ingest-yield-curves` | Daily 02:00 | |
| `refresh-gold-ratios-daily` | `0 7 * * *` | `refresh-gold-ratios` | Daily 07:00 | Orphan? — ran successfully (parse gap likely) |
| `send-weekly-digest-job` | `0 1 * * 1` | `send-weekly-digest` | Mon 01:00 | **ORPHAN?** function not in deployed list; was `SERVICE_ROLE_KEY`-only |

---

## Open Issues to Resolve

| # | Issue | Jobs affected |
|---|---|---|
| F6 | Double-fire: two jobs call `ingest-fiscaldata` 30 min apart | `ingest-fiscaldata`, `ingest-fiscaldata-daily` |
| ORPHAN-confirmed | Functions confirmed absent from deployment | `generate-newsletter-monthly`, `ingest-capital-flows-monthly`, `ingest-country-gmd-supplement-quarterly`, `ingest-g20-sovereign-monthly`, `ingest-institutional-loans-monthly`, `ingest-institutional-loans-weekly`, `ingest-state-fiscal-health-monthly`, `ingest-us-fiscal-stress-monthly`, `ingest-weekly-narrative-weekly`, `send-weekly-digest-job` |
| ORPHAN-parse-gap | Functions likely deployed but absent from parsed list | `gsc-sync-daily`, `ingest-geopolitical-osint`, `ingest-institutional-13f-weekly`, `ingest-mutual-funds-daily`, `ingest-nse-flows-daily`, `refresh-gold-ratios-daily` |

---

## Verification Queries

After applying the migration:

```sql
-- 1. Job count (must equal 101)
SELECT COUNT(*) FROM cron.job;

-- 2. Full diff — paste output, compare to table above
SELECT jobname, schedule FROM cron.job ORDER BY jobname;

-- 3. Next-day health (run 24 h post-apply)
SELECT j.jobname, d.status, d.return_message
  FROM cron.job j
  JOIN cron.job_run_details d ON j.jobid = d.jobid
 WHERE d.start_time > NOW() - INTERVAL '24 hours'
   AND d.status <> 'succeeded';
```

---

## Maintenance

**All cron changes must go through the canonical migration — never via ad-hoc SQL.**

### Amending an existing job or adding a new one

1. Edit the `JOBS` array in [`scripts/generate-canonical-crons.mjs`](../scripts/generate-canonical-crons.mjs).
2. Regenerate the SQL:
   ```bash
   node scripts/generate-canonical-crons.mjs > supabase/migrations/$(date +%Y%m%d%H%M%S)_canonical_crons_v2.sql
   ```
3. Review the diff against the previous canonical file.
4. Apply via Supabase MCP (`mcp__607ea09c__apply_migration`) — **never paste raw SQL into the Supabase Dashboard SQL editor** and **never create a one-off migration** for a single schedule change.

### Removing a job

Remove the entry from the `JOBS` array and regenerate as above. The migration's Step A (`DO $$ … cron.unschedule …`) will drop any job not present in the new Step B.

### Rules

- **Never** run `cron.schedule(…)` or `cron.unschedule(…)` outside of a canonical migration.
- **Never** modify schedules via the Supabase Dashboard → Database → pg_cron UI (changes are not version-controlled).
- Schedule expressions encode upstream API rate-limit knowledge — do not tidy stagger offsets without confirming with the data-source owner.
- Vault secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) must be set in Supabase Dashboard → Vault before the job can authenticate correctly.
