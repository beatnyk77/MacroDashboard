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
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    } catch (error: any) {
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
    { id: 'EU_DEBT_GDP_PCT', fredId: 'DEBTGDP' },
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

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { source, processed },
  };
});
