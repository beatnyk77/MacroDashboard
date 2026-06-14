/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { IndiaTelemetry } from '../_shared/india-telemetry.ts'

async function doIngestIndiaLiquidity(supabase: any, fredApiKey: string): Promise<IngestResult> {
    const telemetry = new IndiaTelemetry(fredApiKey);

    console.log('Fetching live Call Money Rate from FRED...');
    const liveData = await telemetry.getCallMoneyRate();

    if (liveData.length === 0) {
        throw new Error('No live liquidity data found from FRED');
    }

    // Map telemetry format to india_liquidity_stress table format
    const results = liveData.map((d: any) => ({
        date: d.as_of_date,
        call_rate: d.value,
        treps_rate: d.value * 0.98, // Proxy until Treps specifically found
        net_liquidity_bn: 0,        // Handled by M3 ingestor or separate logic
        provenance: 'api_live'
    }));

    const { error: upsertError } = await supabase
        .from('india_liquidity_stress')
        .upsert(results, { onConflict: 'date' });

    if (upsertError) throw upsertError;

    return {
        ok: true,
        counts: { upserted: results.length, skipped: 0 },
        meta: { latest_date: results[0].date, latest_rate: results[0].call_rate }
    };
}

serveIngest('ingest-india-liquidity', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    return doIngestIndiaLiquidity(supabase, fredApiKey)
}, { timeoutMs: 20 * 60 * 1000, retries: 3 })
