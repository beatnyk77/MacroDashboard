/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.newyorkfed.org/',
                    'Origin': 'https://www.newyorkfed.org',
                    'Connection': 'keep-alive'
                }
            });
            if (response.ok) return response;
            console.warn(`Attempt ${i + 1} for ${url} failed with ${response.status}`);
        } catch (err) {
            console.warn(`Attempt ${i + 1} for ${url} errored: ${err}`);
        }
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)));
    }
    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

// @ts-expect-error: Deno globals and third-party types: Deno is available in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseClient = createClient(
        // @ts-expect-error: Deno globals and third-party types: Deno is available in Supabase Edge Functions
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-expect-error: Deno globals and third-party types: Deno is available in Supabase Edge Functions
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    return runIngestion(supabaseClient, 'ingest-nyfed-markets', async (ctx) => {
        const results: any[] = [];
        const errors: any[] = [];
        const fredApiKey = Deno.env.get('FRED_API_KEY');

        if (!fredApiKey) throw new Error('FRED_API_KEY is missing');

        // Helper for FRED fetches
        const fetchFred = async (seriesId: string, metricId: string, scale = 1) => {
            try {
                const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
                const resp = await fetch(fredUrl);
                if (!resp.ok) throw new Error(`FRED HTTP ${resp.status}`);
                const data = await resp.json();
                if (data.observations?.length > 0) {
                    const latest = data.observations[0];
                    results.push({
                        metric_id: metricId,
                        as_of_date: latest.date,
                        value: parseFloat(latest.value) * scale,
                        last_updated_at: new Date().toISOString()
                    });
                }
            } catch (e: any) {
                console.error(`Error fetching ${metricId} from FRED:`, e);
                errors.push({ metric: metricId, error: e.message });
            }
        };

        // 1. TGA (FRED - WTREGEN) - Billions
        await fetchFred('WTREGEN', 'TGA_BALANCE_BN');

        // 2. RRP (FRED - RRPONTSYD) - Billions
        await fetchFred('RRPONTSYD', 'RRP_BALANCE_BN');

        // 3. SOFR & EFFR for Spread (BPS)
        try {
            const [sofrResp, effrResp] = await Promise.all([
                fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=SOFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`),
                fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=EFFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`)
            ]);

            if (sofrResp.ok && effrResp.ok) {
                const sofrData = await sofrResp.json();
                const effrData = await effrResp.json();
                const latestSofr = sofrData.observations?.[0];
                const latestEffr = effrData.observations?.[0];

                if (latestSofr && latestEffr) {
                    results.push({
                        metric_id: 'SOFR_EFFR_SPREAD_BPS',
                        as_of_date: latestSofr.date,
                        value: (parseFloat(latestSofr.value) - parseFloat(latestEffr.value)) * 100,
                        last_updated_at: new Date().toISOString()
                    });
                }
            }
        } catch (e: any) {
            errors.push({ metric: 'SOFR_EFFR_SPREAD_BPS', error: e.message });
        }

        if (results.length > 0) {
            const { error: upsertError } = await ctx.supabase
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        return {
            rows_inserted: results.length,
            metadata: {
                results_preview: results.map(r => ({ id: r.metric_id, date: r.as_of_date, val: r.value })),
                errors
            }
        };
    });
})
