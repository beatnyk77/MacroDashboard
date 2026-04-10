/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'
import { sendSlackAlert } from '../_shared/slack.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Gold Price Ingestion
 * Sources: 
 * 1. Yahoo Finance (Primary) - Ticker: XAUUSD=X (Spot)
 * 2. GoldAPI (Fallback)
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)
        const goldApiKey = Deno.env.get('GOLDAPI_KEY')

        console.log('Starting Gold Price ingestion...')

        // 1. Resolve Source IDs
        const { data: sources, error: sourceError } = await supabase
            .from('data_sources')
            .select('id, name')
            .in('name', ['FRED', 'Yahoo Finance'])

        if (sourceError) throw sourceError

        // 2. Fetch Gold & Silver Prices
        const metals = [
            { id: 'GOLD_PRICE_USD', ticker: 'GC=F', api_id: 'XAU' },
            { id: 'SILVER_PRICE_USD', ticker: 'SI=F', api_id: 'XAG' }
        ]

        const results = []

        for (const metal of metals) {
            let price: number | null = null
            let sourceUsed = 'Yahoo Finance'
            let asOfDate = new Date().toISOString().split('T')[0]

            // Attempt Yahoo First
            try {
                console.log(`Fetching ${metal.id} from Yahoo Finance (${metal.ticker})...`)
                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${metal.ticker}?interval=1d&range=5d`
                const res = await fetch(yahooUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                })
                if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)

                const json = await res.json()
                const result = json.chart?.result?.[0]
                if (!result) throw new Error('Invalid Yahoo structure')

                const timestamps = result.timestamp
                const quotes = result.indicators?.quote?.[0]?.close

                if (timestamps && quotes) {
                    for (let i = timestamps.length - 1; i >= 0; i--) {
                        if (quotes[i]) {
                            price = quotes[i]
                            asOfDate = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
                            break
                        }
                    }
                }
            } catch (e) {
                console.warn(`Yahoo fetch failed for ${metal.id}:`, e)
            }

            // Fallback to GoldAPI
            if (!price && goldApiKey) {
                try {
                    console.log(`Fetching ${metal.id} from GoldAPI...`)
                    sourceUsed = 'GoldAPI'
                    const res = await fetch(`https://www.goldapi.io/api/${metal.api_id}/USD`, {
                        headers: { 'x-access-token': goldApiKey }
                    })
                    if (res.ok) {
                        const json = await res.json()
                        price = json.price
                        asOfDate = new Date().toISOString().split('T')[0]
                    }
                } catch (e) {
                    console.error(`GoldAPI fetch failed for ${metal.id}:`, e)
                }
            }

            if (price) {
                console.log(`Fetched ${metal.id}: $${price} (${asOfDate}) from ${sourceUsed}`)
                const { error: upsertError } = await supabase
                    .from('metric_observations')
                    .upsert({
                        metric_id: metal.id,
                        as_of_date: asOfDate,
                        value: price,
                        last_updated_at: new Date().toISOString(),
                        metadata: { source_used: sourceUsed }
                    }, { onConflict: 'metric_id, as_of_date' })

                if (upsertError) console.error(`Upsert error for ${metal.id}:`, upsertError)
                results.push({ metal: metal.id, price, date: asOfDate, source: sourceUsed })
            }
        }

        return new Response(JSON.stringify({
            message: 'Success',
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Error:', error.message)
        await sendSlackAlert(`GraphiQuestor ingestion failed: ingest-gold - ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
