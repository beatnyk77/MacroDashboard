#!/usr/bin/env node
/**
 * generate-canonical-crons.mjs
 *
 * Generates the complete supabase/migrations/20260613000000_canonical_crons.sql
 * by rendering every cron job from the authoritative JOBS list below.
 *
 * Usage:
 *   node scripts/generate-canonical-crons.mjs \
 *     > supabase/migrations/20260613000000_canonical_crons.sql
 *
 * Future amendments: edit the JOBS array, re-run, and replace the migration.
 * Never write ad-hoc cron migrations — amend this source and regenerate.
 *
 * Source: docs/live-state-2026-06.md § 1 (101 active jobs, 2026-06-12)
 */

// ── Constants ──────────────────────────────────────────────────────────────
const PROJECT_REF = 'debdriyzfcwvgrhzzzre';
const BASE_URL    = `https://${PROJECT_REF}.supabase.co/functions/v1/`;
const GENERATED   = new Date().toISOString().slice(0, 10);

// ── Job definitions ────────────────────────────────────────────────────────
// Each entry is one of:
//   { name, schedule, fn, flags? }          → HTTP job (Pattern 1 or 2)
//   { name, schedule, sql, flags? }         → SQL-direct job (Pattern 3)
//
// fn  : edge-function slug, optionally with query-string (e.g. 'ingest-us-macro?task=auctions')
// sql : raw SQL to execute (no net.http_post)
// flags: string[] displayed as inline -- comments before the schedule call

const JOBS = [
  // ── Cache ─────────────────────────────────────────────────────────────
  { name: 'cache-comtrade-weekly',
    schedule: '0 18 * * 6',
    fn: 'cache-comtrade-data' },

  // ── Check / Health ────────────────────────────────────────────────────
  { name: 'check-data-health-daily',
    schedule: '0 7 * * *',
    fn: 'check-data-health' },

  { name: 'check-fomc-minutes-daily',
    schedule: '0 6 */2 * *',
    fn: 'check-fomc-minutes' },

  // ── Compute ───────────────────────────────────────────────────────────
  { name: 'compute-cie-macro-scores-weekly',
    schedule: '0 12 * * 0',
    fn: 'compute-cie-macro-scores' },

  { name: 'compute-daily-macro-signal-daily',
    schedule: '30 6 * * *',
    fn: 'compute-daily-macro-signal' },

  // PATTERN 3 — SQL-direct (no HTTP, no headers)
  { name: 'compute-zscores-daily',
    schedule: '0 6 * * *',
    sql: 'SELECT public.compute_rolling_z_scores();' },

  // ── Generate ──────────────────────────────────────────────────────────
  { name: 'generate-monthly-regime-digest-job',
    schedule: '30 0 1 * *',
    fn: 'generate-monthly-regime-digest',
    flags: ['was GUC current_setting(app.settings.service_role_key) — fixed to vault subselect'] },

  { name: 'generate-morning-brief',
    schedule: '45 6 * * *',
    fn: 'generate-morning-brief' },

  { name: 'generate-newsletter-monthly',
    schedule: '30 0 1 * *',
    fn: 'generate-newsletter',
    flags: ['ORPHAN? function not confirmed in deployed list'] },

  { name: 'generate-weekly-regime-digest-job',
    schedule: '0 23 * * 0',
    fn: 'generate-weekly-regime-digest' },

  // ── GSC ───────────────────────────────────────────────────────────────
  { name: 'gsc-sync-daily',
    schedule: '0 6 * * *',
    fn: 'gsc-sync',
    flags: ['ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)'] },

  // ── Ingest (alphabetical) ─────────────────────────────────────────────
  { name: 'ingest-africa-macro-pulse-job',
    schedule: '0 0 5 * *',
    fn: 'ingest-africa-macro',
    flags: ['was GUC current_setting(vault.service_role_key) — fixed to vault subselect'] },

  { name: 'ingest-bis-reer-monthly',
    schedule: '0 6 15 * *',
    fn: 'ingest-bis-reer' },

  { name: 'ingest-boj-balance-sheet-weekly',
    schedule: '5 10 * * 1',
    fn: 'ingest-boj-balance-sheet' },

  { name: 'ingest-capital-flows-monthly',
    schedule: '0 14 1 * *',
    fn: 'ingest-capital-flows',
    flags: ['ORPHAN? function not in deployed list'] },

  { name: 'ingest-cb-gold-net-quarterly',
    schedule: '0 2 1 1,4,7,10 *',
    fn: 'ingest-cb-gold-net' },

  { name: 'ingest-china-energy-weekly',
    schedule: '0 7 * * 0',
    fn: 'ingest-china-energy' },

  { name: 'ingest-china-macro-daily',
    schedule: '0 3 * * *',
    fn: 'ingest-china-macro' },

  { name: 'ingest-china-real-economy-monthly',
    schedule: '0 11 1 * *',
    fn: 'ingest-china-real-economy' },

  { name: 'ingest-cie-deals-daily',
    schedule: '0 20 * * 1-5',
    fn: 'ingest-cie-deals' },

  { name: 'ingest-cie-fundamentals-daily',
    schedule: '0 18 * * 1-5',
    fn: 'ingest-cie-fundamentals' },

  { name: 'ingest-cie-ipos-daily',
    schedule: '0 22 * * 1-5',
    fn: 'ingest-cie-ipos' },

  { name: 'ingest-cie-promoters-daily',
    schedule: '0 19 * * 1-5',
    fn: 'ingest-cie-promoters' },

  { name: 'ingest-cie-short-selling-daily',
    schedule: '0 21 * * 1-5',
    fn: 'ingest-cie-short-selling' },

  { name: 'ingest-cofer-monthly',
    schedule: '0 2 1 * *',
    fn: 'ingest-cofer' },

  { name: 'ingest-commodity-imports-monthly',
    schedule: '0 7 1 * *',
    fn: 'ingest-commodity-imports' },

  { name: 'ingest-commodity-reserves-weekly',
    schedule: '0 0 * * 0',
    fn: 'ingest-commodity-reserves' },

  { name: 'ingest-commodity-terminal',
    schedule: '30 8 * * 0',
    fn: 'ingest-commodity-terminal' },

  { name: 'ingest-copper-gold-ratio-daily',
    schedule: '0 15 * * *',
    fn: 'ingest-copper-gold-ratio' },

  { name: 'ingest-corporate-debt-maturity-daily',
    schedule: '0 2 * * *',
    fn: 'ingest-corporate-debt-maturities',   // SLUG FIX: live was ingest-corporate-debt-maturity (no 's')
    flags: ['SLUG FIX: live cron called ingest-corporate-debt-maturity (no s); corrected to deployed slug ingest-corporate-debt-maturities'] },

  { name: 'ingest-country-gmd-supplement-quarterly',
    schedule: '0 4 1 1,4,7,10 *',
    fn: 'ingest-country-gmd-supplement',      // URL FIX: live cron called ohefbbvldkoflrcjixow (wrong project)
    flags: ['ORPHAN? function not in deployed list', 'URL FIX: live cron called wrong project ohefbbvldkoflrcjixow — corrected to this project'] },

  { name: 'ingest-currency-wars-monthly',
    schedule: '0 16 1 * *',
    fn: 'ingest-currency-wars' },

  { name: 'ingest-ecb-balance-sheet-weekly',
    schedule: '0 10 * * 1',
    fn: 'ingest-ecb-balance-sheet' },

  { name: 'ingest-energy-global-monthly',
    schedule: '30 2 1 * *',
    fn: 'ingest-energy-global' },

  { name: 'ingest-events-markers-daily',
    schedule: '0 11 * * *',
    fn: 'ingest-events-markers' },

  // F6 DUPLICATE — both jobs fire the same function 30 min apart; resolve separately
  { name: 'ingest-fiscaldata',
    schedule: '0 7 * * *',
    fn: 'ingest-fiscaldata',
    flags: ['F6 DUPLICATE — fires same fn as ingest-fiscaldata-daily (30 min apart); resolve separately'] },

  { name: 'ingest-fiscaldata-daily',
    schedule: '30 6 * * *',
    fn: 'ingest-fiscaldata',
    flags: ['F6 DUPLICATE — fires same fn as ingest-fiscaldata (30 min apart); resolve separately'] },

  { name: 'ingest-fred-daily',
    schedule: '0 6 * * *',
    fn: 'ingest-fred' },

  { name: 'ingest-fuel-security-india-daily',
    schedule: '0 2 * * *',
    fn: 'ingest-fuel-security-india' },

  { name: 'ingest-g20-sovereign-monthly',
    schedule: '0 13 1 * *',
    fn: 'ingest-g20-sovereign',
    flags: ['ORPHAN? function not in deployed list'] },

  { name: 'ingest-geopolitical-osint',
    schedule: '0 */6 * * *',
    fn: 'ingest-geopolitical-osint',
    flags: ['ran 28x/7d — likely deployed; not in parsed deploy list (parse gap)'] },

  { name: 'ingest-gfcf',
    schedule: '30 5 * * *',
    fn: 'ingest-gfcf' },

  { name: 'ingest-global-liquidity-weekly',
    schedule: '15 10 * * 1',
    fn: 'ingest-global-liquidity' },

  { name: 'ingest-global-refining-weekly',
    schedule: '0 3 * * 0',
    fn: 'ingest-global-refining' },

  { name: 'ingest-gold-daily',
    schedule: '0 4 * * *',
    fn: 'ingest-gold' },

  { name: 'ingest-gold-debt-coverage-monthly',
    schedule: '0 8 15 * *',
    fn: 'ingest-gold-debt-coverage' },

  { name: 'ingest-gold-history-daily',
    schedule: '0 5 * * *',
    fn: 'ingest-gold-history' },

  { name: 'ingest-imf',
    schedule: '0 8 * * 0',
    fn: 'ingest-imf' },

  { name: 'ingest-imf-brics-monthly',
    schedule: '0 3 1 * *',
    fn: 'ingest-imf-brics' },

  { name: 'ingest-imf-current-account-monthly',
    schedule: '0 8 20 * *',
    fn: 'ingest-imf-current-account' },

  { name: 'ingest-imf-sdr-monthly',
    schedule: '0 8 1 * *',
    fn: 'ingest-imf-sdr' },

  { name: 'ingest-india-credit-cycle-weekly',
    schedule: '30 5 * * 0',
    fn: 'ingest-india-credit-cycle' },

  { name: 'ingest-india-debt-maturities-monthly',
    schedule: '0 6 1 * *',
    fn: 'ingest-india-debt-maturities' },

  { name: 'ingest-india-digitization-monthly',
    schedule: '0 8 1 * *',
    fn: 'ingest-india-digitization' },

  { name: 'ingest-india-energy-weekly',
    schedule: '0 0 * * 0',
    fn: 'ingest-energy',                      // NOTE: calls ingest-energy, not ingest-india-energy
    flags: ['NOTE: calls ingest-energy (not ingest-india-energy) — preserved from live state'] },

  { name: 'ingest-india-fiscal-allocation-monthly',
    schedule: '0 9 1 * *',
    fn: 'ingest-india-fiscal-allocation' },

  { name: 'ingest-india-fiscal-stress-monthly',
    schedule: '0 11 5 * *',
    fn: 'ingest-india-fiscal-stress' },

  { name: 'ingest-india-inflation-monthly',
    schedule: '0 7 1 * *',
    fn: 'ingest-india-inflation' },

  { name: 'ingest-india-liquidity-daily',
    schedule: '0 15 * * 1-5',
    fn: 'ingest-india-liquidity' },

  { name: 'ingest-india-macro-snapshot-job',
    schedule: '0 0 4 * *',
    fn: 'ingest-india-macro-snapshot',
    flags: ['was GUC current_setting(vault.service_role_key) — fixed to vault subselect'] },

  { name: 'ingest-india-market-pulse-daily',
    schedule: '0 14 * * 1-5',
    fn: 'ingest-market-pulse',                // NOTE: calls ingest-market-pulse, not ingest-india-market-pulse
    flags: ['NOTE: calls ingest-market-pulse (not ingest-india-market-pulse) — preserved from live state'] },

  { name: 'ingest-institutional-13f-weekly',
    schedule: '0 3 * * 0',
    fn: 'ingest-institutional-13f',
    flags: ['ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)'] },

  { name: 'ingest-institutional-loans-monthly',
    schedule: '0 4 1 * *',
    fn: 'ingest-institutional-loans',
    flags: ['ORPHAN? function not in deployed list'] },

  { name: 'ingest-institutional-loans-weekly',
    schedule: '0 1 * * 0',
    fn: 'ingest-institutional-loans',
    flags: ['ORPHAN? function not in deployed list'] },

  { name: 'ingest-macro-news-headlines',
    schedule: '0 */6 * * *',
    fn: 'ingest-macro-news-headlines' },

  { name: 'ingest-major-economies-monthly',
    schedule: '0 12 1 * *',
    fn: 'ingest-major-economies' },

  { name: 'ingest-market-pulse-daily',
    schedule: '0 1 * * *',
    fn: 'ingest-market-pulse' },

  { name: 'ingest-mospi',
    schedule: '0 7 * * *',
    fn: 'ingest-mospi' },

  { name: 'ingest-mutual-funds-daily',
    schedule: '30 14 * * *',
    fn: 'ingest-mutual-funds',
    flags: ['ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)'] },

  { name: 'ingest-nse-flows-daily',
    schedule: '30 13 * * 1-5',
    fn: 'ingest-nse-flows',
    flags: ['ORPHAN? not in parsed deploy list; ran successfully 7d — likely deployed (parse gap)'] },

  { name: 'ingest-nyfed-markets-daily',
    schedule: '0 12 * * *',
    fn: 'ingest-nyfed-markets' },

  { name: 'ingest-oecd-cli-monthly',
    schedule: '0 9 10 * *',
    fn: 'ingest-oecd-cli' },

  { name: 'ingest-oil-eia-weekly',
    schedule: '30 16 * * 3',
    fn: 'ingest-oil-eia' },

  { name: 'ingest-oil-global-weekly',
    schedule: '0 5 * * 0',
    fn: 'ingest-oil-global' },

  { name: 'ingest-oil-india-china-weekly',
    schedule: '0 6 * * 0',
    fn: 'ingest-oil-india-china' },

  { name: 'ingest-oil-spread-daily',
    schedule: '0 5 * * 1-5',
    fn: 'ingest-oil-spread' },

  { name: 'ingest-pboc-liquidity-daily',
    schedule: '0 2 * * *',
    fn: 'ingest-pboc-liquidity' },

  { name: 'ingest-precious-divergence-daily',
    schedule: '0 19 * * *',
    fn: 'ingest-precious-divergence' },

  { name: 'ingest-rbi-money-market-daily',
    schedule: '0 15 * * 1-5',
    fn: 'ingest-rbi-money-market' },

  { name: 'ingest-state-fiscal-health-monthly',
    schedule: '0 10 1 * *',
    fn: 'ingest-state-fiscal-health',
    flags: ['ORPHAN? function not in deployed list'] },

  { name: 'ingest-tic-foreign-holders',
    schedule: '0 10 * * 0',
    fn: 'ingest-tic-foreign-holders' },

  { name: 'ingest-trade-global-monthly',
    schedule: '30 6 15 * *',
    fn: 'ingest-trade-global' },

  { name: 'ingest-trade-imports-weekly',
    schedule: '0 7 * * 0',
    fn: 'ingest-trade-imports',
    flags: ['was SERVICE_ROLE_KEY-only vault lookup — normalised to COALESCE'] },

  { name: 'ingest-trade-intelligence-pulse',
    schedule: '0 5 * * 0',
    fn: 'ingest-trade-global-pulse' },

  // PATTERN 2 — URL query params
  { name: 'ingest-un-comtrade-weekly',
    schedule: '0 6 * * 0',
    fn: 'ingest-un-comtrade?hsCode=8542&category=Semiconductors',
    flags: ['PATTERN 2 (query params); was SERVICE_ROLE_KEY-only vault lookup — normalised to COALESCE'] },

  { name: 'ingest-upi-autopay-daily',
    schedule: '30 8 * * *',
    fn: 'ingest-upi-autopay' },

  { name: 'ingest-us-debt-maturities-monthly',
    schedule: '0 14 8 * *',
    fn: 'ingest-us-debt-maturities' },

  { name: 'ingest-us-debt-maturities-monthly-retry',
    schedule: '0 14 10 * *',
    fn: 'ingest-us-debt-maturities' },

  { name: 'ingest-us-fiscal-stress-monthly',
    schedule: '0 10 5 * *',
    fn: 'ingest-us-fiscal-stress',
    flags: ['ORPHAN? function not in deployed list'] },

  // PATTERN 2 — URL query params (already shown as example in skeleton; included in full list)
  { name: 'ingest-us-macro-auctions-daily',
    schedule: '30 2 * * *',
    fn: 'ingest-us-macro?task=auctions' },

  { name: 'ingest-us-macro-daily',
    schedule: '0 3 * * *',
    fn: 'ingest-us-macro' },

  { name: 'ingest-us-macro-fiscal-daily',
    schedule: '0 2 * * *',
    fn: 'ingest-us-macro?task=fiscal' },

  { name: 'ingest-us-macro-fred-daily',
    schedule: '20 2 * * *',
    fn: 'ingest-us-macro?task=fred' },

  { name: 'ingest-us-macro-ust-daily',
    schedule: '10 2 * * *',
    fn: 'ingest-us-macro?task=ust' },

  { name: 'ingest-us-macro-weekly',
    schedule: '0 0 * * 1',
    fn: 'ingest-us-macro',
    flags: ['CRITICAL F3 FIX: live cron had hardcoded JWT in command — replaced with vault subselect'] },

  { name: 'ingest-us-treasury-auctions-monthly',
    schedule: '0 10 5 * *',
    fn: 'ingest-us-treasury-auctions' },

  { name: 'ingest-us-treasury-auctions-weekly',
    schedule: '0 9 * * 1',
    fn: 'ingest-us-treasury-auctions' },

  { name: 'ingest-weekly-narrative-weekly',
    schedule: '30 23 * * 0',
    fn: 'ingest-weekly-narrative',
    flags: ['ORPHAN? function not in deployed list'] },

  { name: 'ingest-yield-curves-daily',
    schedule: '0 2 * * *',
    fn: 'ingest-yield-curves' },

  // ── Refresh ───────────────────────────────────────────────────────────
  { name: 'refresh-gold-ratios-daily',
    schedule: '0 7 * * *',
    fn: 'refresh-gold-ratios',
    flags: ['ran 4x/7d — likely deployed; not in parsed deploy list (parse gap)'] },

  // ── Send ──────────────────────────────────────────────────────────────
  { name: 'send-weekly-digest-job',
    schedule: '0 1 * * 1',
    fn: 'send-weekly-digest',
    flags: ['ORPHAN? function not in deployed list; was SERVICE_ROLE_KEY-only — normalised to COALESCE'] },
];

// ── Validate no duplicate job names ───────────────────────────────────────
const names = JOBS.map(j => j.name);
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
if (dupes.length) {
  process.stderr.write(`ERROR: duplicate job names: ${dupes.join(', ')}\n`);
  process.exit(1);
}

// ── Renderers ─────────────────────────────────────────────────────────────
function renderHttpJob(job) {
  const url = `${BASE_URL}${job.fn}`;
  const flagLines = (job.flags ?? []).map(f => `-- ${f}`).join('\n') + (job.flags?.length ? '\n' : '');
  return `${flagLines}SELECT cron.schedule(
  '${job.name}',
  '${job.schedule}',
  $job$
  SELECT net.http_post(
    url     := '${url}',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1),
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'          LIMIT 1)
      ),
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $job$
);`;
}

function renderSqlJob(job) {
  const flagLines = (job.flags ?? []).map(f => `-- ${f}`).join('\n') + (job.flags?.length ? '\n' : '');
  return `${flagLines}-- PATTERN 3 (SQL-direct — no HTTP)
SELECT cron.schedule(
  '${job.name}',
  '${job.schedule}',
  $job$${job.sql}$job$
);`;
}

function renderJob(job) {
  return job.sql ? renderSqlJob(job) : renderHttpJob(job);
}

// ── File sections ─────────────────────────────────────────────────────────
const HEADER = `-- ============================================================
-- SINGLE SOURCE OF TRUTH — all future cron changes happen by
-- amending and re-running this pattern, never in ad-hoc migrations.
-- ============================================================
-- Migration  : 20260613000000_canonical_crons.sql
-- Generated  : ${GENERATED} via scripts/generate-canonical-crons.mjs
-- Project    : ${PROJECT_REF}  (MacroIntelligence_GraphiQuestor)
-- Source     : docs/live-state-2026-06.md — 101 active jobs as of 2026-06-12
--
-- PURPOSE
-- Replaces every ad-hoc cron migration since 2026-01 with one canonical file.
-- All 101 live jobs are re-registered after an explicit full unschedule sweep.
--
-- CHANGES FROM LIVE STATE
--   1. Normalises all vault patterns to safe jsonb_build_object + COALESCE
--      subselect (fixes GUC pattern on jobs 436, 437, 377, 371; hardcoded JWT
--      on job 372; and SERVICE_ROLE_KEY-only on jobs 432, 430, 428, 439).
--   2. Adds x-cron-secret header to all HTTP-based jobs — header-first,
--      enforcement-second (enforcement is conditional per Task 1.2; a blank
--      CRON_SECRET value is inert until the real value is set in vault).
--   3. Fixes wrong project URL on ingest-country-gmd-supplement-quarterly
--      (was ohefbbvldkoflrcjixow, corrected to ${PROJECT_REF} — but the
--      function is still flagged ORPHAN as it is not in the deployed list).
--   4. Fixes slug typo on ingest-corporate-debt-maturity-daily
--      (was /ingest-corporate-debt-maturity, corrected to
--      /ingest-corporate-debt-maturities which is the deployed slug).
--   5. Schedule expressions preserved EXACTLY from live snapshot — the time
--      stagger encodes upstream rate-limit knowledge; do not tidy.
--
-- VAULT SECRETS
--   SUPABASE_SERVICE_ROLE_KEY  — primary (78 live jobs used this)
--   SERVICE_ROLE_KEY           — fallback (4 live jobs used this alone)
--   CRON_SECRET                — new; guarded creation below (blank placeholder,
--                                must be set via Supabase Dashboard → Vault
--                                before enforcement is enabled on functions)
--
-- ANOMALIES RESOLVED
--   F3  ingest-us-macro-weekly — hardcoded JWT replaced with vault pattern
--   F4  ingest-country-gmd-supplement-quarterly — wrong project URL fixed
--   F5  ingest-corporate-debt-maturity-daily — slug typo fixed
--   F6  ingest-fiscaldata double-fire — both jobs preserved (resolve separately)
--
-- ORPHAN JOBS (function not confirmed deployed — included, flagged inline)
--   Confirmed absent: generate-newsletter-monthly, ingest-capital-flows-monthly,
--     ingest-country-gmd-supplement-quarterly, ingest-g20-sovereign-monthly,
--     ingest-institutional-loans-monthly/-weekly, ingest-state-fiscal-health-monthly,
--     ingest-us-fiscal-stress-monthly, ingest-weekly-narrative-weekly, send-weekly-digest-job
--   Likely deployed (parse gap — all ran successfully in last 7 days):
--     gsc-sync-daily, ingest-geopolitical-osint, ingest-institutional-13f-weekly,
--     ingest-mutual-funds-daily, ingest-nse-flows-daily, refresh-gold-ratios-daily
-- ============================================================`;

const STEP0 = `
-- ── STEP 0 ── Guard: ensure CRON_SECRET exists in vault ──────────────
-- Creates a blank placeholder if the entry is absent.
-- The empty value is inert — enforcement in functions checks for a non-empty
-- match, so leaving this blank is zero-downtime until you're ready to enforce.
-- To activate: set the real value via Supabase Dashboard → Vault, then set
-- CRON_SECRET as a function env var (Task 1.2).
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET'
  ) THEN
    PERFORM vault.create_secret(
      '',             -- secret value (blank placeholder)
      'CRON_SECRET',  -- name
      'Shared secret for x-cron-secret cron-auth header. '
      'Replace blank value via Supabase Dashboard → Vault before enabling enforcement.'
    );
    RAISE NOTICE 'Created blank CRON_SECRET vault entry. Set a real value before enabling enforcement.';
  END IF;
END $$;`;

const STEP_A = `
-- ── STEP A ── Unschedule every active job ────────────────────────────
-- Explicit full sweep — do NOT rely on same-name cron.schedule replacing
-- silently; behaviour differs across pg_cron versions.
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobname FROM cron.job LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
END $$;`;

const STEP_B_HEADER = `
-- ── STEP B ── Reschedule all ${JOBS.length} jobs ─────────────────────────────────────
-- Auth    : COALESCE vault subselect (safe — no string concatenation into ::jsonb)
-- Headers : x-cron-secret for future enforcement (currently inert if blank)
-- Slots   : Exactly as in live snapshot — do not adjust without upstream consent.
-- Timeout : 120 000 ms on all HTTP jobs
-- ─────────────────────────────────────────────────────────────────────`;

const FOOTER = `
-- ── Verification ─────────────────────────────────────────────────────
-- Run after applying this migration:
--
--   SELECT COUNT(*) FROM cron.job;
--   -- Expected: ${JOBS.length}
--
--   SELECT jobname, schedule FROM cron.job ORDER BY jobname;
--   -- Diff against JOBS array in scripts/generate-canonical-crons.mjs
--
-- Next-day health check (run 24 h after apply):
--   SELECT j.jobname, d.status, d.return_message
--     FROM cron.job j
--     JOIN cron.job_run_details d ON j.jobid = d.jobid
--    WHERE d.start_time > NOW() - INTERVAL '24 hours'
--      AND d.status <> 'succeeded';
-- ─────────────────────────────────────────────────────────────────────`;

// ── Render and emit ────────────────────────────────────────────────────────
const parts = [
  HEADER,
  STEP0,
  STEP_A,
  STEP_B_HEADER,
  '',
  ...JOBS.map(renderJob),
  FOOTER,
];

process.stdout.write(parts.join('\n\n') + '\n');
process.stderr.write(`Generated ${JOBS.length} cron jobs.\n`);
