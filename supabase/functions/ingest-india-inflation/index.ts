/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { IndiaTelemetry } from '../_shared/india-telemetry.ts'

async function doIngestIndiaInflation(supabase: any, fredApiKey: string): Promise<IngestResult> {
    const telemetry = new IndiaTelemetry(fredApiKey);

    // Fetch last 2 months to ensure we have recent data
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1);

    console.log(`Fetching inflation for ${year}-${month}`);
    const liveData = await telemetry.getInflationCPI(year, month);

    if (liveData.length === 0) {
        throw new Error(`No live inflation data found for ${year}-${month}`);
    }

    // Map telemetry format to india_inflation_pulse table format
    const results = liveData.map((d: any) => ({
        date: d.as_of_date,
        cpi_headline_yoy: d.value, // Simplifying for now: headline is primary
        cpi_sticky_yoy: d.value,   // Proxy until granular MoSPI fetchers added
        cpi_flexible_yoy: d.value,
        wpi_core_yoy: 0,
        provenance: 'api_live'
    }));

    const { error: upsertError } = await supabase
        .from('india_inflation_pulse')
        .upsert(results, { onConflict: 'date' });

    if (upsertError) throw upsertError;

    return {
        ok: true,
        counts: { upserted: results.length, skipped: 0 },
        meta: { latest_date: results[0].date }
    };
}

serveIngest('ingest-india-inflation', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    return doIngestIndiaInflation(supabase, fredApiKey)
}, { timeoutMs: 20 * 60 * 1000, retries: 3 })
