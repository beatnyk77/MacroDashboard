/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

const CLI_SERIES = [
  { id: 'OECD_CLI_US', fred_id: 'USALOLITONOSTSAM', name: 'United States' },
  { id: 'OECD_CLI_EA', fred_id: 'EA19LOLITONOSTSAM', name: 'Euro Area' },
  { id: 'OECD_CLI_CN', fred_id: 'CHNLOLITONOSTSAM', name: 'China' },
  { id: 'OECD_CLI_IN', fred_id: 'INDLOLITONOSTSAM', name: 'India' },
] as const;

async function fetchFredLatest(seriesId: string, apiKey: string): Promise<{ date: string; value: number } | null> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=6`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { observations?: Array<{ date: string; value: string }> };
  for (const obs of data.observations ?? []) {
    const val = parseFloat(obs.value);
    if (!isNaN(val)) return { date: obs.date, value: val };
  }
  return null;
}

async function ingestOecdCli(supabase: any, fredApiKey: string): Promise<number> {
  const results: Array<{ metric_id: string; as_of_date: string; value: number; last_updated_at: string }> = [];
  for (const region of CLI_SERIES) {
    const latest = await fetchFredLatest(region.fred_id, fredApiKey);
    if (latest) {
      results.push({
        metric_id: region.id,
        as_of_date: latest.date,
        value: latest.value,
        last_updated_at: new Date().toISOString(),
      });
    }
  }

  if (results.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(results, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return results.length;
}

serveIngest('ingest-global-macro', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';

  const url = new URL(req.url);
  const feed = (url.searchParams.get('feed') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if ((feed === 'oecd' || feed === 'all') && fredApiKey) {
    totalUpserted += await ingestOecdCli(supabase, fredApiKey);
    processed.push('oecd_cli');
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { feed, processed },
  };
});
