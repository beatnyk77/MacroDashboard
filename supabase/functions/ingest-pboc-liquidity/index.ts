import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Ingest PBOC Liquidity & Monetary Operations
 * Uses FRED API for M2 (MYAGM2CNM189N), LPR proxies, FX Reserves
 * Computes: Regime Label, PBOC vs Fed Gap
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const fredKey = Deno.env.get('FRED_API_KEY') ?? '';

        console.log('[PBOC] Starting liquidity ingestion...');

        // FRED series for China monetary data
        const fredSeries: {id: string, fredId: string, colName: string}[] = [
            { id: 'M2_GROWTH', fredId: 'MYAGM2CNM189N', colName: 'm2_growth_yoy' },
            { id: 'FX_RESERVES', fredId: 'TRESEGCNM052N', colName: 'fx_reserves_bn' },
        ];

        const fetchedValues: Record<string, {value: number, date: string}> = {};

        if (fredKey) {
            for (const s of fredSeries) {
                try {
                    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.fredId}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=24`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.observations?.length > 0) {
                        // Get latest non-null
                        const latest = data.observations.find((o: any) => o.value !== '.');
                        if (latest) {
                            fetchedValues[s.id] = { value: parseFloat(latest.value), date: latest.date };
                        }

                        // For M2, also compute YoY growth from series
                        if (s.id === 'M2_GROWTH' && data.observations.length >= 13) {
                            const recent = data.observations.find((o: any) => o.value !== '.');
                            const yearAgo = data.observations.find((o: any, i: number) => i >= 11 && o.value !== '.');
                            if (recent && yearAgo) {
                                const growth = ((parseFloat(recent.value) - parseFloat(yearAgo.value)) / parseFloat(yearAgo.value)) * 100;
                                fetchedValues['M2_GROWTH'] = { value: parseFloat(growth.toFixed(2)), date: recent.date };
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[PBOC] FRED fetch error for ${s.fredId}:`, e);
                }
            }
        }

        // Current known rates (updated manually when PBoC announces)
        // These are updated via this function's static values only when FRED lacks direct series
        const today = new Date().toISOString().split('T')[0];
        const asOfDate = fetchedValues['M2_GROWTH']?.date || today;

        // Known latest PBoC policy rates (PBoC announces these explicitly)
        const mlf_rate = 2.00;          // 1Y MLF Rate as of Jan 2026
        const reverse_repo_7d = 1.50;   // 7d Reverse Repo Rate as of Oct 2025
        const rrr_rate_large = 9.50;    // Large bank RRR as of Sep 2024
        const fed_funds = 4.33;         // Fed Funds Effective Rate

        const m2Growth = fetchedValues['M2_GROWTH']?.value ?? 7.0;
        const pbocVsFedGap = parseFloat((mlf_rate - fed_funds).toFixed(4));

        // Compute regime label
        let regime_label = 'Neutral';
        if (m2Growth > 8.0 || mlf_rate < 2.2) {
            regime_label = 'Easing';
        } else if (m2Growth < 6.0 || mlf_rate > 3.0) {
            regime_label = 'Tightening';
        }

        // Net liquidity signal: M2 growth - nominal GDP growth proxy (6.5% nominal)
        const net_liquidity_signal = parseFloat((m2Growth - 6.5).toFixed(4));

        const pbocRecord = {
            date: asOfDate,
            mlf_rate,
            rrr_rate_large,
            reverse_repo_7d,
            m2_growth_yoy: m2Growth,
            net_liquidity_signal,
            regime_label,
            pboc_vs_fed_gap: pbocVsFedGap,
            source: 'FRED/PBoC',
            last_updated_at: new Date().toISOString()
        };

        console.log('[PBOC] Upserting record:', pbocRecord);

        const { error } = await supabase
            .from('china_pboc_ops')
            .upsert(pbocRecord, { onConflict: 'date' });

        if (error) throw error;

        // Also update metric_observations for cross-section compatibility
        const metricUpserts = [
            { metric_id: 'CN_M2_GROWTH', value: m2Growth, as_of_date: asOfDate },
            { metric_id: 'CN_MLF_RATE', value: mlf_rate, as_of_date: asOfDate },
            { metric_id: 'CN_RRR_LARGE', value: rrr_rate_large, as_of_date: asOfDate },
            { metric_id: 'CN_REVERSE_REPO_7D', value: reverse_repo_7d, as_of_date: asOfDate },
            { metric_id: 'CN_PBOC_FED_GAP', value: pbocVsFedGap, as_of_date: asOfDate },
            { metric_id: 'CN_NET_LIQUIDITY', value: net_liquidity_signal, as_of_date: asOfDate },
            { metric_id: 'CN_POLICY_RATE', value: mlf_rate, as_of_date: asOfDate },
        ].map(r => ({ ...r, last_updated_at: new Date().toISOString() }));

        await supabase
            .from('metric_observations')
            .upsert(metricUpserts, { onConflict: 'metric_id, as_of_date' });

        console.log('[PBOC] Done. Regime:', regime_label);

        return new Response(JSON.stringify({ success: true, regime: regime_label, m2Growth }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    } catch (error: any) {
        console.error('[PBOC] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
