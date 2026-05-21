/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'
import { runWithRetry } from '../_shared/job-runner.ts'
import { INITIAL_INDIA_DEBT_DATA } from './data.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-india-debt-maturities', async (ctx) => {
        const result = await runWithRetry(
            'ingest-india-debt-maturities',
            () => doIngestIndiaDebtMaturities(supabase),
            { timeoutMs: 20 * 60 * 1000, maxRetries: 3, backoffMs: 20_000 }
        )
        if (!result.ok) throw new Error(`All attempts failed: ${result.error}`)
        return result.value!
    })
})

// ─── Core ingest logic ────────────────────────────────────────────────────────
async function doIngestIndiaDebtMaturities(supabase: any) {
    console.log('Starting India Debt Maturity ingestion...')

    // Calculate totals for percent_total calculation
    const centralTotal = INITIAL_INDIA_DEBT_DATA
        .filter(d => d.type === 'central')
        .reduce((sum, d) => sum + d.amount_crore, 0);

    const stateTotal = INITIAL_INDIA_DEBT_DATA
        .filter(d => d.type === 'state')
        .reduce((sum, d) => sum + d.amount_crore, 0);

    const results = INITIAL_INDIA_DEBT_DATA.map(d => ({
        ...d,
        percent_total: d.type === 'central'
            ? (d.amount_crore / centralTotal) * 100
            : (d.amount_crore / stateTotal) * 100,
        updated_at: new Date().toISOString()
    }));

    if (results.length > 0) {
        const { error: upsertError } = await supabase
            .from('india_debt_maturities')
            .upsert(results, { onConflict: 'date, bucket, type' });

        if (upsertError) throw upsertError;
    }

    return {
        rows_inserted: results.length,
        metadata: {
            central_total_crore: centralTotal,
            state_total_crore: stateTotal
        }
    };
}
