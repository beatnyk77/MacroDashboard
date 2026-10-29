// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';
import { EIA_WEEKLY_SERIES, buildEiaUrl, rowsToObservations, startDate, type EiaRow } from './eiaWeekly.ts';

const PAGE_LENGTH = 5000;
const UPSERT_CHUNK = 500;
/** About 5.8 years of weekly prints; below this the 5-year band is incomplete. */
const MIN_HISTORY_ROWS = 300;

async function fetchSeries(series: (typeof EIA_WEEKLY_SERIES)[number], apiKey: string, start: string): Promise<EiaRow[]> {
  const rows: EiaRow[] = [];
  for (let offset = 0; ; offset += PAGE_LENGTH) {
    const res = await fetch(buildEiaUrl(series, apiKey, start, offset, PAGE_LENGTH), { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`EIA HTTP ${res.status}`);
    const body = (await res.json()) as any;
    const page: EiaRow[] = body?.response?.data ?? [];
    rows.push(...page);
    const total = Number(body?.response?.total ?? page.length);
    if (page.length < PAGE_LENGTH || rows.length >= total) break;
  }
  return rows;
}

serveIngest('ingest-eia-weekly', async (req: Request): Promise<IngestResult> => {
  const apiKey = Deno.env.get('EIA_API_KEY') ?? '';
  if (!apiKey) return { ok: false, error: 'EIA_API_KEY not set' };

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const url = new URL(req.url);
  const only = url.searchParams.get('series');

  // Self-healing history: the 5-year band needs ~6 years of weekly prints, so a short crude-stocks
  // history (first deploy, or a wiped table) triggers a full backfill without anyone invoking it.
  let backfill = url.searchParams.get('backfill') === '1';
  let autoBackfill = false;
  if (!backfill) {
    const { count, error } = await supabase
      .from('metric_observations')
      .select('as_of_date', { count: 'exact', head: true })
      .eq('metric_id', 'EIA_WKLY_CRUDE_STOCKS_KBBL');
    if (!error && (count ?? 0) < MIN_HISTORY_ROWS) {
      backfill = true;
      autoBackfill = true;
    }
  }
  const start = startDate(backfill, new Date());
  const nowIso = new Date().toISOString();

  const counts: Record<string, number> = {};
  const errors: string[] = [];
  let upserted = 0;

  for (const series of EIA_WEEKLY_SERIES) {
    if (only && series.id !== only) continue;
    try {
      const obs = rowsToObservations(series, await fetchSeries(series, apiKey, start), nowIso);
      if (obs.length === 0) {
        errors.push(`${series.id}: EIA returned no usable rows (route ${series.route})`);
        continue;
      }
      for (let i = 0; i < obs.length; i += UPSERT_CHUNK) {
        const { error } = await supabase
          .from('metric_observations')
          .upsert(obs.slice(i, i + UPSERT_CHUNK), { onConflict: 'metric_id, as_of_date' });
        if (error) throw new Error(`upsert ${series.metricId}: ${error.message}`);
      }
      counts[series.metricId] = obs.length;
      upserted += obs.length;
    } catch (err: any) {
      errors.push(`${series.id}: ${err.message}`);
      console.error(`[EiaWeekly] ${series.id} failed: ${err.message}`);
    }
  }

  if (upserted === 0) return { ok: false, error: `No EIA series written: ${errors.join('; ')}` };
  return { ok: true, counts: { upserted, ...counts }, meta: { start, backfill, autoBackfill, errors: errors.length ? errors : undefined } };
});
