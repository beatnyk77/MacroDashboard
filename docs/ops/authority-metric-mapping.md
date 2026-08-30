# Authority Metric Mapping

This document provides a single authoritative mapping for the eight flagship metrics of GraphiQuestor. It specifies the underlying Supabase metric ID, producer, storage location, and observation parameters.

| Public Slug | Metric ID | Producer | Storage Path | Grain | Unit | Source Ledger |
|-------------|-----------|----------|--------------|-------|------|---------------|
| `net-liquidity` | `US_NET_LIQUIDITY_USD_BN` | `ingest-nyfed-markets + ingest-fred` | `public.vw_net_liquidity` | daily | USD bn | FRED WALCL, FRED WTREGEN, FRED RRPONTSYD, NY Fed H.4.1 |
| `fiscal-dominance-meter` | `US_FISCAL_INTEREST_TO_RECEIPTS_PCT` | `ingest-us-macro::processFiscal` | `public.metric_observations` | quarterly | % | FRED A091RC1Q027SBEA, FRED FGRECPT, FRED GDP, FRED W068RC1Q027SBEA, US Treasury FiscalData |
| `sovereign-stress-index` | `G20_DEBT_GDP_PCT` | `ingest-imf` | `public.vw_g20_sovereign` | annual | % | IMF DataMapper FAD_G20, US FRED proxies for real-rate leg |
| `m2-gold-ratio` | `RATIO_M2_GOLD` | `refresh-gold-ratios -> populate_gold_ratios()` | `public.metric_observations` | monthly | ratio | FRED M2SL, Gold price observations, World Gold Council stock assumption |
| `global-usd-reserve-share` | `GLOBAL_USD_SHARE_PCT` | `ingest-cofer` | `public.metric_observations` | quarterly | % | IMF COFER |
| `CB_GOLD_NET` | `CB_GOLD_NET` | `ingest-cb-gold-net` | `public.cb_gold_net` | mixed | tonnes | IMF IFS RAXG_FO, World Gold Council |
| `india-credit-cycle` | `IN_BANK_CREDIT_GROWTH_YOY` | `ingest-india-credit-cycle` | `public.india_credit_cycle` | monthly | % | RBI DBIE BSC1, MoSPI |
| `china-iceberg-ratio` | `CN_ICEBERG_RATIO` | `compute-china-debt-signals` | `public.china_debt_composites` | quarterly | x | IMF Article IV, IMF WEO, BIS, World Bank |

## Calculation Paths

- **net-liquidity**: Migration 20260829010000 registers US_NET_LIQUIDITY_USD_BN as the active canonical net-liquidity metric. The live terminal still reads public.vw_net_liquidity, whose checked-in upstream legs come from ingest-nyfed-markets writing TGA_BALANCE_BN and RRP_BALANCE_BN plus the FRED ingestion path writing FED_BALANCE_SHEET/WALCL-backed observations.
- **fiscal-dominance-meter**: processFiscal() writes the supporting quarterly table public.us_fiscal_stress and mirrors the derived ratio into metric_observations as US_FISCAL_INTEREST_TO_RECEIPTS_PCT for vw_latest_metrics and frontend consumers.
- **sovereign-stress-index**: The live sovereign screen is backed by public.vw_g20_sovereign, not by BOP_VULNERABILITY_SCORE. Migration 013_g20_sovereign_metrics.sql registers G20_DEBT_GDP_PCT, G20_INFLATION_YOY, and G20_INTEREST_BURDEN_PCT. supabase/functions/ingest-imf/index.ts writes those aggregate rows into metric_observations, and vw_g20_sovereign derives the displayed debt, inflation, interest-burden, and real-rate proxy fields from them.
- **m2-gold-ratio**: The SQL function populate_gold_ratios() transforms upstream gold and money-supply observations into canonical metric_observations rows such as RATIO_M2_GOLD. The refresh-gold-ratios edge function invokes that SQL function, while vw_gold_ratios_tall remains a read model keyed by ratio_name rather than metric_id.
- **global-usd-reserve-share**: ingest-cofer writes GLOBAL_USD_SHARE_PCT into metric_observations. public.vw_dedollarization derives the public latest, QoQ, and YoY surface from those stored observations.
- **CB_GOLD_NET**: ingest-cb-gold-net computes the multi-period leaderboard table in public.cb_gold_net. ingest-fiscaldata separately mirrors the latest annual scalar into metric_observations as CB_GOLD_NET so vw_latest_metrics and cross-feature signals can read it.
- **india-credit-cycle**: ingest-india-credit-cycle fetches monthly RBI DBIE credit and deposit levels, computes YoY credit growth plus the phase clock, stores the richer row set in public.india_credit_cycle, and mirrors IN_BANK_CREDIT_GROWTH_YOY into metric_observations.
- **china-iceberg-ratio**: compute-china-debt-signals reads china_debt_layers, divides consolidated_high by central_official, upserts CN_ICEBERG_RATIO into public.china_debt_composites, and mirrors the same value into metric_observations for vw_latest_metrics and useLatestMetric.
