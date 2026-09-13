import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://debdriyzfcwvgrhzzzre.supabase.co';
const SERVICE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmRyaXl6ZmN3dmdyaHp6enJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDczOTAsImV4cCI6MjA4NTAyMzM5MH0.jhSYCXDWIScrRgVqt947i_ggAotYn_NN2qxFXQOhplc';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible)',
  'Accept': '*/*',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchYahooDaily(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`);
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No chart result for ${ticker}`);
  
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const points = [];
  
  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const close = closes[i];
    if (close == null || isNaN(close)) continue;
    const dateStr = new Date(timestamp * 1000).toISOString().slice(0, 10);
    points.push({ date: dateStr, close });
  }
  
  // Deduplicate by date
  const byDate = new Map();
  for (const p of points) byDate.set(p.date, p.close);
  return [...byDate.entries()]
    .map(([date, close]) => ({ date, close }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function run() {
  console.log('Fetching Nifty 50 from Yahoo Finance...');
  const niftySeries = await fetchYahooDaily('^NSEI');
  console.log(`Fetched ${niftySeries.length} Nifty days.`);

  await sleep(1500);

  console.log('Fetching India VIX from Yahoo Finance...');
  const vixSeries = await fetchYahooDaily('^INDIAVIX');
  console.log(`Fetched ${vixSeries.length} VIX days.`);

  const now = new Date().toISOString();
  const observations = [];

  // 1. NIFTY Returns
  for (let i = 1; i < niftySeries.length; i++) {
    const prev = niftySeries[i - 1].close;
    const curr = niftySeries[i].close;
    const ret = ((curr / prev) - 1) * 100;
    observations.push({
      metric_id: 'IN_NIFTY_RETURN',
      as_of_date: niftySeries[i].date,
      value: Number(ret.toFixed(4)),
      last_updated_at: now,
      source_ref: 'live_api:nse:^NSEI',
      provenance: 'api_live',
      is_provisional: false,
      metadata: { source_name: 'NSE / Yahoo', native_frequency: 'daily', close: curr, prev_close: prev },
    });
  }

  // 2. India VIX Levels
  for (const p of vixSeries) {
    observations.push({
      metric_id: 'IN_INDIA_VIX',
      as_of_date: p.date,
      value: Number(p.close.toFixed(2)),
      last_updated_at: now,
      source_ref: 'live_api:nse:^INDIAVIX',
      provenance: 'api_live',
      is_provisional: false,
      metadata: { source_name: 'NSE / Yahoo', native_frequency: 'daily' },
    });
  }

  // 3. USD/INR Returns from existing USD_INR_RATE
  console.log('Fetching USD_INR_RATE from database...');
  const { data: inrRows, error: inrError } = await supabase
    .from('metric_observations')
    .select('as_of_date, value')
    .eq('metric_id', 'USD_INR_RATE')
    .gte('as_of_date', '2025-08-01')
    .order('as_of_date', { ascending: true });

  if (inrError) throw inrError;
  console.log(`Fetched ${inrRows?.length || 0} USD_INR_RATE rows.`);

  if (inrRows && inrRows.length > 1) {
    for (let i = 1; i < inrRows.length; i++) {
      const prev = Number(inrRows[i - 1].value);
      const curr = Number(inrRows[i].value);
      if (prev > 0 && Number.isFinite(curr)) {
        const ret = ((curr / prev) - 1) * 100;
        observations.push({
          metric_id: 'IN_USD_INR_RETURN',
          as_of_date: inrRows[i].as_of_date,
          value: Number(ret.toFixed(4)),
          last_updated_at: now,
          source_ref: 'live_composite:yahoo_inr',
          provenance: 'api_live',
          is_provisional: false,
          metadata: { source_name: 'RBI/Yahoo', native_frequency: 'daily', rate: curr, prev_rate: prev },
        });
      }
    }
  }

  console.log(`Writing ${observations.length} observations to scratch/institutional_market_observations.json...`);
  import('fs').then(fs => {
    fs.mkdirSync('./scratch', { recursive: true });
    fs.writeFileSync('./scratch/institutional_market_observations.json', JSON.stringify(observations, null, 2));
    console.log('Saved successfully!');
  });
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
