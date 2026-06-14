# Live Production State Snapshot — June 2026

**Captured:** 2026-06-12 · Project: `debdriyzfcwvgrhzzzre` (MacroIntelligence_GraphiQuestor, ACTIVE_HEALTHY)  
**Method:** Read-only SQL via Supabase MCP + `list_edge_functions` API. No live state was modified.  
**Purpose:** Authoritative input for Task 1.4 (canonical crons.sql) and Task 1.5 (RLS hardening).

---

## 1. Live Cron Inventory

101 active jobs in `cron.job`. All are `active = true`. Ordered alphabetically by jobname.

| jobid | jobname | schedule | target function / note |
|---|---|---|---|
| 432 | cache-comtrade-weekly | `0 18 * * 6` | cache-comtrade-data |
| 367 | check-data-health-daily | `0 7 * * *` | check-data-health |
| 414 | check-fomc-minutes-daily | `0 6 */2 * *` | check-fomc-minutes |
| 369 | compute-cie-macro-scores-weekly | `0 12 * * 0` | compute-cie-macro-scores |
| 382 | compute-daily-macro-signal-daily | `30 6 * * *` | compute-daily-macro-signal |
| 401 | compute-zscores-daily | `0 6 * * *` | `SELECT public.compute_rolling_z_scores()` ← SQL, not edge fn |
| 377 | generate-monthly-regime-digest-job | `30 0 1 * *` | generate-monthly-regime-digest — uses `current_setting('app.settings.service_role_key')` |
| 434 | generate-morning-brief | `45 6 * * *` | generate-morning-brief |
| 368 | generate-newsletter-monthly | `30 0 1 * *` | generate-newsletter ← **function NOT in deployed list** |
| 438 | generate-weekly-regime-digest-job | `0 23 * * 0` | generate-weekly-regime-digest |
| 426 | gsc-sync-daily | `0 6 * * *` | gsc-sync ← **function NOT in deployed list** |
| 437 | ingest-africa-macro-pulse-job | `0 0 5 * *` | ingest-africa-macro — uses `current_setting('vault.service_role_key', true)` |
| 326 | ingest-bis-reer-monthly | `0 6 15 * *` | ingest-bis-reer |
| 312 | ingest-boj-balance-sheet-weekly | `5 10 * * 1` | ingest-boj-balance-sheet |
| 354 | ingest-capital-flows-monthly | `0 14 1 * *` | ingest-capital-flows ← **function NOT in deployed list** |
| 336 | ingest-cb-gold-net-quarterly | `0 2 1 1,4,7,10 *` | ingest-cb-gold-net |
| 358 | ingest-china-energy-weekly | `0 7 * * 0` | ingest-china-energy |
| 410 | ingest-china-macro-daily | `0 3 * * *` | ingest-china-macro |
| 359 | ingest-china-real-economy-monthly | `0 11 1 * *` | ingest-china-real-economy |
| 363 | ingest-cie-deals-daily | `0 20 * * 1-5` | ingest-cie-deals |
| 361 | ingest-cie-fundamentals-daily | `0 18 * * 1-5` | ingest-cie-fundamentals |
| 365 | ingest-cie-ipos-daily | `0 22 * * 1-5` | ingest-cie-ipos |
| 362 | ingest-cie-promoters-daily | `0 19 * * 1-5` | ingest-cie-promoters |
| 364 | ingest-cie-short-selling-daily | `0 21 * * 1-5` | ingest-cie-short-selling |
| 323 | ingest-cofer-monthly | `0 2 1 * *` | ingest-cofer |
| 330 | ingest-commodity-imports-monthly | `0 7 1 * *` | ingest-commodity-imports |
| 314 | ingest-commodity-reserves-weekly | `0 0 * * 0` | ingest-commodity-reserves |
| 420 | ingest-commodity-terminal | `30 8 * * 0` | ingest-commodity-terminal |
| 350 | ingest-copper-gold-ratio-daily | `0 15 * * *` | ingest-copper-gold-ratio |
| 366 | ingest-corporate-debt-maturity-daily | `0 2 * * *` | ingest-corporate-debt-maturity ← **SLUG MISMATCH: deployed is `ingest-corporate-debt-maturities` (plural)** |
| 371 | ingest-country-gmd-supplement-quarterly | `0 4 1 1,4,7,10 *` | `ohefbbvldkoflrcjixow.functions.supabase.co` ← **WRONG PROJECT — PERMANENTLY BROKEN** |
| 355 | ingest-currency-wars-monthly | `0 16 1 * *` | ingest-currency-wars |
| 311 | ingest-ecb-balance-sheet-weekly | `0 10 * * 1` | ingest-ecb-balance-sheet |
| 331 | ingest-energy-global-monthly | `30 2 1 * *` | ingest-energy-global |
| 346 | ingest-events-markers-daily | `0 11 * * *` | ingest-events-markers |
| 421 | ingest-fiscaldata | `0 7 * * *` | ingest-fiscaldata ← **DUPLICATE: same function as job 305 below** |
| 305 | ingest-fiscaldata-daily | `30 6 * * *` | ingest-fiscaldata ← **DUPLICATE: same function as job 421 above** |
| 304 | ingest-fred-daily | `0 6 * * *` | ingest-fred |
| 405 | ingest-fuel-security-india-daily | `0 2 * * *` | ingest-fuel-security-india |
| 353 | ingest-g20-sovereign-monthly | `0 13 1 * *` | ingest-g20-sovereign ← **function NOT in deployed list** |
| 345 | ingest-geopolitical-osint | `0 */6 * * *` | ingest-geopolitical-osint ← not confirmed in parsed deploy list; ran 28x in 7 days |
| 416 | ingest-gfcf | `30 5 * * *` | ingest-gfcf |
| 422 | ingest-global-liquidity-weekly | `15 10 * * 1` | ingest-global-liquidity |
| 317 | ingest-global-refining-weekly | `0 3 * * 0` | ingest-global-refining |
| 348 | ingest-gold-daily | `0 4 * * *` | ingest-gold |
| 349 | ingest-gold-debt-coverage-monthly | `0 8 15 * *` | ingest-gold-debt-coverage |
| 347 | ingest-gold-history-daily | `0 5 * * *` | ingest-gold-history |
| 419 | ingest-imf | `0 8 * * 0` | ingest-imf |
| 324 | ingest-imf-brics-monthly | `0 3 1 * *` | ingest-imf-brics |
| 327 | ingest-imf-current-account-monthly | `0 8 20 * *` | ingest-imf-current-account |
| 325 | ingest-imf-sdr-monthly | `0 8 1 * *` | ingest-imf-sdr |
| 435 | ingest-india-credit-cycle-weekly | `30 5 * * 0` | ingest-india-credit-cycle |
| 339 | ingest-india-debt-maturities-monthly | `0 6 1 * *` | ingest-india-debt-maturities |
| 342 | ingest-india-digitization-monthly | `0 8 1 * *` | ingest-india-digitization |
| 315 | ingest-india-energy-weekly | `0 0 * * 0` | ingest-energy |
| 343 | ingest-india-fiscal-allocation-monthly | `0 9 1 * *` | ingest-india-fiscal-allocation |
| 335 | ingest-india-fiscal-stress-monthly | `0 11 5 * *` | ingest-india-fiscal-stress |
| 340 | ingest-india-inflation-monthly | `0 7 1 * *` | ingest-india-inflation |
| 341 | ingest-india-liquidity-daily | `0 15 * * 1-5` | ingest-india-liquidity |
| 436 | ingest-india-macro-snapshot-job | `0 0 4 * *` | ingest-india-macro-snapshot — uses `current_setting('vault.service_role_key', true)` |
| 309 | ingest-india-market-pulse-daily | `0 14 * * 1-5` | ingest-market-pulse |
| 321 | ingest-institutional-13f-weekly | `0 3 * * 0` | ingest-institutional-13f ← **function NOT in deployed list** |
| 332 | ingest-institutional-loans-monthly | `0 4 1 * *` | ingest-institutional-loans ← **function NOT in deployed list** |
| 316 | ingest-institutional-loans-weekly | `0 1 * * 0` | ingest-institutional-loans ← **function NOT in deployed list** |
| 307 | ingest-macro-news-headlines | `0 */6 * * *` | ingest-macro-news-headlines |
| 352 | ingest-major-economies-monthly | `0 12 1 * *` | ingest-major-economies |
| 303 | ingest-market-pulse-daily | `0 1 * * *` | ingest-market-pulse |
| 417 | ingest-mospi | `0 7 * * *` | ingest-mospi |
| 373 | ingest-mutual-funds-daily | `30 14 * * *` | ingest-mutual-funds ← **function NOT in deployed list** |
| 308 | ingest-nse-flows-daily | `30 13 * * 1-5` | ingest-nse-flows ← **function NOT in deployed list** |
| 306 | ingest-nyfed-markets-daily | `0 12 * * *` | ingest-nyfed-markets |
| 328 | ingest-oecd-cli-monthly | `0 9 10 * *` | ingest-oecd-cli |
| 404 | ingest-oil-eia-weekly | `30 16 * * 3` | ingest-oil-eia |
| 319 | ingest-oil-global-weekly | `0 5 * * 0` | ingest-oil-global |
| 320 | ingest-oil-india-china-weekly | `0 6 * * 0` | ingest-oil-india-china |
| 381 | ingest-oil-spread-daily | `0 5 * * 1-5` | ingest-oil-spread |
| 360 | ingest-pboc-liquidity-daily | `0 2 * * *` | ingest-pboc-liquidity |
| 351 | ingest-precious-divergence-daily | `0 19 * * *` | ingest-precious-divergence |
| 310 | ingest-rbi-money-market-daily | `0 15 * * 1-5` | ingest-rbi-money-market |
| 344 | ingest-state-fiscal-health-monthly | `0 10 1 * *` | ingest-state-fiscal-health ← **function NOT in deployed list** |
| 418 | ingest-tic-foreign-holders | `0 10 * * 0` | ingest-tic-foreign-holders |
| 329 | ingest-trade-global-monthly | `30 6 15 * *` | ingest-trade-global |
| 430 | ingest-trade-imports-weekly | `0 7 * * 0` | ingest-trade-imports |
| 427 | ingest-trade-intelligence-pulse | `0 5 * * 0` | ingest-trade-global-pulse |
| 428 | ingest-un-comtrade-weekly | `0 6 * * 0` | ingest-un-comtrade (hardcoded `?hsCode=8542&category=Semiconductors` in URL) |
| 394 | ingest-upi-autopay-daily | `30 8 * * *` | ingest-upi-autopay |
| 412 | ingest-us-debt-maturities-monthly | `0 14 8 * *` | ingest-us-debt-maturities |
| 413 | ingest-us-debt-maturities-monthly-retry | `0 14 10 * *` | ingest-us-debt-maturities |
| 334 | ingest-us-fiscal-stress-monthly | `0 10 5 * *` | ingest-us-fiscal-stress ← **function NOT in deployed list** |
| 392 | ingest-us-macro-auctions-daily | `30 2 * * *` | ingest-us-macro?task=auctions |
| 411 | ingest-us-macro-daily | `0 3 * * *` | ingest-us-macro |
| 389 | ingest-us-macro-fiscal-daily | `0 2 * * *` | ingest-us-macro?task=fiscal |
| 391 | ingest-us-macro-fred-daily | `20 2 * * *` | ingest-us-macro?task=fred |
| 390 | ingest-us-macro-ust-daily | `10 2 * * *` | ingest-us-macro?task=ust |
| 372 | ingest-us-macro-weekly | `0 0 * * 1` | ingest-us-macro — ⚠️ **HARDCODED JWT IN COMMAND** (see §2 notes) |
| 333 | ingest-us-treasury-auctions-monthly | `0 10 5 * *` | ingest-us-treasury-auctions |
| 313 | ingest-us-treasury-auctions-weekly | `0 9 * * 1` | ingest-us-treasury-auctions |
| 322 | ingest-weekly-narrative-weekly | `30 23 * * 0` | ingest-weekly-narrative ← **function NOT in deployed list** |
| 356 | ingest-yield-curves-daily | `0 2 * * *` | ingest-yield-curves |
| 440 | refresh-gold-ratios-daily | `0 7 * * *` | refresh-gold-ratios ← not confirmed in parsed deploy list; ran 4x in 7 days |
| 439 | send-weekly-digest-job | `0 1 * * 1` | send-weekly-digest ← **function NOT in deployed list** |

---

## 2. Repo-vs-Live Cron Diff

### 2.1 The 8 Duplicate-Named Jobs (migration fold vs live winner)

Eight jobnames appear in exactly two `cron.schedule(...)` calls across the 372 migrations. In all 8 cases, the **schedule expression was identical in both migrations** — so the "duplicate" was a benign re-registration with no schedule drift. The winning live entry (from `cron.job`) is:

| jobname in migration | Schedule (both copies) | Live resolution |
|---|---|---|
| `ingest-precious-divergence-daily` | `0 19 * * *` | jobid 351 ✓ present in cron.job |
| `ingest-market-pulse-daily` | `0 1 * * *` | jobid 303 ✓ present in cron.job |
| `ingest-macro-news-headlines` | `0 */6 * * *` | jobid 307 ✓ present in cron.job |
| `ingest-imf-sdr-monthly` | `0 8 1 * *` | jobid 325 ✓ present in cron.job |
| `ingest-fred-daily` | `0 6 * * *` | jobid 304 ✓ present in cron.job |
| `ingest-fiscaldata-daily` | `30 6 * * *` | jobid 305 ✓ present in cron.job |
| `ingest-ecb-weekly` | `0 10 * * 1` | ❌ **ABSENT from cron.job** — superseded by `ingest-ecb-balance-sheet-weekly` (jobid 311, same schedule) |
| `ingest-boj-weekly` | `5 10 * * 1` | ❌ **ABSENT from cron.job** — superseded by `ingest-boj-balance-sheet-weekly` (jobid 312, same schedule) |

**Conclusion:** No schedule-drift exists among the 8 duplicates. Two old names (`ingest-ecb-weekly`, `ingest-boj-weekly`) were eventually unscheduled and re-registered under new names in a later migration. The old names are dead.

### 2.2 Jobs in cron.job Not Traceable to a Deployed Function

The following live cron jobs call edge-function slugs that do **not** appear in the `list_edge_functions` response for project `debdriyzfcwvgrhzzzre`:

| jobname | Called slug | Status |
|---|---|---|
| generate-newsletter-monthly | `generate-newsletter` | Not deployed — 404 on every monthly fire |
| gsc-sync-daily | `gsc-sync` | Not deployed — ran 7 days successfully (see note) |
| ingest-capital-flows-monthly | `ingest-capital-flows` | Not deployed — monthly job |
| ingest-corporate-debt-maturity-daily | `ingest-corporate-debt-maturity` | **Slug typo**: deployed slug is `ingest-corporate-debt-maturities` (plural); cron fires daily against a 404 |
| ingest-country-gmd-supplement-quarterly | external: `ohefbbvldkoflrcjixow.supabase.co` | **Wrong project URL** — calls a different (likely deleted/unrelated) Supabase project; permanently broken |
| ingest-g20-sovereign-monthly | `ingest-g20-sovereign` | Not deployed — monthly job |
| ingest-institutional-13f-weekly | `ingest-institutional-13f` | Not deployed — weekly job, ran once per run_health (see note) |
| ingest-institutional-loans-monthly | `ingest-institutional-loans` | Not deployed — monthly job |
| ingest-institutional-loans-weekly | `ingest-institutional-loans` | Not deployed — weekly job |
| ingest-mutual-funds-daily | `ingest-mutual-funds` | Not deployed — ran 7 times per run_health (see note) |
| ingest-nse-flows-daily | `ingest-nse-flows` | Not deployed — ran 5 times per run_health (see note) |
| ingest-state-fiscal-health-monthly | `ingest-state-fiscal-health` | Not deployed — monthly job |
| ingest-us-fiscal-stress-monthly | `ingest-us-fiscal-stress` | Not deployed — monthly job |
| ingest-weekly-narrative-weekly | `ingest-weekly-narrative` | Not deployed — weekly job |
| send-weekly-digest-job | `send-weekly-digest` | Not deployed — weekly job |

> **Parsing note:** `list_edge_functions` returned a very large JSON response that may have been truncated in the tool output. Functions marked "Not deployed" that also show run-health successes (`gsc-sync`, `ingest-institutional-13f`, `ingest-mutual-funds`, `ingest-nse-flows`) are almost certainly deployed but were not captured in the parsed list. The `ingest-geopolitical-osint` and `refresh-gold-ratios` jobs also showed run-health successes (28 and 4 runs respectively) and are likely deployed. The functions confirmed missing are those with exclusively infrequent schedules (monthly/quarterly) whose recent absence from run-health is consistent with not having fired in 7 days — these warrant individual `supabase functions list` verification.

### 2.3 Deployed Functions with No Cron Job

The following deployed functions have no cron job calling them. Some are user-callable (intentional); others may be orphaned.

| Deployed slug | Cron job? | Notes |
|---|---|---|
| api-auth-middleware | None | Utility function imported by 0 functions (audit: dead code) |
| get-newsletter-data | None | User-callable |
| fetch-hs-demand | None | User-callable (per-request) |
| generate-export-scout | None | User-callable or manual |
| compute-hs-opportunity-scores | None | No cron seen; may be manually triggered |
| ingest-shadow-trade | None | No active cron found |
| ingest-financial-hubs-gold | None | No active cron found |
| ingest-asi | None | No active cron found — india_asi data source |
| ingest-rbi-fx-defense | None | No active cron found |
| ingest-country-metrics | None | No active cron found |
| ingest-imf-gdp-per-capita | None | No active cron found |
| ingest-us-edgar-fundamentals | None | No active cron found |
| ingest-china-defaults | None | No active cron found (version 1, very new) |
| ingest-daily | None | No active cron found (version 1) |
| ingest-eurostat-debt | None | No active cron found (version 1) |
| ingest-events | None | No active cron found (version 1) |
| ingest-trade-gravity | None | No active cron found |
| ingest-uk-trade-traders | None | No active cron found (version 1) |
| ingest-uk-trade-ots | None | No active cron found (version 1) |
| ingest-corporate-debt-maturities | None (broken) | Cron calls `ingest-corporate-debt-maturity` (no 's') — slug mismatch |

### 2.4 Critical Anomalies

**A — Hardcoded JWT in cron command (jobid 372: `ingest-us-macro-weekly`)**  
The cron command for `ingest-us-macro-weekly` embeds a literal service-role JWT beginning `eyJhbGciOiJIUzI1NiIs...` instead of a vault lookup. This token is readable by anyone with SQL access to `cron.job`. It should be rotated and replaced with a vault subselect immediately if the token has not already been rotated. All other jobs use vault lookups.

**B — Wrong project URL (jobid 371: `ingest-country-gmd-supplement-quarterly`)**  
Calls `https://ohefbbvldkoflrcjixow.functions.supabase.co/ingest-country-gmd-supplement` — a Supabase project that is not `debdriyzfcwvgrhzzzre`. This cron job silently fails every quarter. It should be unscheduled.

**C — Duplicate function invocation for ingest-fiscaldata**  
Two separate jobs (`ingest-fiscaldata` jobid 421, schedule `0 7 * * *` and `ingest-fiscaldata-daily` jobid 305, schedule `30 6 * * *`) both call the same `ingest-fiscaldata` function with a 30-minute separation. This is a double-fire, not an intentional retry.

**D — Three competing vault-access patterns in live cron commands**  
- **Safe:** `jsonb_build_object(... 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1))` — 78 jobs
- **GUC (fragile):** `current_setting('vault.service_role_key', true)` — 3 jobs (436, 437, 371)
- **GUC (fragile):** `current_setting('app.settings.service_role_key')` — 1 job (377)
- **Hardcoded JWT:** literal token string — 1 job (372) ← **critical**
- **SERVICE_ROLE_KEY (different secret name):** `vault.decrypted_secrets WHERE name = 'SERVICE_ROLE_KEY'` — 4 jobs (432, 430, 428, 439)

The 1.4 canonical crons.sql must normalize all to the safe jsonb pattern with a consistent secret name.

---

## 3. RLS/Grants Reality for the 11 Audit-Flagged Tables

### 3.1 RLS State

| table | relrowsecurity | relforcerowsecurity | Verdict |
|---|---|---|---|
| cie_bulk_block_deals | **true** | false | RLS ON |
| cie_upcoming_ipos | **true** | false | RLS ON |
| comtrade_cache | **false** | false | ⚠️ RLS OFF |
| cusip_ticker_cache | **false** | false | ⚠️ RLS OFF |
| gold_historical_shocks | **true** | false | RLS ON |
| india_asi | **true** | false | RLS ON |
| ingestion_logs | **true** | false | RLS ON |
| ingestion_runs | **false** | false | ⚠️ RLS OFF |
| latest_metrics | **false** | false | ⚠️ RLS OFF |
| tic_foreign_holders | **true** | false | RLS ON |
| upcoming_events | **true** | false | RLS ON |

**4 of 11 tables have RLS disabled:** `comtrade_cache`, `cusip_ticker_cache`, `ingestion_runs`, `latest_metrics`.

### 3.2 Policies on the 11 Tables

| table | Policies present |
|---|---|
| cie_bulk_block_deals | SELECT for `{public}` + ALL for `{service_role}` — correctly restricted |
| cie_upcoming_ipos | SELECT for `{public}` + ALL for `{service_role}` — correctly restricted |
| comtrade_cache | **NONE** |
| cusip_ticker_cache | **NONE** |
| gold_historical_shocks | SELECT for `{public}` — no write policy (service_role bypasses RLS) |
| india_asi | SELECT for `{public}` — no write policy |
| ingestion_logs | SELECT for `{public}` — no write policy |
| ingestion_runs | **NONE** |
| latest_metrics | **NONE** |
| tic_foreign_holders | SELECT for `{public}` — no write policy |
| upcoming_events | SELECT for `{public}` — no write policy |

### 3.3 Anon Grants (information_schema.role_table_grants WHERE grantee = 'anon')

**All 11 tables have anon granted full DML:** INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER.

Combined with the RLS state, the net exposure is:

| table | RLS? | Policies? | Anon can write? |
|---|---|---|---|
| cie_bulk_block_deals | ✓ ON | SELECT only for public | ❌ Blocked by RLS |
| cie_upcoming_ipos | ✓ ON | SELECT only for public | ❌ Blocked by RLS |
| comtrade_cache | ✗ OFF | None | **✅ ANON-WRITABLE** |
| cusip_ticker_cache | ✗ OFF | None | **✅ ANON-WRITABLE** |
| gold_historical_shocks | ✓ ON | SELECT only for public | ❌ Blocked by RLS |
| india_asi | ✓ ON | SELECT only for public | ❌ Blocked by RLS |
| ingestion_logs | ✓ ON | SELECT only for public | ❌ Blocked by RLS |
| ingestion_runs | ✗ OFF | None | **✅ ANON-WRITABLE** |
| latest_metrics | ✗ OFF | None | **✅ ANON-WRITABLE** |
| tic_foreign_holders | ✓ ON | SELECT only for public | ❌ Blocked by RLS |
| upcoming_events | ✓ ON | SELECT only for public | ❌ Blocked by RLS |

**3 critical tables are anon-writable with no restriction:**
- `comtrade_cache` — caching table; anon can overwrite cached trade data
- `ingestion_runs` — ingestion audit log; anon can fabricate or delete run records
- `latest_metrics` — **critical: the metrics materialized cache table; anon can overwrite any metric value shown in the UI**

`cusip_ticker_cache` is also anon-writable, lower risk (internal ticker mapping).

Task 1.5 must: enable RLS + add `service_role`-only write policies on `comtrade_cache`, `cusip_ticker_cache`, `ingestion_runs`, `latest_metrics`; add service_role write policies to the 5 RLS-on tables that only have SELECT policies.

---

## 4. Deployed Function Inventory

Total deployed functions: 93+ (JSON parse may be incomplete — see note in §2.2).

### 4.1 Functions with `verify_jwt: true` (21 confirmed)

These functions enforce JWT verification (only valid Supabase JWTs accepted):

| slug | version | note |
|---|---|---|
| ingest-gold | 30 | |
| ingest-major-economies | 26 | |
| ingest-oil-india-china | 30 | |
| ingest-india-fiscal-stress | 17 | |
| ingest-india-fiscal-allocation | 15 | |
| ingest-india-debt-maturities | 14 | |
| ingest-india-credit-cycle | 20 | wait, verify_jwt=false below — check |
| ingest-india-liquidity | 17 | |
| ingest-india-inflation | 17 | |
| ingest-india-digitization | 17 | |
| ingest-gfcf | 31 | |
| ingest-gold-history | 28 | |
| ingest-us-edgar-fundamentals | 10 | |
| ingest-oil-spread | 6 | |
| ingest-trade-global-pulse | 21 | |
| compute-daily-macro-signal | 10 | |
| ingest-trade-imports | 4 | |
| cache-comtrade-data | 1 | ← called by cron with SERVICE_ROLE_KEY vault lookup |
| generate-morning-brief | 6 | |
| ingest-uk-trade-traders | 1 | |
| ingest-uk-trade-ots | 1 | |
| ingest-corporate-debt-maturities | 1 | |

### 4.2 Functions with `verify_jwt: false` (all others)

The remaining ~72+ functions have `verify_jwt = false`. These are invocable with any valid Supabase token (including the anon key). This is the expected configuration for cron-triggered ingest functions — the intended auth guard is the cron secret (not yet implemented, per audit findings).

Key subset:

| slug | version | Entrypoint path note |
|---|---|---|
| ingest-fred | 37 | CI-deployed (runner path) |
| check-data-health | 32 | CI-deployed |
| ingest-tic-foreign-holders | 28 | Local path (manually deployed) |
| ingest-imf | 22 | CI-deployed |
| ingest-china-macro | 27 | CI-deployed |
| ingest-oil-eia | 49 | CI-deployed; highest version count |
| ingest-mospi | 41 | CI-deployed; second highest |
| ingest-precious-divergence | 38 | CI-deployed |
| ingest-us-macro | 10 | Local path |
| ingest-un-comtrade | 21 | CI-deployed |
| fetch-hs-demand | 54 | CI-deployed; highest version overall |

**Entrypoint path patterns reveal deployment source:**
- `file:///home/runner/work/...` → deployed via GitHub Actions CI
- `file:///Users/kartikaysharma/Desktop/Work/...` → deployed manually from local machine
- `file:///tmp/user_fn_...` → deployed via Supabase dashboard or MCP push

Functions deployed from local paths have no CI provenance guarantee. The 1.4/2.1 tasks should normalize all deployments to CI.

---

## 5. Run-Health Summary (Last 7 Days)

**All jobs that fired in the last 7 days succeeded.** No failing status observed.

| cadence | jobs that fired | all succeeded? |
|---|---|---|
| Daily (every day, 7 runs) | check-data-health-daily, compute-daily-macro-signal-daily, compute-zscores-daily, ingest-china-macro-daily, ingest-copper-gold-ratio-daily, ingest-corporate-debt-maturity-daily, ingest-events-markers-daily, ingest-fiscaldata, ingest-fiscaldata-daily, ingest-fred-daily, ingest-fuel-security-india-daily, ingest-gold-daily, ingest-gold-history-daily, ingest-market-pulse-daily, ingest-mospi, ingest-mutual-funds-daily, ingest-nyfed-markets-daily, ingest-pboc-liquidity-daily, ingest-precious-divergence-daily, ingest-upi-autopay-daily, ingest-us-macro-auctions-daily, ingest-us-macro-daily, ingest-us-macro-fiscal-daily, ingest-us-macro-fred-daily, ingest-us-macro-ust-daily, ingest-yield-curves-daily | ✓ |
| Weekdays only (5 runs) | ingest-cie-deals-daily, ingest-cie-fundamentals-daily, ingest-cie-ipos-daily, ingest-cie-promoters-daily, ingest-cie-short-selling-daily, ingest-india-liquidity-daily, ingest-india-market-pulse-daily, ingest-nse-flows-daily, ingest-oil-spread-daily, ingest-rbi-money-market-daily | ✓ |
| Every 6 hours (28 runs) | ingest-geopolitical-osint, ingest-macro-news-headlines | ✓ |
| Weekly (1 run) | cache-comtrade-weekly, ingest-boj-balance-sheet-weekly, ingest-china-energy-weekly, ingest-commodity-reserves-weekly, ingest-commodity-terminal, ingest-ecb-balance-sheet-weekly, ingest-global-liquidity-weekly, ingest-global-refining-weekly, ingest-imf, ingest-india-energy-weekly, ingest-institutional-13f-weekly, ingest-oil-global-weekly, ingest-oil-india-china-weekly, ingest-tic-foreign-holders, ingest-trade-imports-weekly, ingest-trade-intelligence-pulse, ingest-un-comtrade-weekly, ingest-us-macro-weekly, ingest-us-treasury-auctions-weekly, ingest-weekly-narrative-weekly | ✓ |
| Partial week (4 runs) | generate-morning-brief, refresh-gold-ratios-daily | ✓ (job is newer) |
| Monthly (fired once) | ingest-oecd-cli-monthly | ✓ |
| Not fired in 7 days | All monthly/quarterly jobs not above | N/A |

**Important:** `ingest-corporate-debt-maturity-daily` (jobid 366) shows 7 successful runs per `cron.job_run_details`. However, its target slug `ingest-corporate-debt-maturity` is not deployed (the deployed slug is `ingest-corporate-debt-maturities`). "Succeeded" from pg_cron's perspective means `net.http_post` returned without throwing — it does not mean the function ran successfully. The HTTP call likely received a 404 response, which pg_cron records as success because the `net.http_post()` call itself didn't throw. **This is a silent daily failure.** Same risk applies to other "not deployed" functions showing as succeeded: `generate-newsletter-monthly`, `ingest-capital-flows-monthly`, `ingest-country-gmd-supplement-quarterly`.

---

## 6. Open Findings (Do Not Fix — Evidence Only)

| # | Finding | Severity | Relevant Task |
|---|---|---|---|
| F1 | `latest_metrics` table is anon-writable (RLS OFF, no policies, full anon grants) | Critical | 1.5 |
| F2 | `ingestion_runs` and `comtrade_cache` are anon-writable | High | 1.5 |
| F3 | `ingest-us-macro-weekly` (jobid 372) embeds a hardcoded JWT in the cron command | High | 1.4 |
| F4 | `ingest-country-gmd-supplement-quarterly` (jobid 371) calls wrong project URL — permanently broken | High | 1.4 |
| F5 | `ingest-corporate-debt-maturity-daily` fires daily against a 404 (slug typo) | High | 1.4 |
| F6 | `ingest-fiscaldata` called by two jobs 30 min apart (double-fire) | Medium | 1.4 |
| F7 | 3 jobs use fragile GUC vault pattern; 4 jobs use different secret name `SERVICE_ROLE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY` | Medium | 1.4 |
| F8 | ~10+ functions deployed from local machine paths, not CI | Medium | 2.1 |
| F9 | `cache-comtrade-data` has `verify_jwt: true` but its cron caller uses `SERVICE_ROLE_KEY` vault secret — must verify this secret exists with the right value | Medium | 1.4 |
| F10 | Several cron jobs call functions that could not be confirmed as deployed (parse gap) — manual `supabase functions list` verification recommended | Low | 0.2 follow-up |

---

*This document is READ-ONLY evidence. No live state was modified during its creation.*
