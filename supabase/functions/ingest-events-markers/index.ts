/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';


// GDELT 2.0 Geo API with explicit 24-hour timespan
// Documentation: https://blog.gdeltproject.org/gdelt-geo-2-0-api-debuts/

async function doIngestEventsMarkers(supabase: any) {
    let recordCount = 0;
    console.log("Fetching GDELT GeoJSON data with 24h timespan...");

    // Construct query with proper encoding
    const query = '(protest OR conflict OR "civil unrest" OR attack OR strike OR sanction OR "trade war")';
    const geoApiUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&mode=artlist&format=geojson&timespan=24h`;

    console.log(`Requesting GDELT Geo: ${geoApiUrl}`);

    const geoRes = await fetch(geoApiUrl, {
        headers: {
            'User-Agent': 'GraphiQuestor-Sovereign-Console/1.1'
        }
    });

    if (!geoRes.ok) {
        const errorText = await geoRes.text();
        throw new Error(`GDELT API failed with HTTP ${geoRes.status}: ${errorText.substring(0, 100)}`);
    }

    const geoJson = await geoRes.json();
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

    return {
    ok: true,
    counts: { upserted: recordCount },
    meta: { source: 'GDELT', timespan: '24h', api_url: geoApiUrl, count: recordCount, status: recordCount === 0 ? 'empty' : 'success' }
  };
}

serveIngest('ingest-events-markers', async (_req: Request): Promise<IngestResult> => {


    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    
    const _r = await (doIngestEventsMarkers(supabase));
    if (_r && typeof _r.ok === 'boolean') return _r as IngestResult;
    return {
      ok: true,
      counts: { upserted: _r?.rows_inserted ?? 0 },
      meta: _r?.metadata ?? _r,
    };
    
});
