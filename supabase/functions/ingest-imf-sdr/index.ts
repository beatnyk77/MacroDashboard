/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const logId = await logIngestionStart(supabase, 'ingest-imf-sdr');

    try {
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        if (!fredApiKey) throw new Error('FRED_API_KEY environment variable is required');

        // IMF SDR Allocations can be fetched from FRED (series: SDR)
        // Or specific SDR rates. For balance sheet purposes, we usually look at Total SDRs.
        const metricsMap = [
            { id: 'IMF_SDR_TOTAL_BILLIONS', fredId: 'SDR' } // SDR Allocations in Billions
        ];

        const results: any[] = [];

        for (const item of metricsMap) {
            const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=50`;

            const response = await fetchWithRetry(fredUrl);
            const data = await response.json();

            if (data.observations) {
                data.observations.forEach((obs: any) => {
                    const value = parseFloat(obs.value);
                    if (!isNaN(value)) {
                        results.push({
                            metric_id: item.id,
                            as_of_date: obs.date,
                            value: value,
                            last_updated_at: new Date().toISOString()
                        });
                    }
                });
            }
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            status: 'success',
            processed: results.length,
            metrics: metricsMap.map(m => m.id)
        };

        // Log success
        await logIngestionEnd(supabase, logId, 'success', {
            rows_inserted: results.length,
            metadata: { summary }
        });

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('IMF SDR Ingestion error:', error);

        // Log failure
        await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
