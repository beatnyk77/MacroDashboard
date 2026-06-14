/* eslint-disable @typescript-eslint/no-explicit-any */
// ingest-corporate-debt-maturities/index.ts
//
// Populates corporate_debt_maturities with US IG corporate bond maturity wall data.
//
// Data sources (all free, via FRED API):
//   ICE BofA US Corporate Index — market values by maturity sub-bucket (BAMLCC*TOTV)
//   ICE BofA US Corporate Index — effective yields by maturity sub-bucket (BAMLCC*EY)
//   Fed Z.1 Flow of Funds       — total nonfinancial corporate debt (NCBDBIQ027S, fallback)
//
// Bucket logic:
//   >5Y  = ICE BofA total − 1-3Y − 3-5Y   (all remaining IG bonds with >5Y to maturity)
//   <1Y  = est. 1-3Y / 3                   (one year of annualised rolloff from 1-3Y bucket)
//   The ICE BofA IG index requires ≥1Y remaining, so <1Y is not directly observable in FRED.
//
// Schedule: 5th of each month at 14:00 UTC (see cron migration).

import { createClient } from '@supabase/supabase-js';
import { serveIngest } from '../_shared/handler.ts';

// FRED series IDs
const S = {
    // ICE BofA US IG Corporate — total market value (USD billions, daily)
    // These cover bonds with ≥1Y remaining, by time-to-maturity bucket.
    CORP_TOTAL_MV: 'BAMLCC0A0CMTOTV',  // All maturities total market value
    MV_1_3Y:       'BAMLCC1A013YTOTV', // 1-3 Year total market value
    MV_3_5Y:       'BAMLCC2A035YTOTV', // 3-5 Year total market value

    // ICE BofA US IG Corporate — effective yields (%, daily)
    EY_ALL:   'BAMLCC0A0CMEY',     // All maturities (used as current refi benchmark)
    EY_1_3Y:  'BAMLCC1A013YEY',   // 1-3 Year
    EY_3_5Y:  'BAMLCC2A035YEY',   // 3-5 Year
    EY_5_7Y:  'BAMLCC3A057YEY',   // 5-7 Year  (averaged into >5Y bucket yield)
    EY_7_10Y: 'BAMLCC4A0710YEY',  // 7-10 Year (averaged into >5Y bucket yield)

    // Fallback total: Fed Z.1 nonfinancial corp debt securities (USD billions, quarterly)
    NCORP_TOTAL: 'NCBDBIQ027S',

    // Short-rate proxy for <1Y bucket coupon
    DGS3MO: 'DGS3MO',
};

async function fetchFred(seriesId: string, apiKey: string): Promise<number | null> {
    const url = `https://api.stlouisfed.org/fred/series/observations`
        + `?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
            console.warn(`[corp-debt] FRED ${seriesId} HTTP ${res.status}`);
            return null;
        }
        const json = await res.json() as any;
        const obs = json.observations?.[0];
        if (!obs || obs.value === '.') return null;
        const val = parseFloat(obs.value);
        return isNaN(val) ? null : val;
    } catch (e: any) {
        console.warn(`[corp-debt] FRED ${seriesId} fetch failed: ${e.message}`);
        return null;
    }
}

async function processCorpDebt(
    supabase: any,
    fredApiKey: string,
): Promise<{ success: boolean; count: number; skipped?: boolean; error?: string }> {

    const today = new Date().toISOString().split('T')[0];
    const monthPrefix = today.slice(0, 7); // YYYY-MM

    // Idempotency: skip if we already have 4 rows for this month
    const { count: existing } = await supabase
        .from('corporate_debt_maturities')
        .select('*', { count: 'exact', head: true })
        .gte('as_of_date', `${monthPrefix}-01`)
        .lt('as_of_date', `${monthPrefix}-32`);

    if (existing && existing >= 4) {
        console.log(`[corp-debt] Already have ${existing} rows for ${monthPrefix}, skipping.`);
        return { success: true, count: 0, skipped: true };
    }

    console.log('[corp-debt] Fetching FRED series in parallel...');

    // Fetch all series concurrently
    const [
        totalMV, mv1_3, mv3_5,
        eyAll, ey1_3, ey3_5, ey5_7, ey7_10,
        ncorpTotal, dgs3mo,
    ] = await Promise.all([
        fetchFred(S.CORP_TOTAL_MV, fredApiKey),
        fetchFred(S.MV_1_3Y, fredApiKey),
        fetchFred(S.MV_3_5Y, fredApiKey),
        fetchFred(S.EY_ALL, fredApiKey),
        fetchFred(S.EY_1_3Y, fredApiKey),
        fetchFred(S.EY_3_5Y, fredApiKey),
        fetchFred(S.EY_5_7Y, fredApiKey),
        fetchFred(S.EY_7_10Y, fredApiKey),
        fetchFred(S.NCORP_TOTAL, fredApiKey),
        fetchFred(S.DGS3MO, fredApiKey),
    ]);

    console.log('[corp-debt] FRED data:', {
        totalMV, mv1_3, mv3_5,
        eyAll, ey1_3, ey3_5, ey5_7, ey7_10,
        ncorpTotal, dgs3mo,
    });

    // ── Compute bucket amounts (USD trillions) ────────────────────────────────

    // IG corp index total (TOTV is in USD billions → divide by 1000 for trillions)
    // Fallback: Z.1 nonfinancial corp (≈61% of all corp bonds) scaled up
    // Second fallback: BIS-estimated 2025 market size
    let igTotalTn: number;
    if (totalMV !== null) {
        igTotalTn = totalMV / 1000;
    } else if (ncorpTotal !== null) {
        // Nonfinancial corp ≈ 61% of IG corp bond market (Fed research)
        igTotalTn = (ncorpTotal / 1000) / 0.61;
    } else {
        igTotalTn = 6.0; // approximate 2025 ICE BofA IG Corp index size
    }

    // 1-3Y and 3-5Y direct from FRED (convert billions → trillions)
    // Fallback: historical proportions from BIS/Fed data (23% and 25% of IG total)
    const amt1_3 = mv1_3 !== null ? mv1_3 / 1000 : igTotalTn * 0.23;
    const amt3_5 = mv3_5 !== null ? mv3_5 / 1000 : igTotalTn * 0.25;

    // >5Y = everything in IG index beyond the 1-3Y and 3-5Y buckets
    // (ICE BofA total includes 1-3Y + 3-5Y + 5-10Y + 10Y+, so remainder = >5Y)
    const amtGt5Raw = igTotalTn - amt1_3 - amt3_5;
    const amtGt5 = amtGt5Raw > 0 ? amtGt5Raw : igTotalTn * 0.42;

    // <1Y: bonds that have rolled off the IG index (now <1Y remaining, not in IG index)
    // Approximation: 1/3 of the 1-3Y bucket matures into <1Y each year
    const amtLt1 = amt1_3 / 3;

    const trueTotal = amtLt1 + amt1_3 + amt3_5 + amtGt5;

    // ── Yields (%): use effective yields as coupon proxy ─────────────────────

    const yLt1 = dgs3mo ?? 4.3;   // Short-dated: 3M Treasury as proxy
    const y1_3  = ey1_3  ?? 5.0;
    const y3_5  = ey3_5  ?? 5.2;

    // >5Y: average of 5-7Y and 7-10Y ICE BofA sub-index yields, or fallback
    let yGt5: number;
    if (ey5_7 !== null && ey7_10 !== null) {
        yGt5 = (ey5_7 + ey7_10) / 2;
    } else {
        yGt5 = ey5_7 ?? ey7_10 ?? (eyAll ? eyAll + 0.3 : 5.5);
    }

    // ── Refinancing cost delta (bps) ─────────────────────────────────────────
    // Positive = rolling into current market rate is MORE expensive than existing yield.
    // Benchmark: current all-in IG corporate effective yield (eyAll).
    const refi = eyAll ?? 5.3;
    const round = (n: number) => Math.round(n * 100) / 100;
    const bps = (yield_: number) => Math.round((refi - yield_) * 100);

    const rows = [
        {
            as_of_date: today,
            bucket: '<1Y',
            maturing_amount: round(amtLt1),
            percent_of_total_debt: round((amtLt1 / trueTotal) * 100),
            weighted_avg_coupon: round(yLt1),
            implied_refinancing_cost_delta: bps(yLt1),
        },
        {
            as_of_date: today,
            bucket: '1-3Y',
            maturing_amount: round(amt1_3),
            percent_of_total_debt: round((amt1_3 / trueTotal) * 100),
            weighted_avg_coupon: round(y1_3),
            implied_refinancing_cost_delta: bps(y1_3),
        },
        {
            as_of_date: today,
            bucket: '3-5Y',
            maturing_amount: round(amt3_5),
            percent_of_total_debt: round((amt3_5 / trueTotal) * 100),
            weighted_avg_coupon: round(y3_5),
            implied_refinancing_cost_delta: bps(y3_5),
        },
        {
            as_of_date: today,
            bucket: '>5Y',
            maturing_amount: round(amtGt5),
            percent_of_total_debt: round((amtGt5 / trueTotal) * 100),
            weighted_avg_coupon: round(yGt5),
            implied_refinancing_cost_delta: bps(yGt5),
        },
    ];

    console.log('[corp-debt] Upserting rows:', rows);

    const { error } = await supabase
        .from('corporate_debt_maturities')
        .upsert(rows, { onConflict: 'as_of_date, bucket' });

    if (error) throw new Error(`Upsert failed: ${error.message}`);

    return { success: true, count: rows.length };
}

serveIngest('ingest-corporate-debt-maturities', async (req: Request) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const fredApiKey  = Deno.env.get('FRED_API_KEY') ?? '';

        if (!fredApiKey) throw new Error('FRED_API_KEY env var not set');

        const supabase = createClient(supabaseUrl, supabaseKey);

        const result = await processCorpDebt(supabase, fredApiKey);

        if (!result.success) {
            return { ok: false, error: result.error ?? 'processCorpDebt returned failure' };
        }

        return { ok: true, counts: { rows: result.count ?? 0 } };

    } catch (err: any) {
        throw err;
    }
});
