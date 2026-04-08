/**
 * Standardized metric keys for programmatic country pages.
 * Maps 1:1 to column names in vw_country_terminal view.
 */
export const COUNTRY_METRIC_GROUPS = {
  MACRO_HEARTBEAT: [
    { key: 'central_bank_rate_pct', label: 'Policy Rate', unit: '%', source: 'FRED' },
  ],
  YIELD_CURVE: [
    { key: 'yield_2y_pct', label: '2Y Yield', unit: '%', source: 'FRED' },
    { key: 'yield_10y_pct', label: '10Y Yield', unit: '%', source: 'FRED' },
    { key: 'yield_slope_2s10s', label: '2s10s Slope', unit: 'bps', source: 'Derived' },
  ],
  RESERVES_ALIGNMENT: [
    { key: 'fx_reserves_bn', label: 'FX Reserves', unit: '$Bn', source: 'IMF' },
    { key: 'gold_tonnes', label: 'Gold Reserves', unit: 'T', source: 'WGC' },
  ]
};

export const ALL_COUNTRY_METRIC_KEYS = Object.values(COUNTRY_METRIC_GROUPS)
  .flat()
  .map(m => m.key);
