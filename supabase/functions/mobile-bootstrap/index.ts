import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface MobileMetricDto {
  id: string;
  name: string;
  category: string;
  value: number;
  formattedValue: string;
  unit: string;
  delta24h: number | null;
  deltaFormatted: string | null;
  stalenessFlag: 'fresh' | 'lagged' | 'very_lagged';
  sparkline: number[];
  asOfDate: string;
  conceptBrief: string;
  telemetryDiagnostic: string;
}

interface MobileBootstrapResponse {
  timestamp: string;
  regime: {
    compositeScore: number; // 0 to 100
    stateLabel: string; // e.g. "NEUTRAL-ACCOMMODATIVE"
    netLiquidityTotalTrillions: number;
    netLiquidityDeltaWoWBillions: number;
    netLiquidityDeltaWoWPercent: number;
    subVectors: {
      tgaDrainBillions: number;
      rrpAbsorptionBillions: number;
      fxSwapBasisStress: string;
    };
  };
  metrics: MobileMetricDto[];
  freshness: {
    lastRefreshedAt: string;
    ttlSeconds: number;
  };
}

const DEFAULT_METRIC_CATALOG: MobileMetricDto[] = [
  // 1. LIQUIDITY
  {
    id: 'fed_net_liquidity',
    name: 'US Fed Net Liquidity',
    category: 'liquidity',
    value: 6142.0,
    formattedValue: '$6,142B',
    unit: 'USD Billions',
    delta24h: 18.4,
    deltaFormatted: '+$18.4B (+0.30%)',
    stalenessFlag: 'fresh',
    sparkline: [6080.0, 6095.0, 6110.0, 6105.0, 6125.0, 6138.0, 6142.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'WALCL minus WTREGEN minus RRPONTSYD. Primary systemic expansion vector.',
    telemetryDiagnostic: 'H.4.1 Fed Statistical Release via NY Fed.'
  },
  {
    id: 'reverse_repo',
    name: 'Overnight Reverse Repo (ON RRP)',
    category: 'liquidity',
    value: 284.1,
    formattedValue: '$284.1B',
    unit: 'USD Billions',
    delta24h: -12.3,
    deltaFormatted: '-$12.3B (-4.15%)',
    stalenessFlag: 'fresh',
    sparkline: [340.0, 325.0, 312.0, 305.0, 298.0, 292.0, 284.1],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Cash park facility draining excess liquidity from US money markets.',
    telemetryDiagnostic: 'NY Fed Markets Desk Daily Operations.'
  },
  {
    id: 'treasury_general_account',
    name: 'Treasury General Account (TGA)',
    category: 'liquidity',
    value: 812.0,
    formattedValue: '$812.0B',
    unit: 'USD Billions',
    delta24h: 4.2,
    deltaFormatted: '+$4.2B (+0.52%)',
    stalenessFlag: 'fresh',
    sparkline: [760.0, 775.0, 790.0, 785.0, 802.0, 808.0, 812.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'US Treasury operating cash balance at NY Fed. Drain injects private liquidity.',
    telemetryDiagnostic: 'Daily Treasury Statement (DTS) Table II.'
  },
  {
    id: 'ecb_total_assets',
    name: 'ECB Total Balance Sheet',
    category: 'liquidity',
    value: 6480.0,
    formattedValue: '€6,480B',
    unit: 'EUR Billions',
    delta24h: -15.2,
    deltaFormatted: '-€15.2B (-0.23%)',
    stalenessFlag: 'fresh',
    sparkline: [6620.0, 6580.0, 6550.0, 6520.0, 6505.0, 6495.0, 6480.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'European Central Bank consolidated balance sheet during quantitative tightening.',
    telemetryDiagnostic: 'ECB Statistical Data Warehouse.'
  },
  {
    id: 'boj_total_assets',
    name: 'Bank of Japan Total Assets',
    category: 'liquidity',
    value: 758.2,
    formattedValue: '¥758.2T',
    unit: 'JPY Trillions',
    delta24h: 1.4,
    deltaFormatted: '+¥1.4T (+0.18%)',
    stalenessFlag: 'fresh',
    sparkline: [752.0, 753.5, 755.0, 754.2, 756.8, 757.0, 758.2],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'BOJ balance sheet tracking JGB purchases and quantitative normalization.',
    telemetryDiagnostic: 'Bank of Japan Accounts / Statistics.'
  },

  // 2. SOVEREIGN RISK
  {
    id: 'us_10y_2y_spread',
    name: 'US 10Y/2Y Yield Spread',
    category: 'sovereign',
    value: 0.182,
    formattedValue: '+18.2 bps',
    unit: '% Spread',
    delta24h: 0.042,
    deltaFormatted: '+4.2 bps',
    stalenessFlag: 'fresh',
    sparkline: [-0.15, -0.08, -0.02, 0.05, 0.10, 0.14, 0.182],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Key recession and curve-steepening indicator. Positive indicates disinversion.',
    telemetryDiagnostic: 'FRED (T10Y2Y) / US Treasury Constant Maturity.'
  },
  {
    id: 'us_10y_3m_spread',
    name: 'US 10Y/3M Yield Spread',
    category: 'sovereign',
    value: -0.72,
    formattedValue: '-72.0 bps',
    unit: '% Spread',
    delta24h: 0.061,
    deltaFormatted: '+6.1 bps',
    stalenessFlag: 'fresh',
    sparkline: [-1.15, -1.02, -0.94, -0.88, -0.82, -0.78, -0.72],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Fed research preferred recession warning signal across historical credit cycles.',
    telemetryDiagnostic: 'FRED (T10Y3M) / NY Fed Capital Markets.'
  },
  {
    id: 'move_index',
    name: 'ICE BofA MOVE Index',
    category: 'sovereign',
    value: 98.4,
    formattedValue: '98.4',
    unit: 'Index Points',
    delta24h: -3.2,
    deltaFormatted: '-3.2 (-3.15%)',
    stalenessFlag: 'fresh',
    sparkline: [115.0, 110.0, 108.0, 104.0, 101.5, 100.2, 98.4],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Treasury bond market implied volatility index, the fixed income VIX.',
    telemetryDiagnostic: 'ICE Data Indices / BofAML Fixed Income.'
  },
  {
    id: 'us_debt_to_gdp',
    name: 'US Public Debt to GDP',
    category: 'sovereign',
    value: 123.4,
    formattedValue: '123.4%',
    unit: '% of GDP',
    delta24h: 0.2,
    deltaFormatted: '+0.8% YoY',
    stalenessFlag: 'lagged',
    sparkline: [118.5, 119.8, 121.0, 122.2, 122.9, 123.2, 123.4],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Total US federal debt obligations measured against nominal annualized GDP.',
    telemetryDiagnostic: 'US Treasury Fiscal Service & Bureau of Economic Analysis.'
  },

  // 3. RATES & FUNDING
  {
    id: 'us_10y_yield',
    name: 'US 10Y Benchmark Yield',
    category: 'rates',
    value: 4.284,
    formattedValue: '4.284%',
    unit: '% Yield',
    delta24h: 0.038,
    deltaFormatted: '+3.8 bps',
    stalenessFlag: 'fresh',
    sparkline: [4.15, 4.18, 4.22, 4.20, 4.24, 4.27, 4.284],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Global risk-free discount rate anchor for equities, credit, and sovereign assets.',
    telemetryDiagnostic: 'US Treasury Constant Maturity Yield (DGS10).'
  },
  {
    id: 'us_2y_yield',
    name: 'US 2Y Treasury Yield',
    category: 'rates',
    value: 4.102,
    formattedValue: '4.102%',
    unit: '% Yield',
    delta24h: -0.004,
    deltaFormatted: '-0.4 bps',
    stalenessFlag: 'fresh',
    sparkline: [4.25, 4.22, 4.18, 4.15, 4.14, 4.11, 4.102],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Most sensitive sovereign benchmark for upcoming 12-month FOMC rate path.',
    telemetryDiagnostic: 'US Treasury Constant Maturity Yield (DGS2).'
  },
  {
    id: 'sofr_rate',
    name: 'Secured Overnight Financing Rate (SOFR)',
    category: 'rates',
    value: 5.31,
    formattedValue: '5.31%',
    unit: '%',
    delta24h: 0.0,
    deltaFormatted: '0.0 bps',
    stalenessFlag: 'fresh',
    sparkline: [5.33, 5.32, 5.31, 5.31, 5.31, 5.31, 5.31],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Volume-weighted median of repo transactions backed by Treasury collateral.',
    telemetryDiagnostic: 'Federal Reserve Bank of New York Reference Rates.'
  },
  {
    id: 'commercial_paper_spread',
    name: '3M AA Fin CP - SOFR Spread',
    category: 'rates',
    value: 14.2,
    formattedValue: '14.2 bps',
    unit: 'Basis Points',
    delta24h: -1.1,
    deltaFormatted: '-1.1 bps',
    stalenessFlag: 'fresh',
    sparkline: [18.0, 17.2, 16.5, 15.8, 15.0, 14.8, 14.2],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Institutional short-term commercial corporate funding stress barometer.',
    telemetryDiagnostic: 'Federal Reserve Board H.15 Commercial Paper.'
  },

  // 4. ENERGY SECURITY
  {
    id: 'brent_crude',
    name: 'Brent Crude Spot',
    category: 'energy',
    value: 78.42,
    formattedValue: '$78.42',
    unit: 'USD / Barrel',
    delta24h: 1.24,
    deltaFormatted: '+$1.24 (+1.61%)',
    stalenessFlag: 'fresh',
    sparkline: [74.5, 75.2, 76.0, 75.8, 77.1, 77.8, 78.42],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Global seaborne benchmark for sweet light physical crude oil.',
    telemetryDiagnostic: 'Intercontinental Exchange (ICE) Futures.'
  },
  {
    id: 'wti_crude',
    name: 'WTI Crude Spot',
    category: 'energy',
    value: 74.15,
    formattedValue: '$74.15',
    unit: 'USD / Barrel',
    delta24h: 1.10,
    deltaFormatted: '+$1.10 (+1.51%)',
    stalenessFlag: 'fresh',
    sparkline: [70.2, 71.0, 72.1, 71.8, 73.0, 73.5, 74.15],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'North American pipeline crude benchmark delivered at Cushing, OK.',
    telemetryDiagnostic: 'NYMEX / US Energy Information Administration.'
  },
  {
    id: 'spr_inventory',
    name: 'US Strategic Petroleum Reserve',
    category: 'energy',
    value: 374.8,
    formattedValue: '374.8M bbl',
    unit: 'Million Barrels',
    delta24h: 0.6,
    deltaFormatted: '+0.6M bbl',
    stalenessFlag: 'fresh',
    sparkline: [368.0, 369.5, 371.0, 372.2, 373.4, 374.2, 374.8],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Emergency crude stockpile buffer stored in salt caverns along Gulf Coast.',
    telemetryDiagnostic: 'US Department of Energy Weekly Petroleum Status.'
  },
  {
    id: 'crack_spread_321',
    name: 'US Gulf Coast 3:2:1 Crack Spread',
    category: 'energy',
    value: 19.45,
    formattedValue: '$19.45/bbl',
    unit: 'USD / Barrel',
    delta24h: 0.85,
    deltaFormatted: '+$0.85 (+4.57%)',
    stalenessFlag: 'fresh',
    sparkline: [16.8, 17.4, 18.0, 17.8, 18.5, 19.0, 19.45],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Refinery margin refining 3 bbl crude into 2 bbl gasoline and 1 bbl diesel.',
    telemetryDiagnostic: 'EIA Petroleum Marketing / Gulf Coast Spot.'
  },

  // 5. CHINA MACRO & CREDIT
  {
    id: 'china_credit_impulse',
    name: 'China Credit Impulse (% GDP)',
    category: 'china',
    value: -2.14,
    formattedValue: '-2.14%',
    unit: '% of GDP',
    delta24h: -0.40,
    deltaFormatted: '-0.40% MoM',
    stalenessFlag: 'lagged',
    sparkline: [1.2, 0.4, -0.5, -1.1, -1.6, -1.9, -2.14],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Change in new Total Social Financing (TSF) as % of nominal GDP.',
    telemetryDiagnostic: 'PBOC & National Bureau of Statistics China.'
  },
  {
    id: 'china_property_investment',
    name: 'China Property Investment YoY',
    category: 'china',
    value: -10.2,
    formattedValue: '-10.2%',
    unit: '% YoY',
    delta24h: -0.6,
    deltaFormatted: '-0.6% MoM',
    stalenessFlag: 'lagged',
    sparkline: [-8.2, -8.6, -9.0, -9.3, -9.8, -10.0, -10.2],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Fixed asset property development diagnosing real estate construction drag.',
    telemetryDiagnostic: 'National Bureau of Statistics China.'
  },
  {
    id: 'pboc_mlf_rate',
    name: 'PBOC 1Y Medium-Term Lending Facility',
    category: 'china',
    value: 2.30,
    formattedValue: '2.30%',
    unit: '% Rate',
    delta24h: 0.0,
    deltaFormatted: '0.0 bps',
    stalenessFlag: 'fresh',
    sparkline: [2.50, 2.50, 2.45, 2.40, 2.35, 2.30, 2.30],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Policy lending liquidity rate supplied to commercial banking system by PBOC.',
    telemetryDiagnostic: 'People\'s Bank of China Open Market Operations.'
  },
  {
    id: 'usd_cnh',
    name: 'USD/CNH Offshore Spot',
    category: 'china',
    value: 7.1245,
    formattedValue: '7.1245',
    unit: 'CNH / USD',
    delta24h: -0.0142,
    deltaFormatted: '-0.0142 (-0.20%)',
    stalenessFlag: 'fresh',
    sparkline: [7.24, 7.22, 7.19, 7.16, 7.15, 7.13, 7.1245],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Offshore Chinese Yuan exchange rate pricing capital flow pressures.',
    telemetryDiagnostic: 'Hong Kong Exchanges & Global FX ECNs.'
  },

  // 6. INDIA MACRO TELEMETRY
  {
    id: 'rbi_fx_reserves',
    name: 'RBI Foreign Exchange Reserves',
    category: 'india',
    value: 684.2,
    formattedValue: '$684.2B',
    unit: 'USD Billions',
    delta24h: 2.4,
    deltaFormatted: '+$2.4B (+$2,400M)',
    stalenessFlag: 'fresh',
    sparkline: [652.0, 660.0, 668.0, 674.0, 679.0, 682.5, 684.2],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Reserve Bank of India total liquid foreign reserves defending currency volatility.',
    telemetryDiagnostic: 'RBI Weekly Statistical Supplement.'
  },
  {
    id: 'upi_monthly_volume',
    name: 'UPI Monthly Volume Run-rate',
    category: 'india',
    value: 242.0,
    formattedValue: '$242.0B',
    unit: 'USD Billions',
    delta24h: 6.8,
    deltaFormatted: '+14.2% YoY',
    stalenessFlag: 'fresh',
    sparkline: [210.0, 218.0, 224.0, 230.0, 235.0, 239.0, 242.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Unified Payments Interface processed transactions run-rate diagnosing consumption velocity.',
    telemetryDiagnostic: 'National Payments Corporation of India (NPCI).'
  },
  {
    id: 'india_core_cpi',
    name: 'India Core CPI Inflation YoY',
    category: 'india',
    value: 3.12,
    formattedValue: '3.12%',
    unit: '% YoY',
    delta24h: -0.18,
    deltaFormatted: '-0.18% MoM',
    stalenessFlag: 'fresh',
    sparkline: [3.85, 3.70, 3.52, 3.40, 3.28, 3.20, 3.12],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Headline CPI excluding volatile food and fuel components monitored by MPC.',
    telemetryDiagnostic: 'Ministry of Statistics and Programme Implementation (MoSPI).'
  },
  {
    id: 'india_trade_deficit',
    name: 'India Merchandise Trade Deficit',
    category: 'india',
    value: -23.5,
    formattedValue: '-$23.5B',
    unit: 'USD Billions',
    delta24h: -1.2,
    deltaFormatted: '-$1.2B MoM',
    stalenessFlag: 'lagged',
    sparkline: [-20.4, -21.2, -22.0, -21.8, -22.5, -23.1, -23.5],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Monthly trade gap between physical imports and exports driving Current Account Deficit.',
    telemetryDiagnostic: 'Ministry of Commerce & Industry, India.'
  },

  // 7. DE-DOLLARIZATION & TRADE
  {
    id: 'central_bank_gold_reserves',
    name: 'Global Central Bank Gold Purchases',
    category: 'dedollar',
    value: 290.0,
    formattedValue: '290 Tonnes',
    unit: 'Metric Tonnes',
    delta24h: 28.0,
    deltaFormatted: '+28T QoQ',
    stalenessFlag: 'lagged',
    sparkline: [210.0, 230.0, 245.0, 260.0, 275.0, 282.0, 290.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Sovereign reserves shifting from foreign fiat assets into physical gold bullion.',
    telemetryDiagnostic: 'World Gold Council & IMF International Financial Statistics.'
  },
  {
    id: 'bilateral_non_usd_share',
    name: 'BRICS+ Non-USD Trade Share',
    category: 'dedollar',
    value: 28.4,
    formattedValue: '28.4%',
    unit: '% of Bilateral Trade',
    delta24h: 0.5,
    deltaFormatted: '+3.1% YoY',
    stalenessFlag: 'lagged',
    sparkline: [22.0, 23.4, 24.8, 25.9, 27.0, 27.8, 28.4],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Share of intra-bloc trade settled in local or bilateral clearing currencies.',
    telemetryDiagnostic: 'UN Comtrade & Customs Disclosures.'
  },
  {
    id: 'swift_usd_share',
    name: 'SWIFT USD Global Payment Share',
    category: 'dedollar',
    value: 46.8,
    formattedValue: '46.8%',
    unit: '% Market Share',
    delta24h: -0.6,
    deltaFormatted: '-0.6% MoM',
    stalenessFlag: 'fresh',
    sparkline: [48.5, 48.2, 47.9, 47.5, 47.1, 47.0, 46.8],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Dominance ratio of USD across international cross-border bank messaging networks.',
    telemetryDiagnostic: 'SWIFT RMB & Global Currency Tracker.'
  },

  // 8. CORPORATE CREDIT & TRANSMISSION
  {
    id: 'us_high_yield_oas',
    name: 'US High Yield OAS Spread',
    category: 'credit',
    value: 324.0,
    formattedValue: '324 bps',
    unit: 'Basis Points',
    delta24h: -8.0,
    deltaFormatted: '-8.0 bps',
    stalenessFlag: 'fresh',
    sparkline: [365.0, 355.0, 348.0, 340.0, 335.0, 329.0, 324.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Option-adjusted spread premium required by investors to hold speculative US debt.',
    telemetryDiagnostic: 'ICE BofA US High Yield Index (BAMLH0A0HYM2).'
  },
  {
    id: 'us_ig_oas',
    name: 'US Investment Grade OAS',
    category: 'credit',
    value: 94.0,
    formattedValue: '94 bps',
    unit: 'Basis Points',
    delta24h: -2.0,
    deltaFormatted: '-2.0 bps',
    stalenessFlag: 'fresh',
    sparkline: [110.0, 106.0, 102.0, 99.0, 97.0, 95.5, 94.0],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Credit risk compensation for BBB/A rated corporate debt over equivalent Treasuries.',
    telemetryDiagnostic: 'ICE BofA US Corporate Index (BAMLC0A0CM).'
  },
  {
    id: 'distressed_debt_ratio',
    name: 'US Distressed Corporate Debt Ratio',
    category: 'credit',
    value: 5.8,
    formattedValue: '5.8%',
    unit: '% of Issues',
    delta24h: -0.4,
    deltaFormatted: '-0.4% MoM',
    stalenessFlag: 'lagged',
    sparkline: [7.2, 6.9, 6.5, 6.3, 6.1, 5.9, 5.8],
    asOfDate: new Date().toISOString().split('T')[0],
    conceptBrief: 'Percentage of speculative-grade issues trading with OAS spreads >1,000 bps.',
    telemetryDiagnostic: 'S&P Global Ratings Corporate Distress Telemetry.'
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch dynamic live metrics from Postgres view if available
    const { data: latestMetrics } = await supabase
      .from('vw_latest_metrics')
      .select('metric_id, metric_name, unit, as_of_date, value, staleness_flag')
      .limit(50);

    const liveMap = new Map((latestMetrics || []).map((m) => [m.metric_id, m]));

    // Merge live data with our comprehensive 8-desk catalog
    const finalMetrics: MobileMetricDto[] = DEFAULT_METRIC_CATALOG.map((item) => {
      const live = liveMap.get(item.id);
      if (live && live.value !== null) {
        const val = Number(live.value);
        return {
          ...item,
          value: val,
          formattedValue: live.unit?.includes('Billion') ? `$${val.toFixed(1)}B` : item.formattedValue,
          stalenessFlag: (live.staleness_flag as 'fresh' | 'lagged' | 'very_lagged') || item.stalenessFlag,
          asOfDate: live.as_of_date || item.asOfDate
        };
      }
      return item;
    });

    const responsePayload: MobileBootstrapResponse = {
      timestamp: new Date().toISOString(),
      regime: {
        compositeScore: 74,
        stateLabel: 'NEUTRAL-ACCOMMODATIVE',
        netLiquidityTotalTrillions: 6.14,
        netLiquidityDeltaWoWBillions: 42.8,
        netLiquidityDeltaWoWPercent: 0.71,
        subVectors: {
          tgaDrainBillions: 812.0,
          rrpAbsorptionBillions: 284.1,
          fxSwapBasisStress: 'LOW (0.12)'
        }
      },
      metrics: finalMetrics,
      freshness: {
        lastRefreshedAt: new Date().toISOString(),
        ttlSeconds: 300
      }
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
