import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { logIngestionStart, logIngestionEnd } from '../_shared/logging.ts'

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

// @ts-ignore: Deno is available in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const supabaseClient = createClient(
        // @ts-ignore: Deno is available in Supabase Edge Functions
        Deno.env.get('SUPABASE_URL') ?? '',
        // @ts-ignore: Deno is available in Supabase Edge Functions
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Start logging
    const logId = await logIngestionStart(supabaseClient, 'ingest-nyfed-markets');

    try {
        const results: any[] = [];
        const errors: any[] = [];

        // 1. Primary Dealer Treasury Holdings (Weekly)
        try {
            const pdResp = await fetchWithRetry('https://markets.newyorkfed.org/api/pd/positions/recent.json');
            const pdData = await pdResp.json();
            const positions = pdData.pd?.positions || [];
            if (positions.length > 0) {
                positions.sort((a: any, b: any) => new Date(b.businessDate).getTime() - new Date(a.businessDate).getTime());
                const latest = positions[0];
                const totalTreasury = latest.instrumentAmount
                    ?.filter((i: any) => i.instrumentType === "Treasury Securities")
                    .reduce((sum: number, i: any) => sum + (i.netLong || 0), 0) || 0;

                results.push({
                    metric_id: 'PRIMARY_DEALER_TREASURY_HOLDINGS_BN',
                    as_of_date: latest.businessDate,
                    value: totalTreasury / 1000, // Millions to Billions
                    last_updated_at: new Date().toISOString()
                });
            }
        } catch (e: any) {
            errors.push({ metric: 'PRIMARY_DEALER_TREASURY_HOLDINGS_BN', error: e.message });
        }

        // 2. RRP & 3. TGA (Daily)
        for (const type of ['rrp', 'tga']) {
            try {
                const resp = await fetchWithRetry(`https://markets.newyorkfed.org/api/${type}/recent.json`);
                const data = await resp.json();
                const obs = data[type]?.operations || [];
                if (obs.length > 0) {
                    obs.sort((a: any, b: any) => new Date(b.businessDate).getTime() - new Date(a.businessDate).getTime());
                    const latest = obs[0];
                    results.push({
                        metric_id: type === 'rrp' ? 'RRP_BALANCE_BN' : 'TGA_BALANCE_BN',
                        as_of_date: latest.businessDate,
                        value: (latest.totalAccepted || latest.closingBalance) / 1000, // Millions to Billions
                        last_updated_at: new Date().toISOString()
                    });
                }
            } catch (e: any) {
                errors.push({ metric: type.toUpperCase() + '_BALANCE_BN', error: e.message });
            }
        }

        // 4. SOFR-EFFR Spread (Daily)
        try {
            const [sofrResp, effrResp] = await Promise.all([
                fetchWithRetry('https://markets.newyorkfed.org/api/rates/sofr/recent.json'),
                fetchWithRetry('https://markets.newyorkfed.org/api/rates/effr/recent.json')
            ]);
            const sofrData = await sofrResp.json();
            const effrData = await effrResp.json();
            const sofrObs = sofrData.rates?.sofr || [];
            const effrObs = effrData.rates?.effr || [];

            if (sofrObs.length > 0 && effrObs.length > 0) {
                sofrObs.sort((a: any, b: any) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
                effrObs.sort((a: any, b: any) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

                const latestSofr = sofrObs[0];
                const latestEffr = effrObs.find((e: any) => e.effectiveDate === latestSofr.effectiveDate) || effrObs[0];

                results.push({
                    metric_id: 'SOFR_EFFR_SPREAD_BPS',
                    as_of_date: latestSofr.effectiveDate,
                    value: (latestSofr.percentRate - latestEffr.percentRate) * 100, // % to bps
                    last_updated_at: new Date().toISOString()
                });
            }
        } catch (e: any) {
            errors.push({ metric: 'SOFR_EFFR_SPREAD_BPS', error: e.message });
        }

        if (results.length > 0) {
            const { error: upsertError } = await supabaseClient
                .from('metric_observations')
                .upsert(results, { onConflict: 'metric_id, as_of_date' });

            if (upsertError) throw upsertError;
        }

        const summary = { success: true, results_count: results.length, error_count: errors.length, details: { results, errors } };

        // Log success
        await logIngestionEnd(supabaseClient, logId, 'success', {
            rows_inserted: results.length,
            metadata: { summary }
        });

        return new Response(
            JSON.stringify(summary),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error: any) {
        // Log failure
        await logIngestionEnd(supabaseClient, logId, 'failed', { error_message: error.message });

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
