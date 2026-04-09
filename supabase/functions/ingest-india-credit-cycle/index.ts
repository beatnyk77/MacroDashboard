import { createClient } from '@supabase/supabase-js'
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

    return runIngestion(supabase, 'ingest-india-credit-cycle', async (ctx) => {
        const telemetry = new IndiaTelemetry(fredApiKey);
        
        console.log('Fetching live Bank Credit Growth from FRED...');
        const liveData = await telemetry.getBankCredit();
        
        if (liveData.length === 0) {
            throw new Error('No live credit data found from FRED');
        }

        // Map telemetry format to india_credit_cycle table format
        const results = liveData.map(d => ({
            date: d.as_of_date,
            credit_growth_yoy: d.value,
            npa_ratio: 3.9,            // Proxy from RBI FSR report
            credit_to_gdp_gap: d.value - 12, // Proxy: Growth - Nominal GDP Target
            provenance: 'api_live'
        }));

        const { error: upsertError } = await supabase
            .from('india_credit_cycle')
            .upsert(results, { onConflict: 'date' });

        if (upsertError) throw upsertError;

        return {
            rows_inserted: results.length,
            metadata: { latest_date: results[0].date, latest_growth: results[0].credit_growth_yoy }
        };
    });
})
