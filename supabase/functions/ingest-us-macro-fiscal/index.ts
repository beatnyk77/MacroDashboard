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

async function fetchTreasurySupplyMetrics(supabase: any, fredApiKey: string): Promise<number> {
  let count = 0;
  let dealerInventory: { date: string; value: number } | null = null;

  const seriesMap = [
    { id: 'FOREIGN_OFFICIAL_UST_CUSTODY_BN', fredId: 'H0RESH4CGNWW', divisor: 1000 },
    { id: 'PRIMARY_DEALER_UST_INVENTORY_BN', fredId: 'PDINTT', divisor: 1000 },
  ];

  for (const s of seriesMap) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=30`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as any;
      const obs = (json.observations ?? [])
        .map((o: any) => {
          const val = parseFloat(o.value);
          if (isNaN(val)) return null;
          return {
            metric_id: s.id,
            as_of_date: o.date,
            value: Math.round((val / s.divisor) * 100) / 100,
            last_updated_at: new Date().toISOString(),
            metadata: { source: 'FRED', series_id: s.fredId },
          };
        })
        .filter((o: any) => o !== null);

      if (obs.length > 0) {
        const { error } = await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
        if (!error) {
          count += obs.length;
          if (s.id === 'PRIMARY_DEALER_UST_INVENTORY_BN') dealerInventory = { date: obs[0].as_of_date, value: obs[0].value };
        }
      }
    } catch (e: any) {
      console.error(`[TreasurySupply] Error fetching ${s.id}:`, e.message);
    }
  }

  // Both inputs must be real observations; no defaults are substituted.
  const auction = await latestTenYearAuction(supabase);
  if (!auction) {
    console.warn('[TreasurySupply] No 10-Year auction result available; skipping bid-to-cover and absorption stress.');
    return count;
  }

  await supabase.from('metric_observations').upsert([{
    metric_id: 'UST_AUCTION_BID_TO_COVER_10Y',
    as_of_date: auction.auction_date,
    value: auction.bid_to_cover,
    last_updated_at: new Date().toISOString(),
    metadata: { source: 'us_treasury_auctions', term: '10-Year' },
  }], { onConflict: 'metric_id, as_of_date' });
  count += 1;

  if (!dealerInventory) {
    console.warn('[TreasurySupply] No primary dealer inventory observation; skipping absorption stress.');
    return count;
  }

  // Composite PRIMARY_DEALER_ABSORPTION_STRESS (0-100), dated to the newer of its two inputs.
  const stressScore = Math.min(100, Math.max(0, Math.round(
    ((dealerInventory.value - 180) / 2.5) + ((2.65 - auction.bid_to_cover) * 50)
  )));
  const asOf = dealerInventory.date > auction.auction_date ? dealerInventory.date : auction.auction_date;

  await supabase.from('metric_observations').upsert([{
    metric_id: 'PRIMARY_DEALER_ABSORPTION_STRESS',
    as_of_date: asOf,
    value: stressScore,
    last_updated_at: new Date().toISOString(),
    metadata: {
      formula: 'Dealer Inventory Strain + 10Y Auction Tail Severity',
      inputs: {
        primary_dealer_inventory_bn: dealerInventory.value,
        primary_dealer_inventory_date: dealerInventory.date,
        bid_to_cover_10y: auction.bid_to_cover,
        auction_date_10y: auction.auction_date,
      },
    },
  }], { onConflict: 'metric_id, as_of_date' });
  count += 1;

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
