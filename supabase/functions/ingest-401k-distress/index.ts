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
    const [savingsRate, confidence, ccDelinquency, debtService] = await Promise.all([
      fetchFredSeries(fredApiKey, 'PSAVERT'),
      fetchFredSeries(fredApiKey, 'UMCSENT'),
      fetchFredSeries(fredApiKey, 'DRCCLACBS'), // Credit Card Delinquency Rate
      fetchFredSeries(fredApiKey, 'TDSP')       // Household Debt Service Payments as % of Disposable Income
    ]);

    // 2. Synthesize Proxy Values for 401(k) Activity Based on Live FRED Datasets
    // These proxy weights convert macro stress factors into institutional 401(k) proxy behavior
    const psav = savingsRate ? parseFloat(savingsRate.value) : 4.0;
    const sent = confidence ? parseFloat(confidence.value) : 70.0;
    const delinq = ccDelinquency ? parseFloat(ccDelinquency.value) : 3.0; // Baseline 3%
    const dsp = debtService ? parseFloat(debtService.value) : 9.5;        // Baseline 9.5%

    // Synthetic Vanguard Hardship Withdrawal Rate Proxy
    // Delinquency drives hardships; if delinq > 3.0, hardships rise
    const vanguardHardshipProxy = Math.max(1.0, (delinq - 1.5) * 1.8 + (dsp > 10 ? 1 : 0));

    // Synthetic Fidelity Loan Default/Origination Proxy
    // Lower savings rate pushes people to take loans
    const fidelityLoanProxy = Math.max(1.0, 10.0 / Math.max(0.1, psav) + (delinq * 0.4));

    // Synthetic ICI Total Outstanding Loan Balance (% of total assets) Proxy
    const iciLoanBalanceProxy = Math.max(5.0, (dsp * 1.2) - (sent / 50));

    const date = new Date().toISOString().split('T')[0];

    const payload = {
      date,
      vanguard_hardship_pct: Number(vanguardHardshipProxy.toFixed(2)),
      fidelity_loan_pct: Number(fidelityLoanProxy.toFixed(2)),
      ici_loan_balance_pct: Number(iciLoanBalanceProxy.toFixed(2)),
      savings_rate_proxy: psav,
      consumer_confidence_proxy: sent,
      metadata: {
        sources: {
          vanguard: "Synthetic proxy via FRED DRCCLACBS",
          fidelity: "Synthetic proxy via FRED PSAVERT",
          fred_savings: "PSAVERT",
          fred_confidence: "UMCSENT",
          fred_delinquency: "DRCCLACBS",
          fred_debt_service: "TDSP"
        },
        raw_fred_inputs: {
          delinq, psav, dsp, sent
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
