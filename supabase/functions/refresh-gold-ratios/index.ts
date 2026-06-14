/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

async function doRefreshGoldRatios(supabase: any): Promise<IngestResult> {
    console.log('Refreshing gold ratios in metric_observations...')

    const { data, error } = await supabase
        .rpc('populate_gold_ratios')

    if (error) {
        throw new Error(`Failed to populate gold ratios: ${error.message}`)
    }

    const { data: metrics, error: metricsError } = await supabase
        .from('metric_observations')
        .select('metric_id, COUNT(*) as row_count, MAX(as_of_date) as latest_date')
        .in('metric_id', ['RATIO_M2_GOLD', 'RATIO_SPX_GOLD', 'RATIO_DEBT_GOLD', 'RATIO_GOLD_SILVER'])

    if (metricsError) {
        console.log('Warning: Could not verify metrics after refresh:', metricsError)
    }

    return {
        ok: true,
        counts: { upserted: metrics ? metrics.length : 0, skipped: 0 },
        meta: { status: 'gold_ratios_refreshed', verification: metrics || [] },
    }
}

serveIngest('refresh-gold-ratios', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    return doRefreshGoldRatios(supabase)
}, { timeoutMs: 5 * 60 * 1000, retries: 2 })
