import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EIA_API_BASE = "https://api.eia.gov/v2";
const FRED_API_BASE = "https://api.stlouisfed.org/fred";

async function fetchFredSeries(seriesId: string, apiKey: string) {
    const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&frequency=a&sort_order=desc&limit=30`;
    console.log(`Fetching FRED ${seriesId}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED Error ${seriesId}: ${res.status}`);
    const json = await res.json();
    return json.observations || [];
}

async function fetchEiaBrent(apiKey: string) {
    // Try both spt and series/data as backup
    const url = `${EIA_API_BASE}/petroleum/pri/spt/data/?api_key=${apiKey}&frequency=annual&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=30`;
    console.log(`Fetching EIA Brent...`);
    const res = await fetch(url);
    if (!res.ok) {
        console.warn(`EIA Brent SPT Error: ${res.status}. Trying series/data...`);
        const altUrl = `${EIA_API_BASE}/series/data/?api_key=${apiKey}&series_id=PET.RBRTE.A&frequency=annual&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=30`;
        const altRes = await fetch(altUrl);
        if (!altRes.ok) throw new Error(`EIA Brent Alt Error: ${altRes.status}`);
        const altJson = await altRes.json();
        return altJson.response?.data || [];
    }
    const json = await res.json();
    return json.response?.data || [];
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const eiaApiKey = Deno.env.get('EIA_API_KEY');
        const fredApiKey = Deno.env.get('FRED_API_KEY');

        if (!eiaApiKey || !fredApiKey) {
            throw new Error('Missing API keys (EIA or FRED)');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: source } = await supabase.from('data_sources').select('id').eq('name', 'EIA').single();
        const sourceId = source?.id;

        if (!sourceId) throw new Error("EIA Data Source not found");

        console.log("Fetching Brent and FX rates...");
        const [brentData, inrData, cnyData] = await Promise.all([
            fetchEiaBrent(eiaApiKey),
            fetchFredSeries('DEXINUS', fredApiKey),
            fetchFredSeries('DEXCHUS', fredApiKey)
        ]);

        console.log(`Brent Data Points: ${brentData.length}`);

        console.log("Starting EIA International Ingestion for IND/CHN...");

        const reporters = [
            { id: 'IND', code: 'IN', fxData: inrData },
            { id: 'CHN', code: 'CN', fxData: cnyData }
        ];

        let totalProcessed = 0;
        let lastError = "";

        for (const reporter of reporters) {
            console.log(`Fetching Global Partners for ${reporter.id}...`);

            // Use the specific crude-oil-imports route if available, or fallback to data with activityId 3
            // Searching international/crude-oil-imports/data/ proved more reliable in docs
            const url = new URL(`${EIA_API_BASE}/international/crude-oil-imports/data/`);
            url.searchParams.append('api_key', eiaApiKey);
            url.searchParams.append('frequency', 'annual');
            url.searchParams.append('data[0]', 'value');
            url.searchParams.append('facets[countryRegionId][]', reporter.id);
            url.searchParams.append('sort[0][column]', 'period');
            url.searchParams.append('sort[0][direction]', 'desc');
            url.searchParams.append('length', '2000');

            try {
                const res = await fetch(url.toString());
                const json = await res.json();
                const data = json.response?.data || [];

                console.log(`${reporter.id} response size: ${data.length}`);

                if (data.length > 0) {
                    const rowMap = new Map();

                    for (const d of data) {
                        const brent = brentData.find((b: any) => b.period === d.period || b.period === d.period?.substring(0, 4));
                        const fx = reporter.fxData.find((f: any) => f.date.startsWith(d.period));

                        const brentVal = brent ? Number(brent.value) : null;
                        const fxVal = fx ? Number(fx.value) : null;
                        const localCost = brentVal && fxVal ? brentVal * fxVal : null;

                        const dateStr = `${d.period}-01-01`;
                        const key = `${reporter.code}-${d.partnerCountryId || 'TOTAL'}-${dateStr}`;

                        // Ensure uniqueness for upsert
                        if (!rowMap.has(key)) {
                            rowMap.set(key, {
                                importer_country_code: reporter.code,
                                exporter_country_code: d.partnerCountryId || 'TOTAL',
                                exporter_country_name: d.partnerCountryName || 'Total Imports',
                                import_volume_mbbl: (Number(d.value) * 365) / 1000,
                                as_of_date: dateStr,
                                frequency: 'annual',
                                source_id: sourceId,
                                import_cost_usd: brentVal,
                                import_cost_local_currency: localCost,
                                exchange_rate: fxVal,
                                brent_price_usd: brentVal
                            });
                        }
                    }

                    const rows = Array.from(rowMap.values()).filter((r: any) => r.import_volume_mbbl > 0);

                    if (rows.length > 0) {
                        const { error } = await supabase.from('oil_imports_by_origin').upsert(rows, {
                            onConflict: 'importer_country_code, exporter_country_code, as_of_date'
                        });
                        if (error) throw error;
                        totalProcessed += rows.length;
                    }
                } else {
                    // Try the data route as fallback if crude-oil-imports route is not found/empty
                    const altUrl = new URL(`${EIA_API_BASE}/international/data/`);
                    altUrl.searchParams.append('api_key', eiaApiKey);
                    altUrl.searchParams.append('frequency', 'annual');
                    altUrl.searchParams.append('data[0]', 'value');
                    altUrl.searchParams.append('facets[activityId][]', '3'); // Imports
                    altUrl.searchParams.append('facets[countryRegionId][]', reporter.id);
                    altUrl.searchParams.append('sort[0][column]', 'period');
                    altUrl.searchParams.append('sort[0][direction]', 'desc');
                    altUrl.searchParams.append('length', '2000');

                    const altRes = await fetch(altUrl.toString());
                    const altJson = await altRes.json();
                    const altData = altJson.response?.data || [];
                    console.log(`${reporter.id} alt response size: ${altData.length}`);

                    if (altData.length > 0) {
                        const rowMap = new Map();
                        for (const d of altData) {
                            const brent = brentData.find((b: any) => b.period === d.period || b.period === d.period?.substring(0, 4));
                            const fx = reporter.fxData.find((f: any) => f.date.startsWith(d.period));
                            const brentVal = brent ? Number(brent.value) : null;
                            const fxVal = fx ? Number(fx.value) : null;
                            const localCost = brentVal && fxVal ? brentVal * fxVal : null;
                            const dateStr = `${d.period}-01-01`;
                            const key = `${reporter.code}-${d.partnerCountryId || 'TOTAL'}-${dateStr}`;
                            if (!rowMap.has(key)) {
                                rowMap.set(key, {
                                    importer_country_code: reporter.code,
                                    exporter_country_code: d.partnerCountryId || 'TOTAL',
                                    exporter_country_name: d.partnerCountryName || 'Total Imports',
                                    import_volume_mbbl: (Number(d.value) * 365) / 1000,
                                    as_of_date: dateStr,
                                    frequency: 'annual',
                                    source_id: sourceId,
                                    import_cost_usd: brentVal,
                                    import_cost_local_currency: localCost,
                                    exchange_rate: fxVal,
                                    brent_price_usd: brentVal
                                });
                            }
                        }
                        const rows = Array.from(rowMap.values()).filter((r: any) => r.import_volume_mbbl > 0);
                        if (rows.length > 0) {
                            const { error } = await supabase.from('oil_imports_by_origin').upsert(rows, {
                                onConflict: 'importer_country_code, exporter_country_code, as_of_date'
                            });
                            if (error) throw error;
                            totalProcessed += rows.length;
                        }
                    }
                }
            } catch (e: any) {
                console.error(`Failed to process ${reporter.id}:`, e);
                lastError = e.message;
            }
        }

        // Also update the OIL_BRENT_PRICE_USD metric
        if (brentData.length > 0) {
            const metricObs = brentData.map((b: any) => ({
                metric_id: 'OIL_BRENT_PRICE_USD',
                as_of_date: `${b.period}-01-01`,
                value: Number(b.value),
                last_updated_at: new Date().toISOString()
            }));
            await supabase.from('metric_observations').upsert(metricObs, {
                onConflict: 'metric_id, as_of_date'
            });
        }

        return new Response(JSON.stringify({
            success: true,
            processed: totalProcessed,
            error: lastError
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
