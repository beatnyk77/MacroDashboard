import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    return runIngestion(supabaseClient, 'ingest-bis-reer', async (ctx) => {
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

        console.log('Fetching BIS REER data from FRED...');

        // FRED IDs for Broad REER indices
        const targetCountries = [
            { id: 'REER_INDEX_IN', fred_id: 'RBIRREER01NAV', name: 'India' },
            { id: 'REER_INDEX_CN', fred_id: 'RBICREER01NAV', name: 'China' },
            { id: 'REER_INDEX_BR', fred_id: 'RBBRREER01NAV', name: 'Brazil' },
            { id: 'REER_INDEX_TR', fred_id: 'RBTRREER01NAV', name: 'Turkey' }
        ];

        const results = [];
        const errors = [];

        for (const country of targetCountries) {
            try {
                const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${country.fred_id}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=12`);
                const data = await response.json() as any;

                if (data.observations && data.observations.length > 0) {
                    for (const obs of data.observations) {
                        const val = parseFloat(obs.value);
                        if (!isNaN(val)) {
                            results.push({
                                metric_id: country.id,
                                as_of_date: obs.date,
                                value: val,
                                last_updated_at: new Date().toISOString()
                            });
                        }
                    }
                }
            } catch (err: any) {
                console.error(`Error fetching REER for ${country.name}:`, err.message);
                errors.push({ country: country.name, error: err.message });
            }
        }

        if (results.length > 0) {
            const { error } = await ctx.supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });
            if (error) throw error;

            // Update metrics updated_at
            for (const country of targetCountries) {
                await ctx.supabase.from('metrics').update({ updated_at: new Date().toISOString() }).eq('id', country.id);
            }
        }

        return {
            rows_inserted: results.length,
            metadata: {
                processed_countries: targetCountries.length,
                errors: errors.length > 0 ? errors : undefined
            }
        };
    });
})
