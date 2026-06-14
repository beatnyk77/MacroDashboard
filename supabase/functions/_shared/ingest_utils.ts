/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { SupabaseClient } from '@supabase/supabase-js'

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Fetch with exponential backoff retry logic and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 15000, maxRetries = 3, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      if (i > 0) {
        // Exponential backoff with jitter
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (response.ok) return response;

      const errorText = await response.text();
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      } else {
        lastError = error;
      }
    } finally {
      clearTimeout(id);
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * Validates that an object has expected numeric values for given keys
 */
export function validateNumericData(data: any, keys: string[]): boolean {
  return keys.every(key => {
    const val = data[key];
    return typeof val === 'number' && !isNaN(val);
  });
}

export interface ProvenanceDefaults {
  /** e.g. 'live_api:fred' | 'fallback:china-macro-lpr-hardcoded' | 'seed:001_initial_schema' */
  source_ref: string;
  /** true when the row did not come from a live API call */
  is_provisional?: boolean;
}

/**
 * Upserts observations to metric_observations table with standard columns.
 *
 * Pass `provenanceDefaults` to stamp source_ref / is_provisional on every row
 * that does not already carry those fields.  Live-API callers pass
 * { source_ref: 'live_api:<name>', is_provisional: false }; fallback callers
 * pass { source_ref: 'fallback:<name>', is_provisional: true }.
 */
export async function upsertObservations(
  supabase: SupabaseClient,
  observations: any[],
  provenanceDefaults?: ProvenanceDefaults,
) {
  if (observations.length === 0) return { count: 0 };

  const rows = provenanceDefaults
    ? observations.map((o) => ({
        ...o,
        source_ref:     o.source_ref     ?? provenanceDefaults.source_ref,
        is_provisional: o.is_provisional ?? (provenanceDefaults.is_provisional ?? false),
      }))
    : observations;

  const { error } = await supabase
    .from('metric_observations')
    .upsert(rows, { onConflict: 'metric_id, as_of_date' });

  if (error) throw error;
  
  // Update the 'updated_at' timestamp on the parent metrics
  const uniqueMetricIds = [...new Set(observations.map(o => o.metric_id))];
  await Promise.all(
    uniqueMetricIds.map(id => 
      supabase
        .from('metrics')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  );

  return { count: observations.length };
}

/**
 * Helper to get active metrics for a specific source
 */
export async function getActiveMetricsBySource(
  supabase: SupabaseClient,
  sourceName: string
) {
  const { data: source } = await supabase
    .from('data_sources')
    .select('id')
    .eq('name', sourceName)
    .single();

  if (!source) throw new Error(`Source ${sourceName} not found`);

  const { data: metrics, error } = await supabase
    .from('metrics')
    .select('id, metadata, updated_at')
    .eq('source_id', source.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: true, nullsFirst: true });

  if (error) throw error;
  return metrics || [];
}

/**
 * Specialized fetcher for AlphaVantage Commodities API
 */
export async function fetchAlphaVantageCommodity(
  functionName: string,
  apiKey: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const url = `https://www.alphavantage.co/query?function=${functionName}&interval=${interval}&apikey=${apiKey}`;
  const resp = await fetchWithRetry(url);
  const json = await resp.json();

  if (json.Note || json.Information) {
    throw new Error(`AlphaVantage Rate Limit or Info: ${json.Note || json.Information}`);
  }

  if (json.Error_Message) {
    throw new Error(`AlphaVantage Error: ${json.Error_Message}`);
  }

  const data = json.data;
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  // AlphaVantage returns data in descending order usually, but we want to be sure
  return data.map((item: any) => ({
    date: item.date,
    value: parseFloat(item.value)
  })).filter(item => !isNaN(item.value));
}

/**
 * Specialized fetcher for AlphaVantage FX API
 */
export async function fetchAlphaVantageFX(
  fromSymbol: string,
  toSymbol: string,
  apiKey: string
) {
  const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=${toSymbol}&apikey=${apiKey}`;
  const resp = await fetchWithRetry(url);
  const json = await resp.json();

  if (json.Note || json.Information) {
    throw new Error(`AlphaVantage Rate Limit or Info: ${json.Note || json.Information}`);
  }

  const timeSeries = json['Time Series FX (Daily)'];
  if (!timeSeries) {
    throw new Error(`AlphaVantage FX Error: ${json['Error Message'] || 'No time series found'}`);
  }

  // Convert map to array of { date, value }
  return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    value: parseFloat(values['4. close'])
  })).sort((a, b) => b.date.localeCompare(a.date)); // Latest first
}

/**
 * Specialized fetcher for AlphaVantage Stock Time Series API
 */
export async function fetchAlphaVantageTimeSeries(
  symbol: string,
  apiKey: string,
  outputsize: 'compact' | 'full' = 'compact'
) {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=${outputsize}&apikey=${apiKey}`;
  const resp = await fetchWithRetry(url);
  const json = await resp.json();

  if (json.Note || json.Information) {
    throw new Error(`AlphaVantage Rate Limit or Info: ${json.Note || json.Information}`);
  }

  const timeSeries = json['Time Series (Daily)'];
  if (!timeSeries) {
    throw new Error(`AlphaVantage Time Series Error: ${json['Error Message'] || 'No time series found'}`);
  }

  return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    value: parseFloat(values['5. adjusted close'] || values['4. close'])
  })).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Specialized fetcher for AlphaVantage Crypto API
 */
export async function fetchAlphaVantageCrypto(
  symbol: string,
  apiKey: string,
  market: string = 'USD'
) {
  const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=${market}&apikey=${apiKey}`;
  const resp = await fetchWithRetry(url);
  const json = await resp.json();

  if (json.Note || json.Information) {
    throw new Error(`AlphaVantage Rate Limit or Info: ${json.Note || json.Information}`);
  }

  const timeSeries = json[`Time Series (Digital Currency Daily)`];
  if (!timeSeries) {
    throw new Error(`AlphaVantage Crypto Error: ${json['Error Message'] || 'No time series found'}`);
  }

  return Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
    date,
    value: parseFloat(values[`4a. close (${market})`] || values[`4b. close (${market})`])
  })).sort((a, b) => b.date.localeCompare(a.date));
}
