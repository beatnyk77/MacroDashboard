import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check for stale metrics
        const { data: staleMetrics, error } = await supabaseClient
            .from('metrics_with_staleness')
            .select('*')
            .eq('is_stale', true)

        if (error) throw error

        let message = 'All systems healthy'
        let status = 200

        if (staleMetrics && staleMetrics.length > 0) {
            status = 503 // Service Unavailable semantics
            message = `Found ${staleMetrics.length} stale metrics: ${staleMetrics.map((m: any) => m.metric_key).join(', ')}`
            console.error(message)
            // TODO: Integrate with Resend for email alerts
        } else {
            console.log(message)
        }

        return new Response(JSON.stringify({ status: status === 200 ? 'ok' : 'error', message, stale_count: staleMetrics?.length ?? 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Health check failed:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
