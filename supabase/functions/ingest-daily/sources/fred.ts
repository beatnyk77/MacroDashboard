import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { Logger } from '../utils/logger.ts'
import { retry } from '../utils/retry.ts'

interface FredObservation {
    date: string
    value: string
}

export async function ingestFred(
    client: SupabaseClient,
    logger: Logger,
    apiKey: string
) {
    const source = 'FRED'

    // 1. Get metrics to fetch
    const { data: metrics, error: metricsError } = await client
        .from('metrics')
        .select('id, metadata, native_frequency')
        .eq('source', source)

    if (metricsError) {
        await logger.log(source, 'error', 0, `Failed to fetch metrics config: ${metricsError.message}`)
        return
    }

    if (!metrics || metrics.length === 0) {
        await logger.log(source, 'warn', 0, 'No metrics configured for FRED')
        return
    }

    for (const metric of metrics) {
        const fredId = (metric.metadata as any)?.fred_id
        if (!fredId) continue

        const fetchStart = performance.now()
        // Incremental: last 100 observations
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=100`

        try {
            await retry(async () => {
                const response = await fetch(url)
                if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

                const data = await response.json()
                if (data.error_code) throw new Error(data.error_message)

                const cleanData = data.observations
                    .map((o: FredObservation) => {
                        const val = parseFloat(o.value)
                        return {
                            metric_id: metric.id,
                            date: o.date,
                            value: isNaN(val) ? null : val,
                        }
                    })
                    .filter((o: any) => o.value !== null)

                if (cleanData.length === 0) {
                    await logger.log(metric.id, 'info', 0, 'No new valid data')
                    return
                }

                // Idempotent upsert
                const { error: upsertError } = await client
                    .from('metric_values')
                    .upsert(cleanData, { onConflict: 'metric_id, date' })

                if (upsertError) throw upsertError

                // Update metadata
                await client
                    .from('metrics')
                    .update({ last_updated_at: new Date().toISOString() })
                    .eq('id', metric.id)

                const duration = Math.round(performance.now() - fetchStart)
                await logger.log(metric.id, 'success', cleanData.length, undefined, duration)
            })
        } catch (err: any) {
            const duration = Math.round(performance.now() - fetchStart)
            await logger.log(metric.id, 'error', 0, err.message, duration)
        }

        // Rate limiting precaution
        await new Promise(r => setTimeout(r, 500))
    }
}
