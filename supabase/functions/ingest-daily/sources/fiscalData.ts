import { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { Logger } from '../utils/logger.ts'
import { retry } from '../utils/retry.ts'

export async function ingestFiscalData(
    client: SupabaseClient,
    logger: Logger
) {
    const source = 'FiscalData'

    // 1. Get metrics
    const { data: metrics, error: metricsError } = await client
        .from('metrics')
        .select('id, metric_key')
        .eq('data_source', source)

    if (metricsError) {
        await logger.log(source, 'error', 0, `Failed to fetch metrics config: ${metricsError.message}`)
        return
    }

    for (const metric of metrics) {
        const fetchStart = performance.now()

        // Handle specific endpoints based on key
        let url = ''
        let dataMapper: (item: any) => any

        if (metric.metric_key === 'TOTAL_PUBLIC_DEBT') {
            // Debt to the Penny
            url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=100'
            dataMapper = (item: any) => ({
                metric_id: metric.id,
                date: item.record_date,
                value: parseFloat(item.tot_pub_debt_out_amt)
            })
        } else {
            await logger.log(metric.metric_key, 'warn', 0, `Unknown FiscalData metric key: ${metric.metric_key}`)
            continue
        }

        try {
            await retry(async () => {
                const response = await fetch(url)
                if (!response.ok) throw new Error(`HTTP ${response.status}`)

                const json = await response.json()
                if (!json.data) throw new Error('No data field in response')

                const cleanData = json.data
                    .map(dataMapper)
                    .filter((o: any) => !isNaN(o.value))

                if (cleanData.length === 0) {
                    await logger.log(metric.metric_key, 'info', 0, 'No data found')
                    return
                }

                const { error: upsertError } = await client
                    .from('metric_values')
                    .upsert(cleanData, { onConflict: 'metric_id, date' })

                if (upsertError) throw upsertError

                await client
                    .from('metrics')
                    .update({ last_updated_at: new Date().toISOString() })
                    .eq('id', metric.id)

                const duration = Math.round(performance.now() - fetchStart)
                await logger.log(metric.metric_key, 'success', cleanData.length, undefined, duration)
            })

        } catch (err: any) {
            const duration = Math.round(performance.now() - fetchStart)
            await logger.log(metric.metric_key, 'error', 0, err.message, duration)
        }
    }
}
