import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Ingest IMF BRICS+ data (Aggregates and Country-wise Gold)
 * Quarterly/Monthly data on BRICS+ economic metrics
 */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Starting IMF BRICS+ ingestion...');

        // 1. Resolve IMF source_id
        const { data: source, error: sourceError } = await supabase
            .from('data_sources')
            .select('id')
            .eq('name', 'IMF')
            .single();

        if (sourceError || !source) throw new Error('IMF data source not found');
        const sourceId = source.id;

        // 2. Identify target metrics
        const { data: metrics, error: metricsError } = await supabase
            .from('metrics')
            .select('id')
            .ilike('id', 'BRICS_%');

        if (metricsError) throw metricsError;

        // 3. Simulated/Mock Data for BRICS+ (Mirroring IMF WEO/COFER structure)
        // In production, this would pull from IMF API or CSV
        const bricsData = {
            '2024-12-31': {
                'BRICS_USD_RESERVE_SHARE_PCT': 42.5,
                'BRICS_GOLD_HOLDINGS_TONNES': 6850.4,
                'BRICS_GOLD_SHARE_PCT': 18.2,
                'BRICS_GDP_PPP_TN': 63.2,
                'BRICS_DEBT_GDP_PCT': 65.4,
                'BRICS_INFLATION_YOY': 4.8
            },
            '2024-09-30': {
                'BRICS_USD_RESERVE_SHARE_PCT': 43.1,
                'BRICS_GOLD_HOLDINGS_TONNES': 6720.8,
                'BRICS_GOLD_SHARE_PCT': 17.5,
                'BRICS_GDP_PPP_TN': 61.8,
                'BRICS_DEBT_GDP_PCT': 64.8,
                'BRICS_INFLATION_YOY': 5.1
            }
        };

        // Country-wise Gold (Tonnes)
        const countryGoldData = [
            { code: 'CN', name: 'China', gold: 2264.3, date: '2024-12-31' },
            { code: 'RU', name: 'Russia', gold: 2332.7, date: '2024-12-31' },
            { code: 'IN', name: 'India', gold: 806.7, date: '2024-12-31' },
            { code: 'BR', name: 'Brazil', gold: 129.7, date: '2024-12-31' },
            { code: 'ZA', name: 'South Africa', gold: 125.4, date: '2024-12-31' }
        ];

        const summary: any = {
            metrics_attempted: metrics?.length || 0,
            metrics_inserted: 0,
            countries_updated: countryGoldData.length,
            errors: []
        };

        // 4. Process Aggregate Metrics
        for (const metric of metrics || []) {
            try {
                const observations = Object.entries(bricsData).map(([date, values]: [string, any]) => ({
                    metric_id: metric.id,
                    as_of_date: date,
                    value: values[metric.id],
                    last_updated_at: new Date().toISOString()
                })).filter(obs => obs.value !== undefined);

                if (observations.length > 0) {
                    const { error: upsertError } = await supabase
                        .from('metric_observations')
                        .upsert(observations, { onConflict: 'metric_id, as_of_date' });

                    if (upsertError) throw upsertError;
                    summary.metrics_inserted++;
                }
            } catch (err: any) {
                summary.errors.push({ metric: metric.id, error: err.message });
            }
        }

        // 5. Process Country-wise Gold Reserves
        const countryUpserts = countryGoldData.map(d => ({
            country_code: d.code,
            as_of_date: d.date,
            gold_tonnes: d.gold,
            last_updated_at: new Date().toISOString()
        }));

        const { error: countryError } = await supabase
            .from('country_reserves')
            .upsert(countryUpserts, { onConflict: 'country_code, as_of_date' });

        if (countryError) {
            summary.errors.push({ context: 'country_reserves', error: countryError.message });
        }

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('BRICS Ingestion Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
