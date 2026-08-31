/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

interface IMFResponse {
  values: {
    [indicator: string]: {
      [entity: string]: Record<string, string | number>;
    };
  };
}

async function upsertMetric(supabase: any, metricId: string, data: Record<string, number>): Promise<number> {
  const observations = Object.entries(data).map(([date, value]) => ({
    metric_id: metricId,
    as_of_date: date,
    value: value,
    last_updated_at: new Date().toISOString(),
  }));

  if (observations.length === 0) return 0;

  const { error } = await supabase
    .from('metric_observations')
    .upsert(observations, { onConflict: 'metric_id, as_of_date' });

  if (error) throw error;
  await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metricId);
  return observations.length;
}

async function ingestIMFGeneral(supabase: any): Promise<number> {
  const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'IMF').single();
  if (!source) return 0;

  const { data: metrics } = await supabase
    .from('metrics')
    .select('id, metadata')
    .eq('source_id', source.id)
    .eq('is_active', true);

  if (!metrics || metrics.length === 0) return 0;

  let total = 0;
  for (const metric of metrics) {
    const meta = metric.metadata as any;
    const indicator = meta?.imf_indicator;
    const group = meta?.imf_group || 'FAD_G20';
    if (!indicator) continue;

    try {
      const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}/${group}`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data: IMFResponse = await response.json();
      const values = data?.values?.[indicator]?.[group];
      if (!values) continue;

      const recentYears = Object.keys(values).filter((y) => parseInt(y) >= 2020);
      const observationsObj: Record<string, number> = {};
      for (const year of recentYears) {
        let val = values[year];
        if (typeof val === 'string') val = parseFloat(val);
        if (!isNaN(val)) {
          observationsObj[`${year}-12-31`] = val;
        }
      }
      total += await upsertMetric(supabase, metric.id, observationsObj);
    } catch (err: any) {
      console.error(`[IMF-Macro] Error processing ${metric.id}:`, err.message);
    }
  }
  return total;
}

async function ingestSDR(supabase: any, fredApiKey: string): Promise<number> {
  if (!fredApiKey) return 0;
  const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=SDR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=50`;
  const response = await fetch(fredUrl);
  if (!response.ok) return 0;
  const data = await response.json();
  const results: any[] = [];
  if (data.observations) {
    data.observations.forEach((obs: any) => {
      const value = parseFloat(obs.value);
      if (!isNaN(value)) {
        results.push({
          metric_id: 'IMF_SDR_TOTAL_BILLIONS',
          as_of_date: obs.date,
          value: value,
          last_updated_at: new Date().toISOString(),
        });
      }
    });
  }
  if (results.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(results, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return results.length;
}

serveIngest('ingest-imf-macro', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';

  const url = new URL(req.url);
  const dataset = (url.searchParams.get('dataset') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if (dataset === 'general' || dataset === 'all') {
    totalUpserted += await ingestIMFGeneral(supabase);
    processed.push('general');
  }
  if (dataset === 'sdr' || dataset === 'all') {
    totalUpserted += await ingestSDR(supabase, fredApiKey);
    processed.push('sdr');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { dataset, processed },
  };
});
