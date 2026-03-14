import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchFredSeries(apiKey: string, seriesId: string) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.observations?.[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fredApiKey = Deno.env.get('FRED_API_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch FRED Proxies
    const [savingsRate, confidence] = await Promise.all([
      fetchFredSeries(fredApiKey, 'PSAVERT'),
      fetchFredSeries(fredApiKey, 'UMCSENT')
    ]);

    // 2. Mock/Seed Institutional Data based on latest reports (Vanguard 2025 = 6%, Fidelity 2022/Latest ~2.4%)
    // In a real production system, this would be scraped or fetched from a dedicated provider API
    const vanguardHardship = 6.0; // Vanguard "How America Saves" 2025 Report
    const fidelityLoan = 2.4;    // Fidelity Quarterly Trends
    const iciLoanBalance = 13.0; // ICI 401k Loan Activity proxy

    const date = new Date().toISOString().split('T')[0];

    const payload = {
      date,
      vanguard_hardship_pct: vanguardHardship,
      fidelity_loan_pct: fidelityLoan,
      ici_loan_balance_pct: iciLoanBalance,
      savings_rate_proxy: savingsRate ? parseFloat(savingsRate.value) : null,
      consumer_confidence_proxy: confidence ? parseFloat(confidence.value) : null,
      metadata: {
        sources: {
          vanguard: "2025 How America Saves Report",
          fidelity: "Q4 2024 Retirement Trends",
          fred_savings: "PSAVERT",
          fred_confidence: "UMCSENT"
        }
      }
    };

    const { error } = await supabase
      .from('us_401k_distress')
      .upsert(payload, { onConflict: 'date' });

    if (error) throw error;

    // Log the ingestion
    await supabase.from('ingestion_logs').insert({
      function_name: 'ingest-401k-distress',
      status: 'success',
      rows_inserted: 1,
      start_time: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, payload }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
