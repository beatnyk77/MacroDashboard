import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { parse } from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GMDRecord {
  countryname: string;
  ISO3: string;
  year: string;
  govdebt_GDP: string;
  govdef_GDP: string;
  ltrate: string;
  cbrate: string;
  M2: string;
  CA_GDP: string;
  SovDebtCrisis: string;
  BankingCrisis: string;
  CurrencyCrisis: string;
  [key: string]: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching GMD.csv...");
    const gmdRes = await fetch("https://www.globalmacrodata.com/GMD.csv");
    if (!gmdRes.ok) throw new Error("Failed to fetch GMD.csv");
    
    const csvContent = await gmdRes.text();
    const { data: records } = parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    }) as { data: GMDRecord[] };

    console.log(`Parsed ${records.length} records.`);

    // Get latest year available (usually 2024 or 2023)
    const latestYear = Math.max(...records.map(r => parseInt(r.year)).filter(y => !isNaN(y)));
    const latestRecords = records.filter(r => parseInt(r.year) === latestYear);

    // Fetch platform live data (Gold Price)
    const { data: goldObs } = await supabase
      .from('metric_observations')
      .select('value')
      .eq('metric_id', 'GOLD_PRICE_USD')
      .order('as_of_date', { ascending: false })
      .limit(1)
      .single();
    
    const goldPrice = goldObs?.value || 2500;

    // Fetch Reserves for Velocity calculation (Last 2 periods)
    const { data: reserves } = await supabase
      .from('country_reserves')
      .select('*')
      .order('as_of_date', { ascending: false });

    // Processing Logic
    const gritUpserts = [];
    const targetCountries = ["USA", "CHN", "IND", "JPN", "DEU", "GBR", "FRA", "BRA", "RUS", "CAN", "ITA", "KOR", "AUS", "MEX", "IDN", "SAU", "TUR", "CHE", "ARE", "ZAF"];

    for (const country of targetCountries) {
      const gmdData = latestRecords.find(r => r.ISO3 === country);
      if (!gmdData) continue;

      // 1. Debt Stress Component (60%)
      const debtGdp = parseFloat(gmdData.govdebt_GDP) || 0;
      const deficitGdp = Math.abs(parseFloat(gmdData.govdef_GDP)) || 0;
      const yieldRate = parseFloat(gmdData.ltrate) || parseFloat(gmdData.cbrate) || 0;

      // Simple normalization (Institutional bounds)
      const normDebt = Math.min(debtGdp / 1.5, 100); // 150%+ = max stress
      const normDeficit = Math.min(deficitGdp * 10, 100); // 10%+ = max stress
      const normYield = Math.min(yieldRate * 10, 100); // 10%+ = max stress
      
      const debtStressRaw = (normDebt * 0.5) + (normDeficit * 0.3) + (normYield * 0.2);
      
      // 2. Monetary Resilience Component (40%)
      const m2 = parseFloat(gmdData.M2) || 0;
      const caGdp = parseFloat(gmdData.CA_GDP) || 0;
      
      // Calculate Reserve Velocity (Monthly change delta)
      const countryReserves = reserves?.filter(r => r.country_code === country.substring(0, 2)) || [];
      const reserveVelocity = countryReserves.length >= 2 
        ? ((countryReserves[0].fx_reserves_usd - countryReserves[1].fx_reserves_usd) / countryReserves[1].fx_reserves_usd) * 100
        : 0;

      const normM2Gold = Math.min((m2 / goldPrice) / 100, 100); 
      const normCA = Math.min(Math.max(caGdp + 5, 0) * 10, 100); // -5% to +5% range
      const normVelocity = Math.min(Math.max(reserveVelocity + 2, 0) * 25, 100); // -2% to +2% range
      
      const resilienceRaw = (normM2Gold * 0.4) + (normCA * 0.3) + (normVelocity * 0.3);

      // Final Composite Calculation
      // User Formula: GRIT = 0.6 * DebtStress + 0.4 * MonetaryResilience
      let finalGrit = (debtStressRaw * 0.6) + ((100 - resilienceRaw) * 0.4); // Resilience reduces risk score

      // Crisis Override
      const isCrisis = gmdData.BankingCrisis === "1" || gmdData.SovDebtCrisis === "1" || gmdData.CurrencyCrisis === "1";
      if (isCrisis) {
        finalGrit = Math.max(finalGrit, 85);
      }

      gritUpserts.push({
        country_code: country,
        as_of_date: `${latestYear}-01-01`,
        grit_score: finalGrit,
        debt_stress_score: debtStressRaw,
        monetary_resilience_score: resilienceRaw,
        is_crisis_active: isCrisis,
        components: {
          debt_gdp: debtGdp,
          deficit_gdp: deficitGdp,
          yield: yieldRate,
          reserve_velocity: reserveVelocity,
          ca_gdp: caGdp,
          m2_gold: m2 / goldPrice
        }
      });
    }

    const { error: upsertError } = await supabase
      .from('grit_index')
      .upsert(gritUpserts, { onConflict: 'country_code, as_of_date' });

    if (upsertError) throw upsertError;

    // Log Ingestion
    await supabase.from('ingestion_logs').insert({
      function_name: 'ingest-grit-index',
      status: 'success',
      records_processed: gritUpserts.length,
      message: `Processed GRIT Index for ${latestYear}`
    });

    return new Response(JSON.stringify({ success: true, processed: gritUpserts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
