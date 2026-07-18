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
| P0-001 | macro-brief | `/macro-brief` shows Brief Unavailable; generation/cron/TZ may be broken | in-progress | 2026-07-19 | Code 3db1ef8 on main; CI build green. **Blocked:** edge deploy 403 + invalid SUPABASE_ACCESS_TOKEN (`sbp_` required) |
| P0-002 | seo | `/macro-brief` (and dated routes) serve homepage shell + homepage canonical | in-progress | 2026-07-19 | Code 520bd20 on main; CI build (incl. prerender validate) green. **Blocked:** Netlify last production deploy 2026-07-02 (not auto-deploying main) |
| P0-003 | seo | Canonical coverage incomplete for prerendered routes (prior claim 39/94 missing SEOManager) | open | 2026-07-19 | Partial via P0-002; full audit after Netlify is redeploying from main |
| P1-001 | security | `daily_macro_briefs` public INSERT/UPDATE (advisor WITH CHECK true for anon) | in-progress | 2026-07-19 | Migration `20260719000000_daily_macro_briefs_service_write_only.sql` (474e8ec). Needs `supabase db push` / Deploy Supabase workflow |
| P0-004 | ops | Deploy pipeline broken for functions + site | open | 2026-07-19 | GH secret SUPABASE_ACCESS_TOKEN invalid format; local CLI 403 on project debdriyzfcwvgrhzzzre; Netlify not publishing post-2026-07-02 |
| P1-002 | security | 12 tables RLS disabled while PostgREST-exposed | open | 2026-07-19 | shadow_trade_anomalies, ai_compute_energy, cie_*, us_*, china_15th_fyp, ingestion_payload_hashes, treasury_hedging_metrics |
| P1-003 | security | ~50 views SECURITY DEFINER — audit intentional vs accidental | open | 2026-07-19 | Convert accidental to INVOKER with migration comments |
| P1-004 | security | `get_traffic_intelligence_summary` / `get_subscriber_stats` EXECUTE for anon | open | 2026-07-19 | GRANT in migrations 20260619 / 20260602 |
| P1-005 | security | Duplicate/redundant RLS policies on 11 tables | open | 2026-07-19 | cb_gold_net, climate_risk_metrics, corporate_debt_maturities, fomc_minutes_analysis, global_refining_capacity, institutional_13f_holdings, institutional_trades_inferred, monthly_regime_digests, trade_gravity, upi_autopay_metrics, us_debt_maturities |
| P2-001 | seo | GSC: 124 Redirect error + 88 Page with redirect | open | 2026-07-19 | Need GSC URL list; check trailing-slash + SPA rules |
| P2-002 | seo | GSC: 102 Excluded by noindex — intent audit | open | 2026-07-19 | embed=true intentional; check layout defaults |
| P2-003 | seo | Index rate ~29% (146 indexed / 364 not-indexed) | open | 2026-07-19 | Regenerate sitemap only after P0-002 / P2-001 |
| P3-001 | ingest | Remaining edge functions not on serveIngest; silent error swallow risk | open | 2026-07-19 | ~72/113 on harness; continue via codemod only |
| P3-002 | ingest | GDP unit bug / freshness-on-failure anti-pattern | open | 2026-07-19 | Re-verify before re-fixing |

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
- **Next (human secrets / infra):**
  1. Replace GH secret `SUPABASE_ACCESS_TOKEN` with a valid Supabase PAT (`sbp_…`) that has deploy rights on project `debdriyzfcwvgrhzzzre`
  2. Re-run workflow **Deploy Supabase** (and migrations) on main
  3. Trigger Netlify production deploy (site not auto-publishing main since 2026-07-02; or invoke `trigger-site-rebuild` if `NETLIFY_BUILD_HOOK_URL` is set)
  4. Live-verify: `curl` `/macro-brief/` self-canonical + brief content; then mark P0-001/P0-002/P1-001 `verified-fixed`

