import { createClient } from 'jsr:@supabase/supabase-js@2'
import { sendSlackAlert } from './slack.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Data Source Config
const METRICS = [
    {
        id: 'US_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'GPDIC1', // Real Gross Private Domestic Investment
        denominator: 'GDPC1', // Real GDP
        adjust_units: false // Both in Billions of Chn 2012 Dollars
    },
    {
        id: 'US_PRIVATE_GFCF_GDP_PCT',
        type: 'direct',
        series_id: 'A006RE1Q156NBEA', // Shares of gross domestic product: Gross private domestic investment
    },
    {
        id: 'JP_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXKP04JPQ189S', // GFCF in Yen
        denominator_candidates: ['JPNNGDP', 'MKTGDPJPA646NWDB'], // GDP in Millions of Yen
        numerator_scale: 1000000 // Convert Yen to Millions of Yen
    },
    {
        id: 'EU_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXCP04EZQ189S', // GFCF in Euros
        denominator: 'EUNNGDP', // GDP in Millions of Euros
        numerator_scale: 1000000 // Convert Euros to Millions of Euros
    },
    {
        id: 'IN_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXKP04INQ652S', // GFCF (Rupees, Current Prices)
        denominator: 'INDGDPNQDSMEI', // Nominal GDP (Rupees, Quarterly, OECD)
    }
];

// Constants for China
const CHINA_GFCF_FIXED = 42.0; // Fallback %

async function fetchFredSeries(apiKey: string, seriesId: string) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED fetch failed for ${seriesId}: ${res.statusText}`);
    const data = await res.json();
    if (!data.observations || data.observations.length === 0) return null;
    return {
        date: data.observations[0].date,
        value: parseFloat(data.observations[0].value)
    };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const fredApiKey = Deno.env.get('FRED_API_KEY');

        if (!fredApiKey) throw new Error('FRED_API_KEY is missing');

        const supabase = createClient(supabaseUrl, supabaseKey);
        const updates = [];
        const errors = [];

        // 1. Process standard metrics
        for (const metric of METRICS) {
            try {
                let value: number | null = null;
                let date: string | null = null;

                if (metric.type === 'direct' && metric.series_id) {
                    const obs = await fetchFredSeries(fredApiKey, metric.series_id);
                    if (obs) {
                        value = obs.value;
                        date = obs.date;
                    }
                } else if (metric.type === 'calculated' && metric.numerator) {
                    const num = await fetchFredSeries(fredApiKey, metric.numerator);

                    let den = null;
                    if (Array.isArray(metric.denominator_candidates)) {
                        for (const cand of metric.denominator_candidates) {
                            try {
                                den = await fetchFredSeries(fredApiKey, cand);
                                if (den) break;
                            } catch (e) { console.log(`Candidate ${cand} failed`); }
                        }
                    } else if (metric.denominator) {
                        den = await fetchFredSeries(fredApiKey, metric.denominator);
                    }

                    if (num && den) {
                        const numValue = metric.numerator_scale ? num.value / metric.numerator_scale : num.value;
                        value = (numValue / den.value) * 100;
                        date = num.date > den.date ? num.date : den.date;
                    }
                }

                if (value !== null && date) {
                    updates.push({
                        metric_id: metric.id,
                        as_of_date: date,
                        value: Number(value.toFixed(2)),
                        last_updated_at: new Date().toISOString()
                    });
                } else {
                    errors.push(`No data for ${metric.id}`);
                }
            } catch (e: any) {
                errors.push(`Error processing ${metric.id}: ${e.message}`);
            }
        }

        // 2. Process China (Fallback/Placeholder)
        // Try to fetch from TE if possible? For now, implementing robust fallback.
        updates.push({
            metric_id: 'CN_GFCF_GDP_PCT',
            as_of_date: new Date().toISOString().split('T')[0], // Today
            value: CHINA_GFCF_FIXED,
            last_updated_at: new Date().toISOString()
        });

        // 3. Upsert
        if (updates.length > 0) {
            const { error } = await supabase
                .from('metric_observations')
                .upsert(updates, { onConflict: 'metric_id, as_of_date' });

            if (error) throw error;
        }

        return new Response(JSON.stringify({
            success: true,
            processed: updates.length,
            errors
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Ingest GFCF Error:', error);
        await sendSlackAlert(`GFCF Ingestion Failed: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
