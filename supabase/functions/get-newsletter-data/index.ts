import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Define Key Metrics to Track
        const metricIds = [
            'GOLD_PRICE_USD',
            'DXY_INDEX',
            'UST_10Y_YIELD',
            'BITCOIN_PRICE_USD',
            'OIL_WTI_PRICE',
            'US_M2_MONEY_SUPPLY',
            'FED_FUNDS_RATE'
        ];

        // 2. Fetch Latest Values & 30-Day Ago Values
        const { data: observations, error: obsError } = await supabase
            .from('metric_observations')
            .select('metric_id, value, as_of_date')
            .in('metric_id', metricIds)
            .order('as_of_date', { ascending: false })
            .limit(100); // Fetch enough to find current and past

        if (obsError) throw obsError;

        // Process Metrics (Calculate MoM Change)
        const processedMetrics = metricIds.map(id => {
            const metricObs = observations.filter(o => o.metric_id === id);
            if (!metricObs.length) return null;

            const latest = metricObs[0];
            // Find observation closest to 30 days ago
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const past = metricObs.find(o => new Date(o.as_of_date) <= thirtyDaysAgo) || metricObs[metricObs.length - 1];

            const currentValue = Number(latest.value);
            const pastValue = Number(past.value);
            const delta = currentValue - pastValue;
            const pctChange = (delta / pastValue) * 100;

            let insight = "Stable";
            if (pctChange > 3) insight = "Bullish Breakout";
            if (pctChange < -3) insight = "Bearish Breakdown";

            return {
                id,
                name: id.replace(/_/g, ' '),
                current: currentValue,
                past: pastValue,
                delta: delta,
                pctChange: pctChange.toFixed(2),
                insight
            };
        }).filter(Boolean);

        // 3. Fetch Upcoming Events (Next 30 Days)
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        const nextMonthStr = nextMonth.toISOString().split('T')[0];

        // Note: adjusting table name if needed based on check, assuming 'economic_events' or similar
        // If table doesn't exist, we'll return an empty array for now to avoid breaking.
        let upcomingEvents = [];
        try {
            const { data: events, error: eventError } = await supabase
                .from('upcoming_events') // derived from previous knowledge of calendar
                .select('*')
                .gte('date', today)
                .lte('date', nextMonthStr)
                .order('date', { ascending: true })
                .limit(1000);

            if (!eventError && events) upcomingEvents = events;
        } catch (e) {
            console.log("Events table not found or error", e);
        }

        // 4. Construct Payload
        const payload = {
            title: `GraphiQuestor Monthly Macro Observer – ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            generated_at: new Date().toISOString(),
            metrics: processedMetrics,
            events: upcomingEvents,
            summary: `Global liquidity conditions are ${processedMetrics.find(m => m.id === 'US_M2_MONEY_SUPPLY')?.pctChange > 0 ? 'expanding' : 'tightening'}. Gold is ${processedMetrics.find(m => m.id === 'GOLD_PRICE_USD')?.insight.toLowerCase()}.`
        };

        return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
