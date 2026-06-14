/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { fetchAlphaVantageCommodity, upsertObservations } from '../_shared/ingest_utils.ts'

async function doIngestGoldHistory(supabase: any, avApiKey: string): Promise<IngestResult> {
    console.log('Starting Gold History Sync from AlphaVantage...')

    const goldData = await fetchAlphaVantageCommodity('GOLD', avApiKey, 'monthly')

    if (goldData.length === 0) {
        throw new Error('No gold data returned from AlphaVantage')
    }

    const sortedData = [...goldData].sort((a, b) => a.date.localeCompare(b.date))

    const observations = []

    for (let i = 0; i < sortedData.length; i++) {
        const current = sortedData[i]

        observations.push({
            metric_id: 'GOLD_PRICE_USD',
            as_of_date: current.date,
            value: current.value,
            metadata: { source: 'AlphaVantage', unit: 'USD/oz' }
        })

        if (i > 0) {
            const prev = sortedData[i - 1]
            if (prev.value > 0) {
                const monthlyReturn = ((current.value - prev.value) / prev.value) * 100
                observations.push({
                    metric_id: 'GOLD_MONTHLY_RETURN',
                    as_of_date: current.date,
                    value: monthlyReturn,
                    metadata: { source: 'AlphaVantage', unit: '%' }
                })
            }
        }
    }

    console.log(`Upserting ${observations.length} observations...`)

    const { count } = await upsertObservations(supabase, observations, {
        source_ref: 'live_api:ingest-gold-history',
        is_provisional: false,
    })

    return {
        ok: true,
        counts: { upserted: count ?? 0, skipped: 0 },
        meta: {
            range: `${sortedData[0].date} to ${sortedData[sortedData.length - 1].date}`,
            points: sortedData.length,
        },
    }
}

serveIngest('ingest-gold-history', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY') ?? ''
    if (!avApiKey) throw new Error('ALPHAVANTAGE_API_KEY not found')
    return doIngestGoldHistory(supabase, avApiKey)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
