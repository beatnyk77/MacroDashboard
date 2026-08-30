# Task 1 Implementation Report

Status: DONE_WITH_CONCERNS

Date: 2026-08-31

Files changed:

- `authorityMetricMapping.ts`
- `docs/ops/authority-metric-mapping.md`
- `scripts/__tests__/authorityMetricMapping.test.ts`
- `src/constants/metricIds.ts`

Commands run:

- `sed -n '1,260p' .superpowers/sdd/2026-08-31-graphiquestor-authority-engine/task-1-brief.md`
- `git status --short`
- `rg -n "net-liquidity|fiscal-dominance-meter|sovereign-stress-index|m2-gold-ratio|global-usd-reserve-share|CB_GOLD_NET|india-credit-cycle|china-iceberg-ratio|RATIO_M2_GOLD|GLOBAL_USD_SHARE_PCT|IN_BANK_CREDIT_GROWTH_YOY|CN_ICEBERG_RATIO|US_FISCAL_INTEREST_TO_RECEIPTS_PCT|BOP_VULNERABILITY_SCORE|BIS_GLOBAL_LIQUIDITY_USD_BN" src supabase -S`
- `rg -n "vw_net_liquidity|vw_gold_ratios_tall|vw_dedollarization|cb_gold_net|india_credit_cycle|china_debt_composites|vw_g20_sovereign|us_fiscal_stress|metric_observations" supabase/migrations supabase/functions -S`
- `sed -n '1,240p' authorityMetricMapping.ts`
- `sed -n '1,260p' src/features/metrics/metricsCatalog.ts`
- `sed -n '1,260p' src/lib/pipelineCatalog.ts`
- `sed -n '1,260p' src/hooks/useLatestMetric.ts`
- `sed -n '1,240p' scripts/__tests__/authorityMetricMapping.test.ts`
- `sed -n '1,220p' supabase/migrations/014_vw_g20_sovereign.sql`
- `sed -n '1,220p' supabase/migrations/20260215000004_us_fiscal_stress.sql`
- `sed -n '1,220p' supabase/migrations/20260415000001_fiscal_stress_entitlements.sql`
- `sed -n '1,220p' supabase/migrations/20260826000001_us_fiscal_capacity_metrics.sql`
- `sed -n '1,260p' supabase/functions/ingest-us-macro/fiscal.ts`
- `sed -n '1,260p' supabase/functions/refresh-gold-ratios/index.ts`
- `sed -n '1,220p' supabase/functions/ingest-cofer/index.ts`
- `sed -n '1,220p' supabase/migrations/006_dedollarization_view.sql`
- `sed -n '1,320p' supabase/functions/compute-china-debt-signals/index.ts`
- `sed -n '1,220p' supabase/migrations/20260619000001_china_debt_layers.sql`
- `sed -n '1,320p' supabase/functions/ingest-india-credit-cycle/index.ts`
- `sed -n '1,220p' supabase/migrations/20260608100000_india_credit_cycle_dbie.sql`
- `sed -n '1,220p' supabase/functions/ingest-cb-gold-net/index.ts`
- `sed -n '1,220p' supabase/migrations/20260215000008_cb_gold_net.sql`
- `sed -n '1,220p' supabase/migrations/20260531000002_register_tips_yield_cb_gold_net.sql`
- `sed -n '1,220p' src/pages/MetricPage.tsx`
- `sed -n '1,240p' src/constants/metricIds.ts`
- `sed -n '1,240p' supabase/migrations/20260206000001_bop_pressure_metrics.sql`
- `sed -n '1,260p' supabase/functions/ingest-imf-current-account/index.ts`
- `sed -n '1,240p' supabase/migrations/003_views.sql`
- `sed -n '1,220p' supabase/functions/ingest-fiscaldata/index.ts`
- `sed -n '1,260p' supabase/functions/ingest-global-liquidity/index.ts`
- `sed -n '1,220p' supabase/migrations/20260801000002_deactivate_unsourced_metrics.sql`
- `sed -n '1,240p' supabase/migrations/20260531000001_add_global_liquidity_cron.sql`
- `sed -n '1,240p' supabase/migrations/20260130000020_gold_ratios_historical.sql`
- `sed -n '1,220p' supabase/migrations/20260801000004_deactivate_fabricated_imf_metrics.sql`
- `tail -n 80 src/constants/metricIds.ts`
- `npx vitest run scripts/__tests__/authorityMetricMapping.test.ts`
- `git diff -- authorityMetricMapping.ts docs/ops/authority-metric-mapping.md scripts/__tests__/authorityMetricMapping.test.ts`
- `git add authorityMetricMapping.ts docs/ops/authority-metric-mapping.md scripts/__tests__/authorityMetricMapping.test.ts .superpowers/sdd/2026-08-31-graphiquestor-authority-engine/task-1-report.md`
- `git commit -m "test: map flagship authority metrics"`
- `ls authorityMetricMapping.ts .superpowers/sdd/2026-08-31-graphiquestor-authority-engine/task-1-report.md`
- `git add authorityMetricMapping.ts docs/ops/authority-metric-mapping.md scripts/__tests__/authorityMetricMapping.test.ts`
- `git add -f .superpowers/sdd/2026-08-31-graphiquestor-authority-engine/task-1-report.md`
- `git rev-parse HEAD`
- `sed -n '1,240p' src/hooks/useG20Sovereign.ts`
- `sed -n '1,280p' src/features/dashboard/components/sections/SovereignRiskMatrix.tsx`
- `sed -n '1,260p' src/hooks/useG20SovereignMatrix.ts`
- `sed -n '1,220p' supabase/functions/ingest-imf/index.ts`
- `sed -n '1,220p' supabase/migrations/013_g20_sovereign_metrics.sql`
- `sed -n '840,900p' supabase/migrations/20260613000000_canonical_crons.sql`
- `sed -n '1,140p' supabase/migrations/20260829010000_register_openbb_cot_market_metrics.sql`
- `npx vitest run scripts/__tests__/authorityMetricMapping.test.ts`
- `git diff -- authorityMetricMapping.ts docs/ops/authority-metric-mapping.md scripts/__tests__/authorityMetricMapping.test.ts src/constants/metricIds.ts .superpowers/sdd/2026-08-31-graphiquestor-authority-engine/task-1-report.md`

Commit hash:

- `TO_BE_FILLED_AFTER_COMMIT`
- `4e9fef7c8fb9da077cbdde3a0ff755633a528919`

Concerns:

- `public.vw_net_liquidity` is referenced by product code and security migrations, yet no checked-in SQL definition was found in the inspected migrations.
- `US_NET_LIQUIDITY_USD_BN` is now the active registry-backed authority id in the mapping, while checked-in product consumers still read `public.vw_net_liquidity` and some digest code still references the older deactivated `BIS_GLOBAL_LIQUIDITY_USD_BN` id.
- The live sovereign screen resolves to `G20_DEBT_GDP_PCT` via `ingest-imf` and `public.vw_g20_sovereign`, while the methodology copy for `sovereign-stress-index` still describes a different CDS and FX-vol composite that is not what the current product renders.
- `ingest-cofer` contains simulated data in checked-in code. The mapping records the active producer path, and the source-quality issue remains open.
