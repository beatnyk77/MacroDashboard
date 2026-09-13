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
    { id: 'IN_CPI_YOY', fredId: 'CPALTT01INM657N' },
    { id: 'IN_FX_RESERVES', fredId: 'TRESEGINM052N' },
    { id: 'IN_REPO_RATE', fredId: 'IRSTCB01INM156N' },
    { id: 'IN_GDP_GROWTH_YOY', fredId: 'NAEXKP01INA657S' },
    { id: 'IN_IIP_GROWTH_YOY', fredId: 'INDPROINDMISMEI' },
    { id: 'IN_WPI_YOY', fredId: 'WPIATT01INM661N' },
    { id: 'IN_DEBT_GDP_PCT', fredId: 'GGGDTAINA188N' },
  ];
  const now = new Date().toISOString();
  const upserts: any[] = [];

  for (const m of metrics) {
    const obs = await fetchFRED(m.fredId, fredKey, 5);
    for (const o of obs) {
      upserts.push({
        metric_id: m.id,
        as_of_date: o.date,
        value: o.value,
        last_updated_at: now,
        source_ref: `live_api:fred:${m.fredId}`,
        provenance: 'api_live',
        is_provisional: false,
      });
      // Also mirror IIP growth to IN_IIP_YOY for compatibility
      if (m.id === 'IN_IIP_GROWTH_YOY') {
        upserts.push({
          metric_id: 'IN_IIP_YOY',
          as_of_date: o.date,
          value: o.value,
          last_updated_at: now,
          source_ref: `live_api:fred:${m.fredId}`,
          provenance: 'api_live',
          is_provisional: false,
        });
      }
    }
  }

  if (upserts.length > 0) {
    const { error } = await supabase.from('metric_observations').upsert(upserts, { onConflict: 'metric_id, as_of_date' });
    if (error) throw error;
  }
  return upserts.length;
}

async function syncIndiaCreditCycle(supabase: any): Promise<number> {
  const { data: creditRows, error } = await supabase
    .from('india_credit_cycle')
    .select('date, credit_growth_yoy')
    .not('credit_growth_yoy', 'is', null)
    .order('date', { ascending: false })
    .limit(120);

  if (error || !creditRows?.length) return 0;
  const now = new Date().toISOString();
  const upserts = creditRows.map((r: any) => ({
    metric_id: 'IN_BANK_CREDIT_GROWTH_YOY',
    as_of_date: r.date,
    value: Number(r.credit_growth_yoy),
    last_updated_at: now,
    source_ref: 'live_api:rbi:dbie_bsc1',
    provenance: 'api_live',
    is_provisional: false,
  }));

  const { error: upsertError } = await supabase
    .from('metric_observations')
    .upsert(upserts, { onConflict: 'metric_id, as_of_date' });

  if (upsertError) throw upsertError;
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

  if (stream === 'fred' || stream === 'all') {
    if (fredKey) {
      const fredCount = await ingestIndiaFred(supabase, fredKey);
      totalUpserted += fredCount;
      processed.push(`india_fred_metrics (${fredCount} obs)`);
    }
  }

  if (stream === 'credit' || stream === 'all') {
    const creditCount = await syncIndiaCreditCycle(supabase);
    totalUpserted += creditCount;
    processed.push(`india_credit_cycle_sync (${creditCount} obs)`);
  }

  return {
    ok: true,
    counts: { upserted: totalUpserted },
    meta: { stream, processed },
  };
});
