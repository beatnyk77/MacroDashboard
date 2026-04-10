/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchFredSeries(fredId: string, apiKey: string, limit = 52) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`FRED fetch failed for ${fredId}: ${resp.statusText}`);
    const data = await resp.json();
    return data.observations.map((o: any) => ({
        date: o.date,
        value: o.value === '.' ? NaN : parseFloat(o.value)
    })).filter((o: any) => !isNaN(o.value));
}

function calculateWoW(current: number, previous: number) {
    if (!previous || isNaN(previous)) return 0;
    return ((current - previous) / previous) * 100;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-global-liquidity', async (ctx) => {
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

        // 1. Fetch required series
        // VIXCLS is a good risk-off proxy (high VIX = tight liquidity/risk-off)
        const [fedAssets, ecbAssets, m2Money, vix, dxyProxy] = await Promise.all([
            fetchFredSeries('WALCL', fredApiKey),
            fetchFredSeries('ECBASSETSW', fredApiKey),
            fetchFredSeries('M2SL', fredApiKey),
            fetchFredSeries('VIXCLS', fredApiKey),
            fetchFredSeries('DTWEXBGS', fredApiKey)
        ]);

        // 2. Latest values
        const latestDate = fedAssets[0].date;
        const fed = fedAssets[0].value / 1000000; // Trillions
        const ecb = ecbAssets[0].value / 1000000;

        const boj_est = 5.2;
        const pboc_est = 6.4;
        const boe_est = 1.1;

        const cb_aggregate = fed + ecb + boj_est + pboc_est + boe_est;
        const prev_cb_aggregate = (fedAssets[1].value + ecbAssets[1].value) / 1000000 + boj_est + pboc_est + boe_est;
        const cb_wow = calculateWoW(cb_aggregate, prev_cb_aggregate);

        const m2 = m2Money[0].value;
        const prev_m2 = m2Money[1].value;
        const m2_wow = calculateWoW(m2, prev_m2);

        const vix_val = vix[0].value;
        const dxy = dxyProxy[0].value;
        // Risk Proxy: Inverse of (VIX * DXY) scaled. 
        // Higher VIX/DXY = tighter conditions. Lower = better liquidity.
        const risk_proxy = 1000 / (vix_val * (dxy / 100));
        const prev_risk_proxy = 1000 / (vix[1].value * (dxyProxy[1].value / 100));
        const risk_wow = calculateWoW(risk_proxy, prev_risk_proxy);

        // Cross border flows (using TIC data from DB)
        const { data: ticData } = await supabase
            .from('tic_foreign_holders')
            .select('grand_total')
            .order('as_of_date', { ascending: false })
            .limit(2);

        const cross_border = ticData?.[0]?.grand_total ? ticData[0].grand_total / 1000 : 7.5;
        const prev_cross_border = ticData?.[1]?.grand_total ? ticData[1].grand_total / 1000 : 7.5;
        const cb_flow_wow = calculateWoW(cross_border, prev_cross_border);

        // 3. Composite Score Calculation (-100 to 100)
        // Sensitivities
        const normalized_cb = Math.min(Math.max(cb_wow * 20, -25), 25);
        const normalized_m2 = Math.min(Math.max(m2_wow * 5, -25), 25);
        const normalized_flow = Math.min(Math.max(cb_flow_wow * 10, -25), 25);
        const normalized_risk = Math.min(Math.max(risk_wow * 8, -25), 25);

        const composite_score = (normalized_cb + normalized_m2 + normalized_flow + normalized_risk) * 2;

        let regime_label = 'NEUTRAL';
        if (composite_score > 15) regime_label = 'EXPANDING';
        if (composite_score < -15) regime_label = 'CONTRACTING';

        let velocity_label = 'STEADY';
        if (Math.abs(composite_score) > 40) velocity_label = 'ACCELERATING';
        if (Math.abs(composite_score) < 5) velocity_label = 'DECELERATING';

        const interpretation = regime_label === 'EXPANDING'
            ? "Institutional liquidity is expanding as global balance sheets grow and risk volatility subsides."
            : regime_label === 'CONTRACTING'
                ? "Liquidity is contracting, signaling tightening financial conditions and heightening risk-off sentiment."
                : "Liquidity conditions are neutral with stable central bank activity and balanced capital flows.";

        // 5. Construct trailing history
        const historyLen = Math.min(fedAssets.length, ecbAssets.length, m2Money.length, vix.length, dxyProxy.length, 52);
        const trailing_history = [];
        for (let i = 0; i < historyLen; i++) {
            trailing_history.push({
                date: fedAssets[i].date,
                cb: (fedAssets[i].value + ecbAssets[i].value) / 1000000 + boj_est + pboc_est + boe_est,
                m2: m2Money[i]?.value || m2Money[0].value,
                risk: 1000 / (vix[i].value * (dxyProxy[i].value / 100)),
                flow: cross_border // Proxying static for historic since TIC is monthly
            });
        }

        const payload = {
            as_of_date: latestDate,
            cb_aggregate,
            cb_aggregate_wow_pct: cb_wow,
            global_m2_growth: m2,
            global_m2_wow_pct: m2_wow,
            cross_border_flow: cross_border,
            cross_border_wow_pct: cb_flow_wow,
            risk_on_off_proxy: risk_proxy,
            risk_on_off_wow_pct: risk_wow,
            composite_score,
            composite_wow_pct: 0,
            regime_label,
            velocity_label,
            interpretation,
            trailing_history: trailing_history.reverse()
        };

        const { error: upsertError } = await supabase
            .from('global_liquidity_direction')
            .upsert(payload, { onConflict: 'as_of_date' });

        if (upsertError) throw upsertError;

        return {
            success: true,
            date: latestDate,
            score: composite_score,
            regime: regime_label,
            rows_inserted: 1,
            raw_payload: payload
        };
    });
});
