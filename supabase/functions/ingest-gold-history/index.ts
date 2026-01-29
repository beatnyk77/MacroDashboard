import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting Recent Gold Sync...')

        // 1. Fetch recent monthly data from Yahoo Finance (GC=F) - 5 years for overlap
        const ticker = 'GC=F'
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1mo&range=max`
        const res = await fetch(yahooUrl)
        if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)

        const json = await res.json()
        const result = json.chart?.result?.[0]
        if (!result) throw new Error('Invalid Yahoo structure')

        const timestamps = result.timestamp
        const prices = result.indicators?.quote?.[0]?.close

        const dataMap = new Map()
        timestamps.forEach((ts: number, i: number) => {
            const date = new Date(ts * 1000)
            date.setUTCDate(1)
            date.setUTCHours(0, 0, 0, 0)
            const dateStr = date.toISOString().split('T')[0]
            if (prices[i] !== null && prices[i] > 0) {
                dataMap.set(dateStr, prices[i])
            }
        })

        const data = Array.from(dataMap.entries())
            .map(([date, price]) => ({ date, price }))
            .sort((a, b) => a.date.localeCompare(b.date))

        // 2. Prepare observations
        const observations = []

        for (let i = 0; i < data.length; i++) {
            const current = data[i]

            // Price point
            observations.push({
                metric_id: 'GOLD_PRICE_USD',
                as_of_date: current.date,
                value: current.price,
                last_updated_at: new Date().toISOString()
            })

            // Monthly return
            if (i > 0) {
                const prev = data[i - 1]
                const monthlyReturn = ((current.price - prev.price) / prev.price) * 100

                observations.push({
                    metric_id: 'GOLD_MONTHLY_RETURN',
                    as_of_date: current.date,
                    value: monthlyReturn,
                    last_updated_at: new Date().toISOString()
                })
            }
        }

        console.log(`Upserting ${observations.length} observations...`)

        // Chunked upsert
        const chunkSize = 500
        for (let i = 0; i < observations.length; i += chunkSize) {
            const chunk = observations.slice(i, i + chunkSize)
            const { error } = await supabase.from('metric_observations').upsert(chunk, { onConflict: 'metric_id, as_of_date' })
            if (error) throw error
        }

        return new Response(JSON.stringify({
            message: 'Success',
            syncedPoints: observations.length,
            range: `${data[0].date} to ${data[data.length - 1].date}`
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

