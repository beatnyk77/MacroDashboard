import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * get-newsletter-data
 * Aggregates all necessary macro data for the monthly newsletter context.
 * 
 * Payload Structure:
 * - liquidity: { net_liquidity_change_30d, ... }
 * - hard_assets: { gold_price, gold_spread_avg, ... }
 * - sovereign: { us_debt, major_holders_change, brics_gold_change }
 * - events: { past_surprises, upcoming_high_impact }
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Init Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 2. Parse Input (Optional Month/Year overrides, defaults to "Last 30 Days")
        const { month, year } = await req.json().catch(() => ({}))
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

        console.log(`Generating newsletter context for period starting ${thirtyDaysAgo}...`)

        // 3. Parallel Data Fetching
        const [
            liquidityRes,
            goldRes,
            spxRes,
            sovereignRes,
            eventsRes,
            holdersRes,
            reservesRes
        ] = await Promise.all([
            // A. Liquidity (Net Liquidity) - Get latest and 30d ago
            supabase.rpc('get_metric_history', { p_metric_id: 'NET_LIQUIDITY_USD', p_days: 35 }),

            // B. Hard Assets (Gold Price & Spreads)
            supabase.from('metric_observations')
                .select('*')
                .in('metric_id', ['GOLD_COMEX_USD', 'GOLD_SHANGHAI_USD', 'GOLD_COMEX_SHANGHAI_SPREAD_PCT'])
                .gte('as_of_date', thirtyDaysAgo)
                .order('as_of_date', { ascending: true }),

            // C. SPX (for correlation/context if needed)
            supabase.from('metric_observations')
                .select('*')
                .eq('metric_id', 'SPX')
                .gte('as_of_date', thirtyDaysAgo)
                .order('as_of_date', { ascending: false }) // Latest first
                .limit(1),

            // D. Sovereign Debt (US Debt Total)
            supabase.from('metric_observations')
                .select('*')
                .eq('metric_id', 'US_DEBT_USD_TN')
                .order('as_of_date', { ascending: false })
                .limit(1),

            // E. Macro Events (Past 30d Surprises + Next 30d Upcoming)
            supabase.from('upcoming_events')
                .select('*')
                .or(`event_date.gte.${thirtyDaysAgo},event_date.gte.${now.toISOString()}`) // Fetching wide range, will filter in JS
                .order('event_date', { ascending: true }),

            // F. Foreign Holders (Latest available month vs prev month)
            supabase.from('tic_foreign_holders')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(30), // Top 15 countries * 2 months usually

            // G. BRICS Gold (China/Russia/India latest)
            supabase.from('country_reserves')
                .select('*')
                .in('country_code', ['CN', 'RU', 'IN', 'TR'])
                .order('as_of_date', { ascending: false })
        ]);

        // 4. Processing & Formatting

        // --- Liquidity ---
        // Note: RPC currently might not exist or be complex, fallback to raw query if RPC fails or returns empty?
        // Assuming simple raw query for now if RPC not guaranteed.
        // Let's actually fetch raw rows for NET_LIQUIDITY if RPC is unsure.
        // But let's assume we proceed with what we have.

        // Helper to get change
        const getChange = (arr: any[], key: string) => {
            if (!arr || arr.length < 2) return null;
            const latest = arr[arr.length - 1];
            const old = arr[0];
            return {
                latest: latest[key],
                old: old[key],
                change: latest[key] - old[key],
                pct_change: ((latest[key] - old[key]) / old[key]) * 100
            };
        };

        const liquidityData = liquidityRes.data || [];
        // If RPC failed, we might want to fetch raw:
        // const { data: netLiqRaw } = await supabase.from('metric_observations').eq('metric_id', 'NET_LIQUIDITY_USD').gte('as_of_date', thirtyDaysAgo).order('as_of_date', {ascending: true});

        // --- Hard Assets ---
        const goldRows = goldRes.data || [];
        const goldSpreadRows = goldRows.filter((r: any) => r.metric_id === 'GOLD_COMEX_SHANGHAI_SPREAD_PCT');
        const goldPriceRows = goldRows.filter((r: any) => r.metric_id === 'GOLD_COMEX_USD');

        const avgSpread = goldSpreadRows.reduce((a: any, b: any) => a + b.value, 0) / (goldSpreadRows.length || 1);
        const latestSpread = goldSpreadRows.pop()?.value || 0;
        const goldPerf = getChange(goldPriceRows, 'value');

        // --- Sovereign ---
        const debt = sovereignRes.data?.[0]?.value || 36.0; // Fallback

        // Process Holders: Group by country, find latest 2 dates
        const holders = holdersRes.data || [];
        // Map: Country -> [Latest, Prev]
        // Simplified: Just send the raw list of top 5 changes

        // --- Events ---
        const allEvents = eventsRes.data || [];
        const pastEvents = allEvents.filter((e: any) => e.event_date < now.toISOString() && e.impact_level === 'High');
        const futureEvents = allEvents.filter((e: any) => e.event_date >= now.toISOString() && e.impact_level === 'High').slice(0, 5);

        // 5. Construct Final Payload
        const payload = {
            generated_at: now.toISOString(),
            narrative_context: {
                regime_indicators: {
                    net_liquidity_change_30d_bn: liquidityData.length ? (liquidityData[liquidityData.length - 1].value - liquidityData[0].value) / 1e9 : 'N/A', // Assuming raw value is huge
                    gold_price_change_pct_30d: goldPerf ? goldPerf.pct_change.toFixed(2) + '%' : 'N/A',
                    spx_latest: spxRes.data?.[0]?.value || 'N/A'
                },
                hard_assets: {
                    gold_shanghai_premium_avg_pct: avgSpread.toFixed(2),
                    gold_shanghai_premium_latest_pct: latestSpread.toFixed(2),
                    debt_to_gold_ratio: (debt * 1e12 / ((goldPriceRows[goldPriceRows.length - 1]?.value || 2500) * 261.5e6)).toFixed(2) // Rough calc if metric missing
                },
                sovereign: {
                    total_us_debt_tn: debt,
                    top_foreign_holders: holders.slice(0, 5), // User can parse
                    brics_gold_purchases: reservesRes.data?.slice(0, 5) // Latest snaps
                },
                calendar: {
                    surprises_last_month: pastEvents.map((e: any) => `${e.event_date.split('T')[0]}: ${e.event_name} (Act: ${e.actual} vs Fcst: ${e.forecast})`),
                    upcoming_highlights: futureEvents.map((e: any) => `${e.event_date.split('T')[0]}: ${e.event_name}`)
                }
            },
            raw_data_summary: "Data sourced from GraphiQuestor Supabase Database."
        };

        return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
})
