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

        await withTimeout((async () => {
            // 1. Get latest date from MSPD Marketable table
            const latestDateUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?sort=-record_date&page[size]=1';
            const latestDateResp = await fetchWithRetry(latestDateUrl);
            const latestDateJson = await latestDateResp.json();

            if (!latestDateJson.data || latestDateJson.data.length === 0) {
                throw new Error("No data found in MSPD API");
            }

            const latestDate = latestDateJson.data[0].record_date;
            debugRawDate = latestDate;
            console.log(`Latest MSPD date: ${latestDate}`);

            // 2. Fetch all securities for that date
            const detailsUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?filter=record_date:eq:${latestDate}&page[size]=10000`;
            const detailsResp = await fetchWithRetry(detailsUrl);
            const detailsJson = await detailsResp.json();
            const securities = detailsJson.data;

            debugSecuritiesCount = securities ? securities.length : 0;

            if (!securities || securities.length === 0) {
                throw new Error('No securities found for latest date');
            }

            // 3. Bucket them
            const buckets: Record<string, number> = {
                '<1M': 0, '1-3M': 0, '3-6M': 0, '6-12M': 0,
                '1-2Y': 0, '2-5Y': 0, '5-10Y': 0, '10Y+': 0
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
                const securityDetail = s.security_class2_desc;
                const outstandingAmt = s.outstanding_amt;
                const maturityDateStr = s.maturity_date;

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

                const diffTime = maturityDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const diffMonths = diffDays / 30.44;
                const diffYears = diffDays / 365.25;

                if (diffMonths < 1) buckets['<1M'] += amount;
                else if (diffMonths < 3) buckets['1-3M'] += amount;
                else if (diffMonths < 6) buckets['3-6M'] += amount;
                else if (diffMonths < 12) buckets['6-12M'] += amount;
                else if (diffYears < 2) buckets['1-2Y'] += amount;
                else if (diffYears < 5) buckets['2-5Y'] += amount;
                else if (diffYears < 10) buckets['5-10Y'] += amount;
                else buckets['10Y+'] += amount;
            });

            finalTotalDebt = totalMarketableDebt;

            Object.entries(buckets).forEach(([bucket, amount]) => {
                results.push({
                    date: latestDate,
                    bucket,
                    amount: amount,
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
