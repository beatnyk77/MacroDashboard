import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EIA API Base URL
const EIA_API_BASE = "https://api.eia.gov/v2";

type OilRefiningCapacity = {
    period: number; // Year
    duoarea: string; // State/Country code
    area_name: string;
    product: string;
    process: string;
    series: string;
    value: number | string; // mbpd
    units: string;
};

// Map accessible origin names to ISO codes (partial list)
const COUNTRY_MAP: Record<string, string> = {
    'CANADA': 'CA',
    'MEXICO': 'MX',
    'SAUDI ARABIA': 'SA',
    'IRAQ': 'IQ',
    'COLOMBIA': 'CO',
    'ECUADOR': 'EC',
    'NIGERIA': 'NG',
    'BRAZIL': 'BR',
    'VENEZUELA': 'VE',
    'RUSSIA': 'RU',
    'UNITED KINGDOM': 'GB',
    'KUWAIT': 'KW',
    'LIBYA': 'LY',
    'ANGOLA': 'AO',
    'KAZAKHSTAN': 'KZ',
    'NORWAY': 'NO',
    'ALGERIA': 'DZ',
    'UNITED STATES': 'US',
    // Add more as discovered
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const eiaApiKey = Deno.env.get('EIA_API_KEY');

        if (!eiaApiKey) {
            throw new Error('Missing EIA_API_KEY environment variable');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Log Start
        const { data: logData, error: logError } = await supabase.rpc('log_ingestion_start', {
            p_function_name: 'ingest-oil-eia'
        });
        const logId = logData;

        if (logError) console.error('Failed to start logging:', logError);

        console.log(`Starting EIA ingestion (Log ID: ${logId})...`);

        // Get Source ID
        const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'EIA').single();
        const sourceId = source?.id;

        if (!sourceId) throw new Error("EIA Data Source not found in DB");

        // --- A. Fetch Refining Capacity (Annual) ---
        // Endpoint: /petroleum/crd/refiningcapacity/data/
        // Facet: country=USA (NUS)
        // Series: PET.MCRMNUS2.A (Operable Capacity)
        console.log('Fetching Refining Capacity...');
        const capacityUrl = `${EIA_API_BASE}/petroleum/crd/refiningcapacity/data/?api_key=${eiaApiKey}&frequency=annual&data[0]=value&facets[duoarea][]=NUS&facets[process][]=MCR&sort[0][column]=period&sort[0][direction]=desc&length=50`;

        // EIA 'MCR' = Atmospheric Crude Oil Distillation Capacity. Units: MBBL/D (Thousand Barrels per Day).

        const capRes = await fetch(capacityUrl);
        if (!capRes.ok) throw new Error(`EIA API Error (Capacity): ${capRes.statusText}`);
        const capJson = await capRes.json();
        const capacityData: OilRefiningCapacity[] = capJson.response.data;

        if (capacityData && capacityData.length > 0) {
            const capRows = capacityData.map(d => ({
                country_code: 'US',
                country_name: 'United States',
                capacity_mbpd: Number(d.value) / 1000, // Convert kbpd to mbpd. 18000 -> 18.0
                as_of_year: Number(d.period),
                source_id: sourceId,
            })).filter(r => !isNaN(r.capacity_mbpd));

            const { error: capUpsertError } = await supabase.from('oil_refining_capacity').upsert(capRows, { onConflict: 'country_code, as_of_year' });
            if (capUpsertError) throw new Error(`Capacity Upsert Error: ${capUpsertError.message}`);
            console.log(`Upserted ${capRows.length} capacity records.`);
        }

        // --- B. Fetch Crude Imports by Origin (Monthly) ---
        // Endpoint: /petroleum/move/imp/data/
        // Product: EPCC (Crude Oil)
        // Process: IZ0 (Imports)
        // We need breakdown by origin. In EIA v2, 'duoarea' often represents the flow (e.g., 'R50-MX' or similar).
        // Or 'series' ID implies origin. 
        // Let's fetch the data directly. We'll grab the last 24 months to ensure we have recent history.

        console.log('Fetching Crude Imports...');
        // Request 'product-name' and 'process-name' and 'area-name' to debug origin mapping if needed.
        // Length 5000 to cover many origins x 24 months.
        const startPeriod = new Date();
        startPeriod.setMonth(startPeriod.getMonth() - 24);
        const startStr = startPeriod.toISOString().slice(0, 7); // YYYY-MM

        const importsUrl = `${EIA_API_BASE}/petroleum/move/imp/data/?api_key=${eiaApiKey}&frequency=monthly&data[0]=value&data[1]=series-description&facets[product][]=EPCC&facets[process][]=IZ0&start=${startStr}&sort[0][column]=period&sort[0][direction]=desc&length=5000`;

        const impRes = await fetch(importsUrl);
        if (!impRes.ok) throw new Error(`EIA API Error (Imports): ${impRes.statusText}`);
        const impJson = await impRes.json();
        const importData: any[] = impJson.response.data;

        let importRowsProcessed = 0;

        if (importData && importData.length > 0) {
            // We need to parse origin from 'series-description'.
            // Example: "Imports of Crude Oil from Canada into the United States"
            // Regex to extract origin: "from (.*?) into the United States"

            const originRegex = /Imports of Crude Oil from (.*?) into the United States/i;

            const importRows = importData.map(d => {
                const desc = d['series-description'] || '';
                const match = originRegex.exec(desc);

                if (!match) return null; // Skip if not matching pattern (e.g., US total imports)

                const originName = match[1].toUpperCase().trim();
                const countryCode = COUNTRY_MAP[originName.replace('THE ', '')] || COUNTRY_MAP[originName] || null;

                if (!countryCode) {
                    // console.warn(`Unknown origin country: ${originName}`);
                    return null;
                }

                return {
                    importer_country_code: 'US',
                    exporter_country_code: countryCode,
                    import_volume_mbbl: Number(d.value) / 1000, // API usually in Thousand Barrels. We want Million Barrels. 
                    // Wait, logic check: MCRIMUS... units often "Thousand Barrels". So / 1000 = Million Barrels.
                    as_of_date: `${d.period}-01`, // YYYY-MM -> YYYY-MM-01
                    frequency: 'monthly',
                    source_id: sourceId
                };
            }).filter(r => r !== null && !isNaN(r.import_volume_mbbl));

            if (importRows.length > 0) {
                const { error: impUpsertError } = await supabase.from('oil_imports_by_origin').upsert(importRows, { onConflict: 'importer_country_code, exporter_country_code, as_of_date' });
                if (impUpsertError) throw new Error(`Imports Upsert Error: ${impUpsertError.message}`);
                // console.log(`Upserted ${importRows.length} import records.`);
                importRowsProcessed = importRows.length;
            }
        }

        // 2. Log Success
        if (logId) {
            await supabase.rpc('log_ingestion_end', {
                p_log_id: logId,
                p_status: 'success',
                p_metadata: {
                    capacity_rows: capacityData?.length ?? 0,
                    import_rows: importRowsProcessed
                }
            });
        }

        return new Response(JSON.stringify({ success: true, processed: { capacity: capacityData?.length, imports: importRowsProcessed } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
