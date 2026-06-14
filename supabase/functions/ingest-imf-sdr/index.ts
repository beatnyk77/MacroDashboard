/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

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

serveIngest('ingest-imf-sdr', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const fredApiKey = Deno.env.get('FRED_API_KEY');
    if (!fredApiKey) throw new Error('FRED_API_KEY environment variable is required');

    const metricsMap = [
        { id: 'IMF_SDR_TOTAL_BILLIONS', fredId: 'SDR' }
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

    return {
        ok: true,
        counts: { upserted: results.length, skipped: 0 },
        meta: { metrics: metricsMap.map(m => m.id) },
    };
})
