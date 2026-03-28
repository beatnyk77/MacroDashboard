import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

interface MaturityBucket {
    date: string;
    bucket: string;
    amount: number;
    tbill_amount: number;
    tbill_avg_yield: number;
    low_cost_amount: number;
    medium_cost_amount: number;
    high_cost_amount: number;
    total_debt: number;
}

export async function processMaturities(supabase: SupabaseClient) {
    try {
        console.log('Fetching US Treasury Maturities (MSPD Marketable)...');
        
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        let fredYieldProxy = 4.3; // Default fallback

        // 0. Fetch FRED proxy yield for T-bills (DGS3MO)
        if (fredApiKey) {
            try {
                const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS3MO&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`;
                const fredResp = await fetch(fredUrl);
                if (fredResp.ok) {
                    const fredJson = await fredResp.json();
                    if (fredJson.observations && fredJson.observations.length > 0) {
                        const val = parseFloat(fredJson.observations[0].value);
                        if (!isNaN(val)) fredYieldProxy = val;
                    }
                }
            } catch (err) {
                console.warn('Error fetching FRED proxy yield, using fallback:', err);
            }
        }

        // 1. Get latest date from MSPD Marketable table
        const latestDateUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?sort=-record_date&page[size]=1';
        const latestDateResp = await fetch(latestDateUrl);
        const latestDateJson = await latestDateResp.json();
        if (!latestDateJson.data || latestDateJson.data.length === 0) {
            throw new Error("No data found in MSPD API");
        }
        const latestDate = latestDateJson.data[0].record_date;

        // 2. Fetch all securities for that date
        const detailsUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?filter=record_date:eq:${latestDate}&page[size]=10000`;
        const detailsResp = await fetch(detailsUrl);
        const detailsJson = await detailsResp.json();
        const securities = detailsJson.data;

        if (!securities || securities.length === 0) {
            throw new Error('No securities found for latest date');
        }

        // 3. Bucket them
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

            const isSummary = !securityDetail || securityDetail === 'null' || securityDetail.includes('Total');
            if (isSummary) return;

            if (!outstandingAmt || outstandingAmt === 'null' || !maturityDateStr || maturityDateStr === 'null') return;

            const amount = parseFloat(outstandingAmt);
            if (isNaN(amount)) return;

            const maturityDate = new Date(maturityDateStr);
            totalMarketableDebt += amount;

            const isTBill = securityClass === 'Bills Maturity Value' || securityType.includes('Bill');
            let effectiveYield = parseFloat(interestRateStr);
            if (isTBill && (isNaN(effectiveYield) || effectiveYield === 0)) {
                effectiveYield = fredYieldProxy;
            } else if (isNaN(effectiveYield)) {
                effectiveYield = 0;
            }

            let costType: 'low' | 'medium' | 'high' = 'medium';
            if (effectiveYield < 2.0) costType = 'low';
            else if (effectiveYield <= 4.0) costType = 'medium';
            else costType = 'high';

            const diffMonths = (maturityDate.getTime() - now.getTime()) / (1000 * 3600 * 24 * 30.44);
            const diffYears = diffMonths / 12;

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

        const results: MaturityBucket[] = [];
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

        if (results.length > 0) {
            const { error: upsertError } = await supabase
                .from('us_debt_maturities')
                .upsert(results, { onConflict: 'date, bucket' });

            if (upsertError) throw upsertError;
            return { success: true, count: results.length };
        }

        return { success: true, count: 0 };
    } catch (error: any) {
        console.error('Maturities processing error:', error);
        return { success: false, error: error.message };
    }
}
