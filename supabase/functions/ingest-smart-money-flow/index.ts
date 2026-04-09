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

function calculateZScore(history: number[]) {
    if (history.length < 5) return 0;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const stdDev = Math.sqrt(history.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / history.length);
    return stdDev === 0 ? 0 : (history[0] - mean) / stdDev;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-smart-money-flow', async (ctx) => {
        const fredApiKey = Deno.env.get('FRED_API_KEY');
        if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

        // 1. Fetch Series
        // BOPGSTRLTS: TIC Net Foreign Purchases of Long-term Securities
        // BAMLH0A0HYM2: HY Option-Adjusted Spread (Invert: Lower = Risk ON)
        // GOLDPMGBD228NLBM: Gold Price (PM Fix)
        // SP500: Equity Performance
        const [ticRaw, hySpread, gold, sp500] = await Promise.all([
            fetchFredSeries('BOPGSTRLTS', fredApiKey),
            fetchFredSeries('BAMLH0A0HYM2', fredApiKey),
            fetchFredSeries('GOLDPMGBD228NLBM', fredApiKey),
            fetchFredSeries('SP500', fredApiKey)
        ]);

        const latestDate = ticRaw[0].date;

        // 2. Indicators
        const ticVal = ticRaw[0].value;
        const hyVal = hySpread[0].value;
        const goldVal = gold[0].value;
        const spVal = sp500[0].value;

        // Sentiment Proxies
        // Z-Scores for momentum
        const hyZ = calculateZScore(hySpread.map(s => s.value)); // Positive Z here means high spread (Risk OFF)
        const spZ = calculateZScore(sp500.map(s => s.value));    // Positive Z means high performance (Risk ON)
        const goldZ = calculateZScore(gold.map(s => s.value));  // Positive Z means high gold (Risk OFF)

        // 3. Composite Regime Score (-100 to 100)
        // Formula: (SP500 Momentum - Gold Momentum - HY Spread Momentum) normalized
        const rawScore = (spZ * 0.5) - (goldZ * 0.3) - (hyZ * 0.2);
        const regime_score = Math.min(Math.max(rawScore * 30, -100), 100);

        // 4. Sankey Structure (JSON)
        // Liquidity Source -> Smart Money Hub -> [Risk Assets, Safe Havens, Cash]
        const { data: liqData } = await supabase
            .from('global_liquidity_direction')
            .select('composite_score')
            .order('as_of_date', { ascending: false })
            .limit(1);

        const liqSource = liqData?.[0]?.composite_score || 0;
        const totalFlow = 100 + Math.abs(liqSource);

        const riskWeight = (regime_score + 100) / 200; // 0 to 1
        const riskFlow = totalFlow * riskWeight * 0.7; // Institutional preference for risk vs safe
        const safeFlow = totalFlow * (1 - riskWeight) * 0.5;
        const cashFlow = totalFlow - riskFlow - safeFlow;

        const sankey_data = {
            nodes: [
                { id: 'Liquidity', color: '#0df259' },
                { id: 'Smart Money Pool', color: '#22d3ee' },
                { id: 'Risk Assets', color: '#fbbf24' },
                { id: 'Safe Havens', color: '#818cf8' },
                { id: 'Cash Reserves', color: '#94a3b8' }
            ],
            links: [
                { source: 'Liquidity', target: 'Smart Money Pool', value: totalFlow },
                { source: 'Smart Money Pool', target: 'Risk Assets', value: riskFlow },
                { source: 'Smart Money Pool', target: 'Safe Havens', value: safeFlow },
                { source: 'Smart Money Pool', target: 'Cash Reserves', value: cashFlow }
            ]
        };

        const interpretation = regime_score > 30
            ? 'Institutional "Smart Money" is aggressively rotating into risk assets, favored by tight credit spreads and equity momentum.'
            : regime_score < -30
                ? 'Defensive posturing detected: Capital is fleeing to safe havens as TIC buying of Treasuries surges and credit risk widens.'
                : 'Balanced flow detected: Market participants are maintaining neutral exposure between risk and safety.';

        const payload = {
            as_of_date: latestDate,
            tic_net_foreign_buying: ticVal,
            cot_equities_net_position: spZ * 100, // Normalized proxy
            cot_gold_net_position: goldZ * 100,
            etf_flow_proxy: (1 / hyVal) * 10, // Inverse spread as flow proxy
            regime_score,
            sankey_data,
            interpretation
        };

        const { error: upsertError } = await supabase
            .from('smart_money_flow')
            .upsert(payload, { onConflict: 'as_of_date' });

        if (upsertError) throw upsertError;

        return {
            success: true,
            date: latestDate,
            regime_score,
            interpretation
        };
    });
});
