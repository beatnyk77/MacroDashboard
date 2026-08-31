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

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { task, processed },
  };
});
