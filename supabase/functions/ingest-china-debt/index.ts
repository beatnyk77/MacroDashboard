/* eslint-disable @typescript-eslint/no-explicit-any */
// ingest-china-debt — China public sector debt layers + live IMF/BIS/WB metrics
// Sources: IMF WEO DataMapper, World Bank, FRED (BIS credit + CGB yields)
// Cron: quarterly (1st of Jan/Apr/Jul/Oct at 04:00 UTC)

import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

declare const Deno: any;

type YearValue = { year: string; value: number };

async function fetchIMFAllYears(conceptCode: string, countryCode = 'CHN'): Promise<YearValue[]> {
    try {
        const url = `https://www.imf.org/external/datamapper/api/v1/${conceptCode}/${countryCode}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`IMF HTTP ${res.status}`);
        const data = await res.json() as Record<string, any>;
        const values: Record<string, number> = data?.values?.[conceptCode]?.[countryCode] ?? {};
        return Object.entries(values)
            .filter(([, v]) => v !== null && v !== undefined && !isNaN(Number(v)))
            .map(([year, value]) => ({ year, value: Number(value) }))
            .sort((a, b) => a.year.localeCompare(b.year));
    } catch (e: unknown) {
        console.error(`IMF ${conceptCode}:`, (e as Error).message);
        return [];
    }
}

async function fetchWorldBankHistory(indicator: string, countryCode = 'CN', mrv = 15): Promise<YearValue[]> {
    try {
        const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=${mrv}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) throw new Error(`WB HTTP ${res.status}`);
        const data = await res.json() as any[];
        const rows: any[] = data?.[1] ?? [];
        return rows
            .filter(r => r.value !== null && r.value !== undefined)
            .map(r => ({ year: String(r.date), value: Number(r.value) }))
            .sort((a, b) => a.year.localeCompare(b.year));
    } catch (e: unknown) {
        console.error(`WorldBank ${indicator}:`, (e as Error).message);
        return [];
    }
}

async function fetchFRED(seriesId: string, fredKey: string, limit = 24): Promise<{ date: string; value: number } | null> {
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

serveIngest('ingest-china-debt', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
    const now = new Date().toISOString();

    console.log('[ingest-china-debt] Starting China debt ingestion...');

    const upserts: Array<{
        metric_id: string;
        as_of_date: string;
        value: number;
        last_updated_at: string;
        provenance: string;
        source_ref: string;
        is_provisional: boolean;
    }> = [];
    let layerUpdates = 0;
    let skipped = 0;

    const push = (metric_id: string, date: string, value: number, source_ref: string, provisional = false) => {
        const as_of_date = date.length === 4 ? `${date}-12-31` : date;
        upserts.push({
            metric_id,
            as_of_date,
            value: Math.round(value * 10000) / 10000,
            last_updated_at: now,
            provenance: provisional ? 'fallback_snapshot' : 'api_live',
            source_ref,
            is_provisional: provisional,
        });
    };

    // ── IMF: General government gross debt (% GDP) ─────────────────────────────
    const ggDebt = await fetchIMFAllYears('GGXWDG_NGDP');
    for (const row of ggDebt) {
        push('CN_DEBT_GDP_PCT', row.year, row.value, 'live_api:imf_weo:GGXWDG_NGDP');
        // Update consolidated layer from live IMF where available
        const { error } = await supabase.from('china_debt_layers').upsert({
            as_of_date: `${row.year}-12-31`,
            layer_code: 'consolidated',
            value_pct_gdp: row.value,
            value_low_pct_gdp: row.value * 0.92,
            value_high_pct_gdp: row.value * 1.15,
            source: 'IMF WEO',
            source_ref: 'GGXWDG_NGDP',
            is_provisional: false,
            provenance: { method: 'IMF DataMapper live fetch' },
            updated_at: now,
        }, { onConflict: 'as_of_date,layer_code' });
        if (!error) layerUpdates++;
    }
    if (ggDebt.length === 0) skipped++;

    // ── IMF: Fiscal balance (% GDP) ────────────────────────────────────────────
    const fiscalBal = await fetchIMFAllYears('GGXONL_NGDP');
    for (const row of fiscalBal) {
        push('CN_FISCAL_BALANCE_GDP_PCT', row.year, row.value, 'live_api:imf_weo:GGXONL_NGDP');
    }
    if (fiscalBal.length === 0) skipped++;

    // ── World Bank: Central government debt (% GDP) ────────────────────────────
    const centralDebt = await fetchWorldBankHistory('GC.DOD.TOTL.GD.ZS');
    for (const row of centralDebt) {
        push('CN_DEBT_CENTRAL_GDP_PCT', row.year, row.value, 'live_api:worldbank:GC.DOD.TOTL.GD.ZS');
        const { error } = await supabase.from('china_debt_layers').upsert({
            as_of_date: `${row.year}-12-31`,
            layer_code: 'central_official',
            value_pct_gdp: row.value,
            value_low_pct_gdp: row.value * 0.95,
            value_high_pct_gdp: row.value * 1.05,
            source: 'World Bank',
            source_ref: 'GC.DOD.TOTL.GD.ZS',
            is_provisional: false,
            provenance: { method: 'World Bank live fetch' },
            updated_at: now,
        }, { onConflict: 'as_of_date,layer_code' });
        if (!error) layerUpdates++;
    }
    if (centralDebt.length === 0) skipped++;

    // ── FRED: BIS private credit (% GDP) ───────────────────────────────────────
    if (fredApiKey) {
        const credit = await fetchFRED('CRDQCNAPABIS', fredApiKey);
        if (credit) {
            push('CN_CREDIT_GDP_PCT', credit.date, credit.value, 'live_api:fred:CRDQCNAPABIS');
            console.log(`[ingest-china-debt] Credit/GDP: ${credit.value}% (${credit.date})`);
        } else { skipped++; }

        const y2 = await fetchFRED('INTDSRCNM024N', fredApiKey);
        if (y2) push('CN_CGB_YIELD_2Y', y2.date, y2.value, 'live_api:fred:INTDSRCNM024N');

        const y10 = await fetchFRED('INTDSRCNM193N', fredApiKey);
        if (y10) push('CN_CGB_YIELD_10Y', y10.date, y10.value, 'live_api:fred:INTDSRCNM193N');

        // Real yield: 10Y - latest CPI
        if (y10) {
            const { data: cpiRows } = await supabase
                .from('metric_observations')
                .select('value, as_of_date')
                .eq('metric_id', 'CN_CPI_YOY')
                .order('as_of_date', { ascending: false })
                .limit(1);
            const cpi = cpiRows?.[0]?.value;
            if (cpi !== undefined && cpi !== null) {
                push('CN_REAL_YIELD_10Y', y10.date, y10.value - cpi, 'derived:10y_minus_cpi');
            }
        }
    } else {
        skipped += 3;
    }

    if (upserts.length > 0) {
        const { error: obsErr } = await supabase
            .from('metric_observations')
            .upsert(upserts, { onConflict: 'metric_id, as_of_date' });
        if (obsErr) throw new Error(`metric_observations upsert failed: ${obsErr.message}`);
        console.log(`[ingest-china-debt] Upserted ${upserts.length} metric_observations`);
    }

    return {
        ok: true,
        counts: { upserted: upserts.length, layer_updates: layerUpdates, skipped },
    };
});