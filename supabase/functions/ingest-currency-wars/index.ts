import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, taskName: string): Promise<T> {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${taskName} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

async function fetchFRED(fredId: string, apiKey: string) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${fredId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1000`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FRED Fetch ${fredId} failed: ${response.statusText}`);
    const data = await response.json();
    return (data.observations || []).map((o: any) => ({
        date: o.date,
        value: parseFloat(o.value)
    })).filter((o: any) => !isNaN(o.value));
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Fetching base metrics from FRED...');
        const [fedFunds, usdInr] = await Promise.all([
            fetchFRED('FEDFUNDS', fredApiKey),
            fetchFRED('DEXINUS', fredApiKey)
        ]);

        // Upsert base metrics
        const fedFundsData = fedFunds.map(d => ({ metric_id: 'FED_FUNDS_RATE', as_of_date: d.date, value: d.value }));
        const usdInrData = usdInr.map(d => ({ metric_id: 'USD_INR_RATE', as_of_date: d.date, value: d.value }));

        await supabase.from('metric_observations').upsert(fedFundsData, { onConflict: 'metric_id, as_of_date' });
        await supabase.from('metric_observations').upsert(usdInrData, { onConflict: 'metric_id, as_of_date' });

        // Fetch RBI Repo Rate (existing in DB)
        const { data: rbiRepo } = await supabase.from('metric_observations')
            .select('as_of_date, value')
            .eq('metric_id', 'IN_REPO_RATE')
            .order('as_of_date', { ascending: false })
            .limit(1000);

        // Fetch NSE Flows
        const { data: nseFlows } = await supabase.from('market_pulse_daily')
            .select('date, fii_cash_net')
            .order('date', { ascending: false })
            .limit(1000);

        // Calculate Policy Divergence
        const rbiMap = new Map(rbiRepo?.map(r => [r.as_of_date, r.value]));
        const divergenceData = fedFunds.map(f => {
            const rbiValue = rbiMap.get(f.date) || 6.5; // Fallback to current if missing
            return {
                metric_id: 'POLICY_DIVERGENCE_INDEX',
                as_of_date: f.date,
                value: (f.value - rbiValue) * 100 // Scale to bps
            };
        });

        await supabase.from('metric_observations').upsert(divergenceData, { onConflict: 'metric_id, as_of_date' });

        // Calculate Rupee Pressure Score (Simplified for now: FII flows + INR Change)
        // In a real scenario, this would involve FX reserve change and trade balance
        const inrMap = new Map(usdInr.map(i => [i.date, i.value]));
        const pressureData = nseFlows?.map((flow, idx) => {
            const nextFlow = nseFlows[idx + 1];
            if (!nextFlow) return null;

            const inrValue = inrMap.get(flow.date);
            const prevInr = inrMap.get(nextFlow.date);
            const inrDelta = (inrValue && prevInr) ? (inrValue - prevInr) : 0;

            // score = normalize(fii) + normalize(inr_delta)
            // High score = High pressure (Outflows + Rupee weakening)
            const score = (flow.fii_cash_net < 0 ? 1 : 0) * 50 + (inrDelta > 0 ? 1 : 0) * 50;

            return {
                metric_id: 'RUPEE_PRESSURE_SCORE',
                as_of_date: flow.date,
                value: score
            };
        }).filter(d => d !== null);

        if (pressureData && pressureData.length > 0) {
            await supabase.from('metric_observations').upsert(pressureData, { onConflict: 'metric_id, as_of_date' });
        }

        // Flow Tension (Simplified: Correlation check)
        const tensionData = nseFlows?.map(flow => {
            return {
                metric_id: 'FLOW_TENSION_INDEX',
                as_of_date: flow.date,
                value: Math.abs(flow.fii_cash_net) / 1000 // Placeholder metric
            };
        });

        if (tensionData && tensionData.length > 0) {
            await supabase.from('metric_observations').upsert(tensionData, { onConflict: 'metric_id, as_of_date' });
        }

        return new Response(JSON.stringify({ success: true, processed: { fedFunds: fedFunds.length, usdInr: usdInr.length, divergence: divergenceData.length } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
