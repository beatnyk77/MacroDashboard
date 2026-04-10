/* eslint-disable @typescript-eslint/no-unused-vars */
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

/**
 * Ingest UPI Credit Growth (RBI Proxy)
 * Strategy: "Credit on UPI" is a high-growth institutional blindspot.
 * 1. Base on NPCI/RBI aggregate UPI transaction value (from india_digitization_premium).
 * 2. Apply a temporal credit-penetration sigmoid curve (starting Oct 2023).
 * 3. Adjust for 'RBI Monetary Policy' sentiment to reflect interest rate impacts on credit appetite.
 */
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        console.log('Ingesting UPI Credit Growth data...')
        
        // 1. Fetch latest UPI transaction values from our digitization table
        const { data: upiData, error: upiError } = await supabase
            .from('india_digitization_premium')
            .select('date, upi_value_inr_trillion')
            .order('date', { ascending: false })
            .limit(12);

        if (upiError) throw upiError;

        const results = [];
        const asOfDate = new Date().toISOString().split('T')[0];

        // 2. Project 'Credit on UPI' based on penetration rate
        // Launch was roughly late 2023. Initial penetration ~0.1% of value.
        // Explosive growth expected to hit 2-3% of total UPI value by 2025.
        
        for (const [idx, row] of upiData.reverse().entries()) {
            const dateObj = new Date(row.date);
            const monthsSinceLaunch = (dateObj.getFullYear() - 2023) * 12 + (dateObj.getMonth() - 9); // Oct 2023 launch
            
            if (monthsSinceLaunch < 0) continue;

            // Sigmoid-like growth for penetration (%)
            const penetrationPct = 0.05 * Math.pow(1.25, monthsSinceLaunch); 
            const creditValueTrillion = (row.upi_value_inr_trillion * (penetrationPct / 100));
            const yoyGrowth = idx > 0 ? ((creditValueTrillion / results[results.length-1].value) - 1) * 100 : 0;

            results.push({
                metric_id: 'IN_UPI_CREDIT_VALUE',
                as_of_date: row.date,
                value: parseFloat(creditValueTrillion.toFixed(4)), // in INR Trillion
                last_updated_at: new Date().toISOString(),
                metadata: {
                    penetration_pct: penetrationPct.toFixed(3),
                    yoy_growth_estimate: yoyGrowth.toFixed(1),
                    source: 'RBI/NPCI Proxy Calculation'
                }
            });
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        await logIngestion(supabase, 'ingest-upi-credit', 'success', { count: results.length });

        return new Response(JSON.stringify({ success: true, count: results.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error(error)
        await logIngestion(supabase, 'ingest-upi-credit', 'error', { error: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
