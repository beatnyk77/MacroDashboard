import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Gold Price Ingestion
 * Sources: 
 * 1. Yahoo Finance (Primary) - Ticker: GC=F
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
            .in('name', ['FRED', 'Yahoo Finance']) // Gold ID is historically mapped to FRED source_id, we might need to update this logic if we want to be strict, but for now we write to Metric ID 'GOLD_PRICE_USD' regardless of source

        if (sourceError) throw sourceError

        // 2. Fetch Gold Price
        let price: number | null = null
        let sourceUsed = 'Yahoo Finance'
        let asOfDate = new Date().toISOString().split('T')[0]

        // Attempt Yahoo First
        try {
            console.log('Fetching from Yahoo Finance (GC=F)...')
            const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=25y'
            const res = await fetch(yahooUrl)
            if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)

            const json = await res.json()
            const result = json.chart?.result?.[0]
            if (!result) throw new Error('Invalid Yahoo structure')

            const timestamps = result.timestamp
            const quotes = result.indicators?.quote?.[0]?.close

            if (timestamps && quotes) {
                // Get last non-null price
                for (let i = timestamps.length - 1; i >= 0; i--) {
                    if (quotes[i]) {
                        price = quotes[i]
                        asOfDate = new Date(timestamps[i] * 1000).toISOString().split('T')[0]
                        break
                    }
                }
            }
        } catch (e) {
            console.warn('Yahoo fetch failed:', e)
        }

        // Attempt GoldAPI Fallback if Yahoo failed or returned null
        if (!price && goldApiKey) {
            try {
                console.log('Fetching from GoldAPI...')
                sourceUsed = 'GoldAPI'
                const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
                    headers: { 'x-access-token': goldApiKey }
                })
                if (!res.ok) throw new Error(`GoldAPI HTTP ${res.status}`)
                const json = await res.json()
                price = json.price
                // GoldAPI returns live price, assume today
                asOfDate = new Date().toISOString().split('T')[0]
            } catch (e) {
                console.error('GoldAPI fetch failed:', e)
            }
        }

        if (!price) {
            throw new Error('Failed to fetch gold price from all sources')
        }

        console.log(`Fetched Gold Price: $${price} (${asOfDate}) from ${sourceUsed}`)

        // 3. Upsert to DB
        // Metric ID: GOLD_PRICE_USD
        const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert({
                metric_id: 'GOLD_PRICE_USD',
                as_of_date: asOfDate,
                value: price,
                last_updated_at: new Date().toISOString(),
                metadata: { source_used: sourceUsed }
            }, { onConflict: 'metric_id, as_of_date' })

        if (upsertError) throw upsertError

        return new Response(JSON.stringify({
            message: 'Success',
            price,
            date: asOfDate,
            source: sourceUsed
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
