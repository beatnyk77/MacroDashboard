#!/usr/bin/env npx tsx
/**
 * Deep FRED backfill for invoicing FX: EXINUS (USD/INR) + DEXCHUS (USD/CNY) → CNY_INR_RATE.
 *
 * Requires: FRED_API_KEY, SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 * Usage:    FRED_API_KEY=... npx tsx scripts/backfill-invoicing-fx.ts
 *           npx tsx scripts/backfill-invoicing-fx.ts --limit 2000
 */

import { createClient } from '@supabase/supabase-js';

const FRED_SERIES = [
  { fredId: 'EXINUS', metricId: 'USD_INR_RATE' },
  { fredId: 'DEXCHUS', metricId: 'USD_CNY_RATE' },
] as const;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 2000;

const FRED_API_KEY = process.env.FRED_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FRED_API_KEY) {
  console.error('✗ FRED_API_KEY is required');
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

interface FredObservation {
  date: string;
  value: number;
}

async function fetchFred(seriesId: string): Promise<FredObservation[]> {
  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', FRED_API_KEY!);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', String(LIMIT));

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FRED ${seriesId} failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { observations?: { date: string; value: string }[] };
  return (data.observations ?? [])
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
    .filter((o) => !Number.isNaN(o.value));
}

async function upsertBatch(
  rows: { metric_id: string; as_of_date: string; value: number }[],
  batchSize = 1000,
) {
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize).map((r) => ({
      ...r,
      last_updated_at: now,
      provenance: 'api_live' as const,
    }));
    const { error } = await supabase
      .from('metric_observations')
      .upsert(slice, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
}

async function main() {
  console.log(`▶ Invoicing FX backfill (limit=${LIMIT})`);

  const seriesData: Record<string, FredObservation[]> = {};

  for (const { fredId, metricId } of FRED_SERIES) {
    const obs = await fetchFred(fredId);
    seriesData[metricId] = obs;
    await upsertBatch(obs.map((o) => ({ metric_id: metricId, as_of_date: o.date, value: o.value })));
    console.log(`  ✓ ${metricId} (${fredId}): ${obs.length} rows`);
  }

  const usdInr = seriesData.USD_INR_RATE ?? [];
  const cnyMap = new Map((seriesData.USD_CNY_RATE ?? []).map((r) => [r.date, r.value]));
  const cnyInr = usdInr
    .map((row) => {
      const usdCny = cnyMap.get(row.date);
      if (usdCny === undefined || usdCny <= 0) return null;
      return {
        metric_id: 'CNY_INR_RATE',
        as_of_date: row.date,
        value: row.value / usdCny,
      };
    })
    .filter((r): r is { metric_id: string; as_of_date: string; value: number } => r !== null);

  if (cnyInr.length > 0) {
    await upsertBatch(cnyInr);
    console.log(`  ✓ CNY_INR_RATE (derived): ${cnyInr.length} rows`);
  }

  await supabase
    .from('metrics')
    .update({ updated_at: new Date().toISOString() })
    .in('id', ['USD_INR_RATE', 'USD_CNY_RATE', 'CNY_INR_RATE']);

  console.log('✅ Backfill complete');
}

main().catch((err) => {
  console.error('✗', err instanceof Error ? err.message : err);
  process.exit(1);
});