import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { INITIAL_INDIA_DEBT_DATA } from './data.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        console.log('Starting India Debt Maturity ingestion...')

        // Calculate totals for percent_total calculation
        const centralTotal = INITIAL_INDIA_DEBT_DATA
            .filter(d => d.type === 'central')
            .reduce((sum, d) => sum + d.amount_crore, 0);

        const stateTotal = INITIAL_INDIA_DEBT_DATA
            .filter(d => d.type === 'state')
            .reduce((sum, d) => sum + d.amount_crore, 0);

        const results = INITIAL_INDIA_DEBT_DATA.map(d => ({
            ...d,
            percent_total: d.type === 'central'
                ? (d.amount_crore / centralTotal) * 100
                : (d.amount_crore / stateTotal) * 100,
            updated_at: new Date().toISOString()
        }));

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('india_debt_maturities')
                .upsert(results, { onConflict: 'date, bucket, type' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            results_count: results.length,
            central_total_crore: centralTotal,
            state_total_crore: stateTotal
        };

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('India Debt Ingestion error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
