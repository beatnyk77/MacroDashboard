/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function doRefreshGoldRatios(supabase: any) {
    console.log('Refreshing gold ratios in metric_observations...')

    // Call the SQL function to populate gold ratios
    const { data, error } = await supabase
        .rpc('populate_gold_ratios')

    if (error) {
        throw new Error(`Failed to populate gold ratios: ${error.message}`)
    }

    // Verify the data was updated
    const { data: metrics, error: metricsError } = await supabase
        .from('metric_observations')
        .select('metric_id, COUNT(*) as row_count, MAX(as_of_date) as latest_date')
        .in('metric_id', ['RATIO_M2_GOLD', 'RATIO_SPX_GOLD', 'RATIO_DEBT_GOLD', 'RATIO_GOLD_SILVER'])

    if (metricsError) {
        console.log('Warning: Could not verify metrics after refresh:', metricsError)
    }

    return {
        rows_refreshed: metrics ? metrics.length : 0,
        status: 'gold_ratios_refreshed',
        verification: metrics || []
    }
}

/**
 * Gold Ratios Refresh
 * Materializes gold ratio data from vw_gold_ratios_stats into metric_observations
 * Runs daily after gold data sources are available
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'refresh-gold-ratios', async (ctx) => {
        const result = await runWithRetry(
            'refresh-gold-ratios',
            () => doRefreshGoldRatios(ctx.supabase),
            { timeoutMs: 5 * 60 * 1000, maxRetries: 2 }
        );

        if (!result.ok) throw new Error(`Gold ratio refresh failed: ${result.error}`);
        return result.value!;
    })
})
