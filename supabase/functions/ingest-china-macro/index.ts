import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Ingest China Macro Pulse Data
 * Syncs with FRED for FX and Gold reserves.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const fredApiKey = Deno.env.get('FRED_API_KEY');

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Starting China Macro Pulse ingestion...');

        const asOfDate = new Date().toISOString().split('T')[0];
        const results = [];

        // 1. Static/NBS Proxy Metrics (until full NBS API integration)
        results.push(
            { metric_id: 'CN_GDP_GROWTH_YOY', value: 5.20 },
            { metric_id: 'CN_CPI_YOY', value: 0.30 },
            { metric_id: 'CN_PPI_YOY', value: -2.50 },
            { metric_id: 'CN_FAI_YOY', value: 3.00 },
            { metric_id: 'CN_IP_YOY', value: 4.60 },
            { metric_id: 'CN_RETAIL_SALES_YOY', value: 7.20 },
            { metric_id: 'CN_CREDIT_IMPULSE', value: 25.40 },
            { metric_id: 'CN_POLICY_RATE', value: 3.10 }
        );

        // 2. FRED-backed Metrics
        if (fredApiKey) {
            const fredMetrics = [
                { id: 'CN_FX_RESERVES', fredId: 'TRESEGCNM052N' },
                { id: 'CN_GOLD_RESERVES', fredId: 'INTLRESGOLDCNM193N' }
            ];

            for (const m of fredMetrics) {
                try {
                    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${m.fredId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.observations?.[0]) {
                        results.push({
                            metric_id: m.id,
                            value: parseFloat(data.observations[0].value),
                            as_of_date: data.observations[0].date
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch FRED ${m.fredId}:`, e);
                }
            }
        }

        const upserts = results.map(r => ({
            metric_id: r.metric_id,
            as_of_date: r.as_of_date || asOfDate,
            value: r.value,
            last_updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('metric_observations')
            .upsert(upserts, { onConflict: 'metric_id, as_of_date' });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: upserts.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('China Macro Ingestion Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
