import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

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

    for (const metric of targetMetrics) {
      // Check time budget
      if (Date.now() - startTime > runtimeBudget) {
        console.log('Runtime budget exceeded, stopping early');
        break;
      }

      const fredId = (metric.metadata as any).fred_id;
      const fredUnits = (metric.metadata as any)?.fred_units;
      const unitsParam = fredUnits ? `&units=${fredUnits}` : '';
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=500${unitsParam}`;

      try {
        const response = await withTimeout(fetchWithRetry(url), 15000, `FRED Fetch ${fredId}`);
        const data = await response.json();

        const observations = (data.observations || [])
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
          if (upsertError) throw upsertError;

          // Update metric timestamp
          await supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', metric.id);

          totalRows += observations.length;
        }

        successCount++;
        processedMetrics.push(metric.id);
      } catch (err: any) {
        console.error(`Error processing ${metric.id}: ${err.message}`);
      }
    }

    const stats = {
      attempted: targetMetrics.length,
      successful: successCount,
      rows: totalRows,
      processed: processedMetrics,
      runtime_ms: Date.now() - startTime
    };

    await logIngestionEnd(supabase, logId, 'success', { rows_inserted: totalRows, metadata: stats });
    return new Response(JSON.stringify(stats), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    if (logId) await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
