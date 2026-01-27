import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { Logger } from '../utils/logger.ts'
import { retry } from '../utils/retry.ts'

// Yahoo Finance generic chart API (often used by frontend, relatively stable)
// https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?interval=1d&range=1mo

export async function ingestYahoo(
    client: SupabaseClient,
    logger: Logger
) {
    const source = 'Yahoo'

    const { data: metrics, error: metricsError } = await client
        .from('metrics')
        .select('id, metric_key')
        .eq('data_source', source)

    if (metricsError) {
        await logger.log(source, 'error', 0, `Failed to load metrics: ${metricsError.message}`)
        return
    }

    if (!metrics || metrics.length === 0) return

    for (const metric of metrics) {
        const fetchStart = performance.now()
        // metric_key should be the ticker, e.g., ^GSPC, GC=F
        const ticker = metric.metric_key
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`

        try {
            await retry(async () => {
                const response = await fetch(url)
                if (!response.ok) throw new Error(`HTTP ${response.status}`)

                const json = await response.json()
                const result = json.chart?.result?.[0]

                if (!result) throw new Error('Invalid Yahoo response format')

                const timestamps = result.timestamp || []
                const closeValues = result.indicators?.quote?.[0]?.close || []

                const cleanData = []
                for (let i = 0; i < timestamps.length; i++) {
                    const ts = timestamps[i]
                    const val = closeValues[i]

                    if (ts && val !== null && val !== undefined) {
                        const dateParams = new Date(ts * 1000)
                        cleanData.push({
                            metric_id: metric.id,
                            // ISO string with time stripped or just strict date
                            // Assuming backend stores date as 'YYYY-MM-DD'
                            date: dateParams.toISOString().split('T')[0],
                            value: val
                        })
                    }
                }

                if (cleanData.length > 0) {
                    const { error: upsertError } = await client
                        .from('metric_values')
                        .upsert(cleanData, { onConflict: 'metric_id, date' })

                    if (upsertError) throw upsertError

                    await client
                        .from('metrics')
                        .update({ last_updated_at: new Date().toISOString() })
                        .eq('id', metric.id)

                    const duration = Math.round(performance.now() - fetchStart)
                    await logger.log(ticker, 'success', cleanData.length, undefined, duration)
                } else {
                    await logger.log(ticker, 'info', 0, 'No data points found')
                }
            })
        } catch (err: any) {
            const duration = Math.round(performance.now() - fetchStart)
            await logger.log(ticker, 'error', 0, err.message, duration)
        }

        // Polite delay
        await new Promise(r => setTimeout(r, 1000))
    }
}
