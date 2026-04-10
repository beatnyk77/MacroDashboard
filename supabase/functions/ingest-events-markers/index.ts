import { createClient } from '@supabase/supabase-js';

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

        // Construct query with proper encoding
        const query = '(protest OR conflict OR "civil unrest" OR attack OR strike OR sanction OR "trade war")';
        const geoApiUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&mode=artlist&format=geojson&timespan=24h`;

        console.log(`Requesting GDELT Geo: ${geoApiUrl}`);

        // Implement retry logic with exponential backoff
        let geoRes;
        let retries = 3;
        let delay = 1000;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                geoRes = await fetch(geoApiUrl, {
                    headers: {
                        'User-Agent': 'GraphiQuestor-Sovereign-Console/1.1'
                    }
                });

                if (geoRes.ok) break;

                const errorText = await geoRes.text();
                console.warn(`GDELT API Attempt ${attempt} HTTP ${geoRes.status}: ${errorText.substring(0, 100)}`);

                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                } else {
                    throw new Error(`GDELT API failed after ${retries} attempts: ${geoRes.status}`);
                }
            } catch (fetchError: any) {
                if (attempt === retries) throw fetchError;
                console.log(`Attempt ${attempt} error: ${fetchError.message}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }

        const geoJson = await geoRes!.json();
        const features = geoJson.features || [];
        console.log(`Successfully retrieved ${features.length} features from GDELT`);

        const rows = features.map((f: any) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];

            // Normalize type inference
            const title = (props.name || props.html || '').toLowerCase();

            let type: 'conflict' | 'protest' | 'energy' | 'disruption' = 'protest';
            if (title.includes('energy') || title.includes('pipeline') || title.includes('oil') || title.includes('gas')) {
                type = 'energy';
            } else if (title.includes('conflict') || title.includes('attack') || title.includes('war') || title.includes('military') || title.includes('sanction')) {
                type = 'conflict';
            } else if (title.includes('disruption') || title.includes('outage') || title.includes('halt')) {
                type = 'disruption';
            } else if (title.includes('protest') || title.includes('strike') || title.includes('riot')) {
                type = 'protest';
            }

            return {
                event_date: new Date().toISOString().split('T')[0],
                latitude: coords[1],
                longitude: coords[0],
                type: type,
                count: props.count || 1,
                location_name: props.name || 'Active Marker',
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
        } else {
            console.warn('GDELT returned no events for the current query/timespan');
        }

        // Log successful ingestion
        if (logId) {
            await supabase.from('ingestion_logs')
                .update({
                    status: 'success',
                    completed_at: new Date().toISOString(),
                    rows_inserted: recordCount,
                    metadata: { source: 'GDELT', timespan: '24h', api_url: geoApiUrl, count: recordCount, status: recordCount === 0 ? 'empty' : 'success' }
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
