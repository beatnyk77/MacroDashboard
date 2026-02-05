import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
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
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
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

    return runIngestion(supabaseClient, 'ingest-nyfed-markets', async (ctx) => {
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

                // Detailed debug logging
                console.log(`Processing PD data for date: ${latest.businessDate}`);

                const totalTreasury = latest.instrumentAmount
                    ?.reduce((sum: number, i: any) => {
                        if (i.instrumentType === "Treasury Securities" || i.instrumentType === "Federal Agency and GSE Debt Securities") {
                            return sum + (i.netLong || 0);
                        }
                        return sum;
                    }, 0) || 0;

                results.push({
                    metric_id: 'PRIMARY_DEALER_TREASURY_HOLDINGS_BN',
                    as_of_date: latest.businessDate,
                    value: totalTreasury / 1000, // Millions to Billions
                    last_updated_at: new Date().toISOString()
                });
            } else {
                console.warn('No PD positions found in response');
            }
        } catch (e: any) {
            console.error('Error fetching PD data:', e);
            errors.push({ metric: 'PRIMARY_DEALER_TREASURY_HOLDINGS_BN', error: e.message });
        }

        // 2. RRP (Daily)
        try {
            const resp = await fetchWithRetry(`https://markets.newyorkfed.org/api/rrp/recent.json`);
            const data = await resp.json();
            const obs = data.rrp?.operations || [];

            if (Array.isArray(obs) && obs.length > 0) {
                obs.sort((a: any, b: any) => new Date(b.businessDate).getTime() - new Date(a.businessDate).getTime());
                const latestObs = obs[0];
                console.log(`Processing RRP data for date: ${latestObs.businessDate}`);
                results.push({
                    metric_id: 'RRP_BALANCE_BN',
                    as_of_date: latestObs.businessDate,
                    value: (latestObs.totalAccepted) / 1000,
                    last_updated_at: new Date().toISOString()
                });
            } else {
                console.warn(`No RRP observations found`);
            }
        } catch (e: any) {
            console.error(`Error fetching RRP data:`, e);
            errors.push({ metric: 'RRP_BALANCE_BN', error: e.message });
        }

        // 3. TGA (Daily/Weekly from FRED - wtregen)
        try {
            const fredApiKey = Deno.env.get('FRED_API_KEY');
            if (fredApiKey) {
                const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=WTREGEN&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
                const fredResp = await fetch(fredUrl);
                if (fredResp.ok) {
                    const fredData = await fredResp.json();
                    if (fredData.observations?.length > 0) {
                        const latest = fredData.observations[0];
                        console.log(`Processing TGA (FRED) data for date: ${latest.date}`);
                        results.push({
                            metric_id: 'TGA_BALANCE_BN',
                            as_of_date: latest.date,
                            value: parseFloat(latest.value),
                            last_updated_at: new Date().toISOString()
                        });
                    }
                }
            }
        } catch (e: any) {
            console.error(`Error fetching TGA data from FRED:`, e);
            errors.push({ metric: 'TGA_BALANCE_BN', error: e.message });
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

                console.log(`Processing SOFR-EFFR data for date: ${latestSofr.effectiveDate}`);
                results.push({
                    metric_id: 'SOFR_EFFR_SPREAD_BPS',
                    as_of_date: latestSofr.effectiveDate,
                    value: (latestSofr.percentRate - latestEffr.percentRate) * 100, // % to bps
                    last_updated_at: new Date().toISOString()
                });
            } else {
                console.warn('Insufficient SOFR or EFFR data found');
            }
        } catch (e: any) {
            console.error('Error fetching SOFR-EFFR data:', e);
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
