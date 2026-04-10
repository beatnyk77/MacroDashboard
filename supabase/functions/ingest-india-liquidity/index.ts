/* eslint-disable @typescript-eslint/no-unused-vars */
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

    return runIngestion(supabase, 'ingest-india-liquidity', async (ctx) => {
        const telemetry = new IndiaTelemetry(fredApiKey);
        
        console.log('Fetching live Call Money Rate from FRED...');
        const liveData = await telemetry.getCallMoneyRate();
        
        if (liveData.length === 0) {
            throw new Error('No live liquidity data found from FRED');
        }

        // Map telemetry format to india_liquidity_stress table format
        const results = liveData.map(d => ({
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
            rows_inserted: results.length,
            metadata: { latest_date: results[0].date, latest_rate: results[0].call_rate }
        };
    });
})
