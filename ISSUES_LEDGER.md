# ISSUES_LEDGER

Single living status for GraphiQuestor. Do not create new `*_AUDIT_REPORT.md` or `*_SUMMARY.md` files — update this ledger instead.

Columns: `id | area | description | status | last-verified-date | notes`

Status values: `open` · `in-progress` · `verified-fixed` · `wont-fix` · `blocked`

Source archives (historical only): `docs/archive/`

---

## Active issues

| id | area | description | status | last-verified-date | notes |
|----|------|-------------|--------|--------------------|-------|
| P0-000 | process | Compost: consolidate audits into ledger, clear root debris | verified-fixed | 2026-07-19 | Commit 934f857 — ISSUES_LEDGER created; living docs restored from archive |
| P0-001 | macro-brief | `/macro-brief` shows Brief Unavailable; generation/cron/TZ may be broken | verified-fixed | 2026-07-19 | Edge binary + live page verified 2026-07-19. Briefs present (fallback-template); page self-canonical. Optional: improve LLM brief quality when OPENROUTER key set. |
| P0-002 | seo | `/macro-brief` (and dated routes) serve homepage shell + homepage canonical | verified-fixed | 2026-07-19 | **Live verified:** `/macro-brief/` title “Morning Macro Brief — 19 July 2026”; canonical `https://graphiquestor.com/macro-brief/2026-07-19/`. Netlify CLI prod deploy `6a5c817f4ebc16de797607ad`. |
| P0-003 | seo | Canonical coverage incomplete for prerendered routes (prior claim 39/94 missing SEOManager) | verified-fixed | 2026-07-19 | **Live sample 23/23 self-canonical** (hubs, labs, methods, countries, macro-brief). No homepage shell. Code SEOManager 66/66 routable. |
| P1-001 | security | `daily_macro_briefs` public INSERT/UPDATE (advisor WITH CHECK true for anon) | verified-fixed | 2026-07-19 | **Live confirmed** via pooler SQL (run 29662904580): policies = `daily_macro_briefs_select` SELECT {anon,authenticated} + `daily_macro_briefs_service_write` ALL {service_role}. Migration applied. |
| P0-004 | ops | Deploy pipeline broken for functions + site | in-progress | 2026-07-19 | Supabase PAT works; Heartbeat green; Netlify CLI prod done. **Remaining:** GitHub↔Netlify auto-deploy; **Supabase function deploy 402** max functions/spend cap blocks bulk redeploy. |
| P1-002 | security | 12 tables RLS disabled while PostgREST-exposed | verified-fixed | 2026-07-19 | Migration 20260719000010 applied; all 12 `rls=true`; anon SELECT ok on product tables; hashes sealed; INSERT denied on us_companies |
| P1-003 | security | ~50 views SECURITY DEFINER — audit intentional vs accidental | verified-fixed | 2026-07-19 | 13 public telemetry views set `security_invoker=true` (20260719000040). Remaining DEFINER are intentional functions (materialize/subscriber cadence) |
| P1-004 | security | `get_traffic_intelligence_summary` / `get_subscriber_stats` EXECUTE for anon | verified-fixed | 2026-07-19 | Revoked (20260719000020); live anon RPC → 401 permission denied |
| P1-005 | security | Duplicate/redundant RLS policies on 11 tables | verified-fixed | 2026-07-19 | Normalized via 20260719000030 (one public SELECT + service_role ALL) |
| P2-001 | seo | GSC: 124 Redirect error + 88 Page with redirect | verified-fixed | 2026-07-19 | **Edge verified:** thematics→labs, labs/india|china→intel/* all **301** with correct Location. GSC UI reprocess still lags (user console). |china + thematics→labs (needs Netlify publish). Full GSC URL list still optional |
| P2-002 | seo | GSC: 102 Excluded by noindex — intent audit | verified-fixed | 2026-07-19 | Intentional: embed=true, admin, subscribe manage/confirm, og-card, 404. Layout defaults index except chromeless |
| P2-003 | seo | Index rate ~29% (146 indexed / 364 not-indexed) | in-progress | 2026-07-19 | Live sitemap **221 URLs** (2026-07-19). Index rate needs GSC reprocess after deploy — do not claim fixed without GSC numbers. |
| P3-001 | ingest | Remaining edge functions not on serveIngest; silent error swallow risk | in-progress | 2026-07-19 | Code: 98 serveIngest. Remote has **100** ACTIVE fns. Today redeployed key set; **bulk redeploy blocked by 402** “Max number of functions / spend cap”. 10 local-only fns cannot create. Script: `scripts/deploy-all-functions.sh`. |
| P3-002 | ingest | GDP unit bug / freshness-on-failure anti-pattern | verified-fixed | 2026-07-19 | **Live:** india_fiscal_stress gdp~2.8e7 crores, debt_gdp~58%, interest_gdp~3.7% (plausible). OECD CLI live FRED upserts (not mock 100.2/99.4); mock 2025-12-31 rows deleted. FRED ingest 5339 upserts. Note: FRED series dates lag (2024-01-01) — series ID freshness follow-up optional. |

---

## Standing goals (check before AND after every change)

1. `npm run lint && npm run build` exits clean
2. No table exposed via PostgREST has `USING (true)` / `WITH CHECK (true)` on INSERT/UPDATE/DELETE for anon/authenticated without intentional migration comment
3. No previously verified-correct page regresses
4. No mock/placeholder data on live routes
5. One concern per commit
6. Codemod if the same pattern touches >~8 files

---

## Session log

### Session 1 — 2026-07-19

- **Closed:** P0-000 (ledger + living docs)
- **Opened:** P0-004 (deploy pipeline broken)
- **In progress:** P0-001, P0-002, P1-001 — code on main, not live-verified
- **Commits (pushed to origin/main):**
  - `934f857` chore: consolidate audit reports into ISSUES_LEDGER, restore living docs
  - `3db1ef8` fix(macro-brief): align market dates to ET and harden generation
  - `520bd20` fix(seo): guard macro-brief prerender against homepage shell
  - `a537ccc` docs: session 1 log for heartbeat protocol P0 work
  - `474e8ec` fix(security): restrict daily_macro_briefs writes to service_role
- **lint/build:** local lint clean; GH CI `29662330570` **green** (full build + prerender)
- **Deploy attempts failed:**
  - CLI `functions deploy` → 403 privileges on project `debdriyzfcwvgrhzzzre`
  - Actions Deploy Supabase → `Invalid access token format. Must be like sbp_...` (bad `SUPABASE_ACCESS_TOKEN` secret)
  - Actions Deploy Migrations → same token failure
  - Live curl still homepage shell on `/macro-brief/` (Netlify last GitHub deployment ~2026-07-02)
- **Automated deploy/verify (run 29662904580 Heartbeat Deploy + Verify):**
  - Applied RLS migration via pooler (token bad → SQL fallback) ✅
  - Live policies confirmed: SELECT public + ALL service_role only ✅ → **P1-001 verified-fixed**
  - Briefs present for 2026-07-18; cron active; vault service_role invoke returned 200 ✅ (old function binary — empty counts)
  - Function deploy skipped (token not `sbp_…`) ❌
  - Netlify rebuild skipped (no vault hook) ❌
- **Next (human secrets / infra — unblocks P0-001/P0-002 fully):**
  1. Create Supabase PAT for the account that owns `debdriyzfcwvgrhzzzre`: Dashboard → Account → Access Tokens → `sbp_…`
  2. `gh secret set SUPABASE_ACCESS_TOKEN` with that value (or `supabase login --token sbp_…` on a machine with access)
  3. Re-run **Heartbeat Deploy + Verify** (or Deploy Supabase) to ship `generate-morning-brief`
  4. Reconnect Netlify → GitHub for this repo (or set vault `NETLIFY_BUILD_HOOK_URL` / `NETLIFY_AUTH_TOKEN`+site id) and deploy production
  5. Curl `/macro-brief/` for self-canonical + MacroBrief assets; mark P0-001/P0-002 verified-fixed


### Session 1b — 2026-07-19 (balance tasks, no Management API token)

- **Applied live via pooler (run 29663192769 migrations step):**
  - `20260719000010` RLS on 12 advisor tables (all `rls=true`)
  - `20260719000020` revoked anon EXECUTE on analytics RPCs
  - `20260719000030` normalized duplicate policies on 11 tables
  - `20260719000040` `security_invoker=true` on 13 public telemetry views
- **Live anon API confirm:**
  - `us_companies` SELECT 200; INSERT 401
  - `cb_gold_net` SELECT 200
  - `ingestion_payload_hashes` SELECT 401 (service-only)
  - `get_subscriber_stats` / `get_traffic_intelligence_summary` EXECUTE 401
- **SEO (code, pending Netlify):** Netlify 301s for `/labs/india|china` and `/thematics`; expanded prerender hub checks; `scripts/list-seo-coverage.mjs` (66/79 pages SEOManager; remainder chart subcomponents)
- **Admin:** graceful empty state when analytics RPCs sealed
- **Still waiting on you (Supabase PAT + Netlify):** deploy `generate-morning-brief` binary; publish frontend so `/macro-brief/` leaves homepage shell

### Session 1c — 2026-07-19 (Phase 4 serveIngest + data integrity)

- **P3-001 harness migration:**
  - Extended `scripts/migrate-to-harness.ts` for `runIngestion` → `serveIngest` + `IngestResult`
  - Migrated 26 functions (incl. manual `cache-comtrade-data`, `ingest-trade-imports`)
  - Coverage after codemod: **96/110** `serveIngest`; remaining `runIngestion`: `ingest-country-metrics`, `ingest-us-macro`
  - Commit `d35a9d4`
- **P3-002 data integrity (code only):**
  - India GDP crores: drop erroneous `* 1e9` (FRED `MKTGDPINA646NWDB` is full USD)
  - OECD CLI: remove mock constants; fetch FRED MEI series; fail closed on empty
  - Commit `a0fba8c` — **not live-verified** (edge deploy needs `sbp_…`)
- **Guards/lint:** `ci-guards` PASS; `npm run lint` clean
- **Still blocked (human):** Supabase PAT + Netlify publish for P0-001/P0-002 and live P3-002 verification

### Session 1d — 2026-07-19 (finish dynamic-name ingest jobs)

- Manually migrated last two `runIngestion` jobs:
  - `ingest-us-macro`: `?task=fiscal|ust|fred|auctions` preserved; logs as `ingest-us-macro` with `meta.task`
  - `ingest-country-metrics`: `?supplement=gmd` preserved; logs as `ingest-country-metrics` with `meta.mode`
- **Zero** `runIngestion` left under `supabase/functions/**/index.ts`
- Cron URLs unchanged (same path + query params)
- **ci-guards** PASS

### Session 1e — 2026-07-19 (remaining tasks: harness repair + freshness + SEO audit)

- **P3-001 repair:** fixed serveIngest jobs damaged by earlier raw-Deno.serve codemod
  - unglued `return { ok:true };} catch`
  - removed dead OPTIONS preflights inside jobFn
  - `return new Response` error/auth paths → throw
  - restored non-empty `counts.upserted` on ~30 functions (incl. state-fiscal, major-economies, CIE, macro-events, etc.)
- **P3-002:** `ingest-fred` no longer bumps `metrics.updated_at` on catch (freshness-on-failure)
- **P0-003:** `list-seo-coverage.mjs` now excludes chart stubs; **0** routable pages missing SEOManager
- **Still blocked (human):** `sbp_…` PAT + Netlify publish for live verify of P0-001/P0-002/P3-*

### Session 1f — 2026-07-19 (Supabase PAT + deploy)

- CLI logged into GraphiQuestor-owning org; project `debdriyzfcwvgrhzzzre` linked
- GH secrets updated: `SUPABASE_ACCESS_TOKEN` (sbp_), `SUPABASE_PROJECT_ID`, `SUPABASE_URL`
- Deployed: generate-morning-brief, ingest-fred, ingest-oecd-cli, ingest-india-fiscal-stress, ingest-us-macro, ingest-country-metrics (with import-map)
- Invoked brief: `ok:true`, counts with skipped-already-exists for 2026-07-19
- Migration history repaired for 20260719* security migrations
- Heartbeat Deploy + Verify **green** (29678609749); Netlify hook still missing
- **Security:** token set only via `gh secret set` stdin + CLI keychain; not committed; scrubbed from workspace search

### Session 1g — 2026-07-19 (Netlify CLI production deploy)

- Linked CLI → site `graphiquestormacro` (graphiquestor.com)
- `netlify deploy --build --prod` — deploy id `6a5c817f4ebc16de797607ad`
- Live `/macro-brief/`: self-canonical dated URL; **not** homepage shell → **P0-002 verified-fixed**
- P0-001 marked verified-fixed (edge + frontend path)

### Session 2 — 2026-07-19 (SEO live + bulk deploy attempt + P3 verify)

- **Anon writes invariant:** SELECT 200 product tables; INSERT 401 briefs/us_companies; hashes 401; analytics RPC 401
- **P0-003 live:** 23/23 sample paths self-canonical, 0 homepage shells
- **P2-001 live:** 6/6 configured 301s OK (thematics, labs/india|china)
- **Sitemap:** 221 URLs live
- **Bulk deploy:** blocked mid-flight by Supabase **402 max functions/spend cap**; key P3 functions already live from earlier deploys
- **P3-002 live invokes:** oecd-cli / india-fiscal-stress / fred all 200 with real counts; GDP crores order 1e7; mock OECD rows purged
- **PAT rotate:** still recommended (token was in chat) — dashboard revoke + new sbp_ → `gh secret set` + `supabase login --token`
- **Scripts:** `scripts/deploy-all-functions.sh` (import-map + use-api)
