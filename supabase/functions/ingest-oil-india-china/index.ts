import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EIA_API_BASE = "https://api.eia.gov/v2";

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
        const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'EIA').single();
        const sourceId = source?.id;

        if (!sourceId) throw new Error("EIA Data Source not found");

        console.log("Starting EIA International Ingestion for IND/CHN Partners...");

        // Activity: 3 (Imports), Product: 5 (Crude Oil)
        // We'll fetch for India (IND) and China (CHN)
        const reporters = ['IND', 'CHN'];
        let totalProcessed = 0;

        for (const reporter of reporters) {
            // Note: Not all countries have partner breakdown in the international API v2.
            // If partnerCountryId facet is not specified, it usually gives 'World'.
            // To get partners, we might need a different route or facet.
            // Some series in EIA have partner data.

            // Try to fetch with partner breakdown
            const url = `${EIA_API_BASE}/international/data/?api_key=${eiaApiKey}&frequency=annual&data[0]=value&facets[activityId][]=3&facets[productId][]=5&facets[countryRegionId][]=${reporter}&sort[0][column]=period&sort[0][direction]=desc&length=200`;

            console.log(`Fetching Data for ${reporter}...`);
            const res = await fetch(url);
            if (!res.ok) continue;

            const json = await res.json();
            const data: any[] = json.response?.data || [];

            // EIA International often lacks granular partner labels in the 'international' endpoint
            // but provides them in specific partner feeds if available.
            // IF partnerCountryId is missing, we'll use World or try to infer.

            if (data.length > 0) {
                const rows = data.map(d => {
                    // Try to find partner label in the response
                    const partnerId = d.partnerCountryId || 'World';
                    const partnerName = d.partnerCountryName || partnerId;

                    return {
                        importer_country_code: reporter === 'IND' ? 'IN' : 'CN',
                        exporter_country_code: partnerId,
                        exporter_country_name: partnerName,
                        import_volume_mbbl: (Number(d.value) * 365) / 1000, // TBPD to MBBL/year approx
                        as_of_date: `${d.period}-01-01`,
                        frequency: 'annual',
                        source_id: sourceId
                    };
                }).filter(r => !isNaN(r.import_volume_mbbl));

                const { error } = await supabase.from('oil_imports_by_origin').upsert(rows, { onConflict: 'importer_country_code, exporter_country_code, as_of_date' });
                if (error) console.error(`Error upserting for ${reporter}:`, error);
                else totalProcessed += rows.length;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: totalProcessed
        }), {
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
