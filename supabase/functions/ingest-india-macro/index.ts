// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

async function fetchFRED(seriesId: string, fredKey: string, limit = 5): Promise<Array<{ date: string; value: number }>> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    return (data.observations ?? [])
      .filter((o: any) => o.value !== '.' && !isNaN(parseFloat(o.value)))
      .map((o: any) => ({ date: o.date, value: parseFloat(o.value) }));
  } catch {
    return [];
  }
}

async function ingestIndiaFred(supabase: any, fredKey: string): Promise<number> {
  const metrics = [
    { id: 'INDIA_CPI_YOY', fredId: 'INDCPIALLMINMEI' },
    { id: 'INDIA_FX_RESERVES', fredId: 'TRESEGINM052N' },
    { id: 'INDIA_POLICY_REPO_RATE', fredId: 'IRSTCB01INM156N' },
  ];
  const now = new Date().toISOString();
  const upserts: any[] = [];

  for (const m of metrics) {
    const obs = await fetchFRED(m.fredId, fredKey, 3);
    for (const o of obs) {
      upserts.push({
        metric_id: m.id,
        as_of_date: o.date,
        value: o.value,
        last_updated_at: now,
        source_ref: 'live_api:fred',
      });
    }
  }

  if (upserts.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(upserts, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return upserts.length;
}

serveIngest('ingest-india-macro', async (req: Request): Promise<IngestResult> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const fredKey = Deno.env.get('FRED_API_KEY') ?? '';

  const url = new URL(req.url);
  const stream = (url.searchParams.get('stream') ?? 'all').toLowerCase();

  let totalUpserted = 0;
  const processed: string[] = [];

  if (stream === 'inflation' || stream === 'all') {
    if (fredKey) {
      totalUpserted += await ingestIndiaFred(supabase, fredKey);
      processed.push('india_fred_metrics');
    }
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { stream, processed },
  };
});
