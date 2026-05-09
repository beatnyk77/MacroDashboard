import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { fetchAlphaVantageCommodity, upsertObservations } from '../_shared/ingest_utils.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Gold & Silver Price Ingestion
 * Source: AlphaVantage (Commodities API)
 */
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

    return runIngestion(supabase, 'ingest-gold', async (ctx) => {
        console.log('Fetching Gold and Silver prices from AlphaVantage...')

        // 1. Fetch Daily Gold & Silver
        // AlphaVantage Commodities API returns historical daily data
        const [goldData, silverData] = await Promise.all([
            fetchAlphaVantageCommodity('GOLD', avApiKey, 'daily'),
            fetchAlphaVantageCommodity('SILVER', avApiKey, 'daily')
        ])

        const observations: any[] = []

        // Process Gold
        if (goldData.length > 0) {
            // Upsert last 30 days to ensure no gaps from weekends/holidays
            const recentGold = goldData.slice(0, 30)
            recentGold.forEach(d => {
                observations.push({
                    metric_id: 'GOLD_PRICE_USD',
                    as_of_date: d.date,
                    value: d.value,
                    metadata: { source: 'AlphaVantage', unit: 'USD/oz' }
                })
            })
        }

        // Process Silver
        if (silverData.length > 0) {
            const recentSilver = silverData.slice(0, 30)
            recentSilver.forEach(d => {
                observations.push({
                    metric_id: 'SILVER_PRICE_USD',
                    as_of_date: d.date,
                    value: d.value,
                    metadata: { source: 'AlphaVantage', unit: 'USD/oz' }
                })
            })
        }

        if (observations.length === 0) {
            throw new Error('No data fetched for Gold or Silver')
        }

        console.log(`Upserting ${observations.length} observations...`)

        const { count } = await upsertObservations(ctx.supabase, observations)

        return {
            rows_inserted: count,
            metadata: {
                gold_points: goldData.length > 0 ? 30 : 0,
                silver_points: silverData.length > 0 ? 30 : 0,
                latest_gold: goldData[0]?.value,
                latest_silver: silverData[0]?.value,
                latest_date: goldData[0]?.date
            }
        }
    })
})
