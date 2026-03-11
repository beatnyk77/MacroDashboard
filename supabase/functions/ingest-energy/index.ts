import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { runIngestion } from '../_shared/logging.ts'
import { IndiaTelemetry } from '../_shared/india-telemetry.ts'

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

    return runIngestion(supabase, 'ingest-energy', async (ctx) => {
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

        // Clean existing data for the year before upserting (optional but consistent with previous logic)
        // await supabase.from('india_energy').delete().eq('year', parseInt(year));

        const { error: upsertError } = await supabase
            .from('india_energy')
            .upsert(results, { onConflict: 'state_code, year, source_type, metric_type' });

        if (upsertError) throw upsertError;

        return {
            rows_inserted: results.length,
            metadata: { year, states_count: results.length }
        };
    });
})
