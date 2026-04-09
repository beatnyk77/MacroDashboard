/**
 * Standardized metric keys for programmatic country pages.
 * Maps 1:1 to vw_country_terminal column names.
 */
export const COUNTRY_METRIC_GROUPS = {
  ECONOMIC_SIZE: [
    { key: 'gdp_usd_bn', label: 'GDP (Nominal)', unit: '$Bn', source: 'IMF' },
    { key: 'gdp_per_capita_usd', label: 'GDP per Capita', unit: '$', source: 'WB' },
    { key: 'population_mn', label: 'Population', unit: 'Mn', source: 'UN' },
  ],
  GROWTH_INFLATION: [
    { key: 'gdp_yoy_pct', label: 'Real GDP Growth', unit: '%', source: 'WB' },
    { key: 'cpi_yoy_pct', label: 'Inflation (CPI)', unit: '%', source: 'IMF' },
    { key: 'unemployment_pct', label: 'Unemployment', unit: '%', source: 'ILO' },
  ],
  MONETARY_POLICY: [
    { key: 'central_bank_rate_pct', label: 'Policy Rate', unit: '%', source: 'FRED/GMD' },
    { key: 'yield_2y_pct', label: '2Y Yield', unit: '%', source: 'FRED' },
    { key: 'yield_10y_pct', label: '10Y Yield', unit: '%', source: 'FRED' },
  ],
  EXTERNAL_SECTOR: [
    { key: 'ca_gdp_pct', label: 'Current Account % GDP', unit: '%', source: 'IMF' },
    { key: 'exports_gdp_pct', label: 'Exports % GDP', unit: '%', source: 'WTO' },
    { key: 'imports_gdp_pct', label: 'Imports % GDP', unit: '%', source: 'WTO' },
    { key: 'fx_reserves_bn', label: 'FX Reserves', unit: '$Bn', source: 'IMF' },
    { key: 'gold_tonnes', label: 'Gold Reserves', unit: 'T', source: 'WGC' },
  ],
  FISCAL_HEALTH: [
    { key: 'gov_debt_gdp_pct', label: 'Gov Debt % GDP', unit: '%', source: 'IMF' },
    { key: 'budget_deficit_gdp_pct', label: 'Budget Deficit % GDP', unit: '%', source: 'IMF' },
  ],
};

export const ALL_COUNTRY_METRIC_KEYS = Object.values(COUNTRY_METRIC_GROUPS)
  .flat()
  .map(m => m.key);
