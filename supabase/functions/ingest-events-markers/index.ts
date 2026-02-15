import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GDELT 2.0 Geo API with explicit 24-hour timespan
// Documentation: https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const startTime = new Date();
    let recordCount = 0;
    let errorMessage = null;

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Fetching GDELT GeoJSON data with 24h timespan...");

        // Add explicit timespan=24h to ensure we get last 24 hours
        // Query for conflict, protest, and energy disruption events
        const geoApiUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=(protest OR conflict OR "energy disruption" OR "civil unrest" OR attack OR strike)&mode=artlist&format=geojson&timespan=24h`;

        console.log(`Requesting: ${geoApiUrl}`);

        // Implement retry logic with exponential backoff
        let geoRes;
        let retries = 3;
        let delay = 1000; // Start with 1 second

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                geoRes = await fetch(geoApiUrl, {
                    headers: {
                        'User-Agent': 'GraphiQuestor-Sovereign-Console/1.0'
                    }
                });

                if (geoRes.ok) break;

                if (attempt < retries) {
                    console.log(`Attempt ${attempt} failed with status ${geoRes.status}, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    throw new Error(`GDELT API failed after ${retries} attempts: ${geoRes.status} ${geoRes.statusText}`);
                }
            } catch (fetchError: any) {
                if (attempt === retries) throw fetchError;
                console.log(`Attempt ${attempt} failed with error: ${fetchError.message}, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }

        const geoJson = await geoRes!.json();
        const features = geoJson.features || [];
        console.log(`Found ${features.length} events from GDELT`);

        const rows = features.map((f: any) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];

            // Improved type inference from GDELT properties
            const rawHtml = (props.html || '').toLowerCase();
            const rawName = (props.name || '').toLowerCase();
            const combinedText = rawHtml + ' ' + rawName;

            const type =
                (combinedText.includes('conflict') || combinedText.includes('fight') || combinedText.includes('attack') || combinedText.includes('war')) ? 'Conflict' :
                    (combinedText.includes('protest') || combinedText.includes('demonstration') || combinedText.includes('rally') || combinedText.includes('strike')) ? 'Protest' :
                        (combinedText.includes('energy') || combinedText.includes('pipeline') || combinedText.includes('oil') || combinedText.includes('gas')) ? 'Disruption' :
                            'Protest'; // Default to Protest if unclear

            return {
                event_date: new Date().toISOString().split('T')[0],
                latitude: coords[1],
                longitude: coords[0],
                type: type,
                count: props.count || 1,
                location_name: props.name || 'Unknown Location',
                source: 'GDELT',
                raw_metadata: props
            };
        });

        recordCount = rows.length;

        if (rows.length > 0) {
            // Delete old auto-ingested records for today to avoid duplicates
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('events_markers')
                .delete()
                .eq('source', 'GDELT')
                .eq('event_date', today);

            const { error } = await supabase.from('events_markers').upsert(rows);
            if (error) throw error;
        }

        // Log successful ingestion
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        await supabase.from('data_ingestion_log').insert({
            function_name: 'ingest-events-markers',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'success',
            records_processed: recordCount,
            error_message: null,
            metadata: { source: 'GDELT', timespan: '24h', api_url: geoApiUrl }
        });

        return new Response(JSON.stringify({
            success: true,
            count: rows.length,
            message: `Ingested ${rows.length} events from GDELT (24h window)`,
            duration_ms: duration
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('GDELT ingestion error:', err);
        errorMessage = err.message;

        // Log failed ingestion
        const endTime = new Date();
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from('data_ingestion_log').insert({
            function_name: 'ingest-events-markers',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: 'error',
            records_processed: recordCount,
            error_message: errorMessage,
            metadata: { source: 'GDELT', error_details: err.toString() }
        });

        return new Response(JSON.stringify({
            error: err.message,
            success: false,
            count: 0
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
