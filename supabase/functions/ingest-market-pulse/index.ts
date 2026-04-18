import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendSlackAlert } from '../_shared/slack.ts'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Market Pulse Ingestion
 * Source: Yahoo Finance
 * Tickers: XAUUSD=X (Gold Spot), CL=F (WTI), XAGUSD=X (Silver Spot), DX-Y.NYB (DXY), ^VIX (VIX), BTC-USD (Bitcoin)
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return await runIngestion(supabase as any, 'ingest-market-pulse', async (ctx) => {
        console.log('Starting Market Pulse ingestion...')

        // 1. Resolve Active Yahoo Metrics
        const { data: metrics, error: metricsError } = await ctx.supabase
            .from('metrics')
            .select('id, metadata')
            .eq('source_id', 6) // Yahoo Finance source_id
            .eq('is_active', true)

        if (metricsError) throw metricsError
        if (!metrics || metrics.length === 0) {
            return { metadata: { message: 'No active Yahoo metrics found' } }
        }

        const summary: any[] = []
        let rows_inserted = 0

        for (const metric of metrics) {
            const ticker = (metric.metadata as any)?.yahoo_ticker
            if (!ticker) continue

            try {
                console.log(`Fetching ${ticker} (${metric.id})...`)
                // Fetching 3 months for some history, but we mainly care about latest for pulse
                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`
                const res = await fetch(yahooUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                })
                if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`)

                const json = await res.json()
                const result = json.chart?.result?.[0]
                if (!result) throw new Error(`Invalid Yahoo structure for ${ticker}`)

                const timestamps = result.timestamp
                const quotes = result.indicators?.quote?.[0]?.close

                if (!timestamps || !quotes) {
                    console.warn(`Empty data for ${ticker}`);
                    summary.push({ ticker, status: 'no_data' });
                    continue;
                }

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
                    const { error: upsertError } = await ctx.supabase
                        .from('metric_observations')
                        .upsert(cleanData, { onConflict: 'metric_id, as_of_date' })

                    if (upsertError) throw upsertError
                    rows_inserted += cleanData.length
                    summary.push({ ticker, status: 'success', count: cleanData.length })
                } else {
                    summary.push({ ticker, status: 'no_data' })
                }

            } catch (e: any) {
                console.error(`Error for ${ticker}:`, e.message)
                summary.push({ ticker, status: 'error', error: e.message })
                await sendSlackAlert(`Yahoo fetch failed for ${ticker}: ${e.message}`)
            }

            // Polite delay
            await new Promise(r => setTimeout(r, 500))
        }

        return { rows_inserted, metadata: { summary } }
    })
})
