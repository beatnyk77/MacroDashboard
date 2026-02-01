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

        // 2. Parse Input (Optional Month/Year overrides, defaults to 1 year for charts)
        const { month, year } = await req.json().catch(() => ({}))
        const now = new Date()
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

        console.log(`Generating newsletter context and charts starting ${oneYearAgo}...`)

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
            // A. Liquidity (Net Liquidity) - 1 Year for chart
            supabase.from('metric_observations')
                .select('*')
                .eq('metric_id', 'NET_LIQUIDITY_USD')
                .gte('as_of_date', oneYearAgo)
                .order('as_of_date', { ascending: true }),
            
            // B. Hard Assets (Gold Price & Spreads) - 1 Year for chart
            supabase.from('metric_observations')
                .select('*')
                .in('metric_id', ['GOLD_COMEX_USD', 'GOLD_SHANGHAI_USD', 'GOLD_COMEX_SHANGHAI_SPREAD_PCT'])
                .gte('as_of_date', oneYearAgo)
                .order('as_of_date', { ascending: true }),

            // C. SPX
            supabase.from('metric_observations')
                .select('*')
                .eq('metric_id', 'SPX')
                .gte('as_of_date', thirtyDaysAgo)
                .order('as_of_date', { ascending: false })
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
                .or(`event_date.gte.${thirtyDaysAgo},event_date.gte.${now.toISOString()}`)
                .order('event_date', { ascending: true }),

             // F. Foreign Holders (Latest available month vs prev month)
             supabase.from('tic_foreign_holders')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(30),

            // G. BRICS Gold (China/Russia/India latest)
             supabase.from('country_reserves')
                 .select('*')
                 .in('country_code', ['CN', 'RU', 'IN', 'TR'])
                 .order('as_of_date', { ascending: false })
        ]);

        // 4. Processing & Formatting

        // Helper to get change for specific window
        const getChange = (arr: any[], days: number) => {
            if (!arr || arr.length < 2) return null;
            const latest = arr[arr.length - 1];
            // Find row closest to target date
            const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const oldIndex = arr.findIndex(r => r.as_of_date >= targetDate);
            const old = oldIndex !== -1 ? arr[oldIndex] : arr[0];
            
            return {
                latest: latest.value,
                old: old.value,
                change: latest.value - old.value,
                pct_change: ((latest.value - old.value) / old.value) * 100
            };
        };

        const liquidityRows = liquidityRes.data || [];
        const liqPerf = getChange(liquidityRows, 30);

        const goldRowsAll = goldRes.data || [];
        const goldSpreadRows = goldRowsAll.filter((r: any) => r.metric_id === 'GOLD_COMEX_SHANGHAI_SPREAD_PCT');
        const goldPriceRows = goldRowsAll.filter((r: any) => r.metric_id === 'GOLD_COMEX_USD');
        
        const latestSpread = goldSpreadRows[goldSpreadRows.length - 1]?.value || 0;
        const goldPerf = getChange(goldPriceRows, 30);

        // --- QuickChart URLs ---
        const generateChartUrl = (data: any[], title: string, label: string) => {
            if (!data || data.length === 0) return null;
            // Downsample for better performance/URL length (e.g., every 5th point for 1y)
            const downsampled = data.filter((_, i) => i % 5 === 0 || i === data.length - 1);
            const config = {
                type: 'line',
                data: {
                    labels: downsampled.map(r => r.as_of_date.split('-').slice(1).join('/')), // MM/DD
                    datasets: [{
                        label: label,
                        data: downsampled.map(r => r.value),
                        borderColor: '#FFD700',
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    title: { display: true, text: title, fontColor: '#fff', fontSize: 16 },
                    legend: { labels: { fontColor: '#fff' } },
                    scales: {
                        xAxes: [{ ticks: { fontColor: '#ccc' }, gridLines: { color: '#333' } }],
                        yAxes: [{ ticks: { fontColor: '#ccc' }, gridLines: { color: '#333' } }]
                    }
                }
            };
            return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&width=600&height=300&bkg=%23111111`;
        };

        const chartUrls = {
            gold_spread_1y: generateChartUrl(goldSpreadRows, 'Gold COMEX-Shanghai Spread (1Y)', 'Spread %'),
            net_liquidity_1y: generateChartUrl(liquidityRows, 'US Net Liquidity (1Y)', 'Value')
        };

        // --- Sovereign ---
        const debt = sovereignRes.data?.[0]?.value || 36.0;
        const holders = holdersRes.data || [];
        
        // --- Events ---
        const allEvents = eventsRes.data || [];
        const pastEvents = allEvents.filter((e: any) => e.event_date < now.toISOString() && e.impact_level === 'High');
        const futureEvents = allEvents.filter((e: any) => e.event_date >= now.toISOString() && e.impact_level === 'High').slice(0, 5);

        // 5. Construct Final Payload
        const payload = {
            generated_at: now.toISOString(),
            narrative_context: {
                regime_indicators: {
                    net_liquidity_change_30d_bn: liqPerf ? (liqPerf.change / 1e9).toFixed(2) : 'N/A',
                    gold_price_change_pct_30d: goldPerf ? goldPerf.pct_change.toFixed(2) + '%' : 'N/A',
                    spx_latest: spxRes.data?.[0]?.value || 'N/A'
                },
                hard_assets: {
                    gold_shanghai_premium_latest_pct: latestSpread.toFixed(2),
                    debt_to_gold_ratio: (debt * 1e12 / ((goldPriceRows[goldPriceRows.length - 1]?.value || 2500) * 261.5e6)).toFixed(2)
                },
                sovereign: {
                    total_us_debt_tn: debt,
                    top_foreign_holders: holders.slice(0, 5),
                    brics_gold_purchases: reservesRes.data?.slice(0, 5)
                },
                calendar: {
                    surprises_last_month: pastEvents.map((e: any) => `${e.event_date.split('T')[0]}: ${e.event_name} (Act: ${e.actual} vs Fcst: ${e.forecast})`),
                    upcoming_highlights: futureEvents.map((e: any) => `${e.event_date.split('T')[0]}: ${e.event_name}`)
                },
                charts: chartUrls
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
