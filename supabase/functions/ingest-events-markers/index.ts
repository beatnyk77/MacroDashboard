import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GDELT daily event files: http://data.gdeltproject.org/events/YYYYMMDD.export.CSV.zip
// For simplicity and freshness, we'll use the 15-minute updates if possible, 
// or just the last day's export.
// Actually GDELT 2.0 has a master list: http://data.gdeltproject.org/gdeltv2/lastupdate.txt

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }


    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Fetching GDELT GeoJSON data...");
        // Use GeoJSON format as it's more reliable than the internal JSON format
        const geoApiUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=(protest OR conflict OR "energy disruption")&format=geojson`;

        console.log(`Requesting: ${geoApiUrl}`);
        const geoRes = await fetch(geoApiUrl);

        if (!geoRes.ok) {
            throw new Error(`GDELT API failed: ${geoRes.status} ${geoRes.statusText}`);
        }

        const geoJson = await geoRes.json();
        const features = geoJson.features || [];
        console.log(`Found ${features.length} events`);

        const rows = features.map((f: any) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];

            // GeoJSON properties from GDELT usually include:
            // name, html, url, etc.
            // We need to extract type from the data or infer it.
            // GDELT GeoJSON doesn't explicitly have 'type' field matching our schema, 
            // so we infer from the API query context or properties.
            // However, since we queried for multiple things, we can try to guess from the 'html' or 'name'.

            const rawHtml = (props.html || '').toLowerCase();
            const type = rawHtml.includes('protest') ? 'Protest' :
                (rawHtml.includes('conflict') || rawHtml.includes('fight') || rawHtml.includes('attack') ? 'Conflict' :
                    (rawHtml.includes('energy') || rawHtml.includes('pipeline') ? 'Disruption' : 'Protest')); // Default to Protest if unclear

            return {
                event_date: new Date().toISOString().split('T')[0], // GDELT Geo 2.0 is "last 24 hours" by default unless timespan specified
                latitude: coords[1],
                longitude: coords[0],
                type: type,
                count: props.count || 1, // GDELT might not return count in GeoJSON, default to 1
                location_name: props.name || 'Unknown Location',
                source: 'GDELT',
                raw_metadata: props
            };
        });

        if (rows.length > 0) {
            // Delete old auto-ingested records for today to avoid duplicates if running multiple times
            const today = new Date().toISOString().split('T')[0];
            await supabase.from('events_markers')
                .delete()
                .eq('source', 'GDELT')
                .eq('event_date', today);

            const { error } = await supabase.from('events_markers').upsert(rows);
            if (error) throw error;
        }

        return new Response(JSON.stringify({
            success: true,
            count: rows.length,
            message: `Ingested ${rows.length} events`
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
