# ISSUES_LEDGER

Single living status for GraphiQuestor. Do not create new `*_AUDIT_REPORT.md` or `*_SUMMARY.md` files — update this ledger instead.

Columns: `id | area | description | status | last-verified-date | notes`

Status values: `open` · `in-progress` · `verified-fixed` · `wont-fix` · `blocked`

Source archives (historical only): `docs/archive/`

---

## Active issues

| id | area | description | status | last-verified-date | notes |
|----|------|-------------|--------|--------------------|-------|
| P0-000 | process | Compost: consolidate audits into ledger, clear root debris | open | 2026-07-19 | Audits already in docs/archive; ledger created this session |
| P0-001 | macro-brief | `/macro-brief` shows Brief Unavailable; generation/cron/TZ may be broken | open | 2026-07-19 | Live: feeds chip lagged; client falls back today+yesterday only; edge uses UTC date |
| P0-002 | seo | `/macro-brief` (and dated routes) serve homepage shell + homepage canonical | open | 2026-07-19 | Live curl: Terminal-*.js only, canonical `https://graphiquestor.com/`; archive route OK |
| P0-003 | seo | Canonical coverage incomplete for prerendered routes (prior claim 39/94 missing SEOManager) | open | 2026-07-19 | Layout auto-canonicals when route mounts; real failure is homepage SPA shell when prerender missing |
| P1-001 | security | `daily_macro_briefs` public INSERT/UPDATE (advisor WITH CHECK true for anon) | open | 2026-07-19 | Repo migration only has SELECT; confirm live policies |
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

_(Append at end of each session.)_
