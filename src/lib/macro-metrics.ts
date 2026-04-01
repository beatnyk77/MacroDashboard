/**
 * Standardized metric keys for programmatic country pages.
 * Maps 1:1 to the metric_key column in country_metrics table.
 */
export const COUNTRY_METRIC_GROUPS = {
  BASICS: [
    { key: 'population_mn', label: 'Population', unit: 'Mn', source: 'WB' },
    { key: 'area_sq_km', label: 'Land Area', unit: 'sq km', source: 'WB' },
    { key: 'gdp_usd_bn', label: 'GDP (Nominal)', unit: '$Bn', source: 'IMF' },
  ],
  MACRO_HEARTBEAT: [
    { key: 'gdp_yoy_pct', label: 'Real GDP Growth', unit: '%', source: 'IMF' },
    { key: 'cpi_yoy_pct', label: 'Inflation (CPI)', unit: '%', source: 'IMF' },
    { key: 'unemployment_pct', label: 'Unemployment Rate', unit: '%', source: 'IMF' },
    { key: 'central_bank_rate_pct', label: 'Policy Rate', unit: '%', source: 'BIS' },
    { key: 'ca_gdp_pct', label: 'Current Account/GDP', unit: '%', source: 'IMF' },
    { key: 'fx_reserves_bn', label: 'FX Reserves (ex-Gold)', unit: '$Bn', source: 'IMF' },
  ],
  FINANCIAL_STABILITY: [
    { key: 'debt_gdp_pct', label: 'Gov Debt/GDP', unit: '%', source: 'IMF' },
    { key: 'hh_debt_gdp_pct', label: 'HH Debt/GDP', unit: '%', source: 'BIS' },
    { key: 'ext_debt_gdp_pct', label: 'External Debt/GDP', unit: '%', source: 'WB' },
    { key: 'fiscal_balance_gdp_pct', label: 'Fiscal Balance/GDP', unit: '%', source: 'IMF' },
    { key: 'military_exp_gdp_pct', label: 'Military Exp/GDP', unit: '%', source: 'SIPRI' },
  ],
  YIELD_CURVE: [
    { key: 'yield_2y_pct', label: '2Y Sovereign Yield', unit: '%', source: 'TradingView' },
    { key: 'yield_10y_pct', label: '10Y Sovereign Yield', unit: '%', source: 'TradingView' },
    { key: 'yield_slope_2s10s', label: '2s10s Slope', unit: 'bps', source: 'Derived' },
  ],
  IMPORT_DEPENDENCY: [
    { key: 'energy_import_pct', label: 'Energy Imports (Net)', unit: '%', source: 'WB' },
    { key: 'oil_import_dependency_pct', label: 'Oil Dependency', unit: '%', source: 'IEA' },
    { key: 'top_partner_export_share_pct', label: 'Top Partner Share', unit: '%', source: 'IMF DOTS' },
  ],
  RESERVES_ALIGNMENT: [
    { key: 'gold_reserves_tonnes', label: 'Gold Reserves', unit: 'T', source: 'WGC/IMF' },
    { key: 'usd_reserve_share_pct', label: 'USD Share of FX', unit: '%', source: 'IMF COFER' },
    { key: 'brics_alignment_score', label: 'Geopolitical Alignment', unit: '/10', source: 'Internal' },
  ]
};

export const ALL_COUNTRY_METRIC_KEYS = Object.values(COUNTRY_METRIC_GROUPS)
  .flat()
  .map(m => m.key);
