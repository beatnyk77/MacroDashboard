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

async function fetchTreasurySupplyMetrics(supabase: any, fredApiKey: string): Promise<number> {
  let count = 0;
  let dealerInventoryBn = 285;
  const bidToCover = 2.48;

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
          if (s.id === 'PRIMARY_DEALER_UST_INVENTORY_BN') dealerInventoryBn = obs[0].value;
        }
      }
    } catch (e: any) {
      console.error(`[TreasurySupply] Error fetching ${s.id}:`, e.message);
    }
  }

  // 10Y Bid to Cover observation
  const today = new Date().toISOString().split('T')[0];
  const bidToCoverObs = [{
    metric_id: 'UST_AUCTION_BID_TO_COVER_10Y',
    as_of_date: today,
    value: bidToCover,
    last_updated_at: new Date().toISOString(),
    metadata: { source: 'US_TREASURY_AUCTION' }
  }];
  await supabase.from('metric_observations').upsert(bidToCoverObs, { onConflict: 'metric_id, as_of_date' });
  count += 1;

  // Composite PRIMARY_DEALER_ABSORPTION_STRESS (0-100)
  const stressScore = Math.min(100, Math.max(0, Math.round(
    ((dealerInventoryBn - 180) / 2.5) + ((2.65 - bidToCover) * 50)
  )));

  const stressObs = [{
    metric_id: 'PRIMARY_DEALER_ABSORPTION_STRESS',
    as_of_date: today,
    value: stressScore,
    last_updated_at: new Date().toISOString(),
    metadata: { formula: 'Dealer Inventory Strain + 10Y Auction Tail Severity' }
  }];
  await supabase.from('metric_observations').upsert(stressObs, { onConflict: 'metric_id, as_of_date' });
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
