/** APIDocs snake_case IDs → live metric_id in vw_latest_metrics */
export const API_TO_LIVE: Record<string, string> = {
  india_rbi_rate: 'IN_REPO_RATE',
  india_cpi_yoy: 'IN_CPI_YOY',
  india_gdp_yoy: 'IN_GDP_GROWTH_YOY',
  india_fx_reserves_usd_bn: 'IN_FX_RESERVES',
  india_cd_ratio: 'IN_CD_RATIO',
  india_mfg_pmi: 'IN_MFG_PMI',
  india_gst_collections: 'IN_GST_COLLECTIONS',
  india_inr_usd: 'USD_INR_RATE',
  india_10y_yield: 'IN_10Y_YIELD',
  india_fiscal_deficit_gdp: 'IN_FISCAL_DEFICIT_GDP',
  india_macro_composite: 'india_macro_composite',
  india_vix: 'IN_VIX',
  us_fed_funds_rate: 'FED_FUNDS_RATE',
  us_cpi_yoy: 'US_CPI_YOY',
  us_10y_yield: 'UST_10Y_YIELD',
  us_m2_yoy: 'US_M2_YOY',
  us_dxy_index: 'DXY_INDEX',
  global_net_liquidity: 'NET_LIQUIDITY_BASE',
  gq_net_liquidity_zscore: 'gq_net_liquidity_zscore',
  gq_dedollarization_index: 'gq_dedollarization_index',
  g20_sovereign_stress_avg: 'g20_sovereign_stress_avg',
  china_pmi_mfg: 'CN_MFG_PMI',
  china_fx_reserves_usd_bn: 'CN_FX_RESERVES',
  gold_spot_usd: 'GOLD_PRICE_USD',
  brent_crude_usd: 'OIL_BRENT_PRICE_USD',
};

/** Reverse map for API-shaped responses */
export const LIVE_TO_API: Record<string, string> = Object.fromEntries(
  Object.entries(API_TO_LIVE).map(([api, live]) => [live, api])
);

export function resolveMetricId(input: string): string {
  const normalized = input.trim();
  if (API_TO_LIVE[normalized]) return API_TO_LIVE[normalized];
  return normalized;
}

export function toApiMetricId(liveId: string): string {
  return LIVE_TO_API[liveId] ?? liveId;
}

const COUNTRY_PREFIXES: Record<string, string[]> = {
  IN: ['IN_', 'USD_INR', 'RUPEE_'],
  US: ['US_', 'FED_', 'UST_', 'RRP_', 'TGA_', 'SOFR_', 'DXY_', 'PMI_US'],
  CN: ['CN_'],
  UK: ['UK_', 'GB_'],
  JP: ['JP_'],
  DE: ['DE_'],
};

export function countryFilter(country?: string): ((metricId: string) => boolean) | null {
  if (!country) return null;
  const code = country.toUpperCase();
  const prefixes = COUNTRY_PREFIXES[code];
  if (!prefixes) {
    return (id) => id.startsWith(`${code}_`);
  }
  return (id) => prefixes.some((p) => id.startsWith(p));
}