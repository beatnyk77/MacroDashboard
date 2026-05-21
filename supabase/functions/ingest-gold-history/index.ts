/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { fetchAlphaVantageCommodity, upsertObservations } from '../_shared/ingest_utils.ts'

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

    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY')
    if (!avApiKey) {
        return new Response(JSON.stringify({ error: 'ALPHAVANTAGE_API_KEY not found' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return runIngestion(supabase, 'ingest-gold-history', async (ctx) => {
        console.log('Starting Gold History Sync from AlphaVantage...')

        // 1. Fetch monthly gold data from AlphaVantage
        const goldData = await fetchAlphaVantageCommodity('GOLD', avApiKey, 'monthly')
        
        if (goldData.length === 0) {
            throw new Error('No gold data returned from AlphaVantage')
        }

        // AV returns data latest first (usually), sort it ascending to calculate returns
        const sortedData = [...goldData].sort((a, b) => a.date.localeCompare(b.date))

        // 2. Prepare observations
        const observations = []

        for (let i = 0; i < sortedData.length; i++) {
            const current = sortedData[i]

            // Price point
            observations.push({
                metric_id: 'GOLD_PRICE_USD',
                as_of_date: current.date,
                value: current.value,
                metadata: { source: 'AlphaVantage', unit: 'USD/oz' }
            })

            // Monthly return
            if (i > 0) {
                const prev = sortedData[i - 1]
                if (prev.value > 0) {
                    const monthlyReturn = ((current.value - prev.value) / prev.value) * 100
                    observations.push({
                        metric_id: 'GOLD_MONTHLY_RETURN',
                        as_of_date: current.date,
                        value: monthlyReturn,
                        metadata: { source: 'AlphaVantage', unit: '%' }
                    })
                }
            }
        }

        console.log(`Upserting ${observations.length} observations...`)

        // upsertObservations handles the updated_at logic for the metric
        const { count } = await upsertObservations(ctx.supabase, observations)

        return {
            rows_inserted: count,
            metadata: {
                range: `${sortedData[0].date} to ${sortedData[sortedData.length - 1].date}`,
                points: sortedData.length
            }
        }
    })
})

