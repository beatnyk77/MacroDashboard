import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FredObservation {
    date: string;
    value: number;
}

interface MetricObservation {
    metric_id: string;
    as_of_date: string;
    value: number;
    last_updated_at: string;
}

async function fetchFRED(seriesId: string, apiKey: string): Promise<FredObservation[]> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2000`;
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

    let rowsUpdated = 0;

    try {
        console.log('Fetching macro metrics from FRED...');
        const seriesToFetch = [
            { id: 'FEDFUNDS', metricId: 'FED_FUNDS_RATE', alias: 'US_POLICY_RATE' },
            { id: 'IRSTCB01INM156N', metricId: 'IN_REPO_RATE', alias: 'IN_POLICY_RATE' },
            { id: 'EXINUS', metricId: 'USD_INR_RATE', alias: null },
            { id: 'DEXCHUS', metricId: 'USD_CNY_RATE', alias: null },
            { id: 'DEXBZUS', metricId: 'USD_BRL_RATE', alias: null },
            { id: 'DEXMXUS', metricId: 'USD_MXN_RATE', alias: null },
            { id: 'DEXTWUS', metricId: 'USD_TWD_RATE', alias: null }
        ];

        const fetchPromises = seriesToFetch.map(series => fetchFRED(series.id, fredApiKey));
        const results = await Promise.all(fetchPromises);

        const observations: MetricObservation[] = [];
        const seriesDataMap: Record<string, FredObservation[]> = {};

        // Process each series
        seriesToFetch.forEach((series, idx) => {
            const data = results[idx];
            seriesDataMap[series.metricId] = data;
            data.forEach(d => {
                observations.push({
                    metric_id: series.metricId,
                    as_of_date: d.date,
                    value: d.value,
                    last_updated_at: new Date().toISOString()
                });
                if (series.alias) {
                    observations.push({
                        metric_id: series.alias,
                        as_of_date: d.date,
                        value: d.value,
                        last_updated_at: new Date().toISOString()
                    });
                }
            });
        });

        // Upsert base metrics (batches of 1000)
        const batchSize = 1000;
        for (let i = 0; i < observations.length; i += batchSize) {
            const { error: upsertError } = await supabase
                .from('metric_observations')
                .upsert(observations.slice(i, i + batchSize), { onConflict: 'metric_id, as_of_date' });
            if (upsertError) throw upsertError;
        }
        rowsUpdated += observations.length;

        // 4. Calculate Derived Metrics (Policy Divergence)
        const fedFunds = seriesDataMap['FED_FUNDS_RATE'] || [];
        const rbiRepo = seriesDataMap['IN_REPO_RATE'] || [];
        const usdInr = seriesDataMap['USD_INR_RATE'] || [];

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
        }).filter((d): d is MetricObservation => d !== null);

        if (divergenceData.length > 0) {
            await supabase.from('metric_observations').upsert(divergenceData, { onConflict: 'metric_id, as_of_date' });
            rowsUpdated += divergenceData.length;
        }

        // 5. Calculate Enhanced Rupee Pressure Score (Composite Index)
        const { data: nseFlows } = await supabase.from('market_pulse_daily')
            .select('date, fii_cash_net, dii_cash_net')
            .order('date', { ascending: false })
            .limit(200);

        // Build temporal maps for volatility and EM peer performance
        const inrVolatilityMap = new Map<string, number>();
        const sortedInr = [...usdInr].sort((a, b) => a.date.localeCompare(b.date));
        for (let i = 20; i < sortedInr.length; i++) {
            const window = sortedInr.slice(i - 20, i).map(x => x.value);
            const mean = window.reduce((a, b) => a + b, 0) / window.length;
            const squaredDiffs = window.map(v => Math.pow(v - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / window.length;
            inrVolatilityMap.set(sortedInr[i].date, Math.sqrt(variance));
        }

        // Calculate EM daily average change (no forward bias)
        const emPeerIds = ['USD_CNY_RATE', 'USD_BRL_RATE', 'USD_MXN_RATE', 'USD_TWD_RATE'];
        const emAvgDailyChangeMap = new Map<string, number>();
        const allDates = new Set<string>();
        emPeerIds.forEach(id => seriesDataMap[id]?.forEach(o => allDates.add(o.date)));

        Array.from(allDates).sort().forEach(date => {
            let totalPctChange = 0;
            let count = 0;
            emPeerIds.forEach(id => {
                const series = seriesDataMap[id] || [];
                const idx = series.findIndex(o => o.date === date);
                if (idx > 0 && idx < series.length - 1) {
                    const current = series[idx].value;
                    const prev = series[idx + 1].value; // sorted desc
                    totalPctChange += ((current - prev) / prev) * 100;
                    count++;
                }
            });
            if (count > 0) emAvgDailyChangeMap.set(date, totalPctChange / count);
        });

        const pressureData: MetricObservation[] = (nseFlows || []).map((flow: any) => {
            const date = flow.date;
            
            // 1. Inflow Pressure (40% weight): -10000cr inflow = 0 pressure, -5000cr outflow = 20 pressure
            const netFlow = (Number(flow.fii_cash_net) || 0) + (Number(flow.dii_cash_net) || 0);
            const flowScore = Math.max(0, Math.min(40, (-netFlow / 1000) * 8));

            // 2. Volatility Pressure (30% weight): 0.05 daily std dev = 0, 0.5 = 30
            const vol = inrVolatilityMap.get(date) || 0;
            const volScore = Math.max(0, Math.min(30, (vol / 0.5) * 30));

            // 3. Relative EM Pressure (30% weight): INR % change - EM avg % change
            const inrSeries = seriesDataMap['USD_INR_RATE'] || [];
            const inrIdx = inrSeries.findIndex(o => o.date === date);
            let relScore = 0;
            if (inrIdx >= 0 && inrIdx < inrSeries.length - 1) {
                const inrChange = ((inrSeries[inrIdx].value - inrSeries[inrIdx+1].value) / inrSeries[inrIdx+1].value) * 100;
                const emChange = emAvgDailyChangeMap.get(date) || 0;
                relScore = Math.max(0, Math.min(30, (inrChange - emChange) * 20)); // Weak relative to peers
            }

            return {
                metric_id: 'COMPOSITE_PRESSURE_INDEX',
                as_of_date: date,
                value: Math.min(100, flowScore + volScore + relScore),
                last_updated_at: new Date().toISOString()
            };
        });

        if (pressureData.length > 0) {
            await supabase.from('metric_observations').upsert(pressureData, { onConflict: 'metric_id, as_of_date' });
            rowsUpdated += pressureData.length;
        }

        // 6. EM Relative Pressure specifically (20-day smoothed)
        const emRelativeData: MetricObservation[] = [];
        const sortedDates = Array.from(allDates).sort();
        sortedDates.forEach((date, idx) => {
            if (idx < 20) return;
            const inrSeries = seriesDataMap['USD_INR_RATE'] || [];
            const inrIdx = inrSeries.findIndex(o => o.date === date);
            if (inrIdx >= 0 && inrIdx < inrSeries.length - 20) {
                const current = inrSeries[inrIdx].value;
                const prev = inrSeries[inrIdx + 20].value;
                const inr20dChange = ((current - prev) / prev) * 100;

                // Calculate EM 20d avg change for this date
                let emSum = 0, emCount = 0;
                emPeerIds.forEach(id => {
                    const s = seriesDataMap[id] || [];
                    const si = s.findIndex(o => o.date === date);
                    if (si >= 0 && si < s.length - 20) {
                        emSum += ((s[si].value - s[si+20].value) / s[si+20].value) * 100;
                        emCount++;
                    }
                });
                const em20dChange = emCount > 0 ? emSum / emCount : 0;

                emRelativeData.push({
                    metric_id: 'EM_RELATIVE_PRESSURE',
                    as_of_date: date,
                    value: inr20dChange - em20dChange,
                    last_updated_at: new Date().toISOString()
                });
            }
        });

        if (emRelativeData.length > 0) {
            await supabase.from('metric_observations').upsert(emRelativeData, { onConflict: 'metric_id, as_of_date' });
            rowsUpdated += emRelativeData.length;
        }

        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-currency-wars',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'success',
            rows_updated: rowsUpdated,
            metadata: { fed_funds_count: fedFunds.length, usd_inr_count: usdInr.length }
        });

        return new Response(JSON.stringify({ success: true, rowsUpdated }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Ingestion failed:', error);
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-currency-wars',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: error.message
        });
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
