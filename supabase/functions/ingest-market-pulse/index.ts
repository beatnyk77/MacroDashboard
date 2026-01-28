import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/slack.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Market Pulse Ingestion
 * Source: Yahoo Finance
 * Tickers: GC=F (Gold), CL=F (WTI), SI=F (Silver), DX-Y.NYB (DXY), ^VIX (VIX)
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('Starting Market Pulse ingestion...')

        // 1. Resolve Active Yahoo Metrics
        const { data: metrics, error: metricsError } = await supabase
            .from('metrics')
            .select('id, metadata')
            .eq('source_id', 6) // Yahoo Finance source_id
            .eq('is_active', true)

        if (metricsError) throw metricsError
        if (!metrics || metrics.length === 0) {
            return new Response(JSON.stringify({ message: 'No active Yahoo metrics found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const summary: any[] = []

        for (const metric of metrics) {
            const ticker = (metric.metadata as any)?.yahoo_ticker
            if (!ticker) continue

            try {
                console.log(`Fetching ${ticker} (${metric.id})...`)
                // Fetching 3 months for some history, but we mainly care about latest for pulse
                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`
                const res = await fetch(yahooUrl)
                if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)

                const json = await res.json()
                const result = json.chart?.result?.[0]
                if (!result) throw new Error(`Invalid Yahoo structure for ${ticker}`)

                const timestamps = result.timestamp
                const quotes = result.indicators?.quote?.[0]?.close

                if (!timestamps || !quotes) throw new Error(`Empty data for ${ticker}`)

                const cleanData = []
                for (let i = 0; i < timestamps.length; i++) {
                    if (quotes[i] !== null && quotes[i] !== undefined) {
                        cleanData.push({
                            metric_id: metric.id,
                            as_of_date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
                            value: quotes[i],
                            last_updated_at: new Date().toISOString()
                        })
                    }
                }

                if (cleanData.length > 0) {
                    const { error: upsertError } = await supabase
                        .from('metric_observations')
                        .upsert(cleanData, { onConflict: 'metric_id, as_of_date' })

                    if (upsertError) throw upsertError
                    summary.push({ ticker, status: 'success', count: cleanData.length })
                } else {
                    summary.push({ ticker, status: 'no_data' })
                }

            } catch (e: any) {
                console.error(`Error for ${ticker}:`, e.message)
                summary.push({ ticker, status: 'error', error: e.message })
            }

            // Polite delay
            await new Promise(r => setTimeout(r, 500))
        }

        return new Response(JSON.stringify({ message: 'Ingestion complete', summary }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Master Error:', error.message)
        await sendSlackAlert(`GraphiQuestor ingestion failed: ingest-market-pulse - ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
