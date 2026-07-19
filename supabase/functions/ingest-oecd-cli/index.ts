/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts';

/**
 * OECD Composite Leading Indicators via FRED (OECD Main Economic Indicators).
 * Amplitude-adjusted, long-term average = 100. CLI > 100 = above-trend growth signal.
 *
 * Series IDs (OECD via FRED):
 *   USALOLITONOSTSAM — United States
 *   EA19LOLITONOSTSAM — Euro Area (19)
 *   CHNLOLITONOSTSAM — China
 *   INDLOLITONOSTSAM — India
 */
const CLI_SERIES = [
  { id: 'OECD_CLI_US', fred_id: 'USALOLITONOSTSAM', name: 'United States' },
  { id: 'OECD_CLI_EA', fred_id: 'EA19LOLITONOSTSAM', name: 'Euro Area' },
  { id: 'OECD_CLI_CN', fred_id: 'CHNLOLITONOSTSAM', name: 'China' },
  { id: 'OECD_CLI_IN', fred_id: 'INDLOLITONOSTSAM', name: 'India' },
] as const;

async function fetchFredLatest(
  seriesId: string,
  apiKey: string,
): Promise<{ date: string; value: number } | null> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations`
    + `?series_id=${seriesId}`
    + `&api_key=${apiKey}`
    + `&file_type=json`
    + `&sort_order=desc`
    + `&limit=6`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FRED ${seriesId}: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json() as { observations?: Array<{ date: string; value: string }> };
  for (const obs of data.observations ?? []) {
    const val = parseFloat(obs.value);
    if (!isNaN(val)) return { date: obs.date, value: val };
  }
  return null;
}

serveIngest('ingest-oecd-cli', async (_req: Request): Promise<IngestResult> => {
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  console.log('Fetching OECD CLI data from FRED...');

  const results: Array<{
    metric_id: string;
    as_of_date: string;
    value: number;
    last_updated_at: string;
  }> = [];
  const errors: Array<{ region: string; error: string }> = [];
  const values: Record<string, number> = {};

  for (const region of CLI_SERIES) {
    try {
      const latest = await fetchFredLatest(region.fred_id, fredApiKey);
      if (!latest) {
        errors.push({ region: region.name, error: 'no numeric observations' });
        continue;
      }
      results.push({
        metric_id: region.id,
        as_of_date: latest.date,
        value: latest.value,
        last_updated_at: new Date().toISOString(),
      });
      values[region.id] = latest.value;
    } catch (err: any) {
      console.error(`CLI fetch failed for ${region.name}:`, err?.message ?? err);
      errors.push({ region: region.name, error: err?.message ?? String(err) });
    }
  }

  // Refuse silent partial success with zero rows — never fabricate CLI values.
  if (results.length === 0) {
    throw new Error(
      `OECD CLI: no live observations (${errors.map((e) => `${e.region}: ${e.error}`).join('; ')})`,
    );
  }

  const { error } = await supabase
    .from('metric_observations')
    .upsert(results, { onConflict: 'metric_id, as_of_date' });
  if (error) throw error;

  for (const region of CLI_SERIES) {
    if (values[region.id] !== undefined) {
      await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', region.id);
    }
  }

  return {
    ok: true,
    counts: { upserted: results.length, failed: errors.length },
    meta: {
      values,
      errors: errors.length > 0 ? errors : undefined,
      source: 'FRED/OECD MEI',
    },
  };
});
