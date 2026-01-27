import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get Source ID for FiscalData
        let { data: sourceData, error: sourceError } = await supabaseClient
            .from('data_sources')
            .select('id')
            .eq('name', 'FiscalData')
            .single()

        if (sourceError || !sourceData) {
            // Fallback: try 'UST' if 'FiscalData' not found
            const { data: sourceDataUst, error: sourceErrorUst } = await supabaseClient
                .from('data_sources')
                .select('id')
                .eq('name', 'UST')
                .single()

            if (sourceErrorUst || !sourceDataUst) {
                throw new Error('FiscalData/UST data source not found in database')
            }
            sourceData = sourceDataUst;
        }
        const sourceId = sourceData.id

        // 2. Fetch FiscalData metrics
        const { data: metrics, error: metricsError } = await supabaseClient
            .from('metrics')
            .select('id, metadata') // No metric_key in new schema, check metadata or id
            .eq('source_id', sourceId)
            .eq('is_active', true)

        if (metricsError) throw metricsError
        if (!metrics || metrics.length === 0) {
            return new Response(JSON.stringify({ message: 'No active FiscalData metrics found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const results = []

        for (const metric of metrics) {
            // Identify if this metric is Total Public Debt
            // Check metadata.fiscal_service_endpoint or similar, or just ID convention
            // For now, assume ID 'UST_TOTAL_PUBLIC_DEBT' or metadata flag
            // Safely access metadata properties with optional chaining and type assertion if needed
            const metadata = metric.metadata as { endpoint?: string } | null;
            const isTotalDebt = metric.id === 'UST_TOTAL_PUBLIC_DEBT' || metadata?.endpoint === 'debt_to_penny';

            if (isTotalDebt) {
                // Fetch Debt to the Penny
                // Endpoint: https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny
                // Sort by date desc, limit 100
                const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=100'

                console.log(`Fetching Debt to Penny for metric ${metric.id}...`)
                try {
                    const response = await fetch(url)
                    const data = await response.json()

                    if (!data.data) {
                        throw new Error('No data returned from FiscalData API')
                    }

                    const observations = data.data.map((obs: any) => ({
                        metric_id: metric.id,
                        as_of_date: obs.record_date, // Map to new schema
                        value: parseFloat(obs.tot_pub_debt_out_amt),
                    })).filter((o: any) => !isNaN(o.value))

                    if (observations.length > 0) {
                        const { error: upsertError } = await supabaseClient
                            .from('metric_observations')
                            .upsert(observations, { onConflict: 'metric_id, as_of_date' })

                        if (upsertError) {
                            console.error(`Error upserting ${metric.id}:`, upsertError)
                            results.push({ metric: metric.id, status: 'db_error', error: upsertError.message })
                        } else {
                            // Staleness computed by view
                            results.push({ metric: metric.id, status: 'success', count: observations.length })
                        }
                    } else {
                        results.push({ metric: metric.id, status: 'no_data' })
                    }
                } catch (err: any) {
                    console.error(`Error fetching ${metric.id}:`, err)
                    results.push({ metric: metric.id, status: 'error', error: err.message || String(err) })
                }
            } else {
                // Other endpoints can be added here
                results.push({ metric: metric.id, status: 'skipped', message: 'Endpoint logic not implemented' })
            }

            // Rate limit
            await new Promise(resolve => setTimeout(resolve, 500))
        }

        return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
