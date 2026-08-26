/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient } from '@supabase/supabase-js'
import { serveIngest, IngestResult } from '../_shared/handler.ts'

serveIngest('ingest-nyfed-markets', async (_req: Request): Promise<IngestResult> => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const results: any[] = [];
    const errors: { metric: string; error: string }[] = [];
    const fredApiKey = Deno.env.get('FRED_API_KEY');
    const fetchedAt = new Date().toISOString();

    if (!fredApiKey) throw new Error('FRED_API_KEY is missing');

    // Helper for FRED fetches — per-series failures are intentional skips
    const fetchFred = async (seriesId: string, metricId: string, scale = 1) => {
        try {
            const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=250`;
            const resp = await fetch(fredUrl);
            if (!resp.ok) throw new Error(`FRED HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.observations?.length > 0) {
                results.push(...data.observations
                    .map((observation: any) => ({
                        metric_id: metricId,
                        as_of_date: observation.date,
                        value: parseFloat(observation.value) * scale,
                        last_updated_at: fetchedAt,
                        provenance: 'api_live',
                        source_ref: 'live_api:fred',
                        is_provisional: false,
                    }))
                    .filter((observation: any) => Number.isFinite(observation.value)));
            }
        } catch (e: any) {
            console.error(`Error fetching ${metricId} from FRED:`, e);
            errors.push({ metric: metricId, error: e.message });
        }
    };

    // 1. TGA (FRED - WTREGEN)
    // NOTE: metric_id says "_BN" but WTREGEN reports in MILLIONS of dollars.
    // Raw value is stored as-is (millions) — do not rename this id or
    // rescale it here without migrating every consumer that assumes
    // millions (src/hooks/useNetLiquidity.ts, NetLiquidityCard.tsx,
    // the vw_net_liquidity SQL view, and formatNumber.ts's
    // SNAPSHOT_METRIC_SCALES).
    await fetchFred('WTREGEN', 'TGA_BALANCE_BN');

    // 2. RRP (FRED - RRPONTSYD) - Billions
    await fetchFred('RRPONTSYD', 'RRP_BALANCE_BN');

    // 3. SOFR & EFFR for Spread (BPS)
    try {
        const [sofrResp, effrResp] = await Promise.all([
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=SOFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=250`),
            fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=EFFR&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=250`)
        ]);

        if (sofrResp.ok && effrResp.ok) {
            const sofrData = await sofrResp.json();
            const effrData = await effrResp.json();
            const effrByDate = new Map((effrData.observations || [])
                .map((observation: any) => [observation.date, parseFloat(observation.value)]));
            results.push(...(sofrData.observations || [])
                .map((observation: any) => ({
                    metric_id: 'SOFR_EFFR_SPREAD_BPS',
                    as_of_date: observation.date,
                    value: (parseFloat(observation.value) - (effrByDate.get(observation.date) ?? NaN)) * 100,
                    last_updated_at: fetchedAt,
                    provenance: 'api_live',
                    source_ref: 'live_api:fred',
                    is_provisional: false,
                }))
                .filter((observation: any) => Number.isFinite(observation.value)));
        }
    } catch (e: any) {
        // Intentional skip: SOFR/EFFR spread calculation failure should not abort the batch
        errors.push({ metric: 'SOFR_EFFR_SPREAD_BPS', error: e.message });
    }

    if (results.length > 0) {
        const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert(results, { onConflict: 'metric_id, as_of_date' });

        if (upsertError) throw upsertError;
    }

    return {
        ok: true,
        counts: { upserted: results.length, skipped: errors.length },
        meta: {
            results_preview: results.map(r => ({ id: r.metric_id, date: r.as_of_date, val: r.value })),
            errors,
        },
    };
})
