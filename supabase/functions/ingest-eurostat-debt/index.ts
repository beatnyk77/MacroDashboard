import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function logIngestionStart(supabase: SupabaseClient, functionName: string): Promise<number | null> {
    try {
        const { data, error } = await supabase
            .from('ingestion_logs')
            .insert({
                function_name: functionName,
                status: 'started',
                metadata: {},
                start_time: new Date().toISOString()
            })
            .select('id')
            .single();
        if (error) return null;
        return data.id;
    } catch {
        return null;
    }
}

async function logIngestionEnd(supabase: SupabaseClient, logId: number | null, status: string, details: any = {}) {
    if (!logId) return;
    try {
        await supabase
            .from('ingestion_logs')
            .update({
                completed_at: new Date().toISOString(),
                status,
                ...details
            })
            .eq('id', logId);
    } catch { 
        // Silently ignore log update failures
    }
}

async function fetchWithRetry(url: string, maxRetries: number = 2): Promise<Response> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            if (attempt < maxRetries) {
                const delay = attempt * 2000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error: any) {
            if (attempt === maxRetries) throw error;
            console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`);
        }
    }
    throw new Error('Max retries exceeded');
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logId = await logIngestionStart(supabase, 'ingest-eurostat-debt');

    try {
        // Eurostat API v1.0 - Government Finance Statistics (GOV)
        // Query: Euro area (EA20) government debt as % of GDP (unit=PC_GDP, debt=GD, currency=EUR)
        const baseUrl = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/GOV';
        const params = new URLSearchParams({
            geo: 'EA20', // Euro area 20 countries
            unit: 'PC_GDP',
            currency: 'EUR',
            debt: 'GD', // Gross debt
            time: '2000:2025', // Full historical range
        });
        const url = `${baseUrl}?${params.toString()}`;

        console.log('Fetching Eurostat debt-to-GDP data for Euro Area...');
        const response = await fetchWithRetry(url, 3);
        if (!response.ok) {
            throw new Error(`Eurostat API returned ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Parse Eurostat JSON format
        // The structure includes dimension labels and observations by time position
        const observations = data.data;
        const timeLabels = data.dimension.TIME.category.label;
        const observationsArray: { time: string; value: number }[] = [];

        for (const [timePos, value] of Object.entries(observations)) {
            if (value !== null && value !== '' && value !== undefined) {
                const year = timeLabels[timePos];
                observationsArray.push({
                    time: year,
                    value: parseFloat(value)
                });
            }
        }

        // Sort by time ascending
        observationsArray.sort((a, b) => a.time.localeCompare(b.time));

        // Upsert to metric_observations
        const rows = observationsArray.map(obs => ({
            metric_id: 'EU_DEBT_GDP_PCT',
            as_of_date: `${obs.time}-12-31`, // Annual data, use year-end
            value: obs.value,
            last_updated_at: new Date().toISOString()
        }));

        if (rows.length > 0) {
            const { error: upsertError } = await supabase
                .from('metric_observations')
                .upsert(rows, { onConflict: 'metric_id, as_of_date' });
            if (upsertError) throw upsertError;
        }

        // Update metrics.updated_at
        await supabase
            .from('metrics')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', 'EU_DEBT_GDP_PCT');

        await logIngestionEnd(supabase, logId, 'success', { rows_inserted: rows.length });
        console.log(`Successfully ingested ${rows.length} observations for EU_DEBT_GDP_PCT`);

        return new Response(JSON.stringify({ count: rows.length, status: 'success' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Eurostat debt ingestion failed:', error);
        await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
