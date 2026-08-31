/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';
import { fetchAlphaVantageCommodity, upsertObservations } from '../_shared/ingest_utils.ts';

const OUNCES_PER_TONNE = 32150.7466;
const GLOBAL_ABOVE_GROUND_STOCK = 212582;

async function ingestGoldPrices(supabase: any, avApiKey: string): Promise<number> {
  const [goldData, silverData] = await Promise.all([
    fetchAlphaVantageCommodity('GOLD_SILVER_HISTORY', avApiKey, 'daily', 'GOLD'),
    fetchAlphaVantageCommodity('GOLD_SILVER_HISTORY', avApiKey, 'daily', 'SILVER'),
  ]);

  const observations: any[] = [];
  if (goldData?.length > 0) {
    goldData.slice(0, 30).forEach((d: any) => {
      observations.push({
        metric_id: 'GOLD_PRICE_USD',
        as_of_date: d.date,
        value: d.value,
        metadata: { source: 'AlphaVantage', unit: 'USD/oz' },
      });
    });
  }
  if (silverData?.length > 0) {
    silverData.slice(0, 30).forEach((d: any) => {
      observations.push({
        metric_id: 'SILVER_PRICE_USD',
        as_of_date: d.date,
        value: d.value,
        metadata: { source: 'AlphaVantage', unit: 'USD/oz' },
      });
    });
  }

  if (observations.length > 0) {
    const { count } = await upsertObservations(supabase, observations, {
      source_ref: 'live_api:ingest-precious-metals',
      is_provisional: false,
    });
    return count ?? observations.length;
  }
  return 0;
}

async function ingestCopperGold(supabase: any, fredApiKey: string): Promise<number> {
  const urlCopper = `https://api.stlouisfed.org/fred/series/observations?series_id=PCOPPUSDM&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
  const urlGold = `https://api.stlouisfed.org/fred/series/observations?series_id=GOLDAMGBD228NLBM&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=30`;

  const [resC, resG] = await Promise.all([fetch(urlCopper), fetch(urlGold)]);
  if (!resC.ok || !resG.ok) return 0;

  const [dataC, dataG] = await Promise.all([resC.json(), resG.json()]);
  const cObs = dataC.observations?.filter((o: any) => o.value !== '.') ?? [];
  const gObs = dataG.observations?.filter((o: any) => o.value !== '.') ?? [];

  const obs: any[] = [];
  if (cObs.length > 0 && gObs.length > 0) {
    const latestCopper = parseFloat(cObs[0].value);
    const latestGold = parseFloat(gObs[0].value);
    if (!isNaN(latestCopper) && !isNaN(latestGold) && latestGold > 0) {
      obs.push(
        {
          metric_id: 'COPPER_PRICE_USD',
          as_of_date: cObs[0].date,
          value: latestCopper,
          metadata: { source: 'FRED/PCOPPUSDM', unit: 'USD/metric ton' },
        },
        {
          metric_id: 'COPPER_GOLD_RATIO',
          as_of_date: cObs[0].date,
          value: latestCopper / latestGold,
          metadata: { source: 'FRED', copper_usd_per_mt: latestCopper, gold_usd_per_oz: latestGold },
        },
      );
    }
  }

  if (obs.length > 0) {
    const { count } = await upsertObservations(supabase, obs, {
      source_ref: 'live_api:ingest-precious-metals',
      is_provisional: false,
    });
    return count ?? obs.length;
  }
  return 0;
}

async function refreshRatiosRPC(supabase: any): Promise<number> {
  const { error } = await supabase.rpc('populate_gold_ratios');
  if (error) {
    console.warn('[PreciousMetals] populate_gold_ratios RPC warning:', error.message);
    return 0;
  }
  return 4;
}

serveIngest('ingest-precious-metals', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY') ?? '';
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';

  const url = new URL(req.url);
  const metal = (url.searchParams.get('metal') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if ((metal === 'gold' || metal === 'all') && avApiKey) {
    totalUpserted += await ingestGoldPrices(supabase, avApiKey);
    processed.push('gold_silver_prices');
  }
  if ((metal === 'copper_ratio' || metal === 'all') && fredApiKey) {
    totalUpserted += await ingestCopperGold(supabase, fredApiKey);
    processed.push('copper_gold_ratio');
  }
  if (metal === 'ratios' || metal === 'all') {
    totalUpserted += await refreshRatiosRPC(supabase);
    processed.push('gold_ratios_rpc');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { metal, processed },
  };
});
