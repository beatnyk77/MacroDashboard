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
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    return runIngestion(supabase, 'ingest-india-inflation', async (ctx) => {
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
        const results = liveData.map(d => ({
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
            rows_inserted: results.length,
            metadata: { latest_date: results[0].date }
        };
    });
})
