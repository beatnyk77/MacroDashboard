/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

// @ts-expect-error: Deno globals and third-party types
Deno.serve(async (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response('Unauthorized', { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const client = createClient(supabaseUrl, supabaseKey);

    const start = new Date().toISOString();
    let result: any = { success: false };

    try {
        result = await processCorporateMaturities(client);

        await client.from('ingestion_logs').insert({
            function_name: 'ingest-corporate-debt-maturity',
            status: 'success',
            rows_inserted: result.processed || 0,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 200
        });

        // Register observation
        await client.from('metric_observations').insert({
            metric_code: 'CORPORATE_DEBT_MATURITIES',
            observation_date: new Date().toISOString().split('T')[0],
            value: result.totalDebtFound || 1
        });

        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });

    } catch (e: any) {
        await client.from('ingestion_logs').insert({
            function_name: 'ingest-corporate-debt-maturity',
            status: 'failed',
            error_message: e.message,
            start_time: start,
            completed_at: new Date().toISOString(),
            status_code: 500
        });
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
});

const secHeaders = {
    'User-Agent': 'VibeCode KartikaySharma@macrodashboard.com',
    'Accept-Encoding': 'gzip, deflate'
};

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processCorporateMaturities(client: any) {
    // 1. Fetch Top 100 Companies by Debt from recent fundamentals
    const { data: companies, error } = await client
        .from('us_fundamentals')
        .select(`
            cik,
            total_debt,
            company_id
        `)
        .order('total_debt', { ascending: false })
        .not('total_debt', 'is', null)
        .limit(100);

    if (error || !companies) {
        throw new Error('Failed to fetch top companies by debt');
    }

    // Prepare aggregation buckets
    let totalBucketYr1 = 0; // <1Y
    let totalBucketYr2_3 = 0; // 1-3Y
    let totalBucketYr4_5 = 0; // 3-5Y
    let totalBucketYr5Plus = 0; // 5Y+
    let totalDebtAggregate = 0;
    
    let processedFiles = 0;

    // Use Promise.allSettled with a concurrency limit
    const CONCURRENCY = 5;
    for (let i = 0; i < companies.length; i += CONCURRENCY) {
        const batch = companies.slice(i, i + CONCURRENCY);
        
        const results = await Promise.allSettled(batch.map(async (company: any) => {
            const cikStr = String(company.cik).padStart(10, '0');
            const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cikStr}.json`;
            const res = await fetch(url, { headers: secHeaders });

            if (res.status === 403) {
                await sleep(500); // Backoff for rate limit
                throw new Error(`403 Rate Limit on CIK ${cikStr}`);
            }
            if (!res.ok) throw new Error(`HTTP ${res.status} on CIK ${cikStr} (${url})`);

            const facts = await res.json();
            const usGaap = facts?.facts?.['us-gaap'];
            if (!usGaap) throw new Error(`No us-gaap data for CIK ${cikStr}`);

            const getLatestValue = (concepts: string[]) => {
                for (const concept of concepts) {
                    if (usGaap[concept] && usGaap[concept].units && usGaap[concept].units.USD) {
                        const reports = usGaap[concept].units.USD.filter((r: any) => r.form === '10-K' || r.form === '10-Q');
                        if (reports.length > 0) {
                            reports.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());
                            const latestDate = new Date(reports[0].end).getTime();
                            const eighteenMonthsAgo = new Date().getTime() - (18 * 30 * 24 * 60 * 60 * 1000);
                            if (latestDate > eighteenMonthsAgo) {
                                return reports[0].val || reports[0].value || 0;
                            }
                        }
                    }
                }
                return 0;
            };

            // Enhanced taxonomy map for maturity schedules
            const yr1 = getLatestValue([
                'LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths',
                'LongTermDebtMaturitiesRepaymentsOfPrincipalInYearOne',
                'DebtInstrumentMaturityAmount',
                'LongTermDebtCurrent'
            ]);
            const yr2 = getLatestValue(['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo']);
            const yr3 = getLatestValue(['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree']);
            const yr4 = getLatestValue(['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour']);
            const yr5 = getLatestValue(['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive']);
            const yr2_3_combined = getLatestValue(['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearsTwoAndThree']);
            const yr4_5_combined = getLatestValue(['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearsFourAndFive']);
            const remaining = getLatestValue([
                'LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive',
                'LongTermDebtMaturitiesRepaymentsOfPrincipalInYearsSixThroughTen',
                'LongTermDebtNoncurrent'
            ]);

            const totalReportedDebt = yr1 + yr2 + yr3 + yr4 + yr5 + remaining + yr2_3_combined + yr4_5_combined;

            return {
                yr1,
                yr2_3: (yr2 + yr3) || yr2_3_combined,
                yr4_5: (yr4 + yr5) || yr4_5_combined,
                yr5Plus: remaining,
                total: totalReportedDebt
            };
        }));

        // Aggregate successful results
        results.forEach((r) => {
            if (r.status === 'fulfilled' && r.value) {
                // We only add to buckets if they actually reported these specific maturity tags
                if (r.value.total > 0) {
                    totalBucketYr1 += r.value.yr1;
                    totalBucketYr2_3 += r.value.yr2_3;
                    totalBucketYr4_5 += r.value.yr4_5;
                    totalBucketYr5Plus += r.value.yr5Plus;
                    totalDebtAggregate += r.value.total;
                    processedFiles++;
                }
            } else if (r.status === 'rejected') {
                console.warn(r.reason);
            }
        });

        // Respect SEC rate limits (max 10 req/s, we do 5 concurrently then wait)
        await sleep(650); 
    }

    if (processedFiles === 0) {
        throw new Error("No maturity data could be parsed from the top 100 debt companies (check GAAP taxonomy fields).");
    }

    const todayDate = new Date().toISOString().split('T')[0];

    // Convert from raw dollars to trillions
    const toTrillions = (val: number) => val / 1_000_000_000_000;

    // We'll mock the coupon rates/delta for MVP, as getting weighted average coupon 
    // requires deep NLP parsing of the 10-K text block which SEC API doesn't structure cleanly.
    // We can use a proxy matrix based on the bucket duration.
    const maturityData = [
        {
            bucket: '<1Y',
            maturing_amount: toTrillions(totalBucketYr1),
            weighted_avg_coupon: 2.8,
            implied_refinancing_cost_delta: 240, // proxy bps
            percent_of_total_debt: totalDebtAggregate ? (totalBucketYr1 / totalDebtAggregate) * 100 : 0
        },
        {
            bucket: '1-3Y',
            maturing_amount: toTrillions(totalBucketYr2_3),
            weighted_avg_coupon: 3.2,
            implied_refinancing_cost_delta: 180,
            percent_of_total_debt: totalDebtAggregate ? (totalBucketYr2_3 / totalDebtAggregate) * 100 : 0
        },
        {
            bucket: '3-5Y',
            maturing_amount: toTrillions(totalBucketYr4_5),
            weighted_avg_coupon: 3.5,
            implied_refinancing_cost_delta: 150,
            percent_of_total_debt: totalDebtAggregate ? (totalBucketYr4_5 / totalDebtAggregate) * 100 : 0
        },
        {
            bucket: '5Y+',
            maturing_amount: toTrillions(totalBucketYr5Plus),
            weighted_avg_coupon: 4.1,
            implied_refinancing_cost_delta: 80,
            percent_of_total_debt: totalDebtAggregate ? (totalBucketYr5Plus / totalDebtAggregate) * 100 : 0
        }
    ];

    // Upsert into DB
    for (const data of maturityData) {
        const { error: upsertErr } = await client.from('corporate_debt_maturities').upsert({
            as_of_date: todayDate,
            bucket: data.bucket,
            maturing_amount: data.maturing_amount,
            weighted_avg_coupon: data.weighted_avg_coupon,
            implied_refinancing_cost_delta: data.implied_refinancing_cost_delta,
            percent_of_total_debt: data.percent_of_total_debt
        }, { onConflict: 'as_of_date, bucket' });
        
        if(upsertErr) {
            console.error("Failed writing bucket", data.bucket, upsertErr);
        }
    }

    return { 
        success: true, 
        processed: processedFiles,
        totalDebtFound: toTrillions(totalDebtAggregate)
    };
}
