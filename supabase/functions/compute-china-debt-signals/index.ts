/* eslint-disable @typescript-eslint/no-explicit-any */
// compute-china-debt-signals — proprietary China debt composite indices
// Cron: weekly (Monday 05:00 UTC)

import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

declare const Deno: any;

function clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
}

async function latestMetric(supabase: any, metricId: string): Promise<number | null> {
    const { data } = await supabase
        .from('metric_observations')
        .select('value')
        .eq('metric_id', metricId)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    return data?.value ?? null;
}

async function latestLayer(supabase: any, layerCode: string) {
    const { data } = await supabase
        .from('china_debt_layers')
        .select('*')
        .eq('layer_code', layerCode)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    return data;
}

async function layerHistory(supabase: any, layerCode: string, limit = 5) {
    const { data } = await supabase
        .from('china_debt_layers')
        .select('as_of_date, value_pct_gdp, value_high_pct_gdp')
        .eq('layer_code', layerCode)
        .order('as_of_date', { ascending: false })
        .limit(limit);
    return data ?? [];
}

async function latestFiscalSignal(supabase: any, signalKey: string) {
    const { data } = await supabase
        .from('china_fiscal_signals')
        .select('value, as_of_date')
        .eq('signal_key', signalKey)
        .order('as_of_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    return data;
}

serveIngest('compute-china-debt-signals', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    console.log('[compute-china-debt-signals] Computing composites...');

    const consolidated = await latestLayer(supabase, 'consolidated');
    const central = await latestLayer(supabase, 'central_official');
    const lgfvHistory = await layerHistory(supabase, 'lgfv', 3);

    const m2Growth = await latestMetric(supabase, 'CN_M2_GROWTH');
    const gdpGrowth = await latestMetric(supabase, 'CN_GDP_GROWTH_YOY');
    const fiscalBalance = await latestMetric(supabase, 'CN_FISCAL_BALANCE_GDP_PCT');
    const creditGdp = await latestMetric(supabase, 'CN_CREDIT_GDP_PCT');
    const yield10y = await latestMetric(supabase, 'CN_CGB_YIELD_10Y');
    const landDependence = await latestFiscalSignal(supabase, 'land_revenue_pct_lg');

    const composites: Array<{
        composite_id: string;
        as_of_date: string;
        value: number;
        components: Record<string, number | null>;
        formula: string;
        updated_at: string;
    }> = [];

    // ── Iceberg Ratio ─────────────────────────────────────────────────────────
    const consHigh = consolidated?.value_high_pct_gdp ?? consolidated?.value_pct_gdp;
    const centralVal = central?.value_pct_gdp;
    if (consHigh && centralVal && centralVal > 0) {
        const iceberg = Math.round((consHigh / centralVal) * 100) / 100;
        composites.push({
            composite_id: 'CN_ICEBERG_RATIO',
            as_of_date: today,
            value: iceberg,
            components: { consolidated_high: consHigh, central_official: centralVal },
            formula: 'consolidated_high / central_official',
            updated_at: now,
        });
    }

    // ── LGFV Stress Index (0–100 proxy) ───────────────────────────────────────
    const latestLgfv = lgfvHistory[0];
    const prevLgfv = lgfvHistory[1];
    if (latestLgfv) {
        const lgfvLevel = latestLgfv.value_high_pct_gdp ?? latestLgfv.value_pct_gdp ?? 0;
        const lgfvDelta = prevLgfv
            ? (latestLgfv.value_pct_gdp ?? 0) - (prevLgfv.value_pct_gdp ?? 0)
            : 0;
        const fiscalStress = fiscalBalance !== null ? clamp(-fiscalBalance * 5, 0, 30) : 0;
        const lgfvStress = clamp(lgfvLevel * 0.6 + lgfvDelta * 3 + fiscalStress, 0, 100);
        composites.push({
            composite_id: 'CN_LGFV_STRESS_INDEX',
            as_of_date: today,
            value: Math.round(lgfvStress * 10) / 10,
            components: { lgfv_level: lgfvLevel, lgfv_delta: lgfvDelta, fiscal_stress: fiscalStress },
            formula: '0.6×LGFV_high + 3×ΔLGFV + fiscal_deficit_penalty',
            updated_at: now,
        });
    }

    // ── Monetization Pressure (0–100) ─────────────────────────────────────────
    if (m2Growth !== null && gdpGrowth !== null) {
        const m2GdpGap = m2Growth - gdpGrowth;
        const creditComponent = creditGdp !== null ? clamp((creditGdp - 200) / 2, 0, 40) : 0;
        const monetization = clamp(m2GdpGap * 8 + creditComponent, 0, 100);
        composites.push({
            composite_id: 'CN_MONETIZATION_PRESSURE',
            as_of_date: today,
            value: Math.round(monetization * 10) / 10,
            components: { m2_growth: m2Growth, gdp_growth: gdpGrowth, m2_gdp_gap: m2GdpGap, credit_gdp: creditGdp },
            formula: '8×(M2_growth − GDP_growth) + credit/GDP component',
            updated_at: now,
        });
    }

    // ── Debt Wall Proximity (0–100 proxy) ─────────────────────────────────────
    if (latestLgfv && creditGdp !== null) {
        const lgfvHigh = latestLgfv.value_high_pct_gdp ?? latestLgfv.value_pct_gdp ?? 0;
        const refinancingCapacity = creditGdp * 0.3;
        const proximity = refinancingCapacity > 0
            ? clamp((lgfvHigh / refinancingCapacity) * 50, 0, 100)
            : 50;
        composites.push({
            composite_id: 'CN_DEBT_WALL_PROXIMITY',
            as_of_date: today,
            value: Math.round(proximity * 10) / 10,
            components: { lgfv_high: lgfvHigh, credit_gdp: creditGdp, refinancing_proxy: refinancingCapacity },
            formula: 'LGFV_high / (0.3 × credit/GDP) × 50',
            updated_at: now,
        });
    }

    // ── Land Fiscal Dependence (% of LG revenue) ────────────────────────────────
    if (landDependence?.value != null) {
        composites.push({
            composite_id: 'CN_LAND_FISCAL_DEPENDENCE',
            as_of_date: landDependence.as_of_date?.slice(0, 10) ?? today,
            value: landDependence.value,
            components: { land_revenue_pct_lg: landDependence.value },
            formula: 'Land sale revenue / total local government revenue',
            updated_at: now,
        });
    }

    // ── r-g Differential (10Y yield − GDP growth) ───────────────────────────────
    if (yield10y !== null && gdpGrowth !== null) {
        const rgDiff = Math.round((yield10y - gdpGrowth) * 100) / 100;
        composites.push({
            composite_id: 'CN_RG_DIFFERENTIAL',
            as_of_date: today,
            value: rgDiff,
            components: { yield_10y: yield10y, gdp_growth: gdpGrowth },
            formula: 'CGB 10Y yield − nominal GDP growth',
            updated_at: now,
        });
    }

    if (composites.length === 0) {
        return { ok: true, counts: { computed: 0 }, meta: { message: 'Insufficient inputs' } };
    }

    const { error: compErr } = await supabase
        .from('china_debt_composites')
        .upsert(composites, { onConflict: 'composite_id, as_of_date' });
    if (compErr) throw new Error(`china_debt_composites upsert failed: ${compErr.message}`);

    // Mirror composites to metric_observations for vw_latest_metrics / useLatestMetric
    const metricUpserts = composites.map(c => ({
        metric_id: c.composite_id,
        as_of_date: c.as_of_date,
        value: c.value,
        last_updated_at: now,
        provenance: 'computed',
        source_ref: 'compute-china-debt-signals',
        is_provisional: false,
    }));

    const { error: obsErr } = await supabase
        .from('metric_observations')
        .upsert(metricUpserts, { onConflict: 'metric_id, as_of_date' });
    if (obsErr) console.error('[compute-china-debt-signals] metric_observations mirror error:', obsErr.message);

    console.log(`[compute-china-debt-signals] Computed ${composites.length} composites`);

    return { ok: true, counts: { computed: composites.length } };
});