/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { INITIAL_INDIA_DEBT_DATA } from './data.ts'

// ─── Core ingest logic ────────────────────────────────────────────────────────
async function doIngestIndiaDebtMaturities(supabase: any): Promise<IngestResult> {
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
        ok: true,
        counts: { upserted: results.length, skipped: 0 },
        meta: {
            central_total_crore: centralTotal,
            state_total_crore: stateTotal
        }
    };
}

serveIngest('ingest-india-debt-maturities', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    return doIngestIndiaDebtMaturities(supabase)
}, { timeoutMs: 20 * 60 * 1000, retries: 3 })
