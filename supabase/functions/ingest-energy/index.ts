/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { IndiaTelemetry } from '../_shared/india-telemetry.ts'
import { serveIngest, IngestResult } from '../_shared/handler.ts';


async function doIngestEnergy(supabase: any) {
    const telemetry = new IndiaTelemetry();
    const year = String(new Date().getFullYear() - 1); // Last complete year
    
    console.log(`Fetching live Energy Generation from MoSPI for ${year}...`);
    const liveData = await telemetry.getEnergyGeneration(year);
    
    if (liveData.length === 0) {
        throw new Error(`No live energy data found for ${year}`);
    }

    // Map telemetry format to india_energy table format
    const results = liveData.map(d => ({
        state_code: d.metadata?.state_code || '00',
        state_name: d.metadata?.state || 'TOTAL',
        year: parseInt(year),
        source_type: 'renewable', // Defaulting to renewable for this specific fetcher
        metric_type: 'production',
        value: d.value,
        unit: 'KToE',
        as_of_date: d.as_of_date,
        provenance: 'api_live'
    }));

    const { error: upsertError } = await supabase
        .from('india_energy')
        .upsert(results, { onConflict: 'state_code, year, source_type, metric_type' });

    if (upsertError) throw upsertError;

    return {
        ok: true,
        counts: { upserted: results.length },
        meta: { year, states_count: results.length },
    };
}

serveIngest('ingest-energy', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    return doIngestEnergy(supabase);
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
