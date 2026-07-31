/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  taskName: string
): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${taskName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      const response = await fetch(url, options);
      if (response.ok) return response;

      const errorText = await response.text();
      if (response.status === 400 || response.status === 403 || response.status === 401) {
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

interface IngestFredOptions {
  /** When set, only ingest these metric IDs (must have metadata.fred_id). */
  metricIds?: string[];
  /** FRED observations per series. Default 100; use 2000 for invoicing FX backfill. */
  limit?: number;
}

// ─── Core ingest logic ────────────────────────────────────────────────────────
/** Exported for unit tests. */
export async function doIngestFred(
  supabase: any,
  fredApiKey: string,
  options: IngestFredOptions = {},
): Promise<IngestResult> {
    const startTime = Date.now();
    // 25 minute budget — stays under the 28 minute global safety timeout in serveIngest.
    const runtimeBudget = 25 * 60 * 1000;

    // 1. Resolve FRED source_id
    const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'FRED').single();
    if (!source) throw new Error('FRED source not found');

    // 2. Prioritize stale metrics (oldest updated_at first)
    const { data: metrics } = await supabase
      .from('metrics')
      .select('id, metadata, updated_at')
      .eq('source_id', source.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: true, nullsFirst: true });

    const fredLimit = Math.min(Math.max(options.limit ?? 100, 1), 2000);
    const metricIdFilter = options.metricIds?.length ? new Set(options.metricIds) : null;

    let targetMetrics = metrics?.filter((m: any) =>
      (m.metadata as any)?.fred_id || m.id === 'COPPER_GOLD_RATIO' || m.id === 'CNY_INR_RATE'
    ) || [];
    if (metricIdFilter) {
      targetMetrics = targetMetrics.filter((m: any) => metricIdFilter.has(m.id));
    }

    let successCount = 0;
    let totalRows = 0;
    const processedMetrics: string[] = [];
    const errors: { metric: string; error: string | undefined }[] = [];
    const batchSize = 10;
    const rawPayloads: any[] = [];

    for (let i = 0; i < targetMetrics.length; i += batchSize) {
      if (Date.now() - startTime > runtimeBudget) {
        console.log(`Runtime budget (${runtimeBudget / 60000}min) exceeded at batch ${i / batchSize}, stopping early`);
        break;
      }

      const batch = targetMetrics.slice(i, i + batchSize);
      const resultsArray = await Promise.all(batch.map(async (metric: any) => {
        const fredId = (metric.metadata as any).fred_id;

        // --- Special Case: SOFR-OIS Spread Proxy ---
        if (metric.id === 'SOFR_OIS_SPREAD') {
          try {
            const [sofrRes, effrRes] = await Promise.all([
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=SOFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'SOFR Fetch'),
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'EFFR Fetch')
            ]);

            const sofrData = await sofrRes.json() as any;
            const effrData = await effrRes.json() as any;

            rawPayloads.push({ metricId: 'SOFR', data: sofrData });
            rawPayloads.push({ metricId: 'EFFR', data: effrData });

            const sofrObs = sofrData.observations || [];
            const effrObs = effrData.observations || [];
            const effrMap = new Map(effrObs.map((o: any) => [o.date, parseFloat(o.value)]));

            const spreadObservations = sofrObs
              .map((s: any) => {
                const sofrVal = parseFloat(s.value);
                const effrVal = effrMap.get(s.date);
                if (isNaN(sofrVal) || effrVal === undefined || isNaN(effrVal as number)) return null;
                return {
                  metric_id: 'SOFR_OIS_SPREAD',
                  as_of_date: s.date,
                  value: Math.round((sofrVal - (effrVal as number)) * 100), // Convert to bps
                  last_updated_at: new Date().toISOString(),
                  provenance: 'api_live'
                };
              })
              .filter((o: any) => o !== null);

            if (spreadObservations.length > 0) {
              const { error: upsertError } = await supabase.from('metric_observations').upsert(spreadObservations, { onConflict: 'metric_id, as_of_date' });
              if (upsertError) throw upsertError;
              await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', 'SOFR_OIS_SPREAD');
              return { metricId: 'SOFR_OIS_SPREAD', count: spreadObservations.length, success: true };
            }
            return { metricId: 'SOFR_OIS_SPREAD', count: 0, success: true };
          } catch (err: any) {
            return { metricId: 'SOFR_OIS_SPREAD', count: 0, success: false, error: err.message };
          }
        }

        // --- Special Case: Copper/Gold Ratio ---
        if (metric.id === 'COPPER_GOLD_RATIO') {
          try {
            const numId = (metric.metadata as any).fred_id_numerator; // PCOPPUSDM
            const denId = (metric.metadata as any).fred_id_denominator; // GOLDAMGBD228NLBM
            const [numRes, denRes] = await Promise.all([
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=${numId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'Copper Fetch'),
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=${denId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'Gold Fetch')
            ]);

            const numData = await numRes.json() as any;
            const denData = await denRes.json() as any;

            rawPayloads.push({ metricId: 'COPPER_GOLD_RATIO_NUM', data: numData });
            rawPayloads.push({ metricId: 'COPPER_GOLD_RATIO_DEN', data: denData });

            const numObs = numData.observations || [];
            const denMap = new Map(denData.observations?.map((o: any) => [o.date, parseFloat(o.value)]) || []);

            const ratioObservations = numObs
              .map((n: any) => {
                const numVal = parseFloat(n.value);
                const denVal = denMap.get(n.date);
                if (isNaN(numVal) || denVal === undefined || isNaN(denVal as number) || (denVal as number) === 0) return null;
                return {
                  metric_id: 'COPPER_GOLD_RATIO',
                  as_of_date: n.date,
                  value: numVal / (denVal as number),
                  last_updated_at: new Date().toISOString(),
                  provenance: 'api_live'
                };
              })
              .filter((o: any) => o !== null);

            if (ratioObservations.length > 0) {
              const { error: upsertError } = await supabase.from('metric_observations').upsert(ratioObservations, { onConflict: 'metric_id, as_of_date' });
              if (upsertError) throw upsertError;
              await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', 'COPPER_GOLD_RATIO');
              return { metricId: 'COPPER_GOLD_RATIO', count: ratioObservations.length, success: true };
            }
            return { metricId: 'COPPER_GOLD_RATIO', count: 0, success: false, error: 'No overlapping copper/gold observations' };
          } catch (err: any) {
            return { metricId: 'COPPER_GOLD_RATIO', count: 0, success: false, error: err.message };
          }
        }

        // --- Special Case: CNY/INR derived cross-rate (no direct FRED series) ---
        if (metric.id === 'CNY_INR_RATE') {
          try {
            const { data: usdInr } = await supabase
              .from('metric_observations')
              .select('as_of_date, value')
              .eq('metric_id', 'USD_INR_RATE')
              .order('as_of_date', { ascending: false })
              .limit(100);
            const { data: usdCny } = await supabase
              .from('metric_observations')
              .select('as_of_date, value')
              .eq('metric_id', 'USD_CNY_RATE')
              .order('as_of_date', { ascending: false })
              .limit(100);

            const cnyMap = new Map((usdCny || []).map((o: any) => [o.as_of_date, Number(o.value)]));
            const crossObservations = (usdInr || [])
              .map((inr: any) => {
                const inrVal = Number(inr.value);
                const cnyVal = cnyMap.get(inr.as_of_date);
                if (isNaN(inrVal) || cnyVal === undefined || isNaN(cnyVal) || cnyVal === 0) return null;
                return {
                  metric_id: 'CNY_INR_RATE',
                  as_of_date: inr.as_of_date,
                  value: inrVal / cnyVal,
                  last_updated_at: new Date().toISOString(),
                  provenance: 'api_live'
                };
              })
              .filter((o: any) => o !== null);

            if (crossObservations.length > 0) {
              const { error: upsertError } = await supabase.from('metric_observations').upsert(crossObservations, { onConflict: 'metric_id, as_of_date' });
              if (upsertError) throw upsertError;
              await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', 'CNY_INR_RATE');
              return { metricId: 'CNY_INR_RATE', count: crossObservations.length, success: true };
            }
            return { metricId: 'CNY_INR_RATE', count: 0, success: false, error: 'No overlapping USD/INR and USD/CNY dates' };
          } catch (err: any) {
            return { metricId: 'CNY_INR_RATE', count: 0, success: false, error: err.message };
          }
        }

        const fredUnits = (metric.metadata as any)?.fred_units;
        const unitsParam = fredUnits ? `&units=${fredUnits}` : '';
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=${fredLimit}${unitsParam}`;

        try {
          const response = await withTimeout(fetchWithRetry(url), 10000, `FRED Fetch ${fredId}`);
          const data = await response.json() as any;

          rawPayloads.push({ metricId: metric.id, data });

          if (!data.observations) return { metricId: metric.id, count: 0, success: false, error: 'No observations' };

          const observations = data.observations
            .map((obs: any) => ({
              metric_id: metric.id,
              as_of_date: obs.date,
              value: parseFloat(obs.value),
              last_updated_at: new Date().toISOString(),
              provenance: 'api_live'
            }))
            .filter((obs: any) => !isNaN(obs.value));

          if (observations.length > 0) {
            const { error: upsertError } = await supabase.from('metric_observations').upsert(observations, { onConflict: 'metric_id, as_of_date' });
            if (upsertError) throw upsertError;
            await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
            return { metricId: metric.id, count: observations.length, success: true };
          }
          // Do NOT bump updated_at here — a 0-observation response usually means
          // the upstream series ID is dead/discontinued or temporarily empty.
          // Bumping updated_at would make it look freshly-checked and would push
          // it to the back of the "prioritize stalest first" queue, hiding the
          // problem indefinitely. Surface it as a soft failure instead.
          return { metricId: metric.id, count: 0, success: false, error: 'FRED returned zero observations' };
        } catch (err: any) {
          // Do NOT bump metrics.updated_at on fetch failure — that would mark
          // stale series as fresh (freshness-on-failure anti-pattern).
          return { metricId: metric.id, count: 0, success: false, error: err.message };
        }
      }));

      for (const res of resultsArray) {
        if (res.success) {
          successCount++;
          processedMetrics.push(res.metricId);
          totalRows += res.count;
        } else {
          errors.push({ metric: res.metricId, error: res.error });
        }
      }
    }

    return {
      ok: true,
      counts: { upserted: totalRows, skipped: errors.length },
      meta: {
        raw_payload: rawPayloads,
        attempted: targetMetrics.length,
        successful: successCount,
        processed: processedMetrics,
        errors: errors.slice(0, 5),
        error_count: errors.length
      }
    };
}

serveIngest('ingest-fred', async (req: Request): Promise<IngestResult> => {
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  let options: IngestFredOptions = {};
  try {
    const body = await req.json() as { metric_ids?: string[]; limit?: number };
    if (body?.metric_ids?.length) options.metricIds = body.metric_ids;
    if (typeof body?.limit === 'number' && body.limit > 0) options.limit = body.limit;
  } catch {
    // Empty body — default scheduled ingest behaviour
  }

  return doIngestFred(supabase, fredApiKey, options);
}, { timeoutMs: 25 * 60 * 1000, retries: 3 });
