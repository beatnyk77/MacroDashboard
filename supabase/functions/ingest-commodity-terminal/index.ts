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

        // 1. Commodity Prices (FRED & Mock for Futures)
        // Symbols: WTI (DCOILWTICO), BRENT (DCOILBRENTEU), COPPER (PCOPPUSDM), WHEAT (PWHEAMT), CORN (PCORNUSDM)
        const priceSeries = [
            { id: 'DCOILWTICO', symbol: 'WTI', category: 'Energy' },
            { id: 'DCOILBRENTEU', symbol: 'Brent', category: 'Energy' },
            { id: 'PCOPPUSDM', symbol: 'Copper', category: 'Metals' },
            { id: 'PNICKUSDM', symbol: 'Nickel', category: 'Metals' },
            { id: 'PWHEAMT', symbol: 'Wheat', category: 'Ag' },
            { id: 'PCORNUSDM', symbol: 'Corn', category: 'Ag' }
        ];

        let pricesProcessed = 0;
        if (fredApiKey) {
            for (const series of priceSeries) {
                const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series.id}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    const latest = json.observations?.[0];
                    if (latest && latest.value !== '.') {
                        const { error } = await supabase.from('commodity_prices').upsert({
                            symbol: series.symbol,
                            as_of_date: latest.date,
                            price: parseFloat(latest.value),
                            curve_type: 'spot'
                        }, { onConflict: 'symbol, as_of_date, curve_type' });
                        if (!error) pricesProcessed++;
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
                const json = await res.json();
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

        // 3. Commodity Flows (Mock for India/China expansion)
        const mockFlows = [
            { source: 'Australia', target: 'China', commodity: 'Iron Ore', volume: 750, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Brazil', target: 'China', commodity: 'Soybeans', volume: 420, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'DRC', target: 'China', commodity: 'Cobalt', volume: 15, as_of_date: new Date().toISOString().split('T')[0] },
            { source: 'Australia', target: 'India', commodity: 'Coal', volume: 180, as_of_date: new Date().toISOString().split('T')[0] }
        ];
        const { error: flowError } = await supabase.from('commodity_flows').upsert(mockFlows, { onConflict: 'source, target, commodity, as_of_date' });

        // 4. Commodity Events (Mock Disruption Events)
        const mockEvents = [
            { lat: 12.0, lng: 45.0, event_type: 'Disruption', description: 'Red Sea Transit Delay', severity: 'high', as_of_date: new Date().toISOString().split('T')[0] },
            { lat: -11.0, lng: 26.0, event_type: 'Mine Shutdown', description: 'DRC Cobalt Mine Strike', severity: 'medium', as_of_date: new Date().toISOString().split('T')[0] }
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
