import { createClient } from 'jsr:@supabase/supabase-js@2'
import { runIngestion } from '../_shared/logging.ts'
import { 
  fetchAlphaVantageCommodity, 
  fetchAlphaVantageFX, 
  fetchAlphaVantageTimeSeries, 
  fetchAlphaVantageCrypto,
  upsertObservations,
  getActiveMetricsBySource
} from '../_shared/ingest_utils.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Market Pulse Ingestion
 * Migrated from Yahoo Finance to AlphaVantage (Source ID: 47)
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    return await runIngestion(supabase as any, 'ingest-market-pulse', async (ctx) => {
        console.log('Starting Market Pulse ingestion (AlphaVantage)...')

        if (!avApiKey) throw new Error('ALPHAVANTAGE_API_KEY not found in environment')

        // 1. Resolve Active AlphaVantage Metrics
        const metrics = await getActiveMetricsBySource(ctx.supabase, 'AlphaVantage')
        
        if (metrics.length === 0) {
            return { metadata: { message: 'No active AlphaVantage metrics found' } }
        }

        const summary: any[] = []
        let total_rows = 0

        for (const metric of metrics) {
            const meta = (metric.metadata as any) || {}
            const symbol = meta.av_symbol
            const func = meta.av_function

            if (!symbol || !func) {
                console.warn(`Missing AlphaVantage metadata for ${metric.id}`)
                continue
            }

            try {
                console.log(`Fetching ${symbol} via ${func} (${metric.id})...`)
                let data: { date: string, value: number }[] = []

                if (func === 'COMMODITY') {
                    data = await fetchAlphaVantageCommodity(symbol, avApiKey, meta.av_interval || 'daily')
                } else if (func === 'FX_DAILY') {
                    data = await fetchAlphaVantageFX(symbol, meta.av_target_symbol || 'USD', avApiKey)
                } else if (func === 'DIGITAL_CURRENCY_DAILY') {
                    data = await fetchAlphaVantageCrypto(symbol, avApiKey, meta.av_market || 'USD')
                } else if (func === 'TIME_SERIES_DAILY' || func === 'TIME_SERIES_DAILY_ADJUSTED') {
                    data = await fetchAlphaVantageTimeSeries(symbol, avApiKey)
                }

                if (data.length > 0) {
                    // Filter for recent data (last 30 days) for pulse
                    const thirtyDaysAgo = new Date()
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                    
                    const recentData = data
                        .filter(d => new Date(d.date) >= thirtyDaysAgo)
                        .map(d => ({
                            metric_id: metric.id,
                            as_of_date: d.date,
                            value: d.value,
                            last_updated_at: new Date().toISOString()
                        }))

                    if (recentData.length > 0) {
                        const { count } = await upsertObservations(ctx.supabase, recentData)
                        total_rows += count
                        summary.push({ symbol, status: 'success', count })
                    } else {
                        summary.push({ symbol, status: 'no_recent_data' })
                    }
                } else {
                    summary.push({ symbol, status: 'no_data' })
                }

            } catch (e: any) {
                console.error(`Error for ${symbol}:`, e.message)
                summary.push({ symbol, status: 'error', error: e.message })
            }

            // AlphaVantage Free Tier: 5 calls per minute.
            // We wait 12-15 seconds between calls to avoid 429s.
            console.log('Waiting for rate limit clearance...')
            await new Promise(r => setTimeout(r, 13000))
        }

        return { rows_inserted: total_rows, metadata: { summary } }
    })
})
