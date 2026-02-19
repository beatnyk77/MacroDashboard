import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KalshiMarket {
    ticker: string;
    event_ticker: string;
    yes_price: number;
    no_price: number;
    volume: number;
    close_time: string;
    subtitle: string;
    title: string;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const startTime = new Date();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Fetching Kalshi Fed meeting data...');
        // KXFEDM is the series for Fed meeting rates
        const kalshiUrl = 'https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXFEDM&status=open';
        const response = await fetch(kalshiUrl);

        if (!response.ok) {
            throw new Error(`Kalshi API failed with status ${response.status}`);
        }

        const data = await response.json();
        const markets: KalshiMarket[] = data.markets || [];

        if (markets.length === 0) {
            console.log('No open KXFEDM markets found.');
            return new Response(JSON.stringify({ success: true, message: 'No open markets' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Group by meeting and map outcomes
        // Tickers look like: FED-26MAR-25-T5.5 (Rate Target 5.5%)
        // Or similar. We need to extract the outcome from the subtitle or title.
        // Example: "Target range: 5% - 5.25%" or "Will the target range be 5.25% - 5.5%?"

        const observations = markets.map(m => {
            // Yes price represents the probability in cents (0-100)
            const probability = m.yes_price;

            // Map common outcomes based on title/subtitle
            let outcome = m.subtitle || m.title;

            // Normalize outcome for better charting
            if (outcome.includes('5.25% - 5.5%')) outcome = '5.25 - 5.50%';
            else if (outcome.includes('5% - 5.25%')) outcome = '5.00 - 5.25%';
            else if (outcome.includes('4.75% - 5%')) outcome = '4.75 - 5.00%';

            return {
                meeting_date: m.close_time.split('T')[0],
                outcome: outcome,
                probability: probability,
                volume_contracts: m.volume,
                ticker: m.ticker,
                fetched_at: startTime.toISOString()
            };
        });

        // Get previous day's probabilities for deltas
        const { data: prevData } = await supabase
            .from('kalshi_fomc_probabilities')
            .select('*')
            .order('fetched_at', { ascending: false })
            .limit(observations.length * 2);

        const prevMap = new Map();
        if (prevData) {
            // Find the most recent distinct fetched_at that isn't the current one (if current already exists)
            const distinctFetchedAt = [...new Set(prevData.map(d => d.fetched_at))];
            const lastFetchedAt = distinctFetchedAt[0];

            prevData.filter(d => d.fetched_at === lastFetchedAt).forEach(d => {
                prevMap.set(d.outcome, d.probability);
            });
        }

        const finalObservations = observations.map(obs => ({
            ...obs,
            prev_day_probability: prevMap.get(obs.outcome) || null
        }));

        const { error: upsertError } = await supabase
            .from('kalshi_fomc_probabilities')
            .upsert(finalObservations, { onConflict: 'fetched_at, outcome' });

        if (upsertError) throw upsertError;

        // Log success
        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-kalshi-fed',
            start_time: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            status: 'success',
            rows_updated: finalObservations.length,
            metadata: {
                markets_found: markets.length,
                meeting_dates: [...new Set(observations.map(o => o.meeting_date))]
            }
        });

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${finalObservations.length} outcomes`,
            data: finalObservations
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Kalshi ingestion failed:', error);

        await supabase.from('ingestion_logs').insert({
            function_name: 'ingest-kalshi-fed',
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
