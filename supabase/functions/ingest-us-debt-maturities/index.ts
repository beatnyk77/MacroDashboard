/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
// ingest-us-debt-maturities/index.ts
// Dedicated edge function for US Treasury Debt Maturity Wall
// Source: US Treasury FiscalData API — MSPD Marketable Securities (Table 3)
// Official URL: https://fiscaldata.treasury.gov/datasets/monthly-statement-public-debt/
// Release schedule: Monthly, typically by the 8th of the following month
// Cron: 8th of each month at 14:00 UTC (after Treasury MSPD is confirmed published)

import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

declare const Deno: any;

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

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
            if (res.ok) return res;
            console.warn(`[MSPD] HTTP ${res.status} on attempt ${i + 1} for ${url.slice(0, 80)}`);
        } catch (e: unknown) {
            console.warn(`[MSPD] Attempt ${i + 1} failed: ${(e as Error).message}`);
            if (i < retries - 1) await new Promise(r => setTimeout(r, 3000 * (i + 1)));
        }
    }
    throw new Error(`Failed to fetch after ${retries} attempts: ${url.slice(0, 80)}`);
}

async function processMaturities(supabase: any, fredApiKey: string | undefined): Promise<{ count: number; latestDate: string }> {
    console.log('[maturities] Fetching current T-Bill yield proxy from FRED...');

    // Step 0: Fetch current 3-month T-Bill yield as yield proxy for T-Bills with no coupon rate
    let fredYieldProxy = 4.3; // fallback
    if (fredApiKey) {
        try {
            const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS3MO&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=1`;
            const fredRes = await fetchWithRetry(fredUrl);
            const fredJson = await fredRes.json() as Record<string, any>;
            const obs = fredJson.observations?.[0];
            if (obs && obs.value !== '.') {
                const parsed = parseFloat(obs.value);
                if (!isNaN(parsed)) fredYieldProxy = parsed;
            }
            console.log(`[maturities] 3M T-Bill yield proxy: ${fredYieldProxy}%`);
        } catch (e: unknown) {
            console.warn('[maturities] FRED yield fetch failed, using fallback:', (e as Error).message);
        }
    }

    // Step 1: Get the latest available MSPD record_date
    console.log('[maturities] Fetching latest MSPD record date...');
    const latestDateUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?sort=-record_date&page[size]=1';
    const latestRes = await fetchWithRetry(latestDateUrl);
    const latestJson = await latestRes.json() as Record<string, any>;

    if (!latestJson.data || latestJson.data.length === 0) {
        throw new Error('MSPD API returned no data for latest date query');
    }
    const latestDate: string = latestJson.data[0].record_date;
    const totalCount: number = latestJson.meta?.['total-count'] ?? 0;
    console.log(`[maturities] Latest MSPD date: ${latestDate} (total records: ${totalCount})`);

    // Step 2: Check if we already have fresh data for this date
    const { count: existingCount } = await supabase
        .from('us_debt_maturities')
        .select('*', { count: 'exact', head: true })
        .eq('date', latestDate);

    if (existingCount && existingCount >= 8) {
        console.log(`[maturities] Already have ${existingCount} buckets for ${latestDate}, skipping.`);
        return { count: 0, latestDate };
    }

    // Step 3: Paginate through ALL securities for this date
    console.log('[maturities] Fetching all securities for latest date...');
    const allSecurities: any[] = [];
    let page = 1;
    const pageSize = 10000;

    while (true) {
        const pageUrl = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/debt/mspd/mspd_table_3_market?filter=record_date:eq:${latestDate}&page[size]=${pageSize}&page[number]=${page}`;
        const res = await fetchWithRetry(pageUrl);
        const json = await res.json() as Record<string, any>;
        const data: any[] = json.data ?? [];
        allSecurities.push(...data);

        const totalPages = json.meta?.['total-pages'] ?? 1;
        console.log(`[maturities] Page ${page}/${totalPages}: fetched ${data.length} records (total so far: ${allSecurities.length})`);

        if (page >= totalPages) break;
        page++;
    }

    if (allSecurities.length === 0) {
        throw new Error(`No securities found for date ${latestDate}`);
    }

    // Step 4: Define maturity buckets
    const buckets: Record<string, { total: number; tbill: number; tbill_yield_sum: number; low: number; medium: number; high: number }> = {
        '<1M':   { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '1-3M':  { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '3-6M':  { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '6-12M': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '1-2Y':  { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '2-5Y':  { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '5-10Y': { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
        '10Y+':  { total: 0, tbill: 0, tbill_yield_sum: 0, low: 0, medium: 0, high: 0 },
    };

    const TARGET_CLASSES = new Set([
        'Bills Maturity Value',
        'Notes',
        'Bonds',
        'Treasury Inflation-Protected Securities',
        'Floating Rate Notes'
    ]);

    const refDate = new Date(latestDate);
    let totalMarketableDebt = 0;

    // Step 5: Deduplicate by security detail (CUSIP-level) and bucket
    const deduped = new Map<string, any>();
    for (const s of allSecurities) {
        const cls = s.security_class1_desc;
        if (!TARGET_CLASSES.has(cls)) continue;

        const detail = s.security_class2_desc;
        const isSummaryRow = !detail || detail === 'null' || detail.includes('Total');
        if (isSummaryRow) continue;

        const outstanding = parseFloat(s.outstanding_amt) || 0;
        const issued = parseFloat(s.issued_amt) || 0;
        const redeemed = parseFloat(s.redeemed_amt) || 0;

        if (!deduped.has(detail)) {
            deduped.set(detail, { ...s, total_outstanding: outstanding || (issued - redeemed) });
        } else {
            const ex = deduped.get(detail)!;
            if (outstanding > 0) {
                ex.total_outstanding = outstanding;
            } else {
                ex.total_outstanding += (issued - redeemed);
            }
        }
    }

    // Step 6: Assign each security to a maturity bucket
    for (const s of deduped.values()) {
        const amount = s.total_outstanding;
        const maturityDateStr = s.maturity_date;

        if (!maturityDateStr || maturityDateStr === 'null' || amount <= 0) continue;

        const matDate = new Date(maturityDateStr);
        totalMarketableDebt += amount;

        const cls = s.security_class1_desc;
        const typ = s.security_type_desc ?? '';
        const isTBill = cls === 'Bills Maturity Value' || typ.includes('Bill');

        let effectiveYield = parseFloat(s.interest_rate_pct);
        if (isTBill && (isNaN(effectiveYield) || effectiveYield === 0)) {
            effectiveYield = fredYieldProxy;
        } else if (isNaN(effectiveYield)) {
            effectiveYield = 0;
        }

        let costType: 'low' | 'medium' | 'high' = 'medium';
        if (effectiveYield < 2.0) costType = 'low';
        else if (effectiveYield <= 4.0) costType = 'medium';
        else costType = 'high';

        const diffMs = matDate.getTime() - refDate.getTime();
        const diffDays = diffMs / (1000 * 86400);
        const diffMonths = diffDays / 30.44;
        const diffYears = diffDays / 365.25;

        let bucket = '10Y+';
        if (diffMonths < 1) bucket = '<1M';
        else if (diffMonths < 3) bucket = '1-3M';
        else if (diffMonths < 6) bucket = '3-6M';
        else if (diffMonths < 12) bucket = '6-12M';
        else if (diffYears < 2) bucket = '1-2Y';
        else if (diffYears < 5) bucket = '2-5Y';
        else if (diffYears < 10) bucket = '5-10Y';

        buckets[bucket].total += amount;
        if (isTBill) {
            buckets[bucket].tbill += amount;
            buckets[bucket].tbill_yield_sum += (amount * effectiveYield);
        } else {
            buckets[bucket][costType] += amount;
        }
    }

    // Step 7: Build upsert rows
    const results: MaturityBucket[] = Object.entries(buckets).map(([bucket, data]) => ({
        date: latestDate,
        bucket,
        amount: Math.round(data.total * 100) / 100,
        tbill_amount: Math.round(data.tbill * 100) / 100,
        tbill_avg_yield: data.tbill > 0 ? Math.round((data.tbill_yield_sum / data.tbill) * 10000) / 10000 : 0,
        low_cost_amount: Math.round(data.low * 100) / 100,
        medium_cost_amount: Math.round(data.medium * 100) / 100,
        high_cost_amount: Math.round(data.high * 100) / 100,
        total_debt: Math.round(totalMarketableDebt * 100) / 100,
    }));

    // Step 8: Upsert maturity buckets
    console.log(`[maturities] Upserting ${results.length} buckets for ${latestDate}. Total marketable debt: $${(totalMarketableDebt / 1_000_000).toFixed(2)}T`);
    const { error: upsertError } = await supabase
        .from('us_debt_maturities')
        .upsert(results as any[], { onConflict: 'date, bucket' });

    if (upsertError) throw upsertError;

    // Step 9: Upsert summary metrics to metric_observations
    const shortTermDebt = ['<1M', '1-3M', '3-6M', '6-12M', '1-2Y']
        .reduce((sum, b) => sum + (buckets[b]?.total ?? 0), 0);
    const shortTermPct = totalMarketableDebt > 0 ? (shortTermDebt / totalMarketableDebt) * 100 : 0;
    const totalDebtTn = totalMarketableDebt / 1_000_000;

    const metricRows = [
        { metric_id: 'US_DEBT_MATURING_1Y_TN', as_of_date: latestDate, value: Math.round(shortTermDebt / 10000) / 100 },
        { metric_id: 'US_DEBT_MATURING_1Y_PCT', as_of_date: latestDate, value: Math.round(shortTermPct * 100) / 100 },
        { metric_id: 'US_TOTAL_MARKETABLE_DEBT_TN', as_of_date: latestDate, value: Math.round(totalDebtTn * 100) / 100 },
    ];

    for (const row of metricRows) {
        const { data: metricExists } = await supabase
            .from('metrics')
            .select('id')
            .eq('id', row.metric_id)
            .single();

        if (metricExists) {
            await supabase
                .from('metric_observations')
                .upsert({ ...row, provenance: 'api_live', last_updated_at: new Date().toISOString() }, { onConflict: 'metric_id, as_of_date' });
        }
    }

    return { count: results.length, latestDate };
}

serveIngest('ingest-us-debt-maturities', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const fredApiKey = Deno.env.get('FRED_API_KEY') as string | undefined;

    console.log('[ingest-us-debt-maturities] Starting US Treasury MSPD ingestion...');

    const { count, latestDate } = await processMaturities(supabase, fredApiKey);

    return {
        ok: true,
        counts: { upserted: count, skipped: 0 },
        meta: { latestDate },
    };
})
