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

        const summary: any = { capacity: 0, imports: 0, spr: 0, utilization: 0 };

        // --- A. Refining Capacity ---
        console.log('Fetching Refining Capacity...');
        const capacityUrl = `${EIA_API_BASE}/petroleum/pnp/cap1/data/?api_key=${eiaApiKey}&frequency=annual&data[0]=value&facets[duoarea][]=NUS&facets[process][]=MCR&sort[0][column]=period&sort[0][direction]=desc&length=5`;
        try {
            const res = await withTimeout(fetch(capacityUrl), 15000, 'EIA Capacity Fetch');
            if (res.ok) {
                const json = await res.json();
                const rows = (json.response.data || []).map((d: any) => ({
                    country_code: 'US',
                    country_name: 'United States',
                    capacity_mbpd: Number(d.value) / 1000,
                    as_of_year: Number(d.period),
                    source_id: sourceId,
                })).filter((r: any) => !isNaN(r.capacity_mbpd));

                if (rows.length > 0) {
                    await supabase.from('oil_refining_capacity').upsert(rows, { onConflict: 'country_code, as_of_year' });
                    summary.capacity = rows.length;
                }
            }
        } catch (e: any) { console.error('Capacity Error:', e.message); }

        // --- B. Crude Imports ---
        console.log('Fetching Crude Imports...');
        const importSeriesMap: Record<string, string> = {
            'PET.MCRIMUSCA2.M': 'CA',
            'PET.MCRIMUSMX2.M': 'MX',
            'PET.MCRIMUSSA2.M': 'SA',
            'PET.MCRIMUSIZ2.M': 'IQ',
            'PET.MCRIMUSCO2.M': 'CO',
            'PET.MCRIMUSVE2.M': 'VE', // Venezuela
            'PET.MCRIMUSNG2.M': 'NG', // Nigeria
            'PET.MCRIMUSAU2.M': 'DZ', // Algeria (OPEC)
            'PET.MCRIMUSKU2.M': 'KW', // Kuwait
            'PET.MCRIMUSAE2.M': 'AE', // UAE
            'PET.MCRIMUSAG2.M': 'AO', // Angola
        };
        const importSeriesIds = Object.keys(importSeriesMap).join(';');
        const importsUrl = `${EIA_API_BASE}/series/data/?api_key=${eiaApiKey}&series_id=${importSeriesIds}&frequency=monthly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=12`;
        try {
            const res = await withTimeout(fetch(importsUrl), 20000, 'EIA Imports Fetch');
            if (res.ok) {
                const json = await res.json();
                const COUNTRY_MAP: Record<string, string> = {
                    'CA': 'Canada', 'MX': 'Mexico', 'SA': 'Saudi Arabia', 'IQ': 'Iraq',
                    'CO': 'Colombia', 'VE': 'Venezuela', 'NG': 'Nigeria', 'DZ': 'Algeria',
                    'KW': 'Kuwait', 'AE': 'UAE', 'AO': 'Angola'
                };
                const rows = (json.response.data || []).map((d: any) => {
                    const originCode = importSeriesMap[d.series_id || d.series];
                    if (!originCode) return null;
                    return {
                        importer_country_code: 'US',
                        exporter_country_code: originCode,
                        exporter_country_name: COUNTRY_MAP[originCode] || originCode,
                        import_volume_mbbl: Number(d.value) / 1000,
                        as_of_date: `${d.period}-01`,
                        frequency: 'monthly',
                        source_id: sourceId
                    };
                }).filter((r: any) => r !== null && !isNaN(r.import_volume_mbbl));

                if (rows.length > 0) {
                    await supabase.from('oil_imports_by_origin').upsert(rows, { onConflict: 'importer_country_code, exporter_country_code, as_of_date' });
                    summary.imports = rows.length;
                }
            }
        } catch (e: any) { console.error('Imports Error:', e.message); }

        // --- C. SPR Levels ---
        console.log('Fetching SPR Levels...');
        const sprUrl = `${EIA_API_BASE}/petroleum/stoc/spr/data/?api_key=${eiaApiKey}&frequency=monthly&data[0]=value&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=12`;
        try {
            const res = await withTimeout(fetch(sprUrl), 10000, 'EIA SPR Fetch');
            if (res.ok) {
                const json = await res.json();
                const obs = (json.response.data || []).map((d: any) => ({
                    metric_id: 'OIL_SPR_LEVEL_US',
                    as_of_date: `${d.period}-01`,
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
        const utilUrl = `${EIA_API_BASE}/petroleum/pnp/unc/data/?api_key=${eiaApiKey}&frequency=monthly&data[0]=value&facets[duoarea][]=NUS&facets[process][]=RPU&sort[0][column]=period&sort[0][direction]=desc&length=12`;
        try {
            const res = await withTimeout(fetch(utilUrl), 10000, 'EIA Util Fetch');
            if (res.ok) {
                const json = await res.json();
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

        await logIngestionEnd(supabase, logId, 'success', { metadata: summary });
        return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        if (logId) await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});
