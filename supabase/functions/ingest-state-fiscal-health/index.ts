/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { STATE_FISCAL_DATA } from './data.ts'
import { serveIngest } from '../_shared/handler.ts';


serveIngest('ingest-state-fiscal-health', async (req: Request) => {

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        console.log('Starting India State Fiscal Health ingestion...')

        const results = STATE_FISCAL_DATA;

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('india_state_fiscal_health')
                .upsert(results, { onConflict: 'state_name,date' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            results_count: results.length,
            latest_date: '2024-03-31'
        };

        return { ok: true, counts: { upserted: results.length }, meta: summary };
    } catch (error: any) {
        console.error('State Fiscal Health Ingestion error:', error.message)
        throw error;
    }
})
