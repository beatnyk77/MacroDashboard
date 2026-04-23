import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function classifyRegime(spread: number): 'OVERSUPPLY' | 'NORMAL' | 'TIGHTENING' | 'STRESSED' | 'EXTREME' {
    if (spread > 16) return 'EXTREME';
    if (spread > 10) return 'STRESSED';
    if (spread > 5) return 'TIGHTENING';
    if (spread < -5) return 'OVERSUPPLY';
    return 'NORMAL';
}

async function logIngestion(supabase: SupabaseClient, status: string, metadata: any) {
    await supabase.from('ingestion_logs').insert({
        function_name: 'ingest-oil-spread',
        status,
        metadata,
        start_time: new Date().toISOString()
    });
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const eiaApiKey = Deno.env.get('EIA_API_KEY'); // Use EIA for the reliable spread
    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY'); // Backup/Spot price

    try {
        console.log("Starting Oil Spread Ingestion...");

        // 1. Fetch Front Month (CL1) and Next Month (CL2) from EIA
        // Series IDs: PET.RWTC1.D, PET.RWTC2.D
        const fetchSeries = async (seriesId: string) => {
            const url = `https://api.eia.gov/v2/seriesid/${seriesId}/data?api_key=${eiaApiKey}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=5`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`EIA Fetch failed for ${seriesId}`);
            const json = await res.json();
            return json.response.data;
        };

        const [cl1Data, cl2Data] = await Promise.all([
            fetchSeries('PET.RWTC1.D'),
            fetchSeries('PET.RWTC2.D')
        ]);

        if (!cl1Data || !cl2Data || cl1Data.length === 0 || cl2Data.length === 0) {
            throw new Error("Empty data returned from EIA");
        }

        // Align dates (most recent common date)
        const latestDate = cl1Data[0].period;
        const cl1Price = Number(cl1Data[0].value);
        
        // Find matching date in CL2
        const cl2Match = cl2Data.find((d: any) => d.period === latestDate);
        if (!cl2Match) throw new Error(`No matching date for CL2 on ${latestDate}`);
        const cl2Price = Number(cl2Match.value);

        const spread = cl1Price - cl2Price;
        const regime = classifyRegime(spread);

        // 2. Change Detection (vs previous day common to both)
        const prevDate = cl1Data[1].period;
        const cl1Prev = Number(cl1Data[1].value);
        const cl2PrevMatch = cl2Data.find((d: any) => d.period === prevDate);
        const cl2Prev = cl2PrevMatch ? Number(cl2PrevMatch.value) : cl1Prev - 1.0; // Fallback
        const spreadPrev = cl1Prev - cl2Prev;
        
        const change_1d = spread - spreadPrev;

        // 3. 3-Day Change
        const threeDaysAgoDate = cl1Data[3]?.period;
        const cl1Three = Number(cl1Data[3]?.value || cl1Data[1].value);
        const cl2ThreeMatch = cl2Data.find((d: any) => d.period === threeDaysAgoDate);
        const cl2Three = cl2ThreeMatch ? Number(cl2ThreeMatch.value) : cl1Three - 1.0;
        const spreadThree = cl1Three - cl2Three;
        const change_3d = spread - spreadThree;

        // 4. Upsert to DB
        const { error: dbError } = await supabase
            .from('oil_market_spread')
            .upsert({
                date: latestDate,
                front_price: cl1Price,
                next_price: cl2Price,
                spread: spread,
                regime: regime,
                change_1d: change_1d,
                change_3d: change_3d,
                metadata: {
                    source: 'EIA',
                    cl1_series: 'PET.RWTC1.D',
                    cl2_series: 'PET.RWTC2.D',
                    computed_at: new Date().toISOString()
                }
            }, { onConflict: 'date' });

        if (dbError) throw dbError;

        await logIngestion(supabase, 'success', { spread, regime, date: latestDate });

        return new Response(JSON.stringify({
            ok: true,
            date: latestDate,
            spread,
            regime,
            cl1: cl1Price,
            cl2: cl2Price
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        console.error('[ingest-oil-spread]', err);
        await logIngestion(supabase, 'failed', { error: String(err) });
        return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
