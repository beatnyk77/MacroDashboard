/* eslint-disable no-undef */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function logIngestion(supabase: SupabaseClient, functionName: string, status: string, metadata: any = {}) {
    await supabase.from('ingestion_logs').insert({
        function_name: functionName,
        status: status,
        metadata: metadata,
        start_time: new Date().toISOString()
    });
}

const WATER_RISK_SEED = [
    { country: 'India', region: 'South Asia', base_stress: 85, base_capex: 120, base_fiscal_stress: 0.8 },
    { country: 'China', region: 'East Asia', base_stress: 78, base_capex: 350, base_fiscal_stress: 0.65 },
    { country: 'USA', region: 'North America', base_stress: 45, base_capex: 180, base_fiscal_stress: 0.4 },
    { country: 'Mexico', region: 'Latin America', base_stress: 82, base_capex: 25, base_fiscal_stress: 0.75 },
    { country: 'Saudi Arabia', region: 'Middle East', base_stress: 95, base_capex: 40, base_fiscal_stress: 0.2 },
    { country: 'Egypt', region: 'Latin America', base_stress: 88, base_capex: 15, base_fiscal_stress: 0.9 },
    { country: 'Iran', region: 'Middle East', base_stress: 92, base_capex: 12, base_fiscal_stress: 0.85 },
    { country: 'Morocco', region: 'Middle East & North Africa', base_stress: 86, base_capex: 8, base_fiscal_stress: 0.78 },
    { country: 'Spain', region: 'Europe', base_stress: 65, base_capex: 22, base_fiscal_stress: 0.5 },
    { country: 'Australia', region: 'Oceania', base_stress: 60, base_capex: 35, base_fiscal_stress: 0.3 }
];

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        console.log('Ingesting water risk metrics data...')

        const asOfDate = new Date().toISOString().split('T')[0];

        // Add some random variation to simulate live metrics updating quarterly
        const variation = () => (Math.random() * 10 - 5); // -5 to +5 variation

        const rows = WATER_RISK_SEED.map(f => {
            const stress_variation = variation();
            const capex_growth = 1 + (Math.random() * 0.05); // 0 to 5% growth
            return {
                country: f.country,
                region: f.region,
                as_of_date: asOfDate,
                water_stress_index: Math.min(100, Math.max(0, f.base_stress + stress_variation)),
                capex_usd_bn: f.base_capex * capex_growth,
                fiscal_stress_correlation: Math.min(1, Math.max(0, f.base_fiscal_stress + (variation() / 100))),
                corporate_water_risk: Math.min(100, Math.max(0, f.base_stress + variation() * 1.5)), // Corporate risk correlated but more volatile
                energy_water_nexus_score: Math.min(100, Math.max(0, (f.base_stress * 0.7) + (Math.random() * 30)))
            };
        });

        const { error } = await supabase
            .from('water_risk_metrics')
            .upsert(rows, { onConflict: 'country, as_of_date' });

        if (error) throw error;

        await logIngestion(supabase, 'ingest-water-risk', 'success', { count: rows.length });

        return new Response(JSON.stringify({ status: 'success', count: rows.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error(error)
        await logIngestion(supabase, 'ingest-water-risk', 'error', { error: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
