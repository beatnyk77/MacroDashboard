import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- DATA PROVIDER CONFIGS ---
const EMBER_API_BASE = "https://api.ember-climate.org/v1/data/generation"; // Placeholder
const EUROSTAT_API_BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        console.log("Starting Global Energy Ingestion (Ember + Eurostat + GIE)...");

        const results = [];

        // 1. Fetch Power Mix Divergence Data (Comparative for US, EU, IN, CN)
        const entities = [
            { code: 'USA', region: 'US' },
            { code: 'EUU', region: 'EU' },
            { code: 'IND', region: 'India' },
            { code: 'CHN', region: 'China' }
        ];

        const FETCH_VARIABLES = ['Coal', 'Solar', 'Wind', 'Hydro', 'Bioenergy', 'Nuclear', 'Gas', 'Other fossil', 'Other renewables'];
        const emberApiKey = Deno.env.get('EMBER_API_KEY');

        console.log(`Using Ember API Key: ${emberApiKey ? 'YES' : 'NO'}`);

        if (emberApiKey) {
            try {
                for (const entity of entities) {
                    const emberUrl = new URL("https://api.ember-climate.org/v1/electricity-generation/monthly");
                    emberUrl.searchParams.append('entity_code', entity.code);
                    emberUrl.searchParams.append('unit', 'percentage');

                    const res = await fetch(emberUrl.toString(), {
                        headers: { 'x-api-key': emberApiKey }
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Get latest month's data
                        const latestDate = Array.isArray(data) ? data[0]?.date : null;
                        if (latestDate) {
                            const currentMonthData = data.filter((d: any) => d.date === latestDate);

                            const coal = currentMonthData.find((d: any) => d.variable === 'Coal')?.share_pct || 0;
                            const renewables = currentMonthData
                                .filter((d: any) => ['Solar', 'Wind', 'Hydro', 'Bioenergy', 'Other renewables'].includes(d.variable))
                                .reduce((acc: number, curr: any) => acc + (curr.share_pct || 0), 0);
                            const other = 100 - coal - renewables;

                            const prefix = entity.region === 'India' ? 'IN' : (entity.region === 'China' ? 'CN' : entity.region);

                            // Upsert metrics
                            const observations = [
                                { id: `${prefix}_POWER_COAL_PCT`, val: coal },
                                { id: `${prefix}_POWER_RENEWABLE_PCT`, val: renewables },
                                { id: `${prefix}_POWER_OTHER_PCT`, val: other }
                            ];

                            for (const obs of observations) {
                                const { error } = await supabase.from('metric_observations').upsert({
                                    metric_id: obs.id,
                                    value: obs.val,
                                    as_of_date: latestDate,
                                    last_updated_at: new Date().toISOString()
                                }, { onConflict: 'metric_id, as_of_date' });
                                if (!error) results.push(obs.id);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Ember Fetch failed:", e);
            }
        } else {
            console.warn("EMBER_API_KEY missing. Skipping real-time Power Mix ingestion.");
        }

        // 2. EU Gas Storage (via GIE AGSI API - Public endpoint)
        try {
            const gieUrl = "https://agsi.gie.eu/api?type=eu";
            const res = await fetch(gieUrl);
            if (res.ok) {
                const data: any = await res.json();
                const latest = data.data?.[0];
                if (latest) {
                    const { error } = await supabase.from('metric_observations').upsert({
                        metric_id: 'EU_GAS_STORAGE_PCT',
                        value: parseFloat(latest.full),
                        as_of_date: latest.gasDayStart,
                        last_updated_at: new Date().toISOString()
                    }, { onConflict: 'metric_id, as_of_date' });
                    if (!error) results.push('EU_GAS_STORAGE_PCT');
                }
            }
        } catch (e) {
            console.error("GIE Fetch failed:", e);
        }

        return new Response(JSON.stringify({ success: true, ingested: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
