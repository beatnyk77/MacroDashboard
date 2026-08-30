export interface AuthorityMetricMapping {
  publicSlug: string;
  metricId: string;
  producer: string;
  storagePath: string;
  observationGrain: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'mixed';
  unit: string;
  sourceLedger: string[];
  calculationPath: string;
}

export const EXPECTED_AUTHORITY_METRICS: AuthorityMetricMapping[] = [
  {
    publicSlug: 'net-liquidity',
    metricId: 'BIS_GLOBAL_LIQUIDITY_USD_BN',
    producer: 'ingest-nyfed-markets',
    storagePath: 'public.vw_net_liquidity',
    observationGrain: 'daily',
    unit: 'USD bn',
    sourceLedger: ['FRED WALCL', 'FRED WTREGEN', 'FRED RRPONTSYD', 'NY Fed H.4.1'],
    calculationPath: 'The terminal reads public.vw_net_liquidity directly. The checked-in producer evidence is ingest-nyfed-markets writing TGA_BALANCE_BN and RRP_BALANCE_BN into metric_observations, with FED_BALANCE_SHEET supplied by the FRED ingestion path. BIS_GLOBAL_LIQUIDITY_USD_BN remains a downstream mirror id used by digest code even though migration 20260801000002 deactivates it as unsourced.',
  },
  {
    publicSlug: 'fiscal-dominance-meter',
    metricId: 'US_FISCAL_INTEREST_TO_RECEIPTS_PCT',
    producer: 'ingest-us-macro::processFiscal',
    storagePath: 'public.metric_observations',
    observationGrain: 'quarterly',
    unit: '%',
    sourceLedger: ['FRED A091RC1Q027SBEA', 'FRED FGRECPT', 'FRED GDP', 'FRED W068RC1Q027SBEA', 'US Treasury FiscalData'],
    calculationPath: 'processFiscal() writes the supporting quarterly table public.us_fiscal_stress and mirrors the derived ratio into metric_observations as US_FISCAL_INTEREST_TO_RECEIPTS_PCT for vw_latest_metrics and frontend consumers.',
  },
  {
    publicSlug: 'sovereign-stress-index',
    metricId: 'BOP_VULNERABILITY_SCORE',
    producer: 'UNRESOLVED_NO_ACTIVE_PRODUCER',
    storagePath: 'public.vw_g20_sovereign',
    observationGrain: 'mixed',
    unit: 'index',
    sourceLedger: ['BIS Statistics Portal', 'Bloomberg CDS/FX vol', 'IMF WEO'],
    calculationPath: 'The methodology slug exists in src/features/metrics/metricsCatalog.ts and BOP_VULNERABILITY_SCORE exists in src/constants/metricIds.ts, but no current migration or producer function writes that metric_id. The nearest checked-in sovereign surface is public.vw_g20_sovereign, which exposes debt, inflation, real-rate proxy, and interest-burden aggregates without a dedicated SSI row.',
  },
  {
    publicSlug: 'm2-gold-ratio',
    metricId: 'RATIO_M2_GOLD',
    producer: 'refresh-gold-ratios -> populate_gold_ratios()',
    storagePath: 'public.metric_observations',
    observationGrain: 'monthly',
    unit: 'ratio',
    sourceLedger: ['FRED M2SL', 'Gold price observations', 'World Gold Council stock assumption'],
    calculationPath: 'The SQL function populate_gold_ratios() transforms upstream gold and money-supply observations into canonical metric_observations rows such as RATIO_M2_GOLD. The refresh-gold-ratios edge function invokes that SQL function, while vw_gold_ratios_tall remains a read model keyed by ratio_name rather than metric_id.',
  },
  {
    publicSlug: 'global-usd-reserve-share',
    metricId: 'GLOBAL_USD_SHARE_PCT',
    producer: 'ingest-cofer',
    storagePath: 'public.metric_observations',
    observationGrain: 'quarterly',
    unit: '%',
    sourceLedger: ['IMF COFER'],
    calculationPath: 'ingest-cofer writes GLOBAL_USD_SHARE_PCT into metric_observations. public.vw_dedollarization derives the public latest, QoQ, and YoY surface from those stored observations.',
  },
  {
    publicSlug: 'CB_GOLD_NET',
    metricId: 'CB_GOLD_NET',
    producer: 'ingest-cb-gold-net',
    storagePath: 'public.cb_gold_net',
    observationGrain: 'mixed',
    unit: 'tonnes',
    sourceLedger: ['IMF IFS RAXG_FO', 'World Gold Council'],
    calculationPath: 'ingest-cb-gold-net computes the multi-period leaderboard table in public.cb_gold_net. ingest-fiscaldata separately mirrors the latest annual scalar into metric_observations as CB_GOLD_NET so vw_latest_metrics and cross-feature signals can read it.',
  },
  {
    publicSlug: 'india-credit-cycle',
    metricId: 'IN_BANK_CREDIT_GROWTH_YOY',
    producer: 'ingest-india-credit-cycle',
    storagePath: 'public.india_credit_cycle',
    observationGrain: 'monthly',
    unit: '%',
    sourceLedger: ['RBI DBIE BSC1', 'MoSPI'],
    calculationPath: 'ingest-india-credit-cycle fetches monthly RBI DBIE credit and deposit levels, computes YoY credit growth plus the phase clock, stores the richer row set in public.india_credit_cycle, and mirrors IN_BANK_CREDIT_GROWTH_YOY into metric_observations.',
  },
  {
    publicSlug: 'china-iceberg-ratio',
    metricId: 'CN_ICEBERG_RATIO',
    producer: 'compute-china-debt-signals',
    storagePath: 'public.china_debt_composites',
    observationGrain: 'quarterly',
    unit: 'x',
    sourceLedger: ['IMF Article IV', 'IMF WEO', 'BIS', 'World Bank'],
    calculationPath: 'compute-china-debt-signals reads china_debt_layers, divides consolidated_high by central_official, upserts CN_ICEBERG_RATIO into public.china_debt_composites, and mirrors the same value into metric_observations for vw_latest_metrics and useLatestMetric.',
  },
];
