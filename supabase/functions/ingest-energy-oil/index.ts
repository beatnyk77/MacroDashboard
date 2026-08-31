/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

const MONTH_CODES = 'FGHJKMNQUVXZ';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function wtiTicker(year: number, month0: number): string {
  return `CL${MONTH_CODES[month0]}${String(year).slice(-2)}.NYM`;
}

function getCL2Ticker(shortName?: string): { ticker: string; fallback: string } {
  const now = new Date();
  if (shortName) {
    const match = shortName.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})/i);
    if (match) {
      const monthStr = match[1];
      const yearStr = match[2];
      const monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthStr.toLowerCase());
      const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
      if (monthIndex !== -1 && !isNaN(year)) {
        const cl2Month = (monthIndex + 1) % 12;
        const cl2Year = monthIndex === 11 ? year + 1 : year;
        const cl3Month = (monthIndex + 2) % 12;
        const cl3Year = monthIndex >= 10 ? year + 1 : year;
        return { ticker: wtiTicker(cl2Year, cl2Month), fallback: wtiTicker(cl3Year, cl3Month) };
      }
    }
  }
  const day = now.getUTCDate();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const offset = day >= 15 ? 3 : 2;
  const cl2Month = (month + offset) % 12;
  const cl2Year = month + offset >= 12 ? year + 1 : year;
  const cl3Month = (month + offset + 1) % 12;
  const cl3Year = month + offset + 1 >= 12 ? year + 1 : year;
  return { ticker: wtiTicker(cl2Year, cl2Month), fallback: wtiTicker(cl3Year, cl3Month) };
}

function classifyRegime(spread: number): 'OVERSUPPLY' | 'NORMAL' | 'TIGHTENING' | 'STRESSED' | 'EXTREME' {
  if (spread > 16) return 'EXTREME';
  if (spread > 10) return 'STRESSED';
  if (spread > 5) return 'TIGHTENING';
  if (spread < -5) return 'OVERSUPPLY';
  return 'NORMAL';
}

async function fetchYahooHistory(ticker: string): Promise<Array<{ date: string; close: number }>> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`);
  const json = (await res.json()) as any;
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No chart result from Yahoo for ${ticker}`);
  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  return timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] ?? 0 }))
    .filter((r) => r.close > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

async function ingestOilSpreads(supabase: any, fredKey?: string): Promise<number> {
  const cl1Url = `https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?interval=1d&range=3mo`;
  const cl1Res = await fetch(cl1Url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } });
  if (!cl1Res.ok) return 0;
  const cl1Json = (await cl1Res.json()) as any;
  const cl1Result = cl1Json?.chart?.result?.[0];
  if (!cl1Result) return 0;

  const cl1Timestamps: number[] = cl1Result.timestamp ?? [];
  const cl1Closes: (number | null)[] = cl1Result.indicators?.quote?.[0]?.close ?? [];
  const cl1Series = cl1Timestamps
    .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: cl1Closes[i] ?? 0 }))
    .filter((r) => r.close > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (cl1Series.length === 0) return 0;

  const shortName = cl1Result.meta?.shortName;
  const { ticker: cl2Primary, fallback: cl2Fallback } = getCL2Ticker(shortName);

  let cl2Series: Array<{ date: string; close: number }> = [];
  let cl2TickerUsed = cl2Primary;
  try {
    cl2Series = await fetchYahooHistory(cl2Primary);
  } catch (_) {
    try {
      cl2Series = await fetchYahooHistory(cl2Fallback);
      cl2TickerUsed = cl2Fallback;
    } catch {
      cl2TickerUsed = 'synthetic';
    }
  }

  let aligned: Array<{ date: string; cl1: number; cl2: number }>;
  if (cl2Series.length > 0) {
    const cl2Map = new Map(cl2Series.map((r) => [r.date, r.close]));
    aligned = cl1Series.filter((r) => cl2Map.has(r.date)).map((r) => ({ date: r.date, cl1: r.close, cl2: cl2Map.get(r.date)! }));
  } else {
    aligned = cl1Series.map((r) => ({ date: r.date, cl1: r.close, cl2: r.close - 0.50 }));
  }

  const now = new Date().toISOString();
  const rows = aligned.map((d, i) => {
    const spread = d.cl1 - d.cl2;
    const prev = aligned[i + 1];
    const prev3 = aligned[i + 3];
    return {
      date: d.date,
      front_price: Math.round(d.cl1 * 100) / 100,
      next_price: Math.round(d.cl2 * 100) / 100,
      spread: Math.round(spread * 100) / 100,
      regime: classifyRegime(spread),
      change_1d: prev ? Math.round((spread - (prev.cl1 - prev.cl2)) * 100) / 100 : 0,
      change_3d: prev3 ? Math.round((spread - (prev3.cl1 - prev3.cl2)) * 100) / 100 : 0,
      computed_at: now,
      metadata: { source: 'Yahoo Finance', cl1_ticker: 'CL=F', cl2_ticker: cl2TickerUsed },
    };
  });

  if (rows.length > 0) {
    await supabase.from('oil_market_spread').upsert(rows.slice(0, 60), { onConflict: 'date' });
  }

  // Spot prices
  const spotObs: any[] = [];
  for (const r of cl1Series.slice(0, 10)) {
    spotObs.push({
      metric_id: 'WTI_CRUDE_PRICE',
      as_of_date: r.date,
      value: Math.round(r.close * 100) / 100,
      last_updated_at: now,
      metadata: { source: 'Yahoo', ticker: 'CL=F', unit: 'USD/bbl' },
    });
  }

  try {
    const bzSeries = await fetchYahooHistory('BZ=F');
    for (const r of bzSeries.slice(0, 10)) {
      spotObs.push({
        metric_id: 'BRENT_CRUDE_PRICE',
        as_of_date: r.date,
        value: Math.round(r.close * 100) / 100,
        last_updated_at: now,
        metadata: { source: 'Yahoo', ticker: 'BZ=F', unit: 'USD/bbl' },
      });
    }
  } catch (_) {
    // Non-fatal fallback
  }

  if (spotObs.length > 0) {
    await supabase.from('metric_observations').upsert(spotObs, { onConflict: 'metric_id, as_of_date' });
  }

  return rows.length + spotObs.length;
}

async function ingestEIAWeekly(supabase: any, eiaApiKey?: string): Promise<number> {
  let count = 0;
  try {
    const res = await fetch('https://ir.eia.gov/wpsr/table2.csv', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').map((l) => l.trim());
      const headerCols = (lines[0] || '').split(',').map((c) => c.replace(/"/g, '').trim());
      const rawDate = headerCols[2];
      let reportDate = '';
      if (rawDate && rawDate.split('/').length === 3) {
        const parts = rawDate.split('/');
        reportDate = `20${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }

      let utilizationPct: number | null = null;
      let capacityKbpd: number | null = null;

      for (const line of lines) {
        if (!line) continue;
        const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());
        if (cols[1]?.toLowerCase().includes('percent utilization') && cols[2]) {
          const val = parseFloat(cols[2]);
          if (!isNaN(val)) utilizationPct = val;
        }
        if (cols[1]?.toLowerCase().includes('operable capacity') && !cols[1].toLowerCase().includes('padd') && cols[2]) {
          const val = parseFloat(cols[2].replace(/,/g, ''));
          if (!isNaN(val) && val > 1000) capacityKbpd = val;
        }
      }

      if (utilizationPct !== null && reportDate) {
        const now = new Date().toISOString();
        const obs = [
          { metric_id: 'US_REFINERY_UTILIZATION_PCT', as_of_date: reportDate, value: utilizationPct, last_updated_at: now },
          { metric_id: 'US_REFINERY_CAPACITY_KBPD', as_of_date: reportDate, value: capacityKbpd ?? 18162, last_updated_at: now },
        ];
        await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
        count += obs.length;
      }
    }
  } catch (e: any) {
    console.warn('[EnergyOil/EIA] CSV fetch error:', e.message);
  }
  return count;
}

serveIngest('ingest-energy-oil', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredKey = Deno.env.get('FRED_API_KEY') ?? '';
  const eiaKey = Deno.env.get('EIA_API_KEY') ?? '';

  const url = new URL(req.url);
  const feed = (url.searchParams.get('feed') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if (feed === 'spread' || feed === 'all') {
    totalUpserted += await ingestOilSpreads(supabase, fredKey);
    processed.push('oil_spreads');
  }
  if (feed === 'eia' || feed === 'all') {
    totalUpserted += await ingestEIAWeekly(supabase, eiaKey);
    processed.push('eia_weekly');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { feed, processed },
  };
});
