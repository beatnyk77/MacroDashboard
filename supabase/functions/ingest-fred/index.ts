import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// --- SHARED UTILS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

async function logIngestionStart(
  supabase: SupabaseClient,
  functionName: string,
  metadata: any = {}
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('ingestion_logs')
      .insert({
        function_name: functionName,
        status: 'started',
        metadata: metadata,
        start_time: new Date().toISOString()
      })
      .select('id')
      .single()
    if (error) return null;
    return data.id;
  } catch {
    return null;
  }
}

async function logIngestionEnd(
  supabase: SupabaseClient,
  logId: number | null,
  status: 'success' | 'failed' | 'timeout',
  details: any
) {
  if (!logId) return;
  try {
    await supabase
      .from('ingestion_logs')
      .update({
        completed_at: new Date().toISOString(),
        status: status,
        ...details
      })
      .eq('id', logId);
  } catch { }
}

/**
 * Fetch with exponential backoff retry logic
 */
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

// --- MAIN FUNCTION ---
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();
  const runtimeBudget = 50000; // 50s total budget

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const logId = await logIngestionStart(supabase, 'ingest-fred');

  try {
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

    // 1. Resolve FRED source_id
    const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'FRED').single();
    if (!source) throw new Error('FRED source not found');

    // 2. Prioritize stale metrics
    const { data: metrics } = await supabase
      .from('metrics')
      .select('id, metadata, updated_at')
      .eq('source_id', source.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: true, nullsFirst: true });

    const targetMetrics = metrics?.filter((m: any) => (m.metadata as any)?.fred_id) || [];

    let successCount = 0;
    let totalRows = 0;
    const processedMetrics = [];
    const errors = [];
    const batchSize = 10; // Increased concurrency

    for (let i = 0; i < targetMetrics.length; i += batchSize) {
      if (Date.now() - startTime > runtimeBudget) {
        console.log('Runtime budget exceeded, stopping early');
        break;
      }

      const batch = targetMetrics.slice(i, i + batchSize);
      const resultsArray = await Promise.all(batch.map(async (metric) => {
        const fredId = (metric.metadata as any).fred_id;

        // --- Special Case: SOFR-OIS Spread Proxy ---
        if (metric.id === 'SOFR_OIS_SPREAD') {
          try {
            console.log('Calculating SOFR-OIS Spread Proxy...');
            const [sofrRes, effrRes] = await Promise.all([
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=SOFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'SOFR Fetch'),
              withTimeout(fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`), 10000, 'EFFR Fetch')
            ]);

            const [sofrData, effrData] = await Promise.all([sofrRes.json() as Promise<any>, effrRes.json() as Promise<any>]);
            const sofrObs = sofrData.observations || [];
            const effrObs = effrData.observations || [];

            // Map EFFR by date for quick lookup
            const effrMap = new Map(effrObs.map((o: any) => [o.date, parseFloat(o.value)]));

            const spreadObservations = sofrObs
              .map((s: any) => {
                const sofrVal = parseFloat(s.value);
                const effrVal = effrMap.get(s.date);
                if (isNaN(sofrVal) || effrVal === undefined || isNaN(effrVal)) return null;
                return {
                  metric_id: 'SOFR_OIS_SPREAD',
                  as_of_date: s.date,
                  value: Math.round((sofrVal - effrVal) * 100), // Convert to bps
                  last_updated_at: new Date().toISOString()
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
            console.error(`Error calculating SOFR_OIS_SPREAD: ${err.message}`);
            return { metricId: 'SOFR_OIS_SPREAD', count: 0, success: false, error: err.message };
          }
        }

        const fredUnits = (metric.metadata as any)?.fred_units;
        const unitsParam = fredUnits ? `&units=${fredUnits}` : '';
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100${unitsParam}`;

        try {
          const response = await withTimeout(fetchWithRetry(url), 10000, `FRED Fetch ${fredId}`);
          const data = await response.json() as any;

          if (!data.observations) {
            console.warn(`FRED: No observations array for ${metric.id} (${fredId})`);
            return { metricId: metric.id, count: 0, success: false, error: 'No observations array in response' };
          }

          const rawCount = data.observations.length;
          const observations = data.observations
            .map((obs: any) => ({
              metric_id: metric.id,
              as_of_date: obs.date,
              value: parseFloat(obs.value),
              last_updated_at: new Date().toISOString()
            }))
            .filter((obs: any) => !isNaN(obs.value));

          if (observations.length > 0) {
            const { error: upsertError } = await supabase
              .from('metric_observations')
              .upsert(observations, { onConflict: 'metric_id, as_of_date' });
            if (upsertError) {
              console.error(`FRED: Upsert error for ${metric.id}:`, upsertError);
              throw upsertError;
            }
            await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
            return { metricId: metric.id, count: observations.length, success: true };
          }
          console.warn(`FRED: No valid numeric data for ${metric.id} (Raw count: ${rawCount})`);
          await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
          return { metricId: metric.id, count: 0, success: true, metadata: { rawCount } };
        } catch (err: any) {
          console.error(`Error processing ${metric.id}: ${err.message}`);
          await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);
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

    const stats = {
      attempted: targetMetrics.length,
      successful: successCount,
      rows: totalRows,
      processed: processedMetrics,
      errors: errors.slice(0, 20), // Only log first 20 errors
      error_count: errors.length,
      runtime_ms: Date.now() - startTime
    };

    await logIngestionEnd(supabase, logId, 'success', { rows_inserted: totalRows, metadata: stats });
    return new Response(JSON.stringify(stats), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    if (logId) await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
