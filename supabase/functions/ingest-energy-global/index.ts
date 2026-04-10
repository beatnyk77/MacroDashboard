import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- DATA PROVIDER CONFIGS ---
const _EMBER_API_BASE = "https://api.ember-climate.org/v1/data/generation"; // Placeholder
const _EUROSTAT_API_BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

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

        const _FETCH_VARIABLES = ['Coal', 'Solar', 'Wind', 'Hydro', 'Bioenergy', 'Nuclear', 'Gas', 'Other fossil', 'Other renewables'];
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
                        const data = await res.json() as any;
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
        // Fetch historical data since 2011 (API limit) - User requested 2000 but API typically starts later.
        // We will fetch incrementally by year to build history.
        try {
            const currentYear = new Date().getFullYear();
            const startYear = 2010; // GIE API has good coverage from ~2011
            const gieBaseUrl = "https://agsi.gie.eu/api";

            // We only need to fetch history if we are doing a full backfill. 
            // For now, we will fetch the last 15 years in blocks or just iterate years.
            // Note: GIE API might rate limit.

            console.log(`[EU_GAS] Fetching history from ${startYear} to ${currentYear}...`);

            for (let year = startYear; year <= currentYear; year++) {
                // Approximate 'from' and 'to' for the year
                const fromDate = `${year}-01-01`;
                const toDate = `${year}-12-31`;

                // GIE API Params: from, to, size
                const gieUrl = `${gieBaseUrl}?type=eu&from=${fromDate}&to=${toDate}&size=300`; // size 300 covers most days or at least samples

                try {
                    const res = await fetch(gieUrl, {
                        headers: { 'x-key': Deno.env.get('GIE_API_KEY') || '' } // Some GIE endpoints need key, public one is open but rate limited
                    });

                    if (res.ok) {
                        const json = await res.json() as any;
                        const data = json.data || [];

                        console.log(`[EU_GAS] Year ${year}: Found ${data.length} records.`);

                        // We will decimate to weekly to save space/calls if needed, but let's try monthly max.
                        // Actually, let's just store the monthly average or first of month.
                        // Filter for 1st of month to reduce noise -> upsert

                        const monthlySamples = data.filter((d: any) => d.gasDayStart.endsWith('-01'));

                        for (const row of monthlySamples) {
                            const { error } = await supabase.from('metric_observations').upsert({
                                metric_id: 'EU_GAS_STORAGE_PCT',
                                value: parseFloat(row.full),
                                as_of_date: row.gasDayStart,
                                last_updated_at: new Date().toISOString()
                            }, { onConflict: 'metric_id, as_of_date' });

                            if (!error && year === currentYear) results.push('EU_GAS_STORAGE_PCT');
                        }
                    }
                } catch (err) {
                    console.error(`[EU_GAS] Failed year ${year}:`, err);
                }

                // Small delay to be nice to API
                // await new Promise(r => setTimeout(r, 200));
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
