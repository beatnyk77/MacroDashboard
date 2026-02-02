import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

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

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const fredApiKey = Deno.env.get('FRED_API_KEY');

        if (!fredApiKey) throw new Error('FRED_API_KEY environment variable is required');

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Metrics to fetch from FRED
        const metricsMap = [
            { id: 'ECB_TOTAL_ASSETS_MEUR', fredId: 'ECBTA' },
            { id: 'ECB_MRO_OUTSTANDING_MEUR', fredId: 'ECBMROW' },
            { id: 'ECB_DF_OUTSTANDING_MEUR', fredId: 'ECBDFW' }
        ];

        const results: any[] = [];
        const observationsByDate: Record<string, any> = {};

        for (const item of metricsMap) {
            const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${item.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=100`;

            const response = await fetchWithRetry(fredUrl);
            const data = await response.json();

            if (data.observations) {
                data.observations.forEach((obs: any) => {
                    if (!observationsByDate[obs.date]) observationsByDate[obs.date] = {};
                    observationsByDate[obs.date][item.id] = parseFloat(obs.value);

                    results.push({
                        metric_id: item.id,
                        as_of_date: obs.date,
                        value: parseFloat(obs.value),
                        last_updated_at: new Date().toISOString()
                    });
                });
            }
        }

        // Compute Excess Liquidity Proxy if possible
        // Formula: Total Assets - MRO - DF (Simplified proxy since CA is often unavailable on FRED)
        // Note: User prompt suggested Excess Liquidity as a proxy.
        Object.keys(observationsByDate).forEach(date => {
            const obs = observationsByDate[date];
            if (obs.ECB_TOTAL_ASSETS_MEUR && obs.ECB_MRO_OUTSTANDING_MEUR && obs.ECB_DF_OUTSTANDING_MEUR) {
                const excessLiquidity = obs.ECB_TOTAL_ASSETS_MEUR - obs.ECB_MRO_OUTSTANDING_MEUR - obs.ECB_DF_OUTSTANDING_MEUR;
                results.push({
                    metric_id: 'ECB_EXCESS_LIQUIDITY_MEUR',
                    as_of_date: date,
                    value: excessLiquidity,
                    last_updated_at: new Date().toISOString()
                });
            }
        });

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        return new Response(JSON.stringify({
            status: 'success',
            processed: results.length,
            metrics: metricsMap.map(m => m.id).concat(['ECB_EXCESS_LIQUIDITY_MEUR'])
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('ECB Ingestion error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
