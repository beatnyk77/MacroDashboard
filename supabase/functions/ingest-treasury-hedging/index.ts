/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FredObservation {
  date: string;
  value: string;
}

async function fetchFredSeries(seriesId: string, apiKey: string, limit = 100): Promise<FredObservation[]> {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED API Error for ${seriesId}: ${res.status}`);
  const data = await res.json();
  return data.observations || [];
}

/**
 * Ingest Treasury Hedging Metrics
 * Sources: FRED
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (!fredApiKey) throw new Error('FRED_API_KEY is not set');

    console.log('Starting Treasury Hedging ingestion...');

    const seriesMap = {
      'SOFR_RATE': 'SOFR',
      'USD_INR_SPOT': 'DEXINUS',
      'WTI_OIL_PRICE': 'DCOILWTICO',
      'US_10Y_YIELD': 'DGS10',
      'US_2Y_YIELD': 'DGS2',
      'US_3M_T_BILL': 'DTB3',
      'IN_10Y_YIELD': 'INDBOND10YVG', // Generic proxy if available or monthly
    };

    const results: any[] = [];
    const now = new Date().toISOString();

    for (const [metricId, fredId] of Object.entries(seriesMap)) {
      try {
        console.log(`Fetching ${metricId} (${fredId})...`);
        const observations = await fetchFredSeries(fredId, fredApiKey);
        
        const validObs = observations
          .map(obs => ({
            metric_id: metricId,
            date: obs.date,
            value: parseFloat(obs.value),
            metadata: { fred_id: fredId },
            created_at: now
          }))
          .filter(obs => !isNaN(obs.value));

        if (validObs.length > 0) {
          // Upsert to treasury_hedging_metrics
          const { error: upsertError } = await supabase
            .from('treasury_hedging_metrics')
            .upsert(validObs, { onConflict: 'date, metric_id' });
          
          if (upsertError) throw upsertError;
          results.push({ metricId, count: validObs.length, status: 'success' });
        } else {
          results.push({ metricId, count: 0, status: 'no_data' });
        }
      } catch (err: any) {
        console.error(`Error processing ${metricId}:`, err.message);
        results.push({ metricId, error: err.message, status: 'failed' });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Ingestion Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
