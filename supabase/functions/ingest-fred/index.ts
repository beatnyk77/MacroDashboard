import { createClient } from '@supabase/supabase-js'
import { sendSlackAlert } from '../_shared/slack.ts'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'
import { withTimeout } from '../_shared/timeout-guard.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retry ${i}/${maxRetries} for ${url}...`);
      }
      const response = await fetch(url, options);
      if (response.ok) return response;

      const errorText = await response.text();
      if (response.status === 400) {
        throw new Error(`HTTP 400: Bad Request (Likely invalid Series ID or Parameters). FRED says: ${errorText}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);
    }
  }
  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Start logging
  const logId = await logIngestionStart(supabase, 'ingest-fred');

  try {
    const fredApiKey = Deno.env.get('FRED_API_KEY');

    if (!fredApiKey) throw new Error('FRED_API_KEY environment variable is required');

    // 1. Resolve FRED source_id
    const { data: source, error: sourceError } = await supabase
      .from('data_sources')
      .select('id')
      .eq('name', 'FRED')
      .single();

    if (sourceError || !source) throw new Error('FRED data source not found');
    const sourceId = source.id;

    // 2. Identify target metrics from FRED
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics')
      .select('id, metadata')
      .eq('source_id', sourceId)
      .eq('is_active', true);

    if (metricsError) throw metricsError;
    if (!metrics || metrics.length === 0) {
      const msg = 'No active FRED metrics';
      await logIngestionEnd(supabase, logId, 'success', { metadata: { message: msg } });
      return new Response(JSON.stringify({ message: msg }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Identify target metrics from FRED (anything with fred_id in metadata)
    const targetMetrics = metrics.filter((m: any) => (m.metadata as any)?.fred_id);

    const summary: any = {
      total_attempted: targetMetrics.length,
      success_count: 0,
      error_count: 0,
      details: []
    };

    let totalInserted = 0;

    for (const metric of targetMetrics) {
      const fredId = (metric.metadata as any).fred_id;

      try {
        // Use timeout guard for per-metric processing (45 seconds)
        await withTimeout((async () => {
          // A. Get latest date in DB to skip if current
          const { data: latestObs } = await supabase
            .from('metric_observations')
            .select('as_of_date')
            .eq('metric_id', metric.id)
            .order('as_of_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const lastDate = latestObs?.as_of_date;
          console.log(`[FRED] ${fredId}: Last DB date = ${lastDate || 'none'}`);

          // B. Fetch from FRED (high limit to ensure 25-year backfill for Z-scores)
          const fredUnits = (metric.metadata as any)?.fred_units;
          const unitsParam = fredUnits ? `&units=${fredUnits}` : '';
          const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=500${unitsParam}`;

          const response = await fetchWithRetry(fredUrl);
          const data = await response.json();

          if (!data.observations || !Array.isArray(data.observations)) {
            throw new Error(`Invalid response from FRED for ${fredId}`);
          }

          console.log(`[FRED] ${fredId}: Received ${data.observations.length} observations from API`);

          // C. Normalize and filter
          const observations = data.observations
            .map((obs: any) => ({
              metric_id: metric.id,
              as_of_date: obs.date,
              value: parseFloat(obs.value),
              last_updated_at: new Date().toISOString()
            }))
            .filter((obs: any) => {
              const isValid = !isNaN(obs.value);
              if (!isValid) console.log(`[FRED] ${fredId}: Skipping invalid value for ${obs.as_of_date}`);
              return isValid;
            });

          if (observations.length === 0) {
            console.log(`[FRED] ${fredId}: Already up to date, skipping upsert`);
            summary.details.push({ metric: metric.id, status: 'skipped', message: 'Already up to date' });
            return;
          }

          // D. Idempotent UPSERT
          const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert(observations, { onConflict: 'metric_id, as_of_date' });

          if (upsertError) throw upsertError;

          totalInserted += observations.length;
          summary.success_count++;
          summary.details.push({
            metric: metric.id,
            fred_id: fredId,
            status: 'success',
            inserted: observations.length
          });
        })(), 45000, `FRED Ingestion for ${fredId}`);

      } catch (err: any) {
        summary.error_count++;
        summary.details.push({
          metric: metric.id,
          fred_id: fredId,
          status: 'error',
          error: err.message
        });
        console.error(`Error processing ${metric.id} (${fredId}):`, err);
      }
    }

    // Log final results
    await logIngestionEnd(supabase, logId, 'success', {
      rows_inserted: totalInserted,
      metadata: { summary }
    });

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: summary.error_count === summary.total_attempted ? 500 : 200
    });

  } catch (error: any) {
    console.error('Master ingestion error:', error);
    await sendSlackAlert(`GraphiQuestor ingestion failed: ingest-fred - ${error.message}`);

    // Ensure log end is recorded
    try {
      if (logId) {
        await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
      }
    } catch (logErr) {
      console.error('Failed to log ingestion end:', logErr);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

