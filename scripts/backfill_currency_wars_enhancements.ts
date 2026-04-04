#!/usr/bin/env deno run --allow-net --allow-env --allow-read
/**
 * Backfill script for enhanced Currency Wars metrics
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface MetricObservation {
  metric_id: string;
  as_of_date: string;
  value: number;
}

async function fetchObservations(metricId: string): Promise<MetricObservation[]> {
  const { data, error } = await supabase
    .from('metric_observations')
    .select('metric_id, as_of_date, value')
    .eq('metric_id', metricId)
    .order('as_of_date', { ascending: true });

  if (error) throw new Error(`Failed to fetch ${metricId}: ${error.message}`);
  return data.map(d => ({
    metric_id: d.metric_id,
    as_of_date: d.as_of_date,
    value: Number(d.value)
  }));
}

async function backfillAll() {
  console.log('🚀 Starting comprehensive backfill...');

  // 1. Fetch all base data
  const [usdInr, emCny, emBrl, emMxn, emTwd] = await Promise.all([
    fetchObservations('USD_INR_RATE'),
    fetchObservations('USD_CNY_RATE'),
    fetchObservations('USD_BRL_RATE'),
    fetchObservations('USD_MXN_RATE'),
    fetchObservations('USD_TWD_RATE')
  ]);

  const { data: flowsData, error: flowsError } = await supabase
    .from('market_pulse_daily')
    .select('date, fii_cash_net, dii_cash_net')
    .order('date', { ascending: true });

  if (flowsError) throw new Error(`Failed to fetch flows: ${flowsError.message}`);

  const seriesMap: Record<string, MetricObservation[]> = {
    'USD_INR_RATE': usdInr,
    'USD_CNY_RATE': emCny,
    'USD_BRL_RATE': emBrl,
    'USD_MXN_RATE': emMxn,
    'USD_TWD_RATE': emTwd
  };

  const emPeerIds = ['USD_CNY_RATE', 'USD_BRL_RATE', 'USD_MXN_RATE', 'USD_TWD_RATE'];

  // 2. Build temporal maps
  const inrVolatilityMap = new Map<string, number>();
  for (let i = 20; i < usdInr.length; i++) {
    const window = usdInr.slice(i - 20, i).map(x => x.value);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const squaredDiffs = window.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / window.length;
    inrVolatilityMap.set(usdInr[i].as_of_date, Math.sqrt(variance));
  }

  const emAvgDailyChangeMap = new Map<string, number>();
  const allDates = new Set<string>();
  Object.values(seriesMap).flat().forEach(o => allDates.add(o.as_of_date));

  Array.from(allDates).sort().forEach(date => {
    let sum = 0, count = 0;
    emPeerIds.forEach(id => {
      const s = seriesMap[id];
      const idx = s.findIndex(o => o.as_of_date === date);
      if (idx > 0) {
        sum += ((s[idx].value - s[idx - 1].value) / s[idx - 1].value) * 100;
        count++;
      }
    });
    if (count > 0) emAvgDailyChangeMap.set(date, sum / count);
  });

  // 3. Process Composite Pressure
  const compositeData: MetricObservation[] = flowsData.map(flow => {
    const date = flow.date;
    const netFlow = (Number(flow.fii_cash_net) || 0) + (Number(flow.dii_cash_net) || 0);
    const flowScore = Math.max(0, Math.min(40, (-netFlow / 1000) * 8));

    const vol = inrVolatilityMap.get(date) || 0;
    const volScore = Math.max(0, Math.min(30, (vol / 0.5) * 30));

    const inrIdx = usdInr.findIndex(o => o.as_of_date === date);
    let relScore = 0;
    if (inrIdx > 0) {
      const inrChange = ((usdInr[inrIdx].value - usdInr[inrIdx - 1].value) / usdInr[inrIdx - 1].value) * 100;
      const emChange = emAvgDailyChangeMap.get(date) || 0;
      relScore = Math.max(0, Math.min(30, (inrChange - emChange) * 20));
    }

    return { metric_id: 'COMPOSITE_PRESSURE_INDEX', as_of_date: date, value: Math.min(100, flowScore + volScore + relScore) };
  });

  // 4. Process EM Relative Pressure (20-day smoothed)
  const relData: MetricObservation[] = usdInr.map((point, idx) => {
    if (idx < 20) return null;
    const date = point.as_of_date;
    const inr20dChange = ((point.value - usdInr[idx - 20].value) / usdInr[idx - 20].value) * 100;

    let emSum = 0, emCount = 0;
    emPeerIds.forEach(id => {
      const s = seriesMap[id];
      const si = s.findIndex(o => o.as_of_date === date);
      const pi = s.findIndex(o => o.as_of_date === usdInr[idx - 20].as_of_date);
      if (si >= 0 && pi >= 0) {
        emSum += ((s[si].value - s[pi].value) / s[pi].value) * 100;
        emCount++;
      }
    });

    return {
      metric_id: 'EM_RELATIVE_PRESSURE',
      as_of_date: date,
      value: inr20dChange - (emCount > 0 ? emSum / emCount : 0)
    };
  }).filter((x): x is MetricObservation => x !== null);

  // 5. Batch Upsert
  const allToUpsert = [...compositeData, ...relData];
  const batchSize = 100;
  for (let i = 0; i < allToUpsert.length; i += batchSize) {
    const { error } = await supabase.from('metric_observations').upsert(allToUpsert.slice(i, i + batchSize));
    if (error) console.error(`Batch failed: ${error.message}`);
    else console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allToUpsert.length/batchSize)}`);
  }

  console.log('✅ Backfill complete!');
}

backfillAll().catch(e => { console.error(e); Deno.exit(1); });
