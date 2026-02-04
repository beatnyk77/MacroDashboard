import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'
import { withTimeout } from '../_shared/timeout-guard.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            console.warn(`Attempt ${i + 1} for ${url} failed with ${response.status}`);
        } catch (err) {
            console.warn(`Attempt ${i + 1} for ${url} errored: ${err}`);
        }
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Start logging
    const logId = await logIngestionStart(supabase, 'ingest-fiscaldata');

    try {
        console.log('Starting Fiscal Data ingestion...')
        const results: any[] = []
        const errors: any[] = []

        // Use timeout guard for the whole block or individual sections
        // 1. Debt to the Penny (US_DEBT_USD_TN)
        // https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny
        try {
            await withTimeout(async () => {
                const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=100'
                const response = await fetchWithRetry(url)
                const json = await response.json()

                if (json.data) {
                    const debtData = json.data
                        .map((item: any) => ({
                            metric_id: 'US_DEBT_USD_TN',
                            as_of_date: item.record_date,
                            value: parseFloat(item.tot_pub_debt_out_amt) / 1000000000000, // Dollars to Trillions
                            last_updated_at: new Date().toISOString()
                        }))
                        .filter((item: any) => !isNaN(item.value))

                    results.push(...debtData)
                }
            }, 45000, 'US Debt Ingestion');
        } catch (e: any) {
            errors.push({ metric: 'US_DEBT_USD_TN', error: e.message })
            console.error('Error fetching US Debt:', e)
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            results_count: results.length,
            error_count: errors.length,
            errors
        };

        // Log success
        await logIngestionEnd(supabase, logId, 'success', {
            rows_inserted: results.length,
            metadata: { summary }
        });

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('Fiscal Data Ingestion error:', error.message)

        // Log failure
        try {
            if (logId) {
                await logIngestionEnd(supabase, logId, 'failed', { error_message: error.message });
            }
        } catch (logErr) {
            console.error('Failed to log ingestion end:', logErr);
        }

        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
