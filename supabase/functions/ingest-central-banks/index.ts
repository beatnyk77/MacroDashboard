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

  // Only fetched observations are written. The PBOC policy rates (MLF, 7-day reverse repo,
  // RRR, policy rate) have no live source here; they were previously hard-coded constants
  // re-dated to every run, so they are no longer written, and neither is anything derived
  // from them (PBOC-vs-Fed gap, regime label, china_pboc_ops row).
  const m2 = fetchedValues['M2_GROWTH'];
  if (!m2) {
    console.warn('[CentralBanks/PBOC] No China M2 observation from FRED; nothing written.');
    return 0;
  }

  const metricUpserts = [
    { metric_id: 'CN_M2_GROWTH', value: m2.value, as_of_date: m2.date },
    { metric_id: 'CN_NET_LIQUIDITY', value: parseFloat((m2.value - 6.5).toFixed(4)), as_of_date: m2.date },
  ].map((r) => ({ ...r, last_updated_at: new Date().toISOString(), metadata: { source: 'FRED', series_id: 'MYAGM2CNM189N' } }));

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

/** Latest stored observation, or null — never a default. */
async function latestObservation(supabase: any, metricId: string): Promise<{ value: number; as_of_date: string } | null> {
  const { data } = await supabase.from('metric_observations').select('value, as_of_date').eq('metric_id', metricId)
    .order('as_of_date', { ascending: false }).limit(1).maybeSingle();
  const value = Number(data?.value);
  return data && Number.isFinite(value) ? { value, as_of_date: data.as_of_date } : null;
}

async function latestFred(seriesId: string, fredApiKey: string): Promise<{ value: number; date: string } | null> {
  const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=10`)
    .then((r) => r.json()).catch(() => null);
  const obs = (res?.observations ?? []).find((o: any) => o.value !== '.' && Number.isFinite(parseFloat(o.value)));
  return obs ? { value: parseFloat(obs.value), date: obs.date } : null;
}

/**
 * Fed net liquidity + ECB + BOJ + BOE balance sheets in USD trillions. Written only when every
 * input is a real observation; previously each input had a hard-coded fallback and a constant
 * PBOC term (30.52T CNY), so that term is excluded. Dated to the oldest input.
 */
async function computeGlobalLiquidityComposite(supabase: any, fredApiKey: string): Promise<number> {
  try {
    const [walcl, rrp, tga] = await Promise.all([
      latestFred('WALCL', fredApiKey),
      latestFred('RRPONTSYD', fredApiKey),
      latestFred('WTREGEN', fredApiKey),
    ]);
    const [ecb, eurUsd, boj, usdJpy, boe, gbpUsd] = await Promise.all([
      latestObservation(supabase, 'ECB_TOTAL_ASSETS_MEUR'),
      latestObservation(supabase, 'FX_EUR_USD'),
      latestObservation(supabase, 'BOJ_TOTAL_ASSETS_TRJPY'),
      latestObservation(supabase, 'FX_USD_JPY'),
      latestObservation(supabase, 'BOE_TOTAL_ASSETS_MN_GBP'),
      latestObservation(supabase, 'FX_GBP_USD'),
    ]);
    if (!walcl || !rrp || !tga || !ecb || !eurUsd || !boj || !usdJpy || !boe || !gbpUsd) {
      console.warn('[CentralBanks/GlobalLiquidityComposite] Missing input observation; composite not written.');
      return 0;
    }

    const usNetLiqTr = (walcl.value - rrp.value * 1000 - tga.value * 1000) / 1_000_000;
    const ecbAssetsTr = (ecb.value * eurUsd.value) / 1_000_000;
    const bojAssetsTr = boj.value / usdJpy.value;
    const boeAssetsTr = (boe.value * gbpUsd.value) / 1_000_000;
    const globalNetLiquidityTr = Math.round((usNetLiqTr + ecbAssetsTr + bojAssetsTr + boeAssetsTr) * 100) / 100;
    const inputDates = [walcl.date, rrp.date, tga.date, ecb.as_of_date, boj.as_of_date, boe.as_of_date];
    const asOf = inputDates.sort()[0];

    const observation = {
      metric_id: 'GLOBAL_NET_LIQUIDITY_USD_TR',
      as_of_date: asOf,
      value: globalNetLiquidityTr,
      last_updated_at: new Date().toISOString(),
      metadata: {
        formula: 'Fed Net (WALCL - RRP - TGA) + ECB (USD) + BOJ (USD) + BOE (USD)',
        components: {
          us_net_liq_tr: Math.round(usNetLiqTr * 100) / 100,
          ecb_usd_tr: Math.round(ecbAssetsTr * 100) / 100,
          boj_usd_tr: Math.round(bojAssetsTr * 100) / 100,
          boe_usd_tr: Math.round(boeAssetsTr * 100) / 100,
        },
        input_dates: { walcl: walcl.date, rrp: rrp.date, tga: tga.date, ecb: ecb.as_of_date, boj: boj.as_of_date, boe: boe.as_of_date },
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
  // fx_carry (3M swap bases, G7 real-rate matrix, JPY carry-unwind score) was removed on
  // 2026-10-26: it wrote hard-coded constants as daily observations. Those metrics stay
  // unavailable until a real cross-currency basis source is wired in.

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { source, processed },
  };
});
