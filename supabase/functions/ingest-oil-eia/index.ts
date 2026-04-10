import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
    } catch { 
        // Silently ignore log update failures
    }
}

const EIA_API_BASE = "https://api.eia.gov/v2";

// --- MAIN FUNCTION ---
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logId = await logIngestionStart(supabase, 'ingest-oil-eia');

    try {
        const eiaApiKey = Deno.env.get('EIA_API_KEY');
        if (!eiaApiKey) throw new Error("Missing EIA_API_KEY");

        const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'EIA').single();
        const sourceId = source?.id;
        if (!sourceId) throw new Error("EIA Data Source not found");

        const summary: any = { capacity: 0, imports: 0, spr: 0, utilization: 0, prices: 0 };

        // --- A. Refining Capacity ---
        console.log('Fetching Refining Capacity...');
        const capacityUrl = `${EIA_API_BASE}/petroleum/pnp/cap1/data/?api_key=${eiaApiKey}&frequency=annual&data[0]=value&facets[duoarea][]=NUS&facets[process][]=MCR&sort[0][column]=period&sort[0][direction]=desc&length=50`;
        try {
            const res = await withTimeout(fetch(capacityUrl), 15000, 'EIA Capacity Fetch');
            if (res.ok) {
                const json: any = await res.json();
                console.log('Capacity Sample:', JSON.stringify(json.response?.data?.[0]));
                const rows = (json.response.data || []).map((d: any) => ({
                    country_code: 'US',
                    country_name: 'United States',
                    as_of_date: `${d.period}-01-01`,
                    capacity_kbpd: Number(d.value),
                    last_updated_at: new Date().toISOString()
                })).filter((r: any) => !isNaN(r.capacity_kbpd));
                if (rows.length > 0) {
                    await supabase.from('oil_refining_capacity').upsert(rows, { onConflict: 'country_code, as_of_date' });
                    summary.capacity = rows.length;
                }
            }
        } catch (e: any) { console.error('Capacity Error:', e.message); }

        // --- B. Oil Imports by Origin (India) ---
        console.log('Fetching India Oil Imports...');
        const importUrl = `${EIA_API_BASE}/petroleum/pnp/cap1/data/?api_key=${eiaApiKey}&frequency=annual&data[0]=value&facets[duoarea][]=IND&sort[0][column]=period&sort[0][direction]=desc&length=50`;
        try {
            const res = await withTimeout(fetch(importUrl), 15000, 'EIA Imports Fetch');
            if (res.ok) {
                const json: any = await res.json();
                const rows = (json.response.data || []).map((d: any) => ({
                    importer_country_code: 'IN',
                    exporter_country_name: d['duoarea-name'] || 'Unknown',
                    as_of_date: `${d.period}-01-01`,
                    import_volume_mbbl: Number(d.value),
                    last_updated_at: new Date().toISOString()
                })).filter((r: any) => !isNaN(r.import_volume_mbbl) && r.import_volume_mbbl > 0);
                if (rows.length > 0) {
                    await supabase.from('oil_imports_by_origin').upsert(rows, { onConflict: 'importer_country_code, exporter_country_name, as_of_date' });
                    summary.imports = rows.length;
                }
            }
        } catch (e: any) { console.error('Imports Error:', e.message); }

        // --- C. SPR Levels ---
        console.log('Fetching SPR Levels...');
        const sprUrl = `${EIA_API_BASE}/petroleum/stoc/spr/data/?api_key=${eiaApiKey}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=480`;
        try {
            const res = await withTimeout(fetch(sprUrl), 15000, 'EIA SPR Fetch');
            if (res.ok) {
                const json: any = await res.json();
                const obs = (json.response.data || []).map((d: any) => ({
                    metric_id: 'OIL_SPR_LEVEL_US',
                    as_of_date: d.period,
                    value: Number(d.value),
                    last_updated_at: new Date().toISOString()
                })).filter((r: any) => !isNaN(r.value));
                if (obs.length > 0) {
                    await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
                    summary.spr = obs.length;
                }
            }
        } catch (e: any) { console.error('SPR Error:', e.message); }

        // --- D. Utilization ---
        console.log('Fetching Utilization...');
        const utilUrl = `${EIA_API_BASE}/petroleum/pnp/unc/data/?api_key=${eiaApiKey}&frequency=monthly&data[0]=value&facets[duoarea][]=NUS&facets[process][]=RPU&sort[0][column]=period&sort[0][direction]=desc&length=240`;
        try {
            const res = await withTimeout(fetch(utilUrl), 15000, 'EIA Util Fetch');
            if (res.ok) {
                const json: any = await res.json();
                const obs = (json.response.data || []).map((d: any) => ({
                    metric_id: 'OIL_REFINERY_UTILIZATION_US',
                    as_of_date: `${d.period}-01`,
                    value: Number(d.value),
                    last_updated_at: new Date().toISOString()
                })).filter((r: any) => !isNaN(r.value));
                if (obs.length > 0) {
                    await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
                    summary.utilization = obs.length;
                }
            }
        } catch (e: any) { console.error('Utilization Error:', e.message); }

        // --- E. Market Prices (Brent) ---
        console.log('Fetching Brent Prices...');
        // Correcting Brent URL - EIA V2 Series Data
        const brentUrl = `https://api.eia.gov/v2/seriesid/PET.RBRTE.D/data?api_key=${eiaApiKey}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=60`;
        try {
            const res = await withTimeout(fetch(brentUrl), 15000, 'EIA Brent Fetch');
            if (res.ok) {
                const json: any = await res.json();
                console.log('Brent Sample:', JSON.stringify(json.response?.data?.[0]));
                const obs = (json.response.data || []).map((d: any) => ({
                    metric_id: 'OIL_BRENT_PRICE_USD',
                    as_of_date: d.period,
                    value: Number(d.value),
                    last_updated_at: new Date().toISOString()
                })).filter((r: any) => !isNaN(r.value));
                if (obs.length > 0) {
                    await supabase.from('metric_observations').upsert(obs, { onConflict: 'metric_id, as_of_date' });
                    summary.prices = obs.length;
                }
            }
        } catch (e: any) { console.error('Brent Error:', e.message); }

        await logIngestionEnd(supabase, logId, 'success', { metadata: summary });
        return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Oil EIA Function Error:', error.message);
        if (logId) await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
        return new Response(JSON.stringify({ error: error.message }), { headers:corsHeaders, status: 500 });
    }
});
