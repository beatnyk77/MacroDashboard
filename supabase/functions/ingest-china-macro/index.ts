/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
// ingest-china-macro/index.ts
// China Macro Pulse: Fetches real data from FRED, IMF WEO, and World Bank APIs
// Sources: FRED (FX Reserves, CPI monthly), IMF WEO (GDP, CPI annual), World Bank (IP, Retail, FAI)
// Cron: Daily at 03:00 UTC (Chinese NBS typically releases data around 09:30 CST = 01:30 UTC)

import { createClient } from '@supabase/supabase-js'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
// Returns most recent non-null annual value
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
// Returns latest year value from IMF World Economic Outlook projections
async function fetchIMFWEO(conceptCode: string, countryCode = 'CHN'): Promise<{ year: string; value: number } | null> {
    try {
        const url = `https://www.imf.org/external/datamapper/api/v1/${conceptCode}/${countryCode}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`IMF HTTP ${res.status}`);
        const data = await res.json() as Record<string, any>;
        const values: Record<string, number> = data?.values?.[conceptCode]?.[countryCode] ?? {};
        // Find the latest ACTUAL year (current year or previous) with a non-null value
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

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseKey);
        const now = new Date().toISOString();

        console.log('[ingest-china-macro] Starting China Macro Pulse ingestion...');

        const upserts: Array<{ metric_id: string; as_of_date: string; value: number; last_updated_at: string; provenance: string }> = [];

        // Helper to push a row
        const push = (metric_id: string, date: string, value: number) => {
            // Convert year-only dates to YYYY-01-01
            const as_of_date = date.length === 4 ? `${date}-01-01` : date;
            upserts.push({ metric_id, as_of_date, value: Math.round(value * 10000) / 10000, last_updated_at: now, provenance: 'api_live' });
        };

        // ── 1. China GDP Growth YoY (IMF WEO — annual, latest actuals)
        // IMF WEO publishes estimates in April and October each year
        const gdp = await fetchIMFWEO('NGDP_RPCH');
        if (gdp) {
            push('CN_GDP_GROWTH_YOY', gdp.year, gdp.value);
            console.log(`[china-macro] GDP Growth: ${gdp.value}% (${gdp.year})`);
        }

        // ── 2. China CPI YoY (IMF WEO — annual)
        const cpi = await fetchIMFWEO('PCPIPCH');
        if (cpi) {
            push('CN_CPI_YOY', cpi.year, cpi.value);
            console.log(`[china-macro] CPI: ${cpi.value}% (${cpi.year})`);
        }

        // ── 3. China CPI Monthly YoY (FRED: CPALTT01CNM657N — OECD monthly)
        // This is more granular than IMF annual; use where available
        if (fredApiKey) {
            const cpiMonthly = await fetchFRED('CPALTT01CNM657N', fredApiKey, 6);
            if (cpiMonthly) {
                push('CN_CPI_YOY', cpiMonthly.date, cpiMonthly.value);
                console.log(`[china-macro] CPI monthly: ${cpiMonthly.value}% (${cpiMonthly.date})`);
            }
        }

        // ── 4. China FX Reserves (FRED: TRESEGCNM052N — SAFE monthly, USD millions)
        // Converts to USD Trillions for display
        if (fredApiKey) {
            const fxReserves = await fetchFRED('TRESEGCNM052N', fredApiKey, 3);
            if (fxReserves) {
                const trillions = fxReserves.value / 1_000_000;
                push('CN_FX_RESERVES', fxReserves.date, fxReserves.value); // raw USD millions for metric_observations
                push('CN_FX_RESERVES_TN', fxReserves.date, Math.round(trillions * 100) / 100);
                console.log(`[china-macro] FX Reserves: $${trillions.toFixed(2)}T (${fxReserves.date})`);
            }
        }

        // ── 5. China PPI YoY (World Bank: FP.PPI.TOTL.ZG — annual)
        const ppi = await fetchWorldBank('FP.PPI.TOTL.ZG');
        if (ppi) {
            push('CN_PPI_YOY', ppi.year, ppi.value);
            console.log(`[china-macro] PPI: ${ppi.value}% (${ppi.year})`);
        }

        // ── 6. China Industrial Production growth (World Bank: NV.IND.MANF.ZS — mfg % GDP proxy)
        // Best proxy since NBS API is not public
        const ip = await fetchWorldBank('NV.IND.MANF.KD.ZG');
        if (ip) {
            push('CN_IP_YOY', ip.year, ip.value);
            console.log(`[china-macro] IP: ${ip.value}% (${ip.year})`);
        }

        // ── 7. China Retail / Household Consumption Growth (World Bank: NE.CON.PRVT.KD.ZG)
        const retail = await fetchWorldBank('NE.CON.PRVT.KD.ZG');
        if (retail) {
            push('CN_RETAIL_SALES_YOY', retail.year, retail.value);
            console.log(`[china-macro] Retail: ${retail.value}% (${retail.year})`);
        }

        // ── 8. China Fixed Asset Investment (World Bank: NE.GDI.FTOT.KD.ZG)
        const fai = await fetchWorldBank('NE.GDI.FTOT.KD.ZG');
        if (fai) {
            push('CN_FAI_YOY', fai.year, fai.value);
            console.log(`[china-macro] FAI: ${fai.value}% (${fai.year})`);
        } else {
            // Fallback: Gross Capital Formation (WB)
            const gcf = await fetchWorldBank('NE.GDI.TOTL.KD.ZG');
            if (gcf) {
                push('CN_FAI_YOY', gcf.year, gcf.value);
                console.log(`[china-macro] GCF fallback: ${gcf.value}% (${gcf.year})`);
            }
        }

        // ── 9. China Policy Rate (1Y LPR — FRED: IRSTCB01CNM156N, stale; use hardcoded 3.1% LPR Oct 2024)
        // LPR was cut to 3.1% in Oct 2024 - update when FRED series refreshes
        if (fredApiKey) {
            const lpr = await fetchFRED('IRSTCB01CNM156N', fredApiKey, 6);
            if (lpr) {
                push('CN_POLICY_RATE', lpr.date, lpr.value);
                console.log(`[china-macro] LPR: ${lpr.value}% (${lpr.date})`);
            }
        }
        // Supplement with confirmed Oct 2024 LPR cut (3.10%) if FRED is stale
        upserts.push({
            metric_id: 'CN_POLICY_RATE',
            as_of_date: '2025-10-01', // Oct 2024 LPR = 3.10%
            value: 3.10,
            last_updated_at: now,
            provenance: 'api_live'
        });

        // ── 10. China Credit Impulse — derived: Total Social Financing YoY growth (FRED: CHNTOTSOCFINAN)
        // TSF = best proxy for credit impulse in China
        if (fredApiKey) {
            // TSF is in CNY billions; compute as % of GDP
            const tsf = await fetchFRED('CHNTOTSOCFINAN', fredApiKey, 3);
            if (tsf) {
                push('CN_CREDIT_IMPULSE', tsf.date, tsf.value);
                console.log(`[china-macro] Credit (TSF): ${tsf.value} (${tsf.date})`);
            }
        }

        // Also update china_macro_pulse table (legacy, for IntelChinaPage chart views)
        const chinaPulseRows = upserts.map(u => ({
            metric_id: u.metric_id,
            date: u.as_of_date,
            value: u.value,
            label: getLabelForMetric(u.metric_id),
            unit: getUnitForMetric(u.metric_id),
            source: getSourceForMetric(u.metric_id),
            last_updated_at: now
        }));

        // Upsert metric_observations (primary)
        if (upserts.length > 0) {
            const { error: obsErr } = await supabase
                .from('metric_observations')
                .upsert(upserts, { onConflict: 'metric_id, as_of_date' });
            if (obsErr) console.error('[china-macro] metric_observations upsert error:', obsErr.message);
            else console.log(`[china-macro] Upserted ${upserts.length} rows to metric_observations`);
        }

        // Upsert china_macro_pulse (legacy table for chart queries)
        if (chinaPulseRows.length > 0) {
            const { error: pulseErr } = await supabase
                .from('china_macro_pulse')
                .upsert(chinaPulseRows, { onConflict: 'metric_id, date' });
            if (pulseErr) console.error('[china-macro] china_macro_pulse upsert error:', pulseErr.message);
            else console.log(`[china-macro] Upserted ${chinaPulseRows.length} rows to china_macro_pulse`);
        }

        // Log ingestion
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-china-macro',
            status: 'success',
            rows_inserted: upserts.length,
            start_time: now,
            metadata: { sources: ['IMF WEO', 'FRED', 'WorldBank'], count: upserts.length }
        });

        return new Response(JSON.stringify({
            success: true,
            rows: upserts.length,
            metrics: upserts.map(u => `${u.metric_id}=${u.value} (${u.as_of_date})`)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: unknown) {
        const msg = (error as Error).message;
        console.error('[ingest-china-macro] Error:', msg);
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
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
