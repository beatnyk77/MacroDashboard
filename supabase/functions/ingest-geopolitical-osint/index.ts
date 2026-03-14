import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { runIngestion } from "../_shared/logging.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-geopolitical-osint', async (ctx) => {
        const results = [];
        const now = new Date().toISOString();
        const platformStats: Record<string, any> = {};

        // 1. Fetch Aircraft Data from OpenSky (ADS-B)
        try {
            console.log("Fetching aircraft from OpenSky...");
            // Middle East to China: [10, 30, 60, 130]
            const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=10&lomin=30&lamax=60&lomax=130`;
            const aircraftRes = await fetch(openSkyUrl);
            
            if (aircraftRes.ok) {
                const aircraftData = await aircraftRes.json() as any;
                if (aircraftData.states) {
                    const filteredAircraft = aircraftData.states
                        .filter((s: any) => s[8] === false && s[1] && s[5] && s[6])
                        .slice(0, 50);

                    for (const s of filteredAircraft) {
                        const callsign = s[1].trim();
                        results.push({
                            type: 'jet',
                            callsign: callsign,
                            lat: s[6],
                            lng: s[5],
                            owner_flag: s[2],
                            timestamp: now,
                            macro_correlation: determineMacroCorrelation('jet', callsign, s[2]),
                            metadata: {
                                altitude: s[7],
                                velocity: s[9],
                                true_track: s[10]
                            }
                        });
                    }
                    platformStats['OpenSky'] = { status: 'success', count: filteredAircraft.length };
                }
            } else {
                platformStats['OpenSky'] = { status: 'failed', code: aircraftRes.status };
            }
        } catch (e) {
            console.error("OpenSky fetch failed:", e);
            platformStats['OpenSky'] = { status: 'error', message: e.message };
        }

        // 2. Fetch GDELT Marine Events (Tanker focus)
        try {
            console.log("Fetching marine events from GDELT...");
            // Focus more on tankers and Hormuz specifically
            const query = '(tanker OR "oil tanker" OR "lng carrier" OR "vessel" OR "strait of hormuz" OR "bab el-mandeb")';
            const gdeltUrl = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&mode=artlist&format=geojson&timespan=12h`;
            
            const gdeltRes = await fetch(gdeltUrl);
            if (gdeltRes.ok) {
                const gdeltData = await gdeltRes.json() as any;
                if (gdeltData.features) {
                    let vesselCount = 0;
                    for (const feature of gdeltData.features) {
                        const props = feature.properties || {};
                        const coords = feature.geometry?.coordinates || [0, 0];
                        
                        // Heuristic: If name or snippet contains tanker, tag it as such
                        const isTanker = props.name?.toLowerCase().includes('tanker') || props.html?.toLowerCase().includes('tanker');
                        
                        results.push({
                            type: 'vessel',
                            callsign: props.name || 'Unknown Vessel',
                            lat: coords[1],
                            lng: coords[0],
                            owner_flag: 'GDELT_EVENT',
                            timestamp: now,
                            macro_correlation: isTanker 
                                ? 'Oil/LNG tanker event detected via GDELT; monitoring for Hormuz/Bab el-Mandeb transit risk.'
                                : 'Geopolitical maritime event detected via OSINT stream.',
                            metadata: {
                                gdelt_url: props.url,
                                is_tanker_heuristic: isTanker,
                                news_count: props.count
                            }
                        });
                        vesselCount++;
                    }
                    platformStats['GDELT'] = { status: 'success', count: vesselCount };
                }
            } else {
                platformStats['GDELT'] = { status: 'failed', code: gdeltRes.status };
            }
        } catch (e) {
            console.error("GDELT fetch failed:", e);
            platformStats['GDELT'] = { status: 'error', message: e.message };
        }

        // 3. Insert into DB
        if (results.length > 0) {
            const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
            await supabase.from('geopolitical_osint').delete().lt('timestamp', oneHourAgo);

            const { error: insertError } = await supabase
                .from('geopolitical_osint')
                .upsert(results, { onConflict: 'callsign, type' });

            if (insertError) throw insertError;
        }

        return {
            rows_inserted: results.length,
            metadata: { count: results.length, stats: platformStats }
        };
    });
});

function determineMacroCorrelation(type: string, id: string, origin: string): string {
    if (type === 'jet') {
        const oilNations = ['United Arab Emirates', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman'];
        if (oilNations.includes(origin)) {
            return `Gulf-linked corporate flight; potential signal for HNI capital movement or regional diplomatic activity.`;
        }
        if (origin === 'China' || origin === 'India') {
            return `Large-economy corporate jet movement; monitoring for high-level business engagement patterns.`;
        }
        return `High-altitude executive transport; correlating with regional corporate flight frequency.`;
    }
    return `Potential geopolitical maritime event detected via OSINT stream.`;
}
