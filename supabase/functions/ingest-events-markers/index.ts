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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create log entry
    let logId: number | null = null;
    try {
        const { data: logData, error: logError } = await supabase.from('ingestion_logs')
            .insert({
                function_name: 'ingest-events-markers',
                status: 'started',
                start_time: startTime.toISOString(),
                metadata: { source: 'GDELT', timespan: '24h' }
            })
            .select('id')
            .single();

        if (!logError && logData) {
            logId = logData.id;
        }
    } catch (e) {
        console.warn('Failed to create start log:', e);
    }

    try {
        console.log("Fetching GDELT GeoJSON data with 24h timespan...");

        // Add explicit timespan=24h to ensure we get last 24 hours
        // Query for conflict, protest, and energy disruption events
        // Added 'sanction' and 'trade war' for economic conflict
        const geoApiUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=(protest OR conflict OR "energy disruption" OR "civil unrest" OR attack OR strike OR sanction OR "trade war")&mode=artlist&format=geojson&timespan=24h`;

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

            // Types mapped to lowercase for frontend compatibility
            const type =
                (combinedText.includes('energy') || combinedText.includes('pipeline') || combinedText.includes('oil') || combinedText.includes('gas') || combinedText.includes('grid')) ? 'energy' :
                    (combinedText.includes('conflict') || combinedText.includes('fight') || combinedText.includes('attack') || combinedText.includes('war') || combinedText.includes('military') || combinedText.includes('sanction')) ? 'conflict' :
                        (combinedText.includes('protest') || combinedText.includes('demonstration') || combinedText.includes('rally') || combinedText.includes('strike') || combinedText.includes('riot')) ? 'protest' :
                            (combinedText.includes('disruption') || combinedText.includes('outage') || combinedText.includes('halt')) ? 'disruption' :
                                'protest'; // Default fallback

            return {
                event_date: new Date().toISOString().split('T')[0],
                latitude: coords[1],
                longitude: coords[0],
                type: type, // lowercase: conflict, protest, energy, disruption
                count: props.count || 1,
                location_name: props.name || 'Unknown Location',
                source: 'GDELT',
                raw_metadata: props
            };
        });

        recordCount = rows.length;

        if (rows.length > 0) {
            // Delete old auto-ingested records for today to avoid duplicates
            // This ensures we always have the freshest 24h snapshot without accumulation
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('events_markers')
                .delete()
                .eq('source', 'GDELT')
                .eq('event_date', today);

            const { error } = await supabase.from('events_markers').upsert(rows);
            if (error) throw error;
        }

        // Log successful ingestion
        if (logId) {
            await supabase.from('ingestion_logs')
                .update({
                    status: 'success',
                    completed_at: new Date().toISOString(),
                    rows_inserted: recordCount,
                    metadata: { source: 'GDELT', timespan: '24h', api_url: geoApiUrl, count: recordCount }
                })
                .eq('id', logId);
        }

        return new Response(JSON.stringify({
            success: true,
            count: rows.length,
            message: `Ingested ${rows.length} events from GDELT (24h window)`,
            duration_ms: new Date().getTime() - startTime.getTime()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error('GDELT ingestion error:', err);

        // Log failed ingestion
        if (logId) {
            await supabase.from('ingestion_logs')
                .update({
                    status: 'failed',
                    completed_at: new Date().toISOString(),
                    error_message: err.message,
                    metadata: { source: 'GDELT', error_details: err.toString() }
                })
                .eq('id', logId);
        } else {
            // Try to insert a failure log if we couldn't create a start log
            await supabase.from('ingestion_logs').insert({
                function_name: 'ingest-events-markers',
                start_time: startTime.toISOString(),
                completed_at: new Date().toISOString(),
                status: 'failed',
                error_message: err.message
            });
        }

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
