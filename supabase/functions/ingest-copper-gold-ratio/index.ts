import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchYahooFinance(ticker: string) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Yahoo HTTP ${resp.status} for ${ticker}`)
    const json = await resp.json()
    const result = json.chart?.result?.[0]
    if (!result) throw new Error(`Invalid Yahoo structure for ${ticker}`)

    const timestamps = result.timestamp
    const quotes = result.indicators?.quote?.[0]?.close

    if (timestamps && quotes) {
        for (let i = timestamps.length - 1; i >= 0; i--) {
            if (quotes[i]) {
                return {
                    price: quotes[i],
                    date: new Date(timestamps[i] * 1000).toISOString().split('T')[0]
                }
            }
        }
    }
    throw new Error(`No recent data found for ${ticker}`)
}

// @ts-ignore: Deno is available in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseClient = createClient(
        // @ts-ignore: Deno is available in Supabase Edge Functions
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore: Deno is available in Supabase Edge Functions
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    return runIngestion(supabaseClient, 'ingest-copper-gold-ratio', async (ctx) => {
        console.log('Fetching Copper (HG=F) and Gold (GC=F) prices...')

        const [copper, gold] = await Promise.all([
            fetchYahooFinance('HG=F'),
            fetchYahooFinance('GC=F')
        ])

        const ratio = copper.price / gold.price
        const asOfDate = copper.date // Use copper date as primary

        console.log(`Copper: ${copper.price}, Gold: ${gold.price}, Ratio: ${ratio} on ${asOfDate}`)

        const observations = [
            {
                metric_id: 'COPPER_PRICE_USD',
                as_of_date: copper.date,
                value: copper.price,
                last_updated_at: new Date().toISOString()
            },
            {
                metric_id: 'COPPER_GOLD_RATIO',
                as_of_date: asOfDate,
                value: ratio,
                last_updated_at: new Date().toISOString(),
                metadata: { copper_price: copper.price, gold_price: gold.price }
            }
        ]

        const { error } = await ctx.supabase
            .from('metric_observations')
            .upsert(observations, { onConflict: 'metric_id, as_of_date' })

        if (error) throw error

        return {
            rows_inserted: observations.length,
            metadata: {
                copper: copper.price,
                gold: gold.price,
                ratio: ratio,
                date: asOfDate
            }
        }
    })
})
