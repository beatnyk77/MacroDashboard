import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/slack.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Precious Metals Divergence Ingestion
 * Source: Yahoo Finance
 * Calculates spread between COMEX and Shanghai physical proxies.
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting Precious Metals Divergence ingestion...')

        // 1. Fetch required data from Yahoo Finance
        const tickers = {
            gold_comex: 'GC=F',
            gold_shanghai: 'XAUCNY=X',
            silver_comex: 'SI=F',
            silver_shanghai: 'XAGCNY=X',
            usdcny: 'USDCNY=X'
        }

        const data: Record<string, number> = {}
        const today = new Date().toISOString().split('T')[0]

        for (const [key, ticker] of Object.entries(tickers)) {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`
            const res = await fetch(url)
            if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`)

            const json = await res.json()
            const result = json.chart?.result?.[0]
            if (!result) throw new Error(`Invalid Yahoo structure for ${ticker}`)

            const quotes = result.indicators?.quote?.[0]?.close
            if (!quotes || quotes.length === 0) throw new Error(`No data for ${ticker}`)

            // Get latest non-null value
            const latestValue = [...quotes].reverse().find(v => v !== null && v !== undefined)
            if (latestValue === undefined) throw new Error(`All quotes null for ${ticker}`)

            data[key] = latestValue
        }

        console.log('Raw data fetched:', data)

        // 2. Compute Spreads
        // Shanghai prices (XAUCNY=X, XAGCNY=X) are already quoted in CNY/oz in Yahoo (usually)
        // Let's verify: XAUCNY=X is Spot Gold in CNY.
        // We need to convert Shanghai CNY/oz to USD/oz using USDCNY=X
        const usdcny = data.usdcny
        const gold_shanghai_usd = data.gold_shanghai / usdcny
        const silver_shanghai_usd = data.silver_shanghai / usdcny

        const gold_spread_pct = ((gold_shanghai_usd - data.gold_comex) / data.gold_comex) * 100
        const silver_spread_pct = ((silver_shanghai_usd - data.silver_comex) / data.silver_comex) * 100

        // 3. Prepare metric observations
        const observations = [
            { metric_id: 'GOLD_COMEX_USD', value: data.gold_comex, as_of_date: today },
            { metric_id: 'GOLD_SHANGHAI_USD', value: gold_shanghai_usd, as_of_date: today },
            { metric_id: 'GOLD_COMEX_SHANGHAI_SPREAD_PCT', value: gold_spread_pct, as_of_date: today },
            { metric_id: 'SILVER_COMEX_USD', value: data.silver_comex, as_of_date: today },
            { metric_id: 'SILVER_SHANGHAI_USD', value: silver_shanghai_usd, as_of_date: today },
            { metric_id: 'SILVER_COMEX_SHANGHAI_SPREAD_PCT', value: silver_spread_pct, as_of_date: today }
        ].map(obs => ({
            ...obs,
            last_updated_at: new Date().toISOString()
        }))

        const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert(observations, { onConflict: 'metric_id, as_of_date' })

        if (upsertError) throw upsertError

        console.log('Ingestion successful')

        return new Response(JSON.stringify({
            message: 'Ingestion complete',
            data: {
                gold_spread_pct,
                silver_spread_pct,
                gold_comex: data.gold_comex,
                gold_shanghai_usd,
                silver_comex: data.silver_comex,
                silver_shanghai_usd
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Master Error:', error.message)
        await sendSlackAlert(`GraphiQuestor ingestion failed: ingest-precious-divergence - ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
