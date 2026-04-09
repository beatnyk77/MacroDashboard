import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;
    const defaultOptions = {
        ...options,
        headers: {
            ...options.headers,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
    };
    for (let i = 0; i <= maxRetries; i++) {
        try {
            if (i > 0) {
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            const response = await fetch(url, defaultOptions);
            if (response.ok) return response;
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
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
    const fredApiKey = Deno.env.get('FRED_API_KEY');

    if (!fredApiKey) {
        return new Response(JSON.stringify({ error: 'FRED_API_KEY is missing' }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-ecb-balance-sheet', async (ctx) => {
        // Metrics to fetch from FRED
        const metricsMap = [
            { id: 'ECB_TOTAL_ASSETS_MEUR', fredId: 'ECBASSETSW' },
            { id: 'ECB_DF_OUTSTANDING_MEUR', fredId: 'ECBDFR' }, // Using Rate for now as proxy or check if balance exists
            { id: 'ECB_MRO_OUTSTANDING_MEUR', fredId: 'ECBMRRFR' }, // Using Rate
            // Euro Area Government Debt to GDP (replaces stale TED_SPREAD timeline)
            { id: 'EU_DEBT_GDP_PCT', fredId: 'DEBTGDP', description: 'Euro Area General Government Debt to GDP Ratio (%)' }
        ];

        const results: any[] = [];
        const errors: any[] = [];

        for (const item of metricsMap) {
            try {
                const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;

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
            } catch (e: any) {
                console.error(`Error fetching ${item.id}:`, e);
                errors.push({ metric: item.id, error: e.message });
            }
        }

        // Calculate Excess Liquidity (Assets - Liabilities/Providing Ops? Actually ECB publishes a specific series, but we can approximate)
        // For now, let's just ensure we have the primary ones.

        if (results.length > 0) {
            const { error: upsertError } = await ctx.supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        return {
            rows_inserted: results.length,
            metadata: {
                metrics_processed: metricsMap.map(m => m.id),
                errors
            }
        };
    });
})
