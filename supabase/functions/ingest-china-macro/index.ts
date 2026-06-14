/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
// ingest-china-macro/index.ts
// China Macro Pulse: Fetches real data from FRED, IMF WEO, and World Bank APIs
// Sources: FRED (FX Reserves, CPI monthly), IMF WEO (GDP, CPI annual), World Bank (IP, Retail, FAI)
// Cron: Daily at 03:00 UTC (Chinese NBS typically releases data around 09:30 CST = 01:30 UTC)

import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

declare const Deno: any;

// ── FRED fetch helper ──────────────────────────────────────────────────────────
async function fetchFRED(seriesId: string, fredKey: string, limit = 3): Promise<{ date: string; value: number } | null> {
    try {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=${limit}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`FRED HTTP ${res.status}`);
        const data = await res.json() as Record<string, any>;
        const obs = (data.observations ?? []).find((o: any) => o.value !== '.' && !isNaN(parseFloat(o.value)));
        if (!obs) return null;
        return { date: obs.date, value: parseFloat(obs.value) };
    } catch (e: unknown) {
        console.error(`FRED ${seriesId}:`, (e as Error).message);
        return null;
    }
}

// ── World Bank fetch helper ────────────────────────────────────────────────────
async function fetchWorldBank(indicator: string, countryCode = 'CN', mrv = 5): Promise<{ year: string; value: number } | null> {
    try {
        const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=${mrv}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`WB HTTP ${res.status}`);
        const data = await res.json() as any[];
        const rows: any[] = data?.[1] ?? [];
        const latest = rows.find(r => r.value !== null && r.value !== undefined);
        if (!latest) return null;
        return { year: String(latest.date), value: Number(latest.value) };
    } catch (e: unknown) {
        console.error(`WorldBank ${indicator}:`, (e as Error).message);
        return null;
    }
}

// ── IMF WEO fetch helper ───────────────────────────────────────────────────────
async function fetchIMFWEO(conceptCode: string, countryCode = 'CHN'): Promise<{ year: string; value: number } | null> {
    try {
        const url = `https://www.imf.org/external/datamapper/api/v1/${conceptCode}/${countryCode}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`IMF HTTP ${res.status}`);
        const data = await res.json() as Record<string, any>;
        const values: Record<string, number> = data?.values?.[conceptCode]?.[countryCode] ?? {};
        const currentYear = new Date().getFullYear();
        for (let yr = currentYear; yr >= currentYear - 3; yr--) {
            if (values[String(yr)] !== undefined && values[String(yr)] !== null) {
                return { year: String(yr), value: values[String(yr)] };
            }
        }
        return null;
    } catch (e: unknown) {
        console.error(`IMF WEO ${conceptCode}:`, (e as Error).message);
        return null;
    }
}

serveIngest('ingest-china-macro', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
    const now = new Date().toISOString();

    console.log('[ingest-china-macro] Starting China Macro Pulse ingestion...');

    const upserts: Array<{ metric_id: string; as_of_date: string; value: number; last_updated_at: string; provenance: string; source_ref: string; is_provisional: boolean }> = [];
    let skipped = 0;

    const push = (metric_id: string, date: string, value: number, source_ref: string) => {
        const as_of_date = date.length === 4 ? `${date}-01-01` : date;
        upserts.push({ metric_id, as_of_date, value: Math.round(value * 10000) / 10000, last_updated_at: now, provenance: 'api_live', source_ref, is_provisional: false });
    };

    // ── 1. China GDP Growth YoY (IMF WEO — annual, latest actuals)
    const gdp = await fetchIMFWEO('NGDP_RPCH');
    if (gdp) { push('CN_GDP_GROWTH_YOY', gdp.year, gdp.value, 'live_api:imf_weo'); console.log(`[china-macro] GDP Growth: ${gdp.value}% (${gdp.year})`); }
    else { skipped++; }

    // ── 2. China CPI YoY (IMF WEO — annual)
    const cpi = await fetchIMFWEO('PCPIPCH');
    if (cpi) { push('CN_CPI_YOY', cpi.year, cpi.value, 'live_api:imf_weo'); console.log(`[china-macro] CPI: ${cpi.value}% (${cpi.year})`); }
    else { skipped++; }

    // ── 3. China CPI Monthly YoY (FRED: CPALTT01CNM657N — OECD monthly)
    if (fredApiKey) {
        const cpiMonthly = await fetchFRED('CPALTT01CNM657N', fredApiKey, 6);
        if (cpiMonthly) { push('CN_CPI_YOY', cpiMonthly.date, cpiMonthly.value, 'live_api:fred'); console.log(`[china-macro] CPI monthly: ${cpiMonthly.value}% (${cpiMonthly.date})`); }
        else { skipped++; }
    }

    // ── 4. China FX Reserves (FRED: TRESEGCNM052N — SAFE monthly, USD millions)
    if (fredApiKey) {
        const fxReserves = await fetchFRED('TRESEGCNM052N', fredApiKey, 3);
        if (fxReserves) {
            const trillions = fxReserves.value / 1_000_000;
            push('CN_FX_RESERVES', fxReserves.date, fxReserves.value, 'live_api:fred');
            push('CN_FX_RESERVES_TN', fxReserves.date, Math.round(trillions * 100) / 100, 'live_api:fred');
            console.log(`[china-macro] FX Reserves: $${trillions.toFixed(2)}T (${fxReserves.date})`);
        } else { skipped++; }
    }

    // ── 5. China PPI YoY (World Bank: FP.PPI.TOTL.ZG — annual)
    const ppi = await fetchWorldBank('FP.PPI.TOTL.ZG');
    if (ppi) { push('CN_PPI_YOY', ppi.year, ppi.value, 'live_api:worldbank'); console.log(`[china-macro] PPI: ${ppi.value}% (${ppi.year})`); }
    else { skipped++; }

    // ── 6. China Industrial Production growth (World Bank: NV.IND.MANF.KD.ZG)
    const ip = await fetchWorldBank('NV.IND.MANF.KD.ZG');
    if (ip) { push('CN_IP_YOY', ip.year, ip.value, 'live_api:worldbank'); console.log(`[china-macro] IP: ${ip.value}% (${ip.year})`); }
    else { skipped++; }

    // ── 7. China Retail / Household Consumption Growth (World Bank: NE.CON.PRVT.KD.ZG)
    const retail = await fetchWorldBank('NE.CON.PRVT.KD.ZG');
    if (retail) { push('CN_RETAIL_SALES_YOY', retail.year, retail.value, 'live_api:worldbank'); console.log(`[china-macro] Retail: ${retail.value}% (${retail.year})`); }
    else { skipped++; }

    // ── 8. China Fixed Asset Investment (World Bank: NE.GDI.FTOT.KD.ZG)
    const fai = await fetchWorldBank('NE.GDI.FTOT.KD.ZG');
    if (fai) {
        push('CN_FAI_YOY', fai.year, fai.value, 'live_api:worldbank');
        console.log(`[china-macro] FAI: ${fai.value}% (${fai.year})`);
    } else {
        const gcf = await fetchWorldBank('NE.GDI.TOTL.KD.ZG');
        if (gcf) { push('CN_FAI_YOY', gcf.year, gcf.value, 'live_api:worldbank'); console.log(`[china-macro] GCF fallback: ${gcf.value}% (${gcf.year})`); }
        else { skipped++; }
    }

    // ── 9. China Policy Rate (1Y LPR — FRED: IRSTCB01CNM156N)
    if (fredApiKey) {
        const lpr = await fetchFRED('IRSTCB01CNM156N', fredApiKey, 6);
        if (lpr) { push('CN_POLICY_RATE', lpr.date, lpr.value, 'live_api:fred'); console.log(`[china-macro] LPR: ${lpr.value}% (${lpr.date})`); }
        else { skipped++; }
    }
    // Supplement with confirmed Oct 2025 LPR cut (3.10%) — hardcoded fallback used
    // when FRED is stale.  Marked is_provisional=true because this is not a live fetch.
    upserts.push({
        metric_id: 'CN_POLICY_RATE',
        as_of_date: '2025-10-01',
        value: 3.10,
        last_updated_at: now,
        provenance: 'fallback_snapshot',
        source_ref: 'fallback:china-macro-lpr-hardcoded',
        is_provisional: true,
    });

    // ── 10. China Credit Impulse — TSF proxy (FRED: CHNTOTSOCFINAN)
    if (fredApiKey) {
        const tsf = await fetchFRED('CHNTOTSOCFINAN', fredApiKey, 3);
        if (tsf) { push('CN_CREDIT_IMPULSE', tsf.date, tsf.value, 'live_api:fred'); console.log(`[china-macro] Credit (TSF): ${tsf.value} (${tsf.date})`); }
        else { skipped++; }
    }

    // Upsert metric_observations (primary)
    if (upserts.length > 0) {
        const { error: obsErr } = await supabase
            .from('metric_observations')
            .upsert(upserts, { onConflict: 'metric_id, as_of_date' });
        if (obsErr) throw new Error(`metric_observations upsert failed: ${obsErr.message}`);
        console.log(`[china-macro] Upserted ${upserts.length} rows to metric_observations`);
    }

    // Upsert china_macro_pulse (legacy table for chart queries) — soft-fail
    const chinaPulseRows = upserts.map(u => ({
        metric_id: u.metric_id,
        date: u.as_of_date,
        value: u.value,
        label: getLabelForMetric(u.metric_id),
        unit: getUnitForMetric(u.metric_id),
        source: getSourceForMetric(u.metric_id),
        last_updated_at: now,
        source_ref: u.source_ref,
        is_provisional: u.is_provisional,
    }));

    if (chinaPulseRows.length > 0) {
        const { error: pulseErr } = await supabase
            .from('china_macro_pulse')
            .upsert(chinaPulseRows, { onConflict: 'metric_id, date' });
        if (pulseErr) console.error('[china-macro] china_macro_pulse upsert error:', pulseErr.message);
    }

    return {
        ok: true,
        counts: { upserted: upserts.length, skipped },
    };
});

function getLabelForMetric(id: string): string {
    const labels: Record<string, string> = {
        CN_GDP_GROWTH_YOY: 'GDP Growth YoY',
        CN_CPI_YOY: 'CPI Inflation YoY',
        CN_PPI_YOY: 'PPI Deflation YoY',
        CN_IP_YOY: 'Industrial Production YoY',
        CN_RETAIL_SALES_YOY: 'Retail/Consumption Growth YoY',
        CN_FAI_YOY: 'Fixed Asset Investment YoY',
        CN_POLICY_RATE: 'PBOC LPR (1-Year)',
        CN_CREDIT_IMPULSE: 'Credit Impulse (TSF)',
        CN_FX_RESERVES: 'FX Reserves (USD Millions)',
        CN_FX_RESERVES_TN: 'FX Reserves (USD Trillion)',
    };
    return labels[id] ?? id;
}

function getUnitForMetric(id: string): string {
    const units: Record<string, string> = {
        CN_GDP_GROWTH_YOY: '%',
        CN_CPI_YOY: '%',
        CN_PPI_YOY: '%',
        CN_IP_YOY: '%',
        CN_RETAIL_SALES_YOY: '%',
        CN_FAI_YOY: '%',
        CN_POLICY_RATE: '%',
        CN_CREDIT_IMPULSE: 'CNY Bn',
        CN_FX_RESERVES: 'USD Mn',
        CN_FX_RESERVES_TN: 'USD Tn',
    };
    return units[id] ?? 'n/a';
}

function getSourceForMetric(id: string): string {
    const sources: Record<string, string> = {
        CN_GDP_GROWTH_YOY: 'IMF WEO',
        CN_CPI_YOY: 'IMF WEO / OECD via FRED',
        CN_PPI_YOY: 'World Bank',
        CN_IP_YOY: 'World Bank',
        CN_RETAIL_SALES_YOY: 'World Bank',
        CN_FAI_YOY: 'World Bank',
        CN_POLICY_RATE: 'PBoC / FRED',
        CN_CREDIT_IMPULSE: 'PBoC via FRED (TSF)',
        CN_FX_RESERVES: 'SAFE via FRED',
        CN_FX_RESERVES_TN: 'SAFE via FRED',
    };
    return sources[id] ?? 'Multi-source';
}
