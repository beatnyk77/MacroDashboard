/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { createClient } from "@supabase/supabase-js";
import { runIngestion } from "../_shared/logging.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchWithTimeout(url: string, options: any = {}) {
    const timeout = options.timeout || 45000; // 45s default
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms: ${url}`);
        }
        throw err;
    }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const openSkyUser = Deno.env.get('OPENSKY_USERNAME');
    const openSkyPass = Deno.env.get('OPENSKY_PASSWORD');
    
    console.log(`Auth Debug: User present: ${!!openSkyUser}, Pass present: ${!!openSkyPass}`);

    const openSkyAuth = (openSkyUser && openSkyPass) 
        ? `Basic ${btoa(`${openSkyUser}:${openSkyPass}`)}`
        : null;

    return runIngestion(supabase, 'ingest-geopolitical-osint', async (ctx) => {
        const results = [];
        const now = new Date().toISOString();
        const platformStats: Record<string, any> = {};

        // 1. Fetch Aircraft Data from OpenSky (ADS-B)
        // Using two targeted boxes: Hormuz and Israel region
        const boxes = [
            { name: 'Hormuz', lamin: 23, lomin: 53, lamax: 29, lomax: 59 },
            { name: 'Israel-ME', lamin: 29, lomin: 33, lamax: 35, lomax: 37 }
        ];

        for (const box of boxes) {
            try {
                console.log(`Fetching aircraft from OpenSky for ${box.name}...`);
                const openSkyUrl = `https://opensky-network.org/api/states/all?lamin=${box.lamin}&lomin=${box.lomin}&lamax=${box.lamax}&lomax=${box.lomax}`;
                const headers: Record<string, string> = {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                };
                if (openSkyAuth) headers['Authorization'] = openSkyAuth;

                const aircraftRes = await fetchWithTimeout(openSkyUrl, {
                    timeout: 40000,
                    headers
                });
                
                if (aircraftRes.ok) {
                    const aircraftData = await aircraftRes.json() as any;
                    if (aircraftData.states) {
                        const filteredAircraft = aircraftData.states
                            .filter((s: any) => s[1] && s[5] && s[6])
                            .slice(0, 50);

                        for (const s of filteredAircraft) {
                            const callsign = (s[1] || '').trim();
                            if (!callsign) continue;

                            results.push({
                                type: 'jet',
                                callsign: callsign,
                                lat: s[6],
                                lng: s[5],
                                owner_flag: s[2] || 'Unknown',
                                timestamp: now,
                                macro_correlation: determineMacroCorrelation('jet', callsign, s[2] || ''),
                                metadata: {
                                    altitude: s[7],
                                    velocity: s[9],
                                    true_track: s[10],
                                    region: box.name
                                }
                            });
                        }
                        platformStats[`OpenSky_${box.name}`] = { status: 'success', count: filteredAircraft.length };
                    }
                } else {
                    console.error(`OpenSky ${box.name} failed: ${aircraftRes.status}`);
                    platformStats[`OpenSky_${box.name}`] = { status: 'failed', code: aircraftRes.status };
                }
            } catch (e: any) {
                console.error(`OpenSky ${box.name} fetch failed:`, e);
                platformStats[`OpenSky_${box.name}`] = { status: 'error', message: e.message };
            }
        }

        // 2. Fetch GDELT Event API v2 (Conflict, Protest, Diplomatic)
        try {
            console.log("Fetching geopolitical events from GDELT Event API v2...");
            // Query for conflict (19), protest (14), or maritime risk related events in ME/Asia
            const query = '(eventcode:19* OR eventcode:14* OR "strait of hormuz" OR "red sea")';
            const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&format=json&timespan=24h&maxrecords=50`;
            
            const gdeltRes = await fetchWithTimeout(gdeltUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (gdeltRes.ok) {
                const gdeltData = await gdeltRes.json() as any;
                if (gdeltData.articles) {
                    let eventCount = 0;
                    for (const article of gdeltData.articles) {
                        // Event mapping
                        results.push({
                            type: 'vessel', // GDELT events displayed as 'alert' markers
                            callsign: article.title.substring(0, 50),
                            lat: 25.0 + (Math.random() * 2 - 1), // Jitter near Hormuz if no loc
                            lng: 55.0 + (Math.random() * 2 - 1), 
                            owner_flag: article.sourcecountry || 'GDELT',
                            timestamp: now,
                            macro_correlation: `Geo-Risk Alert: "${article.title}"`,
                            metadata: {
                                source: article.domain,
                                url: article.url,
                                seendate: article.seendate,
                                platform: 'GDELT_EVENT_V2'
                            }
                        });
                        eventCount++;
                    }
                    platformStats['GDELT_Event'] = { status: 'success', count: eventCount };
                }
            } else {
                console.error(`GDELT Event failed: ${gdeltRes.status}`);
                platformStats['GDELT_Event'] = { status: 'failed', code: gdeltRes.status };
            }
        } catch (e: any) {
            console.error("GDELT Event fetch failed:", e);
            platformStats['GDELT_Event'] = { status: 'error', message: e.message };
        }

        // 3. Insert into DB
        if (results.length > 0) {
            // Deduplicate results by callsign and type before upserting
            const uniqueResults = Array.from(new Map(results.map(r => [`${r.callsign}-${r.type}`, r])).values());
            
            const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
            await supabase.from('geopolitical_osint').delete().lt('timestamp', oneHourAgo);

            const { error: insertError } = await supabase
                .from('geopolitical_osint')
                .upsert(uniqueResults, { onConflict: 'callsign, type' });

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
