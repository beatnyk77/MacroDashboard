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

    const logId = await logIngestionStart(supabase, 'ingest-us-treasury-maturities');

    try {
        console.log('Starting US Treasury Maturities ingestion (MSPD Marketable)...')
        const results: any[] = []
        let debugRawDate: string | null = null;
        let debugSecuritiesCount = 0;
        let finalTotalDebt = 0;

        let fredYieldProxy = 4.3; // Default fallback

        await withTimeout((async () => {
            // 0. Fetch FRED proxy yield for T-bills (DGS3MO)
            try {
                const fredApiKey = Deno.env.get('FRED_API_KEY');
                if (fredApiKey) {
                    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS3MO&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`;
                    const fredResp = await fetch(fredUrl);
                    if (fredResp.ok) {
                        const fredJson = await fredResp.json() as any;
                        if (fredJson.observations && fredJson.observations.length > 0) {
                            const val = parseFloat(fredJson.observations[0].value);
                            if (!isNaN(val)) {
                                fredYieldProxy = val;
                                console.log(`Using FRED DGS3MO yield proxy: ${fredYieldProxy}%`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('Error fetching FRED proxy yield, using fallback:', err);
                // Try to get last known yield from DB
                const { data: lastData } = await supabase
                    .from('us_debt_maturities')
                    .select('tbill_avg_yield')
                    .not('tbill_avg_yield', 'eq', 0)
                    .order('date', { ascending: false })
                    .limit(1);
                if (lastData && lastData.length > 0) {
                    fredYieldProxy = lastData[0].tbill_avg_yield;
                    console.log(`Using last known T-bill yield from DB: ${fredYieldProxy}%`);
                }
            }

            // 1. Get latest date from MSPD Marketable table
            const latestDateUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?sort=-record_date&page[size]=1';
            const latestDateResp = await fetchWithRetry(latestDateUrl);
            const latestDateJson = await latestDateResp.json() as any;

            if (!latestDateJson.data || latestDateJson.data.length === 0) {
                throw new Error("No data found in MSPD API");
            }

            const latestDate = latestDateJson.data[0].record_date;
            debugRawDate = latestDate;
            console.log(`Latest MSPD date: ${latestDate}`);

            // 2. Fetch all securities for that date
            const detailsUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?filter=record_date:eq:${latestDate}&page[size]=10000`;
            const detailsResp = await fetchWithRetry(detailsUrl);
            const detailsJson = await detailsResp.json() as any;
            const securities = detailsJson.data;

            debugSecuritiesCount = securities ? securities.length : 0;

            if (!securities || securities.length === 0) {
                throw new Error('No securities found for latest date');
            }

            // 3. Bucket them
            // Bucket structure: key -> { total, tbill, tbill_yield_sum, low, medium, high }
            const buckets: Record<string, { total: number, tbill: number, tbill_yield_sum: number, low: number, medium: number, high: number }> = {
                '<1M': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '1-3M': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '3-6M': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '6-12M': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '1-2Y': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '2-5Y': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '5-10Y': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
                '10Y+': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 }
            };

            let totalMarketableDebt = 0;
            const now = new Date(latestDate);

            const TARGET_CLASSES = [
                'Bills Maturity Value',
                'Notes',
                'Bonds',
                'Treasury Inflation-Protected Securities',
                'Floating Rate Notes'
            ];

            securities.forEach((s: any) => {
                const securityClass = s.security_class1_desc;
                const securityType = s.security_type_desc || '';
                const securityDetail = s.security_class2_desc;
                const outstandingAmt = s.outstanding_amt;
                const maturityDateStr = s.maturity_date;
                const interestRateStr = s.interest_rate_pct;

                if (!TARGET_CLASSES.includes(securityClass)) return;

                const isSummary = !securityDetail ||
                    securityDetail === 'null' ||
                    securityDetail.includes('Total') ||
                    securityDetail.includes('Subtotal');
                if (isSummary) return;

                if (!outstandingAmt || outstandingAmt === 'null' || !maturityDateStr || maturityDateStr === 'null') return;

                const amount = parseFloat(outstandingAmt);
                if (isNaN(amount)) return;

                const maturityDate = new Date(maturityDateStr);
                totalMarketableDebt += amount;

                // T-Bill detection
                const isTBill = securityClass === 'Bills Maturity Value' || securityType.includes('Bill');

                // Effective yield calculation
                let effectiveYield = parseFloat(interestRateStr);
                if (isTBill) {
                    // T-bills usually have null or 0 coupon in MSPD
                    if (isNaN(effectiveYield) || effectiveYield === 0) {
                        effectiveYield = fredYieldProxy;
                    }
                } else if (isNaN(effectiveYield)) {
                    effectiveYield = 0;
                }

                // Cost classification based on effective yield
                let costType: 'low' | 'medium' | 'high' = 'medium';
                if (effectiveYield < 2.0) costType = 'low';
                else if (effectiveYield <= 4.0) costType = 'medium';
                else costType = 'high';

                const diffTime = maturityDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = diffDays / 30.44;
                const diffYears = diffDays / 365.25;

                let targetBucket = '10Y+';
                if (diffMonths < 1) targetBucket = '<1M';
                else if (diffMonths < 3) targetBucket = '1-3M';
                else if (diffMonths < 6) targetBucket = '3-6M';
                else if (diffMonths < 12) targetBucket = '6-12M';
                else if (diffYears < 2) targetBucket = '1-2Y';
                else if (diffYears < 5) targetBucket = '2-5Y';
                else if (diffYears < 10) targetBucket = '5-10Y';

                buckets[targetBucket].total += amount;

                if (isTBill) {
                    buckets[targetBucket].tbill += amount;
                    buckets[targetBucket].tbill_yield_sum += (amount * effectiveYield);
                } else {
                    buckets[targetBucket][costType] += amount;
                }
            });

            finalTotalDebt = totalMarketableDebt;

            Object.entries(buckets).forEach(([bucket, data]) => {
                results.push({
                    date: latestDate,
                    bucket,
                    amount: data.total,
                    tbill_amount: data.tbill,
                    tbill_avg_yield: data.tbill > 0 ? (data.tbill_yield_sum / data.tbill) : 0,
                    low_cost_amount: data.low,
                    medium_cost_amount: data.medium,
                    high_cost_amount: data.high,
                    total_debt: totalMarketableDebt
                });
            });

        })(), 120000, 'US Treasury Maturities Ingestion');

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('us_debt_maturities')
                .upsert(results, { onConflict: 'date, bucket' });

            if (upsertError) throw upsertError;
        }

        const summary = {
            success: true,
            results_count: results.length,
            debug_latest_date: debugRawDate,
            debug_securities_count: debugSecuritiesCount,
            total_debt: finalTotalDebt,
            total_debt_trillions: (finalTotalDebt / 1000000).toFixed(2) + 'T'
        };

        await logIngestionEnd(supabase, logId, 'success', {
            rows_inserted: results.length,
            metadata: { summary }
        });

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('US Treasury Ingestion error:', error.message)
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
