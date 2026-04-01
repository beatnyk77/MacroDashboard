import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        const eiaApiKey = Deno.env.get('EIA_API_KEY');
        const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Starting Commodity Terminal Ingestion...");

        // 1. Commodity Prices (FRED)
        // Mappings: WTI (DCOILWTICO), BRENT (DCOILBRENTEU), COPPER (PCOPPUSDM), NICKEL (PNICKUSDM)
        const priceSeries = [
            { id: 'DCOILWTICO', metric_id: 'WTI_CRUDE_PRICE' },
            { id: 'DCOILBRENTEU', metric_id: 'BRENT_CRUDE_PRICE' },
            { id: 'PCOPPUSDM', metric_id: 'COPPER_PRICE_USD' },
            { id: 'PNICKUSDM', metric_id: 'NICKEL_PRICE_USD' }
        ];

        let pricesProcessed = 0;
        if (fredApiKey) {
            // Check for 'backfill' query param
            const urlObj = new URL(req.url);
            const isBackfill = urlObj.searchParams.get('backfill') === 'true';
            const limit = isBackfill ? 1000 : 5; // 1000 observations ~4 years of daily or 20 years of monthly/weekly

            for (const series of priceSeries) {
                const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series.id}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=${limit}`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json() as { observations: any[] };
                    const observations = (json.observations || [])
                        .filter((o: any) => o.value !== '.')
                        .map((o: any) => ({
                            metric_id: series.metric_id,
                            as_of_date: o.date,
                            value: parseFloat(o.value),
                            last_updated_at: new Date().toISOString()
                        }));

                    if (observations.length > 0) {
                        const { error } = await supabase
                            .from('metric_observations')
                            .upsert(observations, { onConflict: 'metric_id, as_of_date' });
                        if (!error) pricesProcessed += observations.length;
                    }
                }
            }
        }

        // 2. Commodity Reserves (EIA SPR)
        let reservesProcessed = 0;
        if (eiaApiKey) {
            const sprUrl = `https://api.eia.gov/v2/petroleum/stoc/wrs/data/?api_key=${eiaApiKey}&frequency=weekly&data[0]=value&facets[series][]=WCSSTUS1&sort[0][column]=period&sort[0][direction]=desc&length=1`;
            const res = await fetch(sprUrl);
            if (res.ok) {
                const json = await res.json() as { response: { data: any[] } };
                const latest = json.response?.data?.[0];
                if (latest) {
                    const { error } = await supabase.from('commodity_reserves').upsert({
                        country: 'US',
                        commodity: 'Crude Oil',
                        volume: parseFloat(latest.value),
                        reserve_type: 'strategic',
                        as_of_date: latest.period + '-01' // EIA period format varies, adjust as needed
                    }, { onConflict: 'country, commodity, reserve_type, as_of_date' });
                    if (!error) reservesProcessed++;
                }
            }
        }

        // 3. Commodity Flows (High-Fidelity Mock for Global Trade)
        // Includes: Oil (China/India/EU), Minerals (Lithium/Cobalt/Nickel), Ag (Wheat/Corn)
        const mockFlows = [
            // Energy - Oil
            { source: 'Saudi Arabia', target: 'China', commodity: 'Crude Oil', volume: 1750, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Russia', target: 'China', commodity: 'Crude Oil', volume: 2100, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Iraq', target: 'India', commodity: 'Crude Oil', volume: 1100, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Russia', target: 'India', commodity: 'Crude Oil', volume: 1600, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'US', target: 'Europe', commodity: 'Crude Oil', volume: 1800, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Saudi Arabia', target: 'Europe', commodity: 'Crude Oil', volume: 900, as_of_date: new Date().toISOString().split('T')[0] },

            // Metals - Battery & Infrastructure
            { source: 'Australia', target: 'China', commodity: 'Iron Ore', volume: 750, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Brazil', target: 'China', commodity: 'Iron Ore', volume: 420, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Chile', target: 'China', commodity: 'Lithium', volume: 45, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Australia', target: 'China', commodity: 'Lithium', volume: 55, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'DRC', target: 'China', commodity: 'Cobalt', volume: 85, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Indonesia', target: 'China', commodity: 'Nickel', volume: 320, as_of_date: new Date().toISOString().split('T')[0] },

            // Agriculture - Food Security
            { source: 'Brazil', target: 'China', commodity: 'Soybeans', volume: 550, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'US', target: 'China', commodity: 'Soybeans', volume: 380, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Ukraine', target: 'Europe', commodity: 'Wheat', volume: 120, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Russia', target: 'Egypt', commodity: 'Wheat', volume: 90, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'US', target: 'Mexico', commodity: 'Corn', volume: 210, as_of_date: new Date().toISOString().split('T')[0] }
        ];
        const { error: flowError } = await supabase.from('commodity_flows').upsert(mockFlows, { onConflict: 'source, target, commodity, as_of_date' });

        // 4. Commodity Events (Simulated GDELT/ACLED Data)
        const mockEvents = [
            { lat: 12.0, lng: 45.0, event_type: 'Disruption', description: 'Red Sea: Houthi Drone Attack - Transit halted', severity: 'high', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: -11.0, lng: 26.0, event_type: 'Mine Shutdown', description: 'DRC: Tenke Fungurume Cobalt Strike', severity: 'medium', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: 29.5, lng: 47.5, event_type: 'Geopolitical', description: 'Kuwait: Worker Strike at Export Terminal', severity: 'medium', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: 9.0, lng: -79.5, event_type: 'Logistics', description: 'Panama Canal: Additional Draft Restrictions', severity: 'medium', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: 30.5, lng: -90.0, event_type: 'Weather', description: 'US Gulf Coast: Hurricane Watch - Refining Risk', severity: 'high', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: -25.0, lng: 133.0, event_type: 'Infrastructure', description: 'Australia: Pilbara Rail Maintenance - Iron Ore Delays', severity: 'low', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: 46.0, lng: 30.0, event_type: 'Conflict', description: 'Black Sea: Grain Corridor Uncertainty', severity: 'high', as_of_date: new Date().toISOString().split('T')[0] }
        ];
        const { error: eventError } = await supabase.from('commodity_events').upsert(mockEvents);

        return new Response(JSON.stringify({
            success: true,
            processed: { prices: pricesProcessed, reserves: reservesProcessed, flows: mockFlows.length, events: mockEvents.length }
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
