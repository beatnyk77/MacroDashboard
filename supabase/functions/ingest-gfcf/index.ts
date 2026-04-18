import { createClient } from '@supabase/supabase-js'
import { runIngestion } from '../_shared/logging.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Data Source Config
interface GfcfMetric {
    id: string;
    type: 'calculated' | 'direct';
    series_id?: string;
    numerator?: string;
    denominator?: string;
    denominator_candidates?: string[];
    numerator_scale?: number; // Multiply by this to get to denominator units
}

const METRICS: GfcfMetric[] = [
    {
        id: 'US_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'GPDIC1', // Real Gross Private Domestic Investment (Billions)
        denominator: 'GDPC1', // Real GDP (Billions)
        numerator_scale: 1
    },
    {
        id: 'US_PRIVATE_GFCF_GDP_PCT',
        type: 'direct',
        series_id: 'A006RE1Q156NBEA', // Shares of gross domestic product: Gross private domestic investment
    },
    {
        id: 'JP_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXKP04JPQ189S', // GFCF (Billions of Yen)
        denominator_candidates: ['JPNNGDP'], // GDP (Millions of Yen)
        numerator_scale: 1000 // Convert Billions to Millions
    },
    {
        id: 'EU_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXCP04EZQ189S', // GFCF (Euros)
        denominator: 'EUNNGDP', // GDP (Millions of Euros)
        numerator_scale: 0.000001 // Convert Euros to Millions
    },
    {
        id: 'IN_GFCF_GDP_PCT',
        type: 'calculated',
        numerator: 'NAEXKP04INQ652S', // GFCF (Rupees, Current Prices)
        denominator: 'INDGDPNQDSMEI', // Nominal GDP (Rupees, Quarterly, OECD)
        numerator_scale: 1
    }
];

const CHINA_GFCF_FIXED = 42.0;

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fredApiKey = Deno.env.get('FRED_API_KEY');

    if (!fredApiKey) {
        return new Response(JSON.stringify({ error: 'FRED_API_KEY is missing' }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    return runIngestion(supabase, 'ingest-gfcf', async (ctx) => {
        const updates = [];
        const errors = [];

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
                    const candidates = metric.denominator_candidates || (metric.denominator ? [metric.denominator] : []);

                    for (const cand of candidates) {
                        try {
                            den = await fetchFredSeries(fredApiKey, cand);
                            if (den) break;
                        } catch (e: any) {
                            console.log(`Candidate ${cand} failed: ${e.message}`);
                        }
                    }

                    if (num && den) {
                        const scale = metric.numerator_scale ?? 1;
                        const scaledNum = num.value * scale;
                        value = (scaledNum / den.value) * 100;
                        date = num.date > den.date ? num.date : den.date;

                        console.log(`Processed ${metric.id}: num=${num.value}, den=${den.value}, scale=${scale}, result=${value.toFixed(2)}%`);
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
                console.error(`Error processing ${metric.id}:`, e);
                errors.push(`Error processing ${metric.id}: ${e.message}`);
            }
        }

        // Process China Fallback
        updates.push({
            metric_id: 'CN_GFCF_GDP_PCT',
            as_of_date: new Date().toISOString().split('T')[0],
            value: CHINA_GFCF_FIXED,
            last_updated_at: new Date().toISOString()
        });

        if (updates.length > 0) {
            const { error } = await ctx.supabase
                .from('metric_observations')
                .upsert(updates, { onConflict: 'metric_id, as_of_date' });
            if (error) throw error;
        }

        return {
            rows_inserted: updates.length,
            metadata: { errors, update_ids: updates.map(u => u.metric_id) }
        };
    });
});
