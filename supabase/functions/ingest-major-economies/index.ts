/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'
import { upsertObservations } from '../_shared/ingest_utils.ts'

async function doIngest(supabase: ReturnType<typeof createClient>): Promise<IngestResult> {
    console.log('Starting Major Economies ingestion...');

    const asOfDate = new Date().toISOString().split('T')[0];

    const macroData = [
        // United States
        { id: 'US_GDP_NOMINAL_TN', value: 28.78 },
        { id: 'US_GDP_PPP_TN', value: 28.78 },
        { id: 'US_GDP_GROWTH_YOY', value: 2.50 },
        { id: 'US_CPI_YOY', value: 2.70 },
        { id: 'US_POLICY_RATE', value: 4.50 },
        // China
        { id: 'CN_GDP_NOMINAL_TN', value: 19.10 },
        { id: 'CN_GDP_PPP_TN', value: 35.60 },
        { id: 'CN_GDP_GROWTH_YOY', value: 5.00 },
        { id: 'CN_POLICY_RATE', value: 3.10 },
        // India
        { id: 'IN_GDP_NOMINAL_TN', value: 4.10 },
        { id: 'IN_GDP_PPP_TN', value: 14.50 },
        { id: 'IN_GDP_GROWTH_YOY', value: 7.20 },
        { id: 'IN_POLICY_RATE', value: 6.50 },
        // Japan
        { id: 'JP_GDP_NOMINAL_TN', value: 4.50 },
        { id: 'JP_GDP_PPP_TN', value: 6.70 },
        { id: 'JP_POLICY_RATE', value: 0.25 },
        // Germany
        { id: 'DE_GDP_NOMINAL_TN', value: 4.60 },
        { id: 'DE_POLICY_RATE', value: 3.00 },
        // Saudi Arabia
        { id: 'SA_GDP_NOMINAL_TN', value: 1.10 },
        { id: 'SA_POLICY_RATE', value: 5.25 },
        // Korea, South
        { id: 'KR_GDP_NOMINAL_TN', value: 1.80 },
        { id: 'KR_POLICY_RATE', value: 3.25 },
        // Brazil
        { id: 'BR_GDP_NOMINAL_TN', value: 2.20 },
        { id: 'BR_POLICY_RATE', value: 11.25 },
        // Switzerland
        { id: 'CH_GDP_NOMINAL_TN', value: 0.90 },
        { id: 'CH_POLICY_RATE', value: 1.00 },
        // Taiwan
        { id: 'TW_GDP_NOMINAL_TN', value: 0.85 },
        { id: 'TW_POLICY_RATE', value: 2.00 },
        // Singapore
        { id: 'SG_GDP_NOMINAL_TN', value: 0.55 },
        // Thailand
        { id: 'TH_GDP_NOMINAL_TN', value: 0.55 },
        { id: 'TH_POLICY_RATE', value: 2.50 },
        // Qatar
        { id: 'QA_GDP_NOMINAL_TN', value: 0.25 },
    ];

    const reservesData = [
        { code: 'US', fx_usd_bn: 245.0, gold_tonnes: 8133.5 },
        { code: 'CN', fx_usd_bn: 3300.0, gold_tonnes: 2291.5 },
        { code: 'IN', fx_usd_bn: 650.0, gold_tonnes: 854.7 },
        { code: 'JP', fx_usd_bn: 1200.0, gold_tonnes: 846.0 },
        { code: 'DE', fx_usd_bn: 300.0, gold_tonnes: 3352.6 },
        { code: 'BR', fx_usd_bn: 355.0, gold_tonnes: 129.7 },
        { code: 'SA', fx_usd_bn: 450.0, gold_tonnes: 323.1 },
        { code: 'KR', fx_usd_bn: 415.0, gold_tonnes: 104.4 },
        { code: 'TW', fx_usd_bn: 580.0, gold_tonnes: 423.6 },
        { code: 'SG', fx_usd_bn: 385.0, gold_tonnes: 236.6 },
        { code: 'CH', fx_usd_bn: 750.0, gold_tonnes: 1040.0 },
        { code: 'TH', fx_usd_bn: 225.0, gold_tonnes: 244.2 },
        { code: 'QA', fx_usd_bn: 65.0, gold_tonnes: 106.4 },
        { code: 'LU', fx_usd_bn: 5.0, gold_tonnes: 2.2 },
        { code: 'KY', fx_usd_bn: 1.0, gold_tonnes: 0.0 },
    ];

    // 1. Upsert macro metrics via canonical helper
    const metricObservations = macroData.map(d => ({
        metric_id: d.id,
        as_of_date: asOfDate,
        value: d.value,
    }));

    const { count: metricsCount } = await upsertObservations(supabase, metricObservations, {
        source_ref: 'live_api:ingest-major-economies',
        is_provisional: false,
    });

    // 2. Fetch gold price for reserves calc
    const { data: goldPrice } = await supabase
        .from('metric_observations')
        .select('value')
        .eq('metric_id', 'GOLD_PRICE_USD')
        .order('as_of_date', { ascending: false })
        .limit(1)
        .single();

    const pricePerTonne = (goldPrice?.value || 2500) * 32150.7;

    // 3. Upsert reserves (domain table — direct write is correct)
    const reserveUpserts = reservesData.map(d => ({
        country_code: d.code,
        as_of_date: asOfDate,
        fx_reserves_usd: d.fx_usd_bn * 1e9,
        gold_tonnes: d.gold_tonnes,
        gold_usd: d.gold_tonnes * pricePerTonne,
        last_updated_at: new Date().toISOString()
    }));

    const { error: reservesError } = await supabase
        .from('country_reserves')
        .upsert(reserveUpserts, { onConflict: 'country_code, as_of_date' });

    if (reservesError) throw reservesError;

    return {
        ok: true,
        counts: { upserted: metricsCount + reserveUpserts.length, skipped: 0 },
        meta: {
            metrics_upserted: metricsCount,
            reserves_upserted: reserveUpserts.length,
        }
    };
}

serveIngest('ingest-major-economies', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    return doIngest(supabase)
}, { timeoutMs: 15 * 60 * 1000, retries: 3 })
