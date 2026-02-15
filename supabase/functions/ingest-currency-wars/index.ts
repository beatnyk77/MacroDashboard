import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FredObservation {
    date: string;
    value: number;
}

async function fetchFRED(seriesId: string, apiKey: string): Promise<FredObservation[]> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=500`;
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FRED Fetch ${seriesId} failed (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    return (data.observations || [])
        .map((o: any) => ({
            date: o.date,
            value: parseFloat(o.value)
        }))
        .filter((o: any) => !isNaN(o.value));
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const startTime = new Date();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let rowsInserted = 0;
    let rowsUpdated = 0;

    try {
        console.log('Fetching macro metrics from FRED...');
        // FEDFUNDS: Effective Federal Funds Rate
        // IRSTCB01INM156N: Interest Rates: Immediate Rates (< 24 Hours): Central Bank Rates: Total for India
        // EXINUS: Indian Rupees to U.S. Dollar Spot Exchange Rate
        const [fedFunds, rbiRepo, usdInr] = await Promise.all([
            fetchFRED('FEDFUNDS', fredApiKey),
            fetchFRED('IRSTCB01INM156N', fredApiKey),
            fetchFRED('EXINUS', fredApiKey)
        ]);

        const observations = [];

        // 1. FED Funds Rate
        fedFunds.forEach(d => {
            observations.push({
                metric_id: 'FED_FUNDS_RATE',
                as_of_date: d.date,
                value: d.value,
                last_updated_at: new Date().toISOString()
            });
            observations.push({
                metric_id: 'US_POLICY_RATE',
                as_of_date: d.date,
                value: d.value,
                last_updated_at: new Date().toISOString()
            });
        });

        // 2. India Repo Rate
        rbiRepo.forEach(d => {
            observations.push({
                metric_id: 'IN_REPO_RATE',
                as_of_date: d.date,
                value: d.value,
                last_updated_at: new Date().toISOString()
            });
            observations.push({
                metric_id: 'IN_POLICY_RATE',
                as_of_date: d.date,
                value: d.value,
                last_updated_at: new Date().toISOString()
            });
        });

        // 3. USD/INR
        usdInr.forEach(d => {
            observations.push({
                metric_id: 'USD_INR_RATE',
                as_of_date: d.date,
                value: d.value,
                last_updated_at: new Date().toISOString()
            });
        });

        // Upsert base metrics
        const { error: upsertError } = await supabase
            .from('metric_observations')
            .upsert(observations, { onConflict: 'metric_id, as_of_date' });

        if (upsertError) throw upsertError;
        rowsUpdated += observations.length;

        // 4. Calculate Derived Metrics (Policy Divergence)
        const rbiMap = new Map(rbiRepo.map(r => [r.date, r.value]));
        const divergenceData = fedFunds.map(f => {
            const rbiValue = rbiMap.get(f.date);
            if (rbiValue === undefined) return null;
            return {
                metric_id: 'POLICY_DIVERGENCE_INDEX',
                as_of_date: f.date,
                value: (f.value - rbiValue) * 100, // bps
                last_updated_at: new Date().toISOString()
            };
        }).filter(d => d !== null);

        if (divergenceData.length > 0) {
            await supabase.from('metric_observations').upsert(divergenceData, { onConflict: 'metric_id, as_of_date' });
            rowsUpdated += divergenceData.length;
        }

        // 5. Calculate Rupee Pressure Score
        // Logic: Weighted average of FII flows (from market_pulse_daily) and INR % change
        const { data: nseFlows } = await supabase.from('market_pulse_daily')
            .select('date, fii_cash_net')
            .order('date', { ascending: false })
            .limit(100);

        const inrMap = new Map(usdInr.map(i => [i.date, i.value]));
        const pressureData = nseFlows?.map((flow, idx) => {
            const nextFlow = nseFlows[idx + 1];
            if (!nextFlow) return null;

            const inrValue = inrMap.get(flow.date);
            const prevInr = inrMap.get(nextFlow.date);
            if (!inrValue || !prevInr) return null;

            const inrChangePct = ((inrValue - prevInr) / prevInr) * 100;
            // Pressure increases if FII outflows (negative fii_cash_net) OR INR weakens (positive inrChangePct)
            // Scale FII: -5000cr = 50 points, 0cr = 0 points
            const fiiComponent = Math.min(Math.max(-flow.fii_cash_net / 100, 0), 50);
            // Scale INR: +1% change = 50 points
            const inrComponent = Math.min(Math.max(inrChangePct * 50, 0), 50);

            return {
                metric_id: 'RUPEE_PRESSURE_SCORE',
                as_of_date: flow.date,
                value: fiiComponent + inrComponent,
                last_updated_at: new Date().toISOString()
            };
        }).filter(d => d !== null);

        if (pressureData && pressureData.length > 0) {
            await supabase.from('metric_observations').upsert(pressureData, { onConflict: 'metric_id, as_of_date' });
            rowsUpdated += pressureData.length;
        }

        // Log success
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-currency-wars',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'success',
            rows_updated: rowsUpdated,
            metadata: {
                fed_funds_count: fedFunds.length,
                rbi_repo_count: rbiRepo.length,
                usd_inr_count: usdInr.length,
                last_date: fedFunds[0]?.date
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${rowsUpdated} observations`,
            last_date: fedFunds[0]?.date
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Ingestion failed:', error);

        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-currency-wars',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message,
            metadata: { stack: error.stack }
        });

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
