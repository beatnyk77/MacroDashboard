# OPERATIONS.md — GraphiQuestor (graphiquestor.com)

Audience: cold engineer or acquirer's diligence team. Everything here is sourced from
the repo and `docs/live-state-2026-06.md`. Anything unverifiable from the repo is
marked **TODO(verify)**.

---

## 1. SYSTEM OVERVIEW

GraphiQuestor is an institutional macro-intelligence terminal served as a static SPA
(Vite + React 18) hosted on Netlify, backed by Supabase (Postgres + Deno Edge Functions
+ pg_cron). All data ingestion is fully automated; no human touches the pipeline
between scheduled runs.

```
External APIs (FRED, RBI, EIA, UN Comtrade, IMF, ECB, AlphaVantage, Ember, Finnhub…)
  │
  ▼ HTTP fetch (authenticated)
Supabase Edge Functions (Deno, free-tier budget: stay ≤95 ACTIVE; leave headroom for deploys)
  │ upsert (metric_id, as_of_date)
  ▼
metric_observations table  ←  ~70 specialised tables (cie_*, gold_*, comtrade_cache…)
  │
  ▼
vw_latest_metrics view  (staleness_flag: fresh / lagged / very_lagged)
  │
  ▼
useLatestMetric(metricId) hook  (TanStack Query, 30 min staleTime)
  │
  ▼
React pages / feature components
  │
  ▼ npm run build → puppeteer prerender → dist/
Netlify CDN  (graphiquestor.com)

Scheduling layer:
  pg_cron (101 active jobs) ──net.http_post──▶ Edge Functions
  check-data-health-daily (07:00 UTC) ──Resend──▶ alerts@graphiquestor.com (on ≥3 issues)
```

The only human-operated path is:
- weekly GSC check (Google Search Console performance) and alert-inbox scan
- monthly newsletter curation (Google Apps Script trigger → `generate-weekly-regime-digest`)

---

## 2. SECRETS INVENTORY

Names and purposes only. Never commit values.

### 2.1 Supabase Vault (stored in `vault.secrets`, read by cron SQL via `vault.decrypted_secrets`)

| Vault secret name | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role JWT used by 78 cron jobs to authenticate Edge Function calls via `Authorization: Bearer …` header. Primary vault key name. |
| `SERVICE_ROLE_KEY` | Alternate name used by 4 cron jobs (`cache-comtrade-data`, `ingest-trade-imports`, `ingest-un-comtrade`, `ingest-us-macro-weekly`). Must hold the same value as above. TODO(verify): confirm both names exist in vault. |

**Note on fragile patterns (from live-state audit):**
- 3 cron jobs read `current_setting('vault.service_role_key', true)` — a GUC, not vault. These break on Postgres restart if GUC is not set.
- 1 cron job (jobid 372, `ingest-us-macro-weekly`) embeds a **hardcoded JWT** in the cron command — a critical finding. Rotate the service-role key and replace with a vault subselect. See `docs/live-state-2026-06.md §2.4 Finding A`.

### 2.2 Edge Function Environment Variables (set in Supabase Dashboard → Project Settings → Edge Functions)

| Variable | Purpose | Which functions |
|---|---|---|
| `SUPABASE_URL` | Project URL (auto-injected by Supabase runtime) | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (auto-injected by Supabase runtime) | All |
| `FRED_API_KEY` | FRED / St. Louis Fed API key | `ingest-fred`, `ingest-us-macro`, `ingest-us-macro/fred.ts` |
| `COMTRADE_API_KEY` | UN Comtrade API premium key | `ingest-un-comtrade`, `cache-comtrade-data` |
| `comtrade_api_key` / `contrade_api_key` | Duplicate / typo variants — TODO(verify): check which functions actually resolve these at runtime and normalise to `COMTRADE_API_KEY` | `ingest-un-comtrade` variants |
| `ALPHAVANTAGE_API_KEY` / `ALPHA_VANTAGE_API_KEY` | Alpha Vantage (equity & FX data) | `ingest-market-pulse`, `ingest-cie-*` |
| `EIA_API_KEY` | US Energy Information Administration API | `ingest-oil-eia`, `ingest-energy-global`, `ingest-fuel-security-india` |
| `EMBER_API_KEY` | Ember Climate energy dataset | `ingest-china-energy`, `ingest-energy-global` |
| `FINNHUB_API_KEY` | Finnhub (macro events calendar) | `ingest-events`, `ingest-events-markers`, `ingest-macro-events` |
| `GIE_API_KEY` | Gas Infrastructure Europe | `ingest-energy-global` |
| `OPENSKY_USERNAME` / `OPENSKY_PASSWORD` | OpenSky Network (flight/cargo data) — basic-auth | `ingest-geopolitical-osint` |
| `AIMLAPI_KEY` | AI/ML API (LLM completions for digest generation) | `generate-morning-brief`, `generate-weekly-regime-digest`, `generate-monthly-regime-digest` |
| `OPENROUTER_API_KEY` | OpenRouter (LLM routing — backup/alternative to AIMLAPI) | `generate-*`, `llm-knowledge` |
| `RESEND_API_KEY` | Resend email API — sends critical data-health alerts | `check-data-health`, `send-weekly-digest`, `send-confirm-email` |
| `ALERT_FROM_EMAIL` | Verified sender address for alert emails. **Must be a domain verified in Resend dashboard.** Default: `alerts@graphiquestor.com`. See §6 for DNS verification steps. | `check-data-health` |
| `ALERT_WEBHOOK_URL` | Webhook URL for push alerts (Slack or similar) | `check-data-health` (optional) |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for pipeline notifications | `_shared/slack.ts` consumers |
| `SUPABASE_DISCORD_WEBHOOK_URL` | Discord webhook for pipeline notifications | Some ingest functions |
| `GSC_SERVICE_ACCOUNT_KEY` | Google Search Console service-account JSON (base64 or raw) | `gsc-sync` |
| `GSC_SITE_URL` | GSC property URL (e.g. `sc-domain:graphiquestor.com`) | `gsc-sync` |

### 2.3 GitHub Actions Secrets (Settings → Secrets → Actions)

| Secret | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase Personal Access Token (PAT) for `supabase functions deploy` |
| `SUPABASE_PROJECT_ID` | Project ref ID: `debdriyzfcwvgrhzzzre` |
| `VITE_SUPABASE_URL` | Injected into Vite build as `VITE_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Injected into Vite build as `VITE_SUPABASE_ANON_KEY` |

### 2.4 Netlify Environment Variables (Site Settings → Environment Variables)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL exposed to frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key exposed to frontend |

**Warning:** The anon key is public by design but is also committed verbatim in several migration files (scripted scan found 9 files). This is not a secret — it is safe as long as RLS policies are correct. See §7 restore step on RLS.

### 2.5 Google Apps Script Properties (script.google.com → Project Settings → Script Properties)

| Property | Purpose |
|---|---|
| `SUPABASE_URL` | Same as above — for newsletter Apps Script |
| `SUPABASE_ANON_KEY` | Anon key for newsletter query |
| `GEMINI_API_KEY` | Google Gemini for newsletter draft generation |
| `USER_EMAIL` | Recipient for newsletter notification |

---

## 3. EXTERNAL API ACCOUNTS

| Provider | URL | Feeds | Auth type | Quota / tier | What breaks when down |
|---|---|---|---|---|---|
| **FRED** (St. Louis Fed) | `api.stlouisfed.org` | US macro series: gold price, UST yields, Fed balance sheet, M2, CPI components | API key (free) | 120 req/min, free tier | `ingest-fred` fails; FRED-sourced metrics go stale (30+ metrics) |
| **UN Comtrade** | `comtradeapi.un.org` | Global trade flows by HS code, country pairs | API key (premium required for bulk) | TODO(verify): confirm subscription tier | Trade intelligence pages show stale/empty data |
| **AlphaVantage** | `www.alphavantage.co` | Equity quotes, FX rates, market pulse indicators | API key (free/premium) | Free: 25 req/day, 5/min | Market pulse, CIE equity data stale |
| **EIA** (US Energy Info Admin) | `api.eia.gov`, `ir.eia.gov` | US oil refining, imports, SPR levels, crude prices | API key (free) | No published hard limit | Oil/energy pages stale; `ingest-oil-eia` fails |
| **IMF** | `dataservices.imf.org`, `www.imf.org` | SDR allocations, COFER currency composition, GDP/CA data | None (public REST) | Rate-limited, no key | Sovereign risk, de-dollarization metrics stale |
| **ECB** | `data-api.ecb.europa.eu` | ECB balance sheet, EUR exchange rates | None (public REST) | Rate-limited, no key | ECB balance sheet metrics stale |
| **Eurostat** | `ec.europa.eu` | EU sovereign debt, fiscal stats | None (public REST) | Rate-limited, no key | EU debt metrics stale |
| **RBI** (Reserve Bank of India) | `api.rbi.org.in`, `dbie.rbi.org.in`, `data.rbi.org.in`, `www.rbi.org.in` | India monetary, forex, money market, banking data, PDF releases | None (public, with scraping for PDFs) | No published limit; scraping fragile | India macro section stale; most acute for daily `ingest-rbi-money-market` |
| **NSE India** | `www.nseindia.com`, `archives.nseindia.com` | NSE equity flows, FII/DII data | None (session-cookie scraping) | Highly fragile — NSE blocks bots | CIE flows, India market data stale |
| **World Bank** | `api.worldbank.org` | GDP, per-capita, GFCF data | None (public REST) | 50 req/10s | Development metrics stale |
| **Ember Climate** | `api.ember-climate.org` | Energy mix data (coal, renewables by country) | API key | TODO(verify): confirm tier | China/India energy security metrics stale |
| **Finnhub** | `finnhub.io` | Economic calendar events | API key (free tier) | 60 req/min free | Macro events calendar empty |
| **OpenSky Network** | `opensky-network.org` | Flight/cargo movement data | Basic auth (username/password) | Rate-limited free tier | Geopolitical OSINT function fails silently |
| **Gas Infrastructure Europe (GIE)** | GIE API | European gas storage levels | API key | TODO(verify) | EU energy security metrics stale |
| **Resend** | `api.resend.com` | Transactional email — data health alerts, newsletter confirms | API key | Free: 100 emails/day, 3000/month | Alert emails not delivered — silent pipeline failure |
| **AI/ML API** | AIMLAPI | LLM completions for digest/brief generation | API key | TODO(verify): confirm model/quota | Morning brief and regime digests not generated |
| **OpenRouter** | openrouter.ai | LLM routing (backup path for generation functions) | API key | TODO(verify) | Digest generation falls back to raw data |
| **Google Search Console** | `searchconsole.googleapis.com` | GSC indexing signals synced to Supabase for SEO monitoring | Service account JSON | No cost | `gsc-sync` fails; GSC data in dashboard stale |
| **Google Apps Script** | `script.google.com` | Monthly newsletter generation (Gemini + Supabase query) | Script Properties | Free | Newsletter generation manual only |
| **UptimeRobot** | uptimerobot.com | Site uptime monitoring, 5-min checks | API key (free tier config) | Free | No uptime alerts — site could be down undetected |
| **Cloudflare** | cloudflare.com | CDN, edge caching, DDoS protection | Account login | Free tier | Degraded performance; origin Netlify still serves |

---

## 4. DEPLOY STORY

### 4.1 Frontend (Netlify)

- **Auto-deploys:** every push to `main` branch triggers Netlify build.
- **Build command:** `npx puppeteer browsers install chrome && npm run build`
  - `npm run build` = `tsc + vite build` → then `scripts/prerender.mjs` runs Puppeteer to prerender all routes into `dist/` for SEO.
- **Preview deploys:** PRs get preview URLs; preview build skips Puppeteer (`tsc && vite build` only).
- **Environment variables:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in Netlify dashboard.
- **Rollback:** Netlify dashboard → Deploys → click any prior deploy → "Publish deploy."

### 4.2 Supabase Edge Functions (GitHub Actions)

- **Workflow:** `.github/workflows/deploy-supabase-functions.yml`
- **Trigger:** push to `main` when any file in `supabase/functions/**` changes; also `workflow_dispatch`.
- **Coverage:** the workflow deploys a hand-maintained allowlist of ~28 functions. The remaining ~65 functions are deployed manually with `supabase functions deploy <name>`.
- **Required secrets:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`.
- **Manual deploy:** `supabase functions deploy <function-name> --project-ref debdriyzfcwvgrhzzzre`

**Known gap:** there is no CI workflow for deploying database migrations. Migrations must be applied manually:
```bash
supabase db push --project-ref debdriyzfcwvgrhzzzre
```

### 4.3 CI Pipeline (`.github/workflows/deploy.yml`)

Runs on every push to `main` and every PR:
1. Pattern guards (`scripts/ci-guards.mjs`)
2. ESLint (`npm run lint -- --max-warnings 0`)
3. Tests (`npm test`)
4. Vite build

This workflow does **not** deploy anything — it is a quality gate only.

### 4.4 Rollback Procedure

| Layer | Rollback |
|---|---|
| Frontend | Netlify dashboard → Deploys → click prior deploy → "Publish deploy" |
| Edge Functions | `supabase functions deploy <name>` with prior code checked out |
| Database migrations | No automated rollback. Write a compensating migration and apply manually. |
| Cron schedule changes | Apply a SQL migration via `supabase db push` or psql that undoes the `cron.schedule`/`cron.unschedule` calls. |

---

## 5. CRON & DATA PIPELINE

### 5.1 Schedule Reference

See `docs/live-state-2026-06.md §1` for the full 101-job inventory. Summary cadences:

| Cadence | Jobs (approx.) | Examples |
|---|---|---|
| Every 6 hours | 2 | `ingest-geopolitical-osint`, `ingest-macro-news-headlines` |
| Daily | 26 | FRED, fiscal data, market pulse, gold, CIE equities, China macro |
| Weekdays only | 10 | NSE flows, RBI money market, CIE deals/IPOs/promoters |
| Weekly | 19 | ECB/BoJ balance sheets, oil (EIA), global refining, Comtrade |
| Monthly | 15+ | IMF COFER, SDR, BRICS, trade global, OECD CLI, India digitisation |
| Quarterly | 2 | CB gold net purchases, country GMD supplement (broken — see below) |

All schedules are UTC. The canonical schedule source is `cron.job` in the live database; the repo's migration files are the historical record but may not match live state exactly.

### 5.2 Known Broken Crons (as of 2026-06-12)

| Cron | Problem |
|---|---|
| `ingest-country-gmd-supplement-quarterly` (jobid 371) | Calls wrong Supabase project URL — permanently 404 |
| `ingest-corporate-debt-maturity-daily` (jobid 366) | Slug typo (`maturity` vs deployed `maturities`) — silently 404 daily |
| `ingest-fiscaldata` / `ingest-fiscaldata-daily` (jobid 421/305) | Double-fires the same function 30 min apart |
| `ingest-us-macro-weekly` (jobid 372) | Hardcoded JWT in cron command — rotate key, replace with vault subselect |
| `generate-newsletter-monthly` (jobid 368) | Target function not in deployed list |
| `ingest-capital-flows-monthly` (jobid 354) | Target function not deployed |

### 5.3 Staleness Monitoring Chain

```
cron.schedule: '0 7 * * *'  →  check-data-health edge function
  ├── queries vw_data_staleness_monitor  (metrics not updated in >30 days)
  ├── queries vw_latest_ingestions       (failed ingest runs, last 24h)
  ├── queries vw_cron_job_status         (failed cron jobs, last 24h)
  └── if totalIssues ≥ 3:
        Resend API → alerts@graphiquestor.com
        from: ALERT_FROM_EMAIL env var (default: alerts@graphiquestor.com)
```

**Caveat — cron success ≠ data written:** `pg_cron` records a run as "succeeded" when `net.http_post()` completes without throwing, regardless of the HTTP response code. A function that 404s (wrong slug) or 500s (swallowed error) still appears as a cron success. The staleness monitor catches this class of failure via metric age, but there is a lag of up to 30 days before a metric crosses the stale threshold.

**Caveat — `ingest-fred` freshness bug:** `ingest-fred` bumps `updated_at` on a metric even when the fetch fails (inside the per-metric error handler). This means a failing FRED metric appears fresh to the staleness monitor. See `supabase/functions/ingest-fred/index.ts:202-205`.

### 5.4 Reading `ingestion_logs`

```sql
-- Most recent run per function, last 48 hours
SELECT function_name, status, started_at, completed_at, error_message
FROM ingestion_logs
WHERE started_at > now() - interval '48 hours'
ORDER BY started_at DESC;

-- Functions that recently failed
SELECT function_name, error_message, started_at
FROM ingestion_logs
WHERE status = 'failed'
  AND started_at > now() - interval '24 hours';
```

### 5.5 Triggering a Function Manually

```bash
# From local CLI (requires supabase login)
supabase functions invoke check-data-health --project-ref debdriyzfcwvgrhzzzre

# Test alert deliverability end-to-end
supabase functions invoke check-data-health --project-ref debdriyzfcwvgrhzzzre -- --method GET --query 'test=true'

# Or via curl with the service-role key
curl -X POST \
  "https://debdriyzfcwvgrhzzzre.functions.supabase.co/check-data-health?test=true" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

---

## 6. ALERT RUNBOOK

### 6.1 Domain Verification for Alerts (REQUIRED MANUAL STEP)

**Status:** The alert sender was changed from `alerts@resend.dev` (Resend's shared test
domain, deliverability-fragile) to `alerts@graphiquestor.com` (set via `ALERT_FROM_EMAIL`
env var). **The domain `graphiquestor.com` must be verified in Resend before alerts will
deliver.**

**Steps (one-time, ~10 minutes):**
1. Log in to [resend.com/domains](https://resend.com/domains).
2. Click "Add Domain" → enter `graphiquestor.com`.
3. Resend will show DNS records to add (typically SPF, DKIM TXT records, and an MX record if not already set).
4. Add those records in your DNS provider (Cloudflare dashboard → DNS).
5. Click "Verify" in Resend. Propagation is usually < 5 minutes on Cloudflare.
6. In Supabase Dashboard → Project Settings → Edge Functions → Environment Variables, set:
   - `ALERT_FROM_EMAIL` = `alerts@graphiquestor.com`
   - `RESEND_API_KEY` = your Resend API key (if not already set)
7. **Test end-to-end:**
   ```bash
   curl "https://debdriyzfcwvgrhzzzre.functions.supabase.co/check-data-health?test=true" \
     -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
   ```
   Check `graphiquestor@gmail.com` for the test email within 2 minutes.

### 6.2 Alert Types and First-Diagnostic Queries

**Alert: "Critical Health Alert: Found N issues (X stale, Y ingest failures, Z cron failures)"**

Triggered when `staleMetrics + failedIngestions + failedCrons ≥ 3`.

```sql
-- Step 1: See which metrics are stale
SELECT metric_id, metric_name, days_since_update, status
FROM vw_data_staleness_monitor
WHERE status != 'FRESH'
ORDER BY days_since_update DESC;

-- Step 2: See which ingest runs failed in last 24h
SELECT function_name, error_message, started_at
FROM ingestion_logs
WHERE status = 'failed'
  AND started_at > now() - interval '24 hours'
ORDER BY started_at DESC;

-- Step 3: See cron job status
SELECT jobname, last_run_status, last_run_message, last_run_at
FROM vw_cron_job_status
WHERE last_run_status = 'failed';
```

**Escalation pattern by failure class:**

| Symptom | Likely cause | Fix |
|---|---|---|
| Metric stale but ingestion log shows "success" | Swallow-and-return-200 pattern in the function (19 functions affected — see audit) | Check function logs in Supabase Dashboard → Functions → Logs |
| FRED metric stale but `updated_at` is recent | `ingest-fred` freshness bug — bumps timestamp on error | Check FRED API key validity and per-metric error in function logs |
| Cron "succeeded" but metric not updated | Wrong function slug in cron command, or function 404 | Check `cron.job` for the jobname, verify slug matches deployed function |
| All ingest failing simultaneously | External API outage or Supabase project issue | Check `status.supabase.com` and the specific API's status page |
| Alert email not received | `ALERT_FROM_EMAIL` domain not verified in Resend, or `RESEND_API_KEY` missing | See §6.1; invoke `?test=true` to test delivery |

---

## 7. RESTORE FROM ZERO

Ordered steps to rebuild the entire system from scratch. Each step requiring a credential from §2 is marked with (🔑).

1. **Create Supabase project** — New project in Supabase dashboard. Note the project ref ID. (🔑 Supabase account)

2. **Apply all database migrations:**
   ```bash
   supabase link --project-ref <new-project-ref>
   supabase db push
   ```
   This applies all 372 migration files in `supabase/migrations/` in timestamp order, creating all tables, views, RLS policies, functions, and cron schedules. (🔑 `SUPABASE_ACCESS_TOKEN`)

3. **Populate Vault secrets** — In Supabase Dashboard → Database → Vault, insert:
   - `SUPABASE_SERVICE_ROLE_KEY` (the new project's service-role JWT) (🔑)
   - `SERVICE_ROLE_KEY` (same value — used by 4 cron jobs) (🔑)

4. **Set Edge Function environment variables** — In Supabase Dashboard → Project Settings → Edge Functions, add all variables from §2.2. (🔑 All API keys)

5. **Deploy all Edge Functions:**
   ```bash
   supabase functions deploy --project-ref <new-project-ref>
   ```
   Or push to `main` to trigger the GitHub Actions workflow (which covers ~28 functions). Deploy remaining ~65 manually. (🔑 `SUPABASE_ACCESS_TOKEN`)

6. **Apply canonical crons** — TODO(verify): a `docs/canonical_crons.sql` was planned in the audit (Task 1.4). If it exists, run it via psql to set the definitive cron schedule. If not, the cron jobs are created by the migrations in step 2 but may include the known broken jobs from §5.2 — those should be fixed. (🔑 Database access)

7. **Set Netlify environment variables** — In Netlify dashboard → Site configuration → Environment variables: (🔑)
   - `VITE_SUPABASE_URL` = new project URL
   - `VITE_SUPABASE_ANON_KEY` = new anon key

8. **Trigger Netlify deploy** — Push to `main` or click "Trigger deploy" in Netlify dashboard. (🔑 Netlify account)

9. **Verify DNS** — `graphiquestor.com` should point to Netlify. If DNS was disrupted, update the A/CNAME records in Cloudflare to Netlify's assigned IP/hostname. (🔑 Cloudflare account)

10. **Verify Resend domain** — Follow §6.1 to re-verify `graphiquestor.com` in Resend and test alert delivery. (🔑 Resend account)

11. **Update GitHub Actions secrets** — Set `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` to new values. (🔑 GitHub repo admin)

12. **Smoke test** — Open `https://graphiquestor.com`, verify metrics load and show freshness chips. Run:
    ```bash
    curl "https://<new-project>.functions.supabase.co/check-data-health?test=true" \
      -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
    ```
    Confirm test alert email arrives.

---

## 8. 30-DAY-UNTOUCHED CHECKLIST

### What runs itself (no human required)

- **Edge Functions (free-tier, stay ≤95 ACTIVE)** — scheduled via pg_cron, auto-invoked. Pruned 2026-07-19 then growth stack: `send-confirm-email`, `send-daily-brief`, `generate-share-card`, `growth-actions` (see `pipelineCatalog.ts`). **Do not create more functions without pruning first.**
- **`check-data-health-daily`** — runs at 07:00 UTC, emails on ≥3 issues.
- **`compute-daily-macro-signal`** and **`compute-zscores-daily`** — 06:00-06:30 UTC.
- **`generate-morning-brief`** and **`generate-weekly-regime-digest`** — automated on schedule.
- **Netlify** — serves the static SPA 24/7 from CDN; no server to manage.
- **Cloudflare** — edge caching and DDoS protection, fully managed.
- **UptimeRobot** — emails `graphiquestor@gmail.com` if site goes down (5-min checks).

### What degrades silently over 30 days

- **NSE India scraping** (`ingest-nse-flows`) — NSE periodically changes session-cookie requirements; the function will fail silently and CIE flow data will go stale. Check via staleness monitor.
- **AlphaVantage free tier** — 25 req/day limit; if the project gets traffic spikes that trigger many concurrent ingest runs, quota may be exhausted and subsequent runs within the day will fail silently.
- **RBI PDF scraping** — RBI website structure changes break PDF link parsing; India credit/money market data goes stale.
- **Functions deployed from local machine** (~65 functions) — not CI-tracked; if function code is updated in the repo but not manually re-deployed, production runs old code. TODO(verify): track which functions are on local-deploy cadence.
- **The 6 known broken crons** (§5.2) — continue firing and failing silently.

### What degrades after 30 days (staleness threshold)

The `check-data-health` monitor alerts when any metric exceeds 30 days since update. Monthly-cadence ingestions (COFER, SDR, BRICS, trade-global, OECD CLI) have a natural 28–31 day update cycle — they will approach the staleness threshold in a normal month. A run failure on any monthly function will cross it and trigger an alert.

### The one weekly human check

1. **Alert inbox** — check `graphiquestor@gmail.com` for any `check-data-health` alert emails. If none, the pipeline is healthy (or the alert is broken — verify with `?test=true`).
2. **Google Search Console** — check impressions/clicks for anomalies (crawl budget, indexing drops). 5-minute task.

---

*Document sourced from: repo working tree, `docs/live-state-2026-06.md`, `docs/devops.md`, `docs/MAINTENANCE.md`, `docs/automation/SETUP.md`, `netlify.toml`, `.github/workflows/`, `supabase/functions/` (all `Deno.env.get` calls), and `audit_report.md`. Last updated: 2026-06-13.*

## Free-tier Edge Function Quota

- **Hard ceiling:** ~100 ACTIVE edge functions on Supabase free plan.
- **Ops budget:** never exceed **95 ACTIVE** (leave 5 slots for deploys / hotfixes).
- **402 max functions / spend cap:** prune before creating new functions.
- **Prune policy:** no cron + no SPA invoke first; keep newsletter (`get-newsletter-data`) and India CIE pack.
- **Catalog:** `src/lib/pipelineCatalog.ts` is the public SSOT for pipeline narrative.
