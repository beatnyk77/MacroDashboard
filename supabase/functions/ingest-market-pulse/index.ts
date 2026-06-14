/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import {
    fetchAlphaVantageCommodity,
    fetchAlphaVantageFX,
    fetchAlphaVantageTimeSeries,
    fetchAlphaVantageCrypto,
    upsertObservations,
    getActiveMetricsBySource
} from '../_shared/ingest_utils.ts'

async function doIngestMarketPulse(supabase: ReturnType<typeof createClient>, avApiKey: string): Promise<IngestResult> {
    console.log('Starting Market Pulse ingestion (AlphaVantage)...')

    // 1. Resolve Active AlphaVantage Metrics
    const metrics = await getActiveMetricsBySource(supabase, 'AlphaVantage')

    if (metrics.length === 0) {
        return { ok: true, counts: { upserted: 0, skipped: 0 }, meta: { message: 'No active AlphaVantage metrics found' } }
    }

    const summary: any[] = []
    let total_rows = 0

    for (const metric of metrics) {
        const meta = (metric.metadata as any) || {}
        const symbol = meta.av_symbol
        const func = meta.av_function

        if (!symbol || !func) {
            console.warn(`Missing AlphaVantage metadata for ${metric.id}`)
            continue
        }

        try {
            console.log(`Fetching ${symbol} via ${func} (${metric.id})...`)
            let data: { date: string, value: number }[] = []

            if (func === 'COMMODITY') {
                data = await fetchAlphaVantageCommodity(symbol, avApiKey, meta.av_interval || 'daily')
            } else if (func === 'FX_DAILY') {
                data = await fetchAlphaVantageFX(symbol, meta.av_target_symbol || 'USD', avApiKey)
            } else if (func === 'DIGITAL_CURRENCY_DAILY') {
                data = await fetchAlphaVantageCrypto(symbol, avApiKey, meta.av_market || 'USD')
            } else if (func === 'TIME_SERIES_DAILY' || func === 'TIME_SERIES_DAILY_ADJUSTED') {
                data = await fetchAlphaVantageTimeSeries(symbol, avApiKey)
            }

            if (data.length > 0) {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                const recentData = data
                    .filter(d => new Date(d.date) >= thirtyDaysAgo)
                    .map(d => ({
                        metric_id: metric.id,
                        as_of_date: d.date,
                        value: d.value,
                    }))

                if (recentData.length > 0) {
                    const { count } = await upsertObservations(supabase, recentData, {
                        source_ref: 'live_api:ingest-market-pulse',
                        is_provisional: false,
                    })
                    total_rows += count
                    summary.push({ symbol, status: 'success', count })
                } else {
                    summary.push({ symbol, status: 'no_recent_data' })
                }
            } else {
                summary.push({ symbol, status: 'no_data' })
            }

        } catch (e: any) {
            console.error(`Error for ${symbol}:`, e.message)
            summary.push({ symbol, status: 'error', error: e.message })
            throw e
        }

        // AlphaVantage Free Tier: 5 calls per minute. Wait 13 seconds between calls.
        console.log('Waiting for rate limit clearance...')
        await new Promise(r => setTimeout(r, 13000))
    }

    return {
        ok: true,
        counts: { upserted: total_rows, skipped: 0 },
        meta: { summary }
    }
}

serveIngest('ingest-market-pulse', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY') ?? ''
    if (!avApiKey) throw new Error('ALPHAVANTAGE_API_KEY not found in environment')
    return doIngestMarketPulse(supabase, avApiKey)
}, { timeoutMs: 45 * 60 * 1000, retries: 3 })
