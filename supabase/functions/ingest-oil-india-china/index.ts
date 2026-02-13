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
        // Reporters: IND (India), CHN (China)
        const reporters = [
            { id: 'IND', code: 'IN' },
            { id: 'CHN', code: 'CN' }
        ];

        // Known top partners to query explicitly if facets are sparse
        const partners = [
            { id: 'RUS', name: 'Russia' },
            { id: 'SAU', name: 'Saudi Arabia' },
            { id: 'IRQ', name: 'Iraq' },
            { id: 'ARE', name: 'UAE' },
            { id: 'USA', name: 'United States' },
            { id: 'BRA', name: 'Brazil' },
            { id: 'KWT', name: 'Kuwait' },
            { id: 'NGA', name: 'Nigeria' }
        ];

        let totalProcessed = 0;

        for (const reporter of reporters) {
            console.log(`Fetching Global Partners for ${reporter.id}...`);

            // Build URL with multiple partner facets
            const url = new URL(`${EIA_API_BASE}/international/data/`);
            url.searchParams.append('api_key', eiaApiKey);
            url.searchParams.append('frequency', 'annual');
            url.searchParams.append('data[0]', 'value');
            url.searchParams.append('facets[activityId][]', '3');
            url.searchParams.append('facets[productId][]', '5');
            url.searchParams.append('facets[countryRegionId][]', reporter.id);
            url.searchParams.append('facets[unit][]', 'TBPD');

            // Add partner facets
            partners.forEach(p => {
                url.searchParams.append('facets[partnerCountryId][]', p.id);
            });

            url.searchParams.append('sort[0][column]', 'period');
            url.searchParams.append('sort[0][direction]', 'desc');
            url.searchParams.append('length', '100');

            try {
                const res = await fetch(url.toString());
                if (!res.ok) {
                    console.error(`EIA API Error for ${reporter.id}: ${res.status}`);
                    continue;
                }

                const json = await res.json();
                const data = json.response?.data || [];

                if (data.length > 0) {
                    // Extract latest period
                    const latestPeriod = data[0].period;
                    const latestData = data.filter((d: any) => d.period === latestPeriod);

                    const rows = latestData.map((d: any) => {
                        const partner = partners.find(p => p.id === d.partnerCountryId) || { name: d.partnerCountryName || d.partnerCountryId };
                        return {
                            importer_country_code: reporter.code,
                            exporter_country_code: d.partnerCountryId,
                            exporter_country_name: partner.name,
                            import_volume_mbbl: (Number(d.value) * 365) / 1000, // TBPD to MBBL/year
                            as_of_date: `${d.period}-01-01`,
                            frequency: 'annual',
                            source_id: sourceId
                        };
                    }).filter((r: any) => r.import_volume_mbbl > 0);

                    if (rows.length > 0) {
                        const { error } = await supabase.from('oil_imports_by_origin').upsert(rows, {
                            onConflict: 'importer_country_code, exporter_country_code, as_of_date'
                        });
                        if (error) throw error;
                        totalProcessed += rows.length;
                    }
                }
            } catch (e) {
                console.error(`Failed to process ${reporter.id}:`, e);
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
