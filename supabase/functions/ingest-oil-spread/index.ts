import { createClient, SupabaseClient } from '@supabase/supabase-js'

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

async function logIngestion(supabase: SupabaseClient, status: string, metadata: unknown) {
    await supabase.from('ingestion_logs').insert({
        function_name: 'ingest-oil-spread',
        status,
        metadata,
        start_time: new Date().toISOString()
    });
}

declare const Deno: any;

Deno.serve(async (_req: Request) => {
    if (_req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const eiaApiKey = Deno.env.get('EIA_API_KEY'); // Use EIA for the reliable spread
    const _avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY'); // Backup/Spot price

    try {
        console.log("Starting Oil Spread Ingestion...");

        // 1. Fetch Front Month (CL1) and Next Month (CL2) from EIA
        // Series IDs: RCLC1 (WTI Future Contract 1), RCLC2 (WTI Future Contract 2)
        const fetchSeries = async (seriesId: string) => {
            const url = `https://api.eia.gov/v2/petroleum/pri/fut/data/?api_key=${eiaApiKey}&facets[series][]=${seriesId}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=10`;
            const res = await fetch(url);
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`EIA Fetch failed for ${seriesId}: ${res.status} ${errorText}`);
            }
            const json = (await res.json()) as any;
            if (!json.response?.data || json.response.data.length === 0) {
                throw new Error(`No data returned from EIA for ${seriesId}`);
            }
            return json.response.data;
        };

        const [cl1Data, cl2Data] = await Promise.all([
            fetchSeries('RCLC1'),
            fetchSeries('RCLC2')
        ]);

        // 2. Align data points - find the most recent dates present in BOTH series
        const commonData: { date: string, cl1: number, cl2: number }[] = [];
        
        for (const r1 of cl1Data) {
            const r2 = cl2Data.find((d: any) => d.period === r1.period);
            if (r2) {
                commonData.push({
                    date: r1.period,
                    cl1: Number(r1.value),
                    cl2: Number(r2.value)
                });
            }
            if (commonData.length >= 5) break;
        }

        if (commonData.length === 0) {
            throw new Error("Could not find any overlapping dates between CL1 and CL2 series in the last 10 days.");
        }

        const latest = commonData[0];
        const latestDate = latest.date;
        const cl1Price = latest.cl1;
        const cl2Price = latest.cl2;
        const spread = cl1Price - cl2Price;
        const regime = classifyRegime(spread);

        // 3. Change Detection
        const prev = commonData[1] || latest;
        const spreadPrev = prev.cl1 - prev.cl2;
        const change_1d = spread - spreadPrev;

        const threeDaysAgo = commonData[3] || prev;
        const spreadThree = threeDaysAgo.cl1 - threeDaysAgo.cl2;
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
                    cl1_series: 'RCLC1',
                    cl2_series: 'RCLC2',
                    computed_at: new Date().toISOString()
                }
            }, { onConflict: 'date' });

        if (dbError) throw dbError;

        await logIngestion(supabase, 'success', { spread, regime, date: latestDate });

        return new Response(JSON.stringify({ success: true, date: latestDate, spread }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        console.error("Ingestion error:", error);
        await logIngestion(supabase, 'FAILED', { error: (error as Error).message });
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
