/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

async function doIngestBisReer(supabase: any, fredApiKey: string): Promise<IngestResult> {
    console.log('Fetching BIS REER data from FRED...');

    // FRED IDs for Broad REER indices
    const targetCountries = [
        { id: 'REER_INDEX_IN', fred_id: 'RBIRREER01NAV', name: 'India' },
        { id: 'REER_INDEX_CN', fred_id: 'RBICREER01NAV', name: 'China' },
        { id: 'REER_INDEX_BR', fred_id: 'RBBRREER01NAV', name: 'Brazil' },
        { id: 'REER_INDEX_TR', fred_id: 'RBTRREER01NAV', name: 'Turkey' }
    ];

    const observations: any[] = [];
    const errors: any[] = [];

    for (const country of targetCountries) {
        try {
            const response = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${country.fred_id}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=12`);
            const data = await response.json() as any;

            if (data.observations && data.observations.length > 0) {
                for (const obs of data.observations) {
                    const val = parseFloat(obs.value);
                    if (!isNaN(val)) {
                        observations.push({
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

    let upserted = 0;
    if (observations.length > 0) {
        const { count } = await upsertObservations(supabase, observations, {
            source_ref: 'live_api:ingest-bis-reer',
            is_provisional: false,
        });
        upserted = count ?? 0;
    }

    return {
        ok: true,
        counts: { upserted, skipped: 0 },
        meta: {
            processed_countries: targetCountries.length,
            errors: errors.length > 0 ? errors : undefined
        }
    };
}

serveIngest('ingest-bis-reer', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? ''
    if (!fredApiKey) throw new Error('FRED_API_KEY is not set')
    return doIngestBisReer(supabase, fredApiKey)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
