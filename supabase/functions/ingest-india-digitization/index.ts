import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { INITIAL_DIGITIZATION_DATA } from './data.ts'

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
        console.log('Starting India Digitization & Formalization ingestion...')

        const results = INITIAL_DIGITIZATION_DATA;

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('india_digitization_premium')
                .upsert(results, { onConflict: 'date' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            results_count: results.length,
            latest_date: results[results.length - 1].date,
            latest_upi_vol: results[results.length - 1].upi_volume_bn,
            latest_dpi: results[results.length - 1].rbi_dpi_index
        };

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('India Digitization Ingestion error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
