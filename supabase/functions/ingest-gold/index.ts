/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { fetchAlphaVantageCommodity, upsertObservations } from '../_shared/ingest_utils.ts'

async function doIngestGold(supabase: any, avApiKey: string): Promise<IngestResult> {
    console.log('Fetching Gold and Silver prices from AlphaVantage...')

    const [goldData, silverData] = await Promise.all([
        fetchAlphaVantageCommodity('GOLD', avApiKey, 'daily'),
        fetchAlphaVantageCommodity('SILVER', avApiKey, 'daily')
    ])

    const observations: any[] = []

    if (goldData.length > 0) {
        const recentGold = goldData.slice(0, 30)
        recentGold.forEach((d: any) => {
            observations.push({
                metric_id: 'GOLD_PRICE_USD',
                as_of_date: d.date,
                value: d.value,
                metadata: { source: 'AlphaVantage', unit: 'USD/oz' }
            })
        })
    }

    if (silverData.length > 0) {
        const recentSilver = silverData.slice(0, 30)
        recentSilver.forEach((d: any) => {
            observations.push({
                metric_id: 'SILVER_PRICE_USD',
                as_of_date: d.date,
                value: d.value,
                metadata: { source: 'AlphaVantage', unit: 'USD/oz' }
            })
        })
    }

    if (observations.length === 0) {
        throw new Error('No data fetched for Gold or Silver')
    }

    console.log(`Upserting ${observations.length} observations...`)

    const { count } = await upsertObservations(supabase, observations, {
        source_ref: 'live_api:ingest-gold',
        is_provisional: false,
    })

    return {
        ok: true,
        counts: { upserted: count ?? 0, skipped: 0 },
        meta: {
            gold_points: goldData.length > 0 ? 30 : 0,
            silver_points: silverData.length > 0 ? 30 : 0,
            latest_gold: goldData[0]?.value,
            latest_silver: silverData[0]?.value,
            latest_date: goldData[0]?.date,
        },
    }
}

serveIngest('ingest-gold', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const avApiKey = Deno.env.get('ALPHAVANTAGE_API_KEY') ?? ''
    if (!avApiKey) throw new Error('ALPHAVANTAGE_API_KEY not found')
    return doIngestGold(supabase, avApiKey)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
