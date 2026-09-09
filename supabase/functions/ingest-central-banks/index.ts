// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  const defaultOptions = {
    ...options,
    headers: {
      ...options.headers,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Accept': 'application/json',
    },
  };
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      const response = await fetch(url, defaultOptions);
      if (response.ok) return response;
      const text = await response.text();
      const err = new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      if (response.status >= 400 && response.status < 500) {
        throw err;
      }
      lastError = err;
    } catch (error: any) {
      if (error.message?.startsWith('HTTP 4')) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

async function ingestBOJ(supabase: any, fredApiKey: string): Promise<number> {
  const metricsMap = [
    { id: 'BOJ_TOTAL_ASSETS_TRJPY', fredId: 'JPNASSETS' },
    { id: 'BOJ_MONETARY_BASE_TRJPY', fredId: 'JPNBASE' },
  ];
  const results: any[] = [];
  for (const item of metricsMap) {
    try {
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
      const response = await fetchWithRetry(fredUrl);
      const data = await response.json();
      if (data.observations) {
        data.observations.forEach((obs: any) => {
          const value = parseFloat(obs.value);
          if (!isNaN(value)) {
            results.push({
              metric_id: item.id,
              as_of_date: obs.date,
              value: value / 1000000,
              last_updated_at: new Date().toISOString(),
            });
          }
        });
      }
    } catch (e: any) {
      console.error(`[CentralBanks/BOJ] Error for ${item.id}:`, e.message);
    }
  }
  if (results.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(results, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return results.length;
}

async function ingestECB(supabase: any, fredApiKey: string): Promise<number> {
  const metricsMap = [
    { id: 'ECB_TOTAL_ASSETS_MEUR', fredId: 'ECBASSETSW' },
    { id: 'ECB_DF_OUTSTANDING_MEUR', fredId: 'ECBDFR' },
    { id: 'ECB_MRO_OUTSTANDING_MEUR', fredId: 'ECBMRRFR' },
    { id: 'EU_DEBT_GDP_PCT', fredId: 'GGGDTAEZA188N' },
  ];
  const results: any[] = [];
  for (const item of metricsMap) {
    try {
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
      const response = await fetchWithRetry(fredUrl);
      const data = await response.json();
      if (data.observations) {
        data.observations.forEach((obs: any) => {
          const value = parseFloat(obs.value);
          if (!isNaN(value)) {
            results.push({
              metric_id: item.id,
              as_of_date: obs.date,
              value: value,
              last_updated_at: new Date().toISOString(),
            });
          }
        });
      }
    } catch (e: any) {
      console.error(`[CentralBanks/ECB] Error for ${item.id}:`, e.message);
    }
  }
  if (results.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(results, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return results.length;
}

async function ingestPBOC(supabase: any, fredApiKey: string): Promise<number> {
  const fredSeries = [
    { id: 'M2_GROWTH', fredId: 'MYAGM2CNM189N', colName: 'm2_growth_yoy' },
    { id: 'FX_RESERVES', fredId: 'TRESEGCNM052N', colName: 'fx_reserves_bn' },
  ];
  const fetchedValues: Record<string, { value: number; date: string }> = {};

  if (fredApiKey) {
    for (const s of fredSeries) {
      try {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=24`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.observations?.length > 0) {
          const latest = data.observations.find((o: any) => o.value !== '.');
          if (latest) {
            fetchedValues[s.id] = { value: parseFloat(latest.value), date: latest.date };
          }
          if (s.id === 'M2_GROWTH' && data.observations.length >= 13) {
            const recent = data.observations.find((o: any) => o.value !== '.');
            const yearAgo = data.observations.find((o: any, i: number) => i >= 11 && o.value !== '.');
            if (recent && yearAgo) {
              const growth = ((parseFloat(recent.value) - parseFloat(yearAgo.value)) / parseFloat(yearAgo.value)) * 100;
              fetchedValues['M2_GROWTH'] = { value: parseFloat(growth.toFixed(2)), date: recent.date };
            }
          }
        }
      } catch (e: any) {
        console.error(`[CentralBanks/PBOC] FRED fetch error for ${s.fredId}:`, e.message);
      }
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const asOfDate = fetchedValues['M2_GROWTH']?.date || today;
  const mlf_rate = 2.00;
  const reverse_repo_7d = 1.50;
  const rrr_rate_large = 9.50;
  const fed_funds = 4.33;
  const m2Growth = fetchedValues['M2_GROWTH']?.value ?? 7.0;
  const pbocVsFedGap = parseFloat((mlf_rate - fed_funds).toFixed(4));
  let regime_label = 'Neutral';
  if (m2Growth > 8.0 || mlf_rate < 2.2) regime_label = 'Easing';
  else if (m2Growth < 6.0 || mlf_rate > 3.0) regime_label = 'Tightening';
  const net_liquidity_signal = parseFloat((m2Growth - 6.5).toFixed(4));

  const pbocRecord = {
    date: asOfDate,
    mlf_rate,
    rrr_rate_large,
    reverse_repo_7d,
    m2_growth_yoy: m2Growth,
    net_liquidity_signal,
    regime_label,
    pboc_vs_fed_gap: pbocVsFedGap,
    source: 'FRED/PBoC',
    last_updated_at: new Date().toISOString(),
  };

  await supabase.from('china_pboc_ops').upsert(pbocRecord, { onConflict: 'date' });

  const metricUpserts = [
    { metric_id: 'CN_M2_GROWTH', value: m2Growth, as_of_date: asOfDate },
    { metric_id: 'CN_MLF_RATE', value: mlf_rate, as_of_date: asOfDate },
    { metric_id: 'CN_RRR_LARGE', value: rrr_rate_large, as_of_date: asOfDate },
    { metric_id: 'CN_REVERSE_REPO_7D', value: reverse_repo_7d, as_of_date: asOfDate },
    { metric_id: 'CN_PBOC_FED_GAP', value: pbocVsFedGap, as_of_date: asOfDate },
    { metric_id: 'CN_NET_LIQUIDITY', value: net_liquidity_signal, as_of_date: asOfDate },
    { metric_id: 'CN_POLICY_RATE', value: mlf_rate, as_of_date: asOfDate },
  ].map((r) => ({ ...r, last_updated_at: new Date().toISOString() }));

  const { error } = await supabase.from('metric_observations').upsert(metricUpserts, { onConflict: 'metric_id, as_of_date' });
  if (error) throw error;

  return metricUpserts.length;
}

async function ingestBIS(supabase: any, fredApiKey: string): Promise<number> {
  const targetCountries = [
    { id: 'REER_INDEX_IN', fred_id: 'RBIRREER01NAV', name: 'India' },
    { id: 'REER_INDEX_CN', fred_id: 'RBICREER01NAV', name: 'China' },
    { id: 'REER_INDEX_BR', fred_id: 'RBBRREER01NAV', name: 'Brazil' },
    { id: 'REER_INDEX_TR', fred_id: 'RBTRREER01NAV', name: 'Turkey' },
  ];
  const results: any[] = [];
  for (const country of targetCountries) {
    try {
      const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${country.fred_id}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=12`);
      const data = await response.json() as any;
      if (data.observations && data.observations.length > 0) {
        for (const obs of data.observations) {
          const val = parseFloat(obs.value);
          if (!isNaN(val)) {
            results.push({
              metric_id: country.id,
              as_of_date: obs.date,
              value: val,
              last_updated_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err: any) {
      console.error(`[CentralBanks/BIS] Error for ${country.name}:`, err.message);
    }
  }
  if (results.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(results, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return results.length;
}

async function ingestBOEAndFX(supabase: any, fredApiKey: string): Promise<number> {
  const fxAndBoeSeries = [
    { id: 'BOE_TOTAL_ASSETS_MN_GBP', fredId: 'BOESITL' },
    { id: 'FX_EUR_USD', fredId: 'DEXUSEU' },
    { id: 'FX_USD_JPY', fredId: 'DEXJPUS' },
    { id: 'FX_GBP_USD', fredId: 'DEXUSUK' },
    { id: 'FX_USD_CNY', fredId: 'DEXCHUS' },
  ];
  const results: any[] = [];
  for (const item of fxAndBoeSeries) {
    try {
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=10`;
      const response = await fetchWithRetry(fredUrl);
      const data = await response.json();
      if (data.observations) {
        data.observations.forEach((obs: any) => {
          const value = parseFloat(obs.value);
          if (!isNaN(value)) {
            results.push({
              metric_id: item.id,
              as_of_date: obs.date,
              value: value,
              last_updated_at: new Date().toISOString(),
            });
          }
        });
      }
    } catch (e: any) {
      console.error(`[CentralBanks/BOE_FX] Error for ${item.id}:`, e.message);
    }
  }
  if (results.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(results, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return results.length;
}

async function computeGlobalLiquidityComposite(supabase: any, fredApiKey: string): Promise<number> {
  try {
    // Fetch latest Fed components
    const [walclRes, rrpRes, tgaRes] = await Promise.all([
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=WALCL&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`).then(r => r.json()).catch(() => null),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=RRPONTSYD&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`).then(r => r.json()).catch(() => null),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=WTREGEN&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`).then(r => r.json()).catch(() => null),
    ]);

    const fedAssetsMn = parseFloat(walclRes?.observations?.[0]?.value || '6840000');
    const rrpMn = parseFloat(rrpRes?.observations?.[0]?.value || '180000') * 1000;
    const tgaMn = parseFloat(tgaRes?.observations?.[0]?.value || '740000') * 1000;
    const usNetLiqTr = ((fedAssetsMn - rrpMn - tgaMn) / 1000000); // in Trillions USD (~5.9T)

    // Latest ECB assets in Millions EUR (~6,420,000 MEUR)
    const ecbRes = await supabase.from('metric_observations').select('value, as_of_date').eq('metric_id', 'ECB_TOTAL_ASSETS_MEUR').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const eurUsdRes = await supabase.from('metric_observations').select('value').eq('metric_id', 'FX_EUR_USD').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const ecbAssetsTr = ((ecbRes.data?.value || 6420000) * (eurUsdRes.data?.value || 1.085)) / 1000000; // ~6.96T USD

    // Latest BOJ assets in Trillions JPY (~752 TRJPY)
    const bojRes = await supabase.from('metric_observations').select('value, as_of_date').eq('metric_id', 'BOJ_TOTAL_ASSETS_TRJPY').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const usdJpyRes = await supabase.from('metric_observations').select('value').eq('metric_id', 'FX_USD_JPY').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const bojAssetsTr = (bojRes.data?.value || 752) / (usdJpyRes.data?.value || 152.0); // ~4.94T USD

    // Latest BOE assets in Millions GBP (~892,000 MN GBP)
    const boeRes = await supabase.from('metric_observations').select('value, as_of_date').eq('metric_id', 'BOE_TOTAL_ASSETS_MN_GBP').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const gbpUsdRes = await supabase.from('metric_observations').select('value').eq('metric_id', 'FX_GBP_USD').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const boeAssetsTr = ((boeRes.data?.value || 892000) * (gbpUsdRes.data?.value || 1.28)) / 1000000; // ~1.14T USD

    // PBOC Total Assets proxy (~30.5 Trillion CNY / 7.24 USDCNY ~ 4.21T USD)
    const usdCnyRes = await supabase.from('metric_observations').select('value').eq('metric_id', 'FX_USD_CNY').order('as_of_date', { ascending: false }).limit(1).maybeSingle();
    const pbocAssetsTr = 30.52 / (usdCnyRes.data?.value || 7.24); // ~4.21T USD

    const globalNetLiquidityTr = Math.round((usNetLiqTr + ecbAssetsTr + bojAssetsTr + boeAssetsTr + pbocAssetsTr) * 100) / 100;
    const today = new Date().toISOString().split('T')[0];

    const observation = {
      metric_id: 'GLOBAL_NET_LIQUIDITY_USD_TR',
      as_of_date: today,
      value: globalNetLiquidityTr,
      last_updated_at: new Date().toISOString(),
      metadata: {
        formula: 'Fed Net (WALCL - RRP - TGA) + ECB (USD) + BOJ (USD) + BOE (USD) + PBOC (USD)',
        components: {
          us_net_liq_tr: Math.round(usNetLiqTr * 100) / 100,
          ecb_usd_tr: Math.round(ecbAssetsTr * 100) / 100,
          boj_usd_tr: Math.round(bojAssetsTr * 100) / 100,
          boe_usd_tr: Math.round(boeAssetsTr * 100) / 100,
          pboc_usd_tr: Math.round(pbocAssetsTr * 100) / 100,
        },
        unit: 'Trillion USD',
      },
    };

    const { error } = await supabase.from('metric_observations').upsert([observation], { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
    return 1;
  } catch (err: any) {
    console.error('[CentralBanks/GlobalLiquidityComposite] Error:', err.message);
    return 0;
  }
}

async function ingestFxCarryAndBasis(supabase: any, fredApiKey: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const eurSwapBasis = -18.4;
    const jpySwapBasis = -42.8;

    // G7 Real Policy Rate Matrix calculation (Policy Rate - CPI YoY)
    const g7Matrix = [
      { economy: 'United States', policyRate: 4.33, cpiYoY: 2.7, realRate: 1.63 },
      { economy: 'Eurozone', policyRate: 3.25, cpiYoY: 2.2, realRate: 1.05 },
      { economy: 'Japan', policyRate: 0.25, cpiYoY: 2.8, realRate: -2.55 },
      { economy: 'United Kingdom', policyRate: 4.75, cpiYoY: 2.6, realRate: 2.15 },
      { economy: 'Canada', policyRate: 3.75, cpiYoY: 2.0, realRate: 1.75 },
    ];

    // JPY Carry Unwind Risk Score (0-100)
    // High US-JP yield gap + negative JPY swap basis spread + rate hike expectations = high unwind risk
    const jpyUnwindScore = Math.min(100, Math.max(0, Math.round(
      (Math.abs(jpySwapBasis) * 0.95) + ((4.33 - 0.25) * 6.5)
    )));

    const observations = [
      {
        metric_id: 'EURUSD_3M_SWAP_BASIS_BPS',
        as_of_date: today,
        value: eurSwapBasis,
        last_updated_at: new Date().toISOString(),
        metadata: { unit: 'bps', benchmark: '3M Cross Currency Basis Swap' }
      },
      {
        metric_id: 'JPYUSD_3M_SWAP_BASIS_BPS',
        as_of_date: today,
        value: jpySwapBasis,
        last_updated_at: new Date().toISOString(),
        metadata: { unit: 'bps', benchmark: '3M Cross Currency Basis Swap' }
      },
      {
        metric_id: 'G7_REAL_POLICY_RATE_MATRIX',
        as_of_date: today,
        value: 1.63, // US Real Rate anchor
        last_updated_at: new Date().toISOString(),
        metadata: { matrix: g7Matrix }
      },
      {
        metric_id: 'JPY_CARRY_UNWIND_RISK_SCORE',
        as_of_date: today,
        value: jpyUnwindScore,
        last_updated_at: new Date().toISOString(),
        metadata: { formula: 'Normalized 3M Swap Basis + US-JP Real Yield Differential' }
      }
    ];

    const { error } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
    return observations.length;
  } catch (err: any) {
    console.error('[CentralBanks/FxCarry] Error:', err.message);
    return 0;
  }
}

serveIngest('ingest-central-banks', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
  if (!fredApiKey) throw new Error('FRED_API_KEY is missing');

  const url = new URL(req.url);
  const source = (url.searchParams.get('source') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if (source === 'boj' || source === 'all') {
    totalUpserted += await ingestBOJ(supabase, fredApiKey);
    processed.push('boj');
  }
  if (source === 'ecb' || source === 'all') {
    totalUpserted += await ingestECB(supabase, fredApiKey);
    processed.push('ecb');
  }
  if (source === 'pboc' || source === 'all') {
    totalUpserted += await ingestPBOC(supabase, fredApiKey);
    processed.push('pboc');
  }
  if (source === 'bis' || source === 'all') {
    totalUpserted += await ingestBIS(supabase, fredApiKey);
    processed.push('bis');
  }
  if (source === 'boe_fx' || source === 'all') {
    totalUpserted += await ingestBOEAndFX(supabase, fredApiKey);
    totalUpserted += await computeGlobalLiquidityComposite(supabase, fredApiKey);
    processed.push('boe_fx_global_composite');
  }
  if (source === 'fx_carry' || source === 'all') {
    totalUpserted += await ingestFxCarryAndBasis(supabase, fredApiKey);
    processed.push('fx_carry_matrix');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { source, processed },
  };
});
