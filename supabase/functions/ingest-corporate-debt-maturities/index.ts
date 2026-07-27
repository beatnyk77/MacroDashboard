/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ingest-corporate-debt-maturities
 *
 * Source (honest, free, reproducible):
 *  1. FRED Z.1 / FOA — Nonfinancial corporate business debt securities liability
 *     series NCBCMDPMVCE (millions USD, quarterly) → total stock
 *  2. ICE BofA US Corporate effective yields by maturity (FRED BAMLC*EY series)
 *  3. Maturity structure weights from SIFMA US Corporate Bond Outstanding by
 *     remaining maturity (public annual statistics) — applied to the FRED stock
 *
 * UI must label: "FRED corporate debt stock × SIFMA structure · ICE BofA yields"
 * NOT "SEC EDGAR S&P 500".
 *
 * Amounts stored in USD trillions (matches corporate_debt_maturities schema).
 * Cadence: monthly (5th) + safe to re-run daily (idempotent by as_of_date).
 */

import { createClient } from '@supabase/supabase-js';
import { serveIngest, IngestResult } from '../_shared/handler.ts';

declare const Deno: any;

/** SIFMA-style remaining-maturity weights for US corporate bonds (public research). */
const STRUCTURE_WEIGHTS: Record<string, number> = {
    '<1Y': 0.13,
    '1-3Y': 0.23,
    '3-5Y': 0.20,
    '>5Y': 0.44,
};

/** ICE BofA effective yield series by our bucket (FRED). */
const YIELD_SERIES: Record<string, string> = {
    '<1Y': 'BAMLC1A0C13YEY',   // 1-3Y yield as short-end proxy
    '1-3Y': 'BAMLC1A0C13YEY',
    '3-5Y': 'BAMLC2A0C35YEY',
    '>5Y': 'BAMLC4A0C710YEY',  // 7-10Y as long-end proxy
};

const ALL_IN_YIELD_SERIES = 'BAMLC0A0CMEY'; // US Corporate Index Effective Yield

/** Candidate total-stock series (unit inferred from magnitude). */
const STOCK_SERIES_IDS = [
    'BCNSDODNS',       // nonfin corp debt securities (FRED typically billions)
    'NCBCMDPMVCE',     // Z.1 debt securities liability
    'NCBDBIQ027S',     // nonfin corp debt securities (alt)
    'TCMDO',           // total credit market debt owed (broader; last resort)
];

/**
 * Infer USD trillions from a raw FRED level by magnitude.
 * US nonfin corporate bond market is roughly ~$5–15T in 2020s.
 */
function rawToTrillions(raw: number): { tn: number; unitLabel: string } | null {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    // Already trillions
    if (raw >= 0.5 && raw < 50) return { tn: raw, unitLabel: 'already-T' };
    // Billions → T
    if (raw >= 500 && raw < 50_000) return { tn: raw / 1000, unitLabel: 'billions→T' };
    // Millions → T
    if (raw >= 500_000 && raw < 50_000_000) return { tn: raw / 1_000_000, unitLabel: 'millions→T' };
    // Thousands of billions / other large levels
    if (raw >= 50_000 && raw < 500_000) return { tn: raw / 1000, unitLabel: 'billions→T (hi)' };
    return null;
}

async function fetchFredLatest(
    seriesId: string,
    apiKey: string,
    limit = 8,
): Promise<Array<{ date: string; value: number }>> {
    const url =
        `https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error(`FRED ${seriesId} HTTP ${res.status}`);
    const json = await res.json() as { observations?: Array<{ date: string; value: string }> };
    return (json.observations ?? [])
        .filter((o) => o.value !== '.' && o.value != null)
        .map((o) => ({ date: o.date, value: parseFloat(o.value) }))
        .filter((o) => Number.isFinite(o.value) && o.value > 0);
}

async function resolveCorporateStock(
    apiKey: string,
): Promise<{ totalTn: number; asOfDate: string; stockSeries: string; raw: number; unitLabel: string }> {
    const errors: string[] = [];
    for (const id of STOCK_SERIES_IDS) {
        try {
            const obs = await fetchFredLatest(id, apiKey, 12);
            if (obs.length === 0) {
                errors.push(`${id}: no positive obs`);
                continue;
            }
            for (const row of obs) {
                const converted = rawToTrillions(row.value);
                console.log(
                    `[corp-debt] try ${id} raw=${row.value} → ${converted ? converted.tn.toFixed(3) + 'T (' + converted.unitLabel + ')' : 'unmapped'} as-of ${row.date}`,
                );
                if (converted && converted.tn > 0.5 && converted.tn < 50) {
                    // Prefer pure corporate securities over TCMDO if both work — TCMDO is last in list
                    return {
                        totalTn: converted.tn,
                        asOfDate: row.date,
                        stockSeries: id,
                        raw: row.value,
                        unitLabel: converted.unitLabel,
                    };
                }
            }
            errors.push(`${id}: raw samples=[${obs.slice(0, 3).map((o) => o.value).join(',')}] unmapped/out-of-range`);
        } catch (e) {
            errors.push(`${id}: ${(e as Error).message}`);
        }
    }
    throw new Error(`Could not resolve corporate debt stock. ${errors.join(' | ')}`);
}

serveIngest('ingest-corporate-debt-maturities', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    if (!fredApiKey) throw new Error('FRED_API_KEY not configured');

    console.log('[corp-debt] Fetching FRED corporate stock + ICE BofA yields...');

    const stock = await resolveCorporateStock(fredApiKey);
    const totalTn = stock.totalTn;
    const asOfDate = stock.asOfDate;
    const TOTAL_STOCK_SERIES = stock.stockSeries;

    let allInYield = 0;
    try {
        const y = await fetchFredLatest(ALL_IN_YIELD_SERIES, fredApiKey, 3);
        allInYield = y[0]?.value ?? 0;
    } catch (e) {
        console.warn('[corp-debt] all-in yield fetch failed:', (e as Error).message);
    }

    const bucketYields: Record<string, number> = {};
    for (const [bucket, seriesId] of Object.entries(YIELD_SERIES)) {
        try {
            const y = await fetchFredLatest(seriesId, fredApiKey, 3);
            bucketYields[bucket] = y[0]?.value ?? 0;
        } catch (e) {
            console.warn(`[corp-debt] yield ${seriesId} failed:`, (e as Error).message);
            bucketYields[bucket] = allInYield;
        }
    }

    const rows = Object.entries(STRUCTURE_WEIGHTS).map(([bucket, weight]) => {
        const maturing_amount = Math.round(totalTn * weight * 1000) / 1000; // 3 dp $T
        const cpn = bucketYields[bucket] ?? allInYield;
        const deltaBps = allInYield > 0 && cpn > 0
            ? Math.round((allInYield - cpn) * 100)
            : 0;
        return {
            as_of_date: asOfDate,
            bucket,
            maturing_amount,
            percent_of_total_debt: Math.round(weight * 1000) / 10,
            weighted_avg_coupon: Math.round(cpn * 100) / 100,
            // Positive = refinancing at today's all-in yield is more expensive than bucket yield
            implied_refinancing_cost_delta: Math.max(0, -deltaBps) || Math.max(0, Math.round((allInYield - cpn) * 100)),
            updated_at: new Date().toISOString(),
        };
    });

    // Recompute refinancing delta consistently: (all-in − bucket) in bps
    for (const row of rows) {
        const cpn = row.weighted_avg_coupon;
        row.implied_refinancing_cost_delta = allInYield > 0
            ? Math.round((allInYield - cpn) * 100)
            : 0;
    }

    const { error } = await supabase
        .from('corporate_debt_maturities')
        .upsert(rows, { onConflict: 'as_of_date, bucket' });

    if (error) throw error;

    console.log(
        `[corp-debt] Upserted ${rows.length} buckets for ${asOfDate}; total≈$${totalTn.toFixed(2)}T; all-in yield ${allInYield}%`,
    );

    return {
        ok: true,
        counts: { upserted: rows.length },
        meta: {
            as_of_date: asOfDate,
            total_tn: Math.round(totalTn * 1000) / 1000,
            stock_series: TOTAL_STOCK_SERIES,
            stock_raw: stock.raw,
            stock_unit: stock.unitLabel,
            yield_series: ALL_IN_YIELD_SERIES,
            all_in_yield: allInYield,
            methodology: `FRED ${TOTAL_STOCK_SERIES} stock × SIFMA maturity weights; ICE BofA FRED yields`,
            source_label: 'FRED corporate debt stock + ICE BofA (FRED) + SIFMA structure',
        },
    };
}, { timeoutMs: 5 * 60 * 1000, retries: 2 });
