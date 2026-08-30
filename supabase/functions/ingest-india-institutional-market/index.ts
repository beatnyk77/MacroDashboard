import { createClient } from '@supabase/supabase-js';
import { serveIngest, type IngestResult } from '../_shared/handler.ts';

const NSE_HOME = 'https://www.nseindia.com/';
const NSE_INDICES = 'https://www.nseindia.com/api/allIndices';
const NSE_STOCK_INDEX = 'https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050';
const headers = { 'User-Agent': 'Mozilla/5.0 GraphiQuestor/1.0', Accept: '*/*', Referer: NSE_HOME };

function isoDate(): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()); }
function numeric(value: unknown): number | null { const number = Number(String(value ?? '').replace(/,/g, '')); return Number.isFinite(number) ? number : null; }
async function fetchJson(url: string, cookie: string): Promise<unknown> { const response = await fetch(url, { headers: { ...headers, Cookie: cookie } }); if (!response.ok) throw new Error(`NSE HTTP ${response.status} for ${url}`); return response.json(); }

export async function ingestIndiaInstitutionalMarket(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
  const home = await fetch(NSE_HOME, { headers });
  const cookie = (home.headers.get('set-cookie') ?? '').split(',').map((part) => part.split(';')[0]).filter(Boolean).join('; ');
  const indicesPayload = await fetchJson(NSE_INDICES, cookie);
  const indices = Array.isArray(indicesPayload) ? indicesPayload : (indicesPayload as { data?: unknown[] }).data ?? [];
  const index = (name: string) => indices.find((row) => String((row as Record<string, unknown>).index ?? '').toUpperCase() === name);
  const nifty = index('NIFTY 50') as Record<string, unknown> | undefined;
  const vix = index('INDIA VIX') as Record<string, unknown> | undefined;
  const stocksPayload = await fetchJson(NSE_STOCK_INDEX, cookie);
  const stocks = Array.isArray(stocksPayload) ? stocksPayload : (stocksPayload as { data?: unknown[] }).data ?? [];
  const changes = stocks.map((row) => numeric((row as Record<string, unknown>).pChange)).filter((value): value is number => value !== null);
  const advances = changes.filter((value) => value > 0).length;
  const declines = changes.filter((value) => value < 0).length;
  const date = isoDate();
  const now = new Date().toISOString();
  const observations = [
    { metric_id: 'IN_NIFTY_RETURN', value: numeric(nifty?.percentChange ?? nifty?.pChange), source_ref: `live_api:nse:${NSE_INDICES}` },
    { metric_id: 'IN_INDIA_VIX', value: numeric(vix?.last ?? vix?.lastPrice), source_ref: `live_api:nse:${NSE_INDICES}` },
    { metric_id: 'IN_MARKET_BREADTH', value: changes.length ? advances - declines : null, source_ref: `live_api:nse:${NSE_STOCK_INDEX}` },
  ].filter((row): row is { metric_id: string; value: number; source_ref: string } => row.value !== null).map((row) => ({ ...row, as_of_date: date, last_updated_at: now, provenance: 'api_live', is_provisional: false, metadata: { source_name: 'NSE', native_frequency: 'daily', advances, declines, source_fields: row.metric_id === 'IN_MARKET_BREADTH' ? { advances, declines } : null } }));
  const { data: fxRows, error: fxError } = await supabase.from('metric_observations').select('as_of_date, value').eq('metric_id', 'USD_INR_RATE').order('as_of_date', { ascending: false }).limit(2);
  if (fxError) throw fxError;
  if (fxRows && fxRows.length >= 2) {
    const latest = numeric(fxRows[0].value);
    const previous = numeric(fxRows[1].value);
    if (latest !== null && previous !== null && previous !== 0) observations.push({ metric_id: 'IN_USD_INR_RETURN', value: ((latest / previous) - 1) * 100, as_of_date: date, last_updated_at: now, provenance: 'api_live', is_provisional: false, metadata: { source_name: 'RBI/FRED', native_frequency: 'daily', source_dates: [fxRows[0].as_of_date, fxRows[1].as_of_date] } });
  }
  if (!observations.length) throw new Error('NSE returned no validated institutional market inputs');
  const { error } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id,as_of_date' });
  if (error) throw error;
  return { ok: true, counts: { upserted: observations.length }, meta: { as_of_date: date, advances, declines } };
}

serveIngest('ingest-india-institutional-market', async () => ingestIndiaInstitutionalMarket(createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')), { timeoutMs: 20 * 60 * 1000, retries: 3 });
