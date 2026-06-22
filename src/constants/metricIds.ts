/**
 * Canonical metric-ID registry — single source of truth for every metric_id
 * string used in frontend queries.
 *
 * Source of truth: SELECT DISTINCT metric_id FROM metric_observations;
 * Last synced: 2026-06-13
 *
 * Rules:
 *  - All frontend hooks MUST reference IDs through this registry.
 *  - Never add an ID that doesn't exist in the live DB (or isn't actively
 *    written by a backend function) — doing so silently produces empty data.
 *  - IDs marked [STUB – 0 rows] are queried by existing hooks but absent from
 *    metric_observations; the corresponding backend function must be created
 *    or repaired before the UI will show data.
 *
 * @see scripts/audit-metrics.mjs — weekly CI job that cross-checks this
 *      registry against the live table to catch drift.
 */

// ── Central Bank Balance Sheets ──────────────────────────────────────────────

/** Bank of Japan weekly balance sheet */
export const BOJ_METRICS = {
  BOJ_TOTAL_ASSETS_TRJPY:                  'BOJ_TOTAL_ASSETS_TRJPY',
  BOJ_MONETARY_BASE_TRJPY:                 'BOJ_MONETARY_BASE_TRJPY',
  BOJ_JGB_HOLDINGS_TRJPY:                  'BOJ_JGB_HOLDINGS_TRJPY',
  BOJ_EXCESS_RESERVES_TRJPY:               'BOJ_EXCESS_RESERVES_TRJPY',
  BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY:      'BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY',
} as const;

/** European Central Bank weekly balance sheet */
export const ECB_METRICS = {
  ECB_TOTAL_ASSETS_MEUR:                   'ECB_TOTAL_ASSETS_MEUR',
  ECB_MRO_OUTSTANDING_MEUR:                'ECB_MRO_OUTSTANDING_MEUR',
  ECB_DF_OUTSTANDING_MEUR:                 'ECB_DF_OUTSTANDING_MEUR',
  ECB_EXCESS_LIQUIDITY_MEUR:               'ECB_EXCESS_LIQUIDITY_MEUR',
} as const;

/** Federal Reserve balance sheet & policy */
export const FED_METRICS = {
  FED_BALANCE_SHEET:                       'FED_BALANCE_SHEET',
  FED_FUNDS_RATE:                          'FED_FUNDS_RATE',
  FED_TREASURY_HOLDINGS:                   'FED_TREASURY_HOLDINGS',
} as const;

// ── US Money Markets & Liquidity ─────────────────────────────────────────────

export const US_MONEY_MARKET_METRICS = {
  RRP_BALANCE_BN:                          'RRP_BALANCE_BN',
  TGA_BALANCE_BN:                          'TGA_BALANCE_BN',
  TGA_BALANCE:                             'TGA_BALANCE',
  REVERSE_REPO_OUTSTANDING:                'REVERSE_REPO_OUTSTANDING',
  PRIMARY_DEALER_TREASURY_HOLDINGS_BN:     'PRIMARY_DEALER_TREASURY_HOLDINGS_BN',
  SOFR_EFFR_SPREAD_BPS:                    'SOFR_EFFR_SPREAD_BPS',
  SOFR_OIS_SPREAD:                         'SOFR_OIS_SPREAD',
  SOFR_RATE:                               'SOFR_RATE',
  SRF_USAGE:                               'SRF_USAGE',
  FX_SWAP_LINES:                           'FX_SWAP_LINES',
  ED_F_FRONT:                              'ED_F_FRONT',
  ED_F_DEFERRED:                           'ED_F_DEFERRED',
  TED_SPREAD:                              'TED_SPREAD',
} as const;

// ── US Macro ─────────────────────────────────────────────────────────────────

export const US_MACRO_METRICS = {
  US_GDP_GROWTH_YOY:                       'US_GDP_GROWTH_YOY',
  US_GDP_NOMINAL_TN:                       'US_GDP_NOMINAL_TN',
  US_GDP_PPP_TN:                           'US_GDP_PPP_TN',
  US_CPI_YOY:                              'US_CPI_YOY',
  US_CPI_INDEX:                            'US_CPI_INDEX',
  US_PCE_PI:                               'US_PCE_PI',
  US_M2:                                   'US_M2',
  US_UNEMPLOYMENT:                         'US_UNEMPLOYMENT',
  US_DEBT_GDP:                             'US_DEBT_GDP',
  US_DEBT_GDP_PCT:                         'US_DEBT_GDP_PCT',
  US_DEBT_USD_TN:                          'US_DEBT_USD_TN',
  US_DEBT_HELD_BY_PUBLIC:                  'US_DEBT_HELD_BY_PUBLIC',
  US_FEDERAL_INTEREST:                     'US_FEDERAL_INTEREST',
  US_FEDERAL_INTEREST_PAYMENTS:            'US_FEDERAL_INTEREST_PAYMENTS',
  US_MAJOR_ENTITLEMENTS:                   'US_MAJOR_ENTITLEMENTS',
  US_DEFENSE_SPENDING:                     'US_DEFENSE_SPENDING',
  US_TAX_RECEIPTS:                         'US_TAX_RECEIPTS',
  US_CREDIT_TOTAL:                         'US_CREDIT_TOTAL',
  US_GFCF_GDP_PCT:                         'US_GFCF_GDP_PCT',
  US_PRIVATE_GFCF_GDP_PCT:                 'US_PRIVATE_GFCF_GDP_PCT',
  US_DEPENDENCY_RATIO:                     'US_DEPENDENCY_RATIO',
  US_POWER_COAL_PCT:                       'US_POWER_COAL_PCT',
  US_POWER_RENEWABLE_PCT:                  'US_POWER_RENEWABLE_PCT',
  US_POWER_OTHER_PCT:                      'US_POWER_OTHER_PCT',
  US_POLICY_RATE:                          'US_POLICY_RATE',
  US_TREASURY_GOLD_TONNES:                 'US_TREASURY_GOLD_TONNES',
  TOTAL_PUBLIC_DEBT:                       'TOTAL_PUBLIC_DEBT',
} as const;

/** US Treasury issuance & yield curve */
export const UST_METRICS = {
  UST_10Y_YIELD:                           'UST_10Y_YIELD',
  UST_10Y_2Y_SPREAD:                       'UST_10Y_2Y_SPREAD',
  UST_BILLS_OUTSTANDING:                   'UST_BILLS_OUTSTANDING',
  UST_BONDS_OUTSTANDING:                   'UST_BONDS_OUTSTANDING',
  UST_NOTES_OUTSTANDING:                   'UST_NOTES_OUTSTANDING',
  UST_DEBT_TOTAL:                          'UST_DEBT_TOTAL',
  UST_NET_ISSUANCE_M:                      'UST_NET_ISSUANCE_M',
  UST_MATURITY_12M_PCT:                    'UST_MATURITY_12M_PCT',
  UST_MATURITY_6M_PCT:                     'UST_MATURITY_6M_PCT',
  US_DGS10:                                'US_DGS10',
  US_10Y_YIELD:                            'US_10Y_YIELD',
  US_10Y_TIPS_YIELD:                       'US_10Y_TIPS_YIELD',
  US_TIPS_10Y_YIELD:                       'US_TIPS_10Y_YIELD',
} as const;

// ── Inflation & Activity Indicators ──────────────────────────────────────────

export const INFLATION_INDICATORS = {
  INFLATION_HEADLINE_YOY:                  'INFLATION_HEADLINE_YOY',
  INFLATION_CORE_YOY:                      'INFLATION_CORE_YOY',
  INFLATION_BREAKEVEN_5Y:                  'INFLATION_BREAKEVEN_5Y',
  INFLATION_EXPECTATIONS_UM:               'INFLATION_EXPECTATIONS_UM',
  INFLATION_REGIME_SCORE:                  'INFLATION_REGIME_SCORE',
  PMI_US_MFG:                              'PMI_US_MFG',
  PMI_US_SERVICES:                         'PMI_US_SERVICES',
  PMI_EA_COMPOSITE_PROXY:                  'PMI_EA_COMPOSITE_PROXY',
  ACTIVITY_REGIME_SCORE:                   'ACTIVITY_REGIME_SCORE',
} as const;

export const LABOR_INDICATORS = {
  LABOR_UNEMPLOYMENT_RATE:                 'LABOR_UNEMPLOYMENT_RATE',
  LABOR_VACANCIES_JOLTS:                   'LABOR_VACANCIES_JOLTS',
  LABOR_WAGE_GROWTH_YOY:                   'LABOR_WAGE_GROWTH_YOY',
  LABOR_TIGHTNESS_SCORE:                   'LABOR_TIGHTNESS_SCORE',
} as const;

export const HOUSING_INDICATORS = {
  HOUSING_PRICE_INDEX:                     'HOUSING_PRICE_INDEX',
  HOUSING_MORTGAGE_RATE_30Y:               'HOUSING_MORTGAGE_RATE_30Y',
  HOUSING_MEDIAN_INCOME_RATIO:             'HOUSING_MEDIAN_INCOME_RATIO',
  HOUSING_REGIME_SCORE:                    'HOUSING_REGIME_SCORE',
} as const;

// ── BOP / Capital Flows ───────────────────────────────────────────────────────

export const BOP_METRICS = {
  BOP_CURRENT_ACCOUNT_GDP:                 'BOP_CURRENT_ACCOUNT_GDP',
  BOP_RESERVES_MONTHS:                     'BOP_RESERVES_MONTHS',
  BOP_SHORT_TERM_DEBT_GDP:                 'BOP_SHORT_TERM_DEBT_GDP',
  BOP_VULNERABILITY_SCORE:                 'BOP_VULNERABILITY_SCORE',
  CAPITAL_FROM_EM_DEBT_BN:                 'CAPITAL_FROM_EM_DEBT_BN',
  CAPITAL_FROM_EQUITY_ETF_BN:              'CAPITAL_FROM_EQUITY_ETF_BN',
  CAPITAL_FROM_GOLD_ETF_BN:               'CAPITAL_FROM_GOLD_ETF_BN',
  CAPITAL_FROM_TREASURIES_BN:              'CAPITAL_FROM_TREASURIES_BN',
} as const;

// ── Gold & Precious Metals ────────────────────────────────────────────────────

export const GOLD_METRICS = {
  GOLD_PRICE_USD:                          'GOLD_PRICE_USD',
  GOLD_COMEX_USD:                          'GOLD_COMEX_USD',
  GOLD_SHANGHAI_USD:                       'GOLD_SHANGHAI_USD',
  GOLD_COMEX_SHANGHAI_SPREAD_PCT:          'GOLD_COMEX_SHANGHAI_SPREAD_PCT',
  GOLD_MONTHLY_RETURN:                     'GOLD_MONTHLY_RETURN',
  SILVER_PRICE_USD:                        'SILVER_PRICE_USD',
  SILVER_COMEX_USD:                        'SILVER_COMEX_USD',
  SILVER_SHANGHAI_USD:                     'SILVER_SHANGHAI_USD',
  SILVER_COMEX_SHANGHAI_SPREAD_PCT:        'SILVER_COMEX_SHANGHAI_SPREAD_PCT',
  COPPER_GOLD_RATIO:                       'COPPER_GOLD_RATIO',
  COPPER_PRICE_USD:                        'COPPER_PRICE_USD',
  /** Written by ingest-commodity-terminal; 0 rows in DB as of 2026-06-13 — likely ingestion gap. */
  NICKEL_PRICE_USD:                        'NICKEL_PRICE_USD',
  RATIO_GOLD_SILVER:                       'RATIO_GOLD_SILVER',
  RATIO_M2_GOLD:                           'RATIO_M2_GOLD',
  RATIO_SPX_GOLD:                          'RATIO_SPX_GOLD',
  RATIO_DEBT_GOLD:                         'RATIO_DEBT_GOLD',
} as const;

// ── Oil, Commodities & Energy ─────────────────────────────────────────────────

export const OIL_METRICS = {
  OIL_BRENT_PRICE_USD:                     'OIL_BRENT_PRICE_USD',
  /** Written by ingest-commodity-terminal (DCOILWTICO series) */
  WTI_CRUDE_PRICE:                         'WTI_CRUDE_PRICE',
  /** Written by ingest-commodity-terminal (DCOILBRENTEU series) */
  BRENT_CRUDE_PRICE:                       'BRENT_CRUDE_PRICE',
  OIL_SPR_LEVEL_US:                        'OIL_SPR_LEVEL_US',
  OIL_REFINERY_UTILIZATION_US:             'OIL_REFINERY_UTILIZATION_US',
  OIL_REFINING_CAPACITY_US:                'OIL_REFINING_CAPACITY_US',
  OIL_IMPORT_DEPENDENCY_US:                'OIL_IMPORT_DEPENDENCY_US',
  OIL_IMPORTS_CONCENTRATION_US:            'OIL_IMPORTS_CONCENTRATION_US',
  EU_GAS_STORAGE_PCT:                      'EU_GAS_STORAGE_PCT',
} as const;

// ── India Macro ───────────────────────────────────────────────────────────────

export const INDIA_METRICS = {
  IN_GDP_GROWTH_YOY:                       'IN_GDP_GROWTH_YOY',
  IN_GDP_NOMINAL_TN:                       'IN_GDP_NOMINAL_TN',
  IN_GDP_PPP_TN:                           'IN_GDP_PPP_TN',
  IN_GDP_CONSTANT_LEVEL:                   'IN_GDP_CONSTANT_LEVEL',
  IN_CPI_YOY:                              'IN_CPI_YOY',
  IN_CPI_FUEL_YOY:                         'IN_CPI_FUEL_YOY',
  IN_WPI_YOY:                              'IN_WPI_YOY',
  IN_WPI_MFG_YOY:                          'IN_WPI_MFG_YOY',
  IN_IIP_YOY:                              'IN_IIP_YOY',
  IN_IIP_GROWTH_YOY:                       'IN_IIP_GROWTH_YOY',
  IN_RETAIL_SALES_YOY:                     'IN_RETAIL_SALES_YOY',
  IN_FX_RESERVES:                          'IN_FX_RESERVES',
  IN_GOLD_RESERVES_TONNES:                 'IN_GOLD_RESERVES_TONNES',
  IN_POLICY_RATE:                          'IN_POLICY_RATE',
  IN_REPO_RATE:                            'IN_REPO_RATE',
  IN_DEBT_GDP_PCT:                         'IN_DEBT_GDP_PCT',
  IN_DEBT_USD_TN:                          'IN_DEBT_USD_TN',
  IN_CREDIT_TOTAL:                         'IN_CREDIT_TOTAL',
  IN_GFCF_GDP_PCT:                         'IN_GFCF_GDP_PCT',
  IN_UNEMPLOYMENT_RATE:                    'IN_UNEMPLOYMENT_RATE',
  IN_LFPR:                                 'IN_LFPR',
  IN_HOURS_WORKED:                         'IN_HOURS_WORKED',
  IN_WAGE_GROWTH:                          'IN_WAGE_GROWTH',
  IN_PLFS_LFPR_RURAL:                      'IN_PLFS_LFPR_RURAL',
  IN_PLFS_LFPR_URBAN:                      'IN_PLFS_LFPR_URBAN',
  IN_PLFS_UR_RURAL:                        'IN_PLFS_UR_RURAL',
  IN_PLFS_UR_URBAN:                        'IN_PLFS_UR_URBAN',
  IN_DEPENDENCY_RATIO:                     'IN_DEPENDENCY_RATIO',
  IN_POWER_COAL_PCT:                       'IN_POWER_COAL_PCT',
  IN_POWER_RENEWABLE_PCT:                  'IN_POWER_RENEWABLE_PCT',
  IN_POWER_OTHER_PCT:                      'IN_POWER_OTHER_PCT',
  IN_ENERGY_COAL_PROD:                     'IN_ENERGY_COAL_PROD',
  IN_ENERGY_ELECTRICITY_CONS:              'IN_ENERGY_ELECTRICITY_CONS',
  IN_ENERGY_INDUSTRIAL:                    'IN_ENERGY_INDUSTRIAL',
  IN_ENERGY_RENEWABLE_SHARE:               'IN_ENERGY_RENEWABLE_SHARE',
  IN_ASI_GVA_TOTAL:                        'IN_ASI_GVA_TOTAL',
  IN_ASI_EMPLOYMENT_TOTAL:                 'IN_ASI_EMPLOYMENT_TOTAL',
  IN_ASI_CAPACITY_UTIL:                    'IN_ASI_CAPACITY_UTIL',
  USD_INR_RATE:                            'USD_INR_RATE',
  RUPEE_PRESSURE_SCORE:                    'RUPEE_PRESSURE_SCORE',
} as const;

// ── China Macro ───────────────────────────────────────────────────────────────

export const CHINA_METRICS = {
  CN_GDP_GROWTH_YOY:                       'CN_GDP_GROWTH_YOY',
  CN_GDP_NOMINAL_TN:                       'CN_GDP_NOMINAL_TN',
  CN_GDP_PPP_TN:                           'CN_GDP_PPP_TN',
  CN_CPI_YOY:                              'CN_CPI_YOY',
  CN_FAI_YOY:                              'CN_FAI_YOY',
  CN_RETAIL_SALES_YOY:                     'CN_RETAIL_SALES_YOY',
  CN_FX_RESERVES:                          'CN_FX_RESERVES',
  CN_FX_RESERVES_TN:                       'CN_FX_RESERVES_TN',
  CN_POLICY_RATE:                          'CN_POLICY_RATE',
  CN_M2_GROWTH:                            'CN_M2_GROWTH',
  CN_DEBT_GDP_PCT:                         'CN_DEBT_GDP_PCT',
  CN_DEBT_CENTRAL_GDP_PCT:                 'CN_DEBT_CENTRAL_GDP_PCT',
  CN_DEBT_USD_TN:                          'CN_DEBT_USD_TN',
  CN_FISCAL_BALANCE_GDP_PCT:               'CN_FISCAL_BALANCE_GDP_PCT',
  CN_CREDIT_GDP_PCT:                       'CN_CREDIT_GDP_PCT',
  CN_CREDIT_TOTAL:                         'CN_CREDIT_TOTAL',
  CN_CGB_YIELD_2Y:                         'CN_CGB_YIELD_2Y',
  CN_CGB_YIELD_10Y:                        'CN_CGB_YIELD_10Y',
  CN_REAL_YIELD_10Y:                       'CN_REAL_YIELD_10Y',
  CN_ICEBERG_RATIO:                        'CN_ICEBERG_RATIO',
  CN_LGFV_STRESS_INDEX:                    'CN_LGFV_STRESS_INDEX',
  CN_MONETIZATION_PRESSURE:                'CN_MONETIZATION_PRESSURE',
  CN_DEBT_WALL_PROXIMITY:                  'CN_DEBT_WALL_PROXIMITY',
  CN_LAND_FISCAL_DEPENDENCE:               'CN_LAND_FISCAL_DEPENDENCE',
  CN_RG_DIFFERENTIAL:                      'CN_RG_DIFFERENTIAL',
  CN_GFCF_GDP_PCT:                         'CN_GFCF_GDP_PCT',
  CN_DEPENDENCY_RATIO:                     'CN_DEPENDENCY_RATIO',
  CN_POWER_COAL_PCT:                       'CN_POWER_COAL_PCT',
  CN_POWER_RENEWABLE_PCT:                  'CN_POWER_RENEWABLE_PCT',
  CN_POWER_OTHER_PCT:                      'CN_POWER_OTHER_PCT',
} as const;

// ── Japan Macro ───────────────────────────────────────────────────────────────

export const JAPAN_METRICS = {
  JP_GDP_GROWTH_YOY:                       'JP_GDP_GROWTH_YOY',
  JP_GDP_NOMINAL_TN:                       'JP_GDP_NOMINAL_TN',
  JP_GDP_PPP_TN:                           'JP_GDP_PPP_TN',
  JP_CPI_YOY:                              'JP_CPI_YOY',
  JP_POLICY_RATE:                          'JP_POLICY_RATE',
  JP_DEBT_GDP_PCT:                         'JP_DEBT_GDP_PCT',
  JP_GFCF_GDP_PCT:                         'JP_GFCF_GDP_PCT',
  JP_DEPENDENCY_RATIO:                     'JP_DEPENDENCY_RATIO',
  JP_CREDIT_TOTAL:                         'JP_CREDIT_TOTAL',
} as const;

// ── Eurozone & European Country Macro ─────────────────────────────────────────

export const EUROPE_METRICS = {
  EU_GDP_GROWTH_YOY:                       'EU_GDP_GROWTH_YOY',
  EU_GDP_NOMINAL_TN:                       'EU_GDP_NOMINAL_TN',
  EU_GDP_PPP_TN:                           'EU_GDP_PPP_TN',
  EU_CPI_YOY:                              'EU_CPI_YOY',
  EU_POLICY_RATE:                          'EU_POLICY_RATE',
  EU_DEBT_GDP_PCT:                         'EU_DEBT_GDP_PCT',
  EU_GFCF_GDP_PCT:                         'EU_GFCF_GDP_PCT',
  EU_DEPENDENCY_RATIO:                     'EU_DEPENDENCY_RATIO',
  EU_CREDIT_TOTAL:                         'EU_CREDIT_TOTAL',
  EU_POWER_COAL_PCT:                       'EU_POWER_COAL_PCT',
  EU_POWER_RENEWABLE_PCT:                  'EU_POWER_RENEWABLE_PCT',
  EU_POWER_OTHER_PCT:                      'EU_POWER_OTHER_PCT',
  DE_GDP_GROWTH_YOY:                       'DE_GDP_GROWTH_YOY',
  DE_GDP_NOMINAL_USD:                      'DE_GDP_NOMINAL_USD',
  DE_DEBT_GDP_PCT:                         'DE_DEBT_GDP_PCT',
  FR_GDP_GROWTH_YOY:                       'FR_GDP_GROWTH_YOY',
  FR_GDP_NOMINAL_USD:                      'FR_GDP_NOMINAL_USD',
  FR_DEBT_GDP_PCT:                         'FR_DEBT_GDP_PCT',
  IT_GDP_GROWTH_YOY:                       'IT_GDP_GROWTH_YOY',
  IT_GDP_NOMINAL_USD:                      'IT_GDP_NOMINAL_USD',
  IT_DEBT_GDP_PCT:                         'IT_DEBT_GDP_PCT',
  UK_GDP_GROWTH_YOY:                       'UK_GDP_GROWTH_YOY',
  UK_GDP_NOMINAL_USD:                      'UK_GDP_NOMINAL_USD',
  UK_DEBT_GDP_PCT:                         'UK_DEBT_GDP_PCT',
} as const;

// ── G20 Sovereign / Major Economies ──────────────────────────────────────────

export const G20_METRICS = {
  G20_DEBT_GDP_PCT:                        'G20_DEBT_GDP_PCT',
  G20_INFLATION_YOY:                       'G20_INFLATION_YOY',
  G20_INTEREST_BURDEN_PCT:                 'G20_INTEREST_BURDEN_PCT',
  AR_GDP_GROWTH_YOY:                       'AR_GDP_GROWTH_YOY',
  AR_GDP_NOMINAL_USD:                      'AR_GDP_NOMINAL_USD',
  AR_DEBT_GDP_PCT:                         'AR_DEBT_GDP_PCT',
  AU_GDP_GROWTH_YOY:                       'AU_GDP_GROWTH_YOY',
  AU_GDP_NOMINAL_USD:                      'AU_GDP_NOMINAL_USD',
  AU_DEBT_GDP_PCT:                         'AU_DEBT_GDP_PCT',
  BR_GDP_GROWTH_YOY:                       'BR_GDP_GROWTH_YOY',
  BR_GDP_NOMINAL_USD:                      'BR_GDP_NOMINAL_USD',
  BR_DEBT_GDP_PCT:                         'BR_DEBT_GDP_PCT',
  ID_GDP_GROWTH_YOY:                       'ID_GDP_GROWTH_YOY',
  ID_GDP_NOMINAL_USD:                      'ID_GDP_NOMINAL_USD',
  ID_DEBT_GDP_PCT:                         'ID_DEBT_GDP_PCT',
  KR_GDP_GROWTH_YOY:                       'KR_GDP_GROWTH_YOY',
  KR_GDP_NOMINAL_USD:                      'KR_GDP_NOMINAL_USD',
  KR_DEBT_GDP_PCT:                         'KR_DEBT_GDP_PCT',
  MX_GDP_GROWTH_YOY:                       'MX_GDP_GROWTH_YOY',
  MX_GDP_NOMINAL_USD:                      'MX_GDP_NOMINAL_USD',
  MX_DEBT_GDP_PCT:                         'MX_DEBT_GDP_PCT',
  RU_GDP_GROWTH_YOY:                       'RU_GDP_GROWTH_YOY',
  RU_GDP_NOMINAL_TN:                       'RU_GDP_NOMINAL_TN',
  RU_GDP_PPP_TN:                           'RU_GDP_PPP_TN',
  RU_CPI_YOY:                              'RU_CPI_YOY',
  RU_DEBT_GDP_PCT:                         'RU_DEBT_GDP_PCT',
  RU_POLICY_RATE:                          'RU_POLICY_RATE',
  SA_GDP_GROWTH_YOY:                       'SA_GDP_GROWTH_YOY',
  SA_GDP_NOMINAL_USD:                      'SA_GDP_NOMINAL_USD',
  SA_DEBT_GDP_PCT:                         'SA_DEBT_GDP_PCT',
  TR_GDP_GROWTH_YOY:                       'TR_GDP_GROWTH_YOY',
  TR_GDP_NOMINAL_USD:                      'TR_GDP_NOMINAL_USD',
  TR_DEBT_GDP_PCT:                         'TR_DEBT_GDP_PCT',
  ZA_GDP_GROWTH_YOY:                       'ZA_GDP_GROWTH_YOY',
  ZA_GDP_NOMINAL_USD:                      'ZA_GDP_NOMINAL_USD',
  ZA_DEBT_GDP_PCT:                         'ZA_DEBT_GDP_PCT',
} as const;

// ── De-dollarization / Global Reserve Composition ────────────────────────────

export const DEDOLLARIZATION_METRICS = {
  GLOBAL_USD_SHARE_PCT:                    'GLOBAL_USD_SHARE_PCT',
  GLOBAL_GOLD_SHARE_PCT:                   'GLOBAL_GOLD_SHARE_PCT',
  GLOBAL_RMB_SHARE_PCT:                    'GLOBAL_RMB_SHARE_PCT',
  GLOBAL_EUR_SHARE_PCT:                    'GLOBAL_EUR_SHARE_PCT',
  GLOBAL_OTHER_SHARE_PCT:                  'GLOBAL_OTHER_SHARE_PCT',
  // NOTE: GLOBAL_GOLD_HOLDINGS_USD is absent from both metric_observations
  // and vw_dedollarization. useDeDollarization.goldHoldings is always null
  // until this ID is added to the ingestion pipeline + view.
  BRICS_GDP_PPP_TN:                        'BRICS_GDP_PPP_TN',
  BRICS_GOLD_HOLDINGS_TONNES:              'BRICS_GOLD_HOLDINGS_TONNES',
  BRICS_GOLD_SHARE_PCT:                    'BRICS_GOLD_SHARE_PCT',
  BRICS_USD_RESERVE_SHARE_PCT:             'BRICS_USD_RESERVE_SHARE_PCT',
  BRICS_DEBT_GDP_PCT:                      'BRICS_DEBT_GDP_PCT',
  BRICS_INFLATION_YOY:                     'BRICS_INFLATION_YOY',
} as const;

// ── REER & Current Account ───────────────────────────────────────────────────

export const REER_AND_CA_METRICS = {
  REER_INDEX_IN:                           'REER_INDEX_IN',
  REER_INDEX_CN:                           'REER_INDEX_CN',
  REER_INDEX_BR:                           'REER_INDEX_BR',
  REER_INDEX_TR:                           'REER_INDEX_TR',
  CA_GDP_PCT_IN:                           'CA_GDP_PCT_IN',
  CA_GDP_PCT_CN:                           'CA_GDP_PCT_CN',
  CA_GDP_PCT_BR:                           'CA_GDP_PCT_BR',
  CA_GDP_PCT_TR:                           'CA_GDP_PCT_TR',
} as const;

// ── Currency Wars & EM FX ─────────────────────────────────────────────────────

export const CURRENCY_METRICS = {
  COMPOSITE_PRESSURE_INDEX:                'COMPOSITE_PRESSURE_INDEX',
  EM_RELATIVE_PRESSURE:                    'EM_RELATIVE_PRESSURE',
  POLICY_DIVERGENCE_INDEX:                 'POLICY_DIVERGENCE_INDEX',
  FLOW_TENSION_INDEX:                      'FLOW_TENSION_INDEX',
  /**
   * STUB – 0 rows in metric_observations as of 2026-06-13.
   * No backend function currently writes USD/CNY, USD/BRL, USD/MXN, USD/TWD.
   * useCurrencyWars will show no EM FX series until ingest-currency-wars
   * is updated to include these pairs.
   * TODO: add ingest-currency-wars EM FX ingestion.
   */
  USD_CNY_RATE:                            'USD_CNY_RATE',
  /** Derived daily cross-rate: USD_INR_RATE ÷ USD_CNY_RATE (ingest-currency-wars) */
  CNY_INR_RATE:                            'CNY_INR_RATE',
  USD_BRL_RATE:                            'USD_BRL_RATE',
  USD_MXN_RATE:                            'USD_MXN_RATE',
  USD_TWD_RATE:                            'USD_TWD_RATE',
} as const;

// ── Computed Signals & Flow Metrics ──────────────────────────────────────────

export const SIGNAL_METRICS = {
  FLOW_TO_RISK_ASSETS:                     'FLOW_TO_RISK_ASSETS',
  FLOW_TO_SAFE_HAVENS:                     'FLOW_TO_SAFE_HAVENS',
  FLOW_EQUITY_TO_RISK_ASSETS:              'FLOW_EQUITY_TO_RISK_ASSETS',
  FLOW_TREASURIES_TO_SAFE_HAVEN:           'FLOW_TREASURIES_TO_SAFE_HAVEN',
  FLOW_CORE_TO_REGIME:                     'FLOW_CORE_TO_REGIME',
  FLOW_HEADLINE_TO_REGIME:                 'FLOW_HEADLINE_TO_REGIME',
  FLOW_MORTGAGE_TO_HOUSING:                'FLOW_MORTGAGE_TO_HOUSING',
  FLOW_VACANCIES_TO_TIGHTNESS:             'FLOW_VACANCIES_TO_TIGHTNESS',
  BIS_GLOBAL_LIQUIDITY_USD_BN:             'BIS_GLOBAL_LIQUIDITY_USD_BN',
  BIS_GLOBAL_LIQUIDITY_USD_YOY_PCT:        'BIS_GLOBAL_LIQUIDITY_USD_YOY_PCT',
} as const;

// ── Global Market Indicators ──────────────────────────────────────────────────

export const MARKET_METRICS = {
  DXY_INDEX:                               'DXY_INDEX',
  SPX_INDEX:                               'SPX_INDEX',
  VIX_INDEX:                               'VIX_INDEX',
  MOVE_INDEX:                              'MOVE_INDEX',
  BITCOIN_PRICE_USD:                       'BITCOIN_PRICE_USD',
  OECD_CLI_US:                             'OECD_CLI_US',
  OECD_CLI_CN:                             'OECD_CLI_CN',
  OECD_CLI_EA:                             'OECD_CLI_EA',
  OECD_CLI_IN:                             'OECD_CLI_IN',
} as const;

// ── Flat registry — canonical import for all hook files ──────────────────────
//
// Usage in hooks:
//   import { METRIC_IDS as MID } from '@/constants/metricIds';
//   .eq('metric_id', MID.GOLD_PRICE_USD)
//   .in('metric_id', [MID.GOLD_PRICE_USD, MID.SILVER_PRICE_USD])

export const METRIC_IDS = {
  ...BOJ_METRICS,
  ...ECB_METRICS,
  ...FED_METRICS,
  ...US_MONEY_MARKET_METRICS,
  ...US_MACRO_METRICS,
  ...UST_METRICS,
  ...INFLATION_INDICATORS,
  ...LABOR_INDICATORS,
  ...HOUSING_INDICATORS,
  ...BOP_METRICS,
  ...GOLD_METRICS,
  ...OIL_METRICS,
  ...INDIA_METRICS,
  ...CHINA_METRICS,
  ...JAPAN_METRICS,
  ...EUROPE_METRICS,
  ...G20_METRICS,
  ...DEDOLLARIZATION_METRICS,
  ...REER_AND_CA_METRICS,
  ...CURRENCY_METRICS,
  ...SIGNAL_METRICS,
  ...MARKET_METRICS,
} as const;

export type MetricId = typeof METRIC_IDS[keyof typeof METRIC_IDS];
