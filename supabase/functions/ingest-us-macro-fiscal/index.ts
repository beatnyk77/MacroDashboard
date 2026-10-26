// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

async function fetchTipsYield(fredApiKey: string): Promise<{ date: string; value: number }[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DFII10&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=30`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as any;
  const rows: { date: string; value: number }[] = [];
  for (const obs of json.observations ?? []) {
    const val = parseFloat(obs.value);
    if (!isNaN(val)) rows.push({ date: obs.date, value: val });
  }
  return rows;
}

/** Latest real 10-Year auction (written by ingest-us-macro?task=auctions). */
async function latestTenYearAuction(supabase: any): Promise<{ auction_date: string; bid_to_cover: number } | null> {
  const { data, error } = await supabase
    .from('us_treasury_auctions')
    .select('auction_date, bid_to_cover')
    .eq('term', '10-Year')
    .order('auction_date', { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  const btc = Number(data[0].bid_to_cover);
  return Number.isFinite(btc) && btc > 0 ? { auction_date: data[0].auction_date, bid_to_cover: btc } : null;
}

/** NY Fed primary dealer statistics: weekly net positions (USD millions) for one series key. */
async function fetchNyFedDealerSeries(keyId: string): Promise<{ date: string; value: number }[]> {
  const res = await fetch(`https://markets.newyorkfed.org/api/pd/get/${keyId}.json`);
  if (!res.ok) return [];
  const json = (await res.json()) as any;
  return (json?.pd?.timeseries ?? [])
    .map((r: any) => ({ date: r.asofdate, value: parseFloat(r.value) }))
    .filter((r: any) => r.date && Number.isFinite(r.value))
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
    .slice(0, 30);
}

async function upsertSeries(supabase: any, metricId: string, rows: { date: string; value: number }[], divisor: number, metadata: Record<string, unknown>): Promise<number> {
  const obs = rows.map((r) => ({
    metric_id: metricId,
    as_of_date: r.date,
    value: Math.round((r.value / divisor) * 100) / 100,
    last_updated_at: new Date().toISOString(),
    metadata,
  }));
  if (obs.length === 0) return 0;
  const { error } = await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
  if (error) {
    console.error(`[TreasurySupply] Upsert failed for ${metricId}:`, error.message);
    return 0;
  }
  return obs.length;
}

async function fetchTreasurySupplyMetrics(supabase: any, fredApiKey: string): Promise<number> {
  let count = 0;

  // Foreign official custody holdings of marketable Treasuries (H.4.1, weekly, USD millions).
  // H0RESH4CGNWW, used previously, was discontinued on FRED in Nov 2012.
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=WMTSECL1&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=30`;
    const res = await fetch(url);
    if (res.ok) {
      const json = (await res.json()) as any;
      const rows = (json.observations ?? [])
        .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }))
        .filter((o: any) => Number.isFinite(o.value));
      count += await upsertSeries(supabase, 'FOREIGN_OFFICIAL_UST_CUSTODY_BN', rows, 1000, { source: 'FRED', series_id: 'WMTSECL1' });
    }
  } catch (e: any) {
    console.error('[TreasurySupply] Error fetching WMTSECL1:', e.message);
  }

  // Primary dealer net positions in Treasuries excl. TIPS (NY Fed, weekly, USD millions).
  // The FRED id used previously (PDINTT) does not exist.
  try {
    const rows = await fetchNyFedDealerSeries('PDPOSGST-TOT');
    count += await upsertSeries(supabase, 'PRIMARY_DEALER_UST_INVENTORY_BN', rows, 1000, { source: 'NY Fed Primary Dealer Statistics', series_id: 'PDPOSGST-TOT' });
  } catch (e: any) {
    console.error('[TreasurySupply] Error fetching NY Fed PDPOSGST-TOT:', e.message);
  }

  // Latest real 10-Year auction bid-to-cover (no default when none is available).
  const auction = await latestTenYearAuction(supabase);
  if (auction) {
    await supabase.from('metric_observations').upsert([{
      metric_id: 'UST_AUCTION_BID_TO_COVER_10Y',
      as_of_date: auction.auction_date,
      value: auction.bid_to_cover,
      last_updated_at: new Date().toISOString(),
      metadata: { source: 'us_treasury_auctions', term: '10-Year' },
    }], { onConflict: 'metric_id, as_of_date' });
    count += 1;
  } else {
    console.warn('[TreasurySupply] No 10-Year auction result available; bid-to-cover not written.');
  }

  // PRIMARY_DEALER_ABSORPTION_STRESS is no longer computed: its thresholds ((inventory - 180) / 2.5)
  // were tuned to placeholder inputs and saturate at 100 on real NY Fed positions (~$440B).
  // It stays unavailable until the score is recalibrated on real history.

  return count;
}

serveIngest('ingest-us-macro-fiscal', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';

  const url = new URL(req.url);
  const task = (url.searchParams.get('task') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if ((task === 'tips' || task === 'all') && fredApiKey) {
    const tipsRows = await fetchTipsYield(fredApiKey);
    const observations = tipsRows.map((r) => ({
      metric_id: 'US_10Y_TIPS_YIELD',
      as_of_date: r.date,
      value: r.value,
      last_updated_at: new Date().toISOString(),
      metadata: { source: 'FRED', series_id: 'DFII10' },
    }));

    if (observations.length > 0) {
      const { error } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
      if (error) throw error;
      totalUpserted += observations.length;
      processed.push('us_10y_tips');
    }
  }

  if ((task === 'treasury_supply' || task === 'all') && fredApiKey) {
    const supplyCount = await fetchTreasurySupplyMetrics(supabase, fredApiKey);
    totalUpserted += supplyCount;
    processed.push('treasury_supply_radar');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { task, processed },
  };
});
