import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fredApiKey = Deno.env.get("FRED_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Series IDs for labor market metrics
    const seriesIds = {
      unemployment_rate: "UNRATE",
      labor_participation_rate: "CIVPART",
      nonfarm_payrolls: "PAYEMS",
      adp_payrolls: "ADPMNUSNERSA",
      initial_claims: "ICSA",
      continuing_claims: "CCSA",
      jolts_openings: "JTSJOL",
      jolts_quits: "JTSQUL",
      jolts_layoffs: "JTSLDL",
      average_hourly_earnings: "CES0500000003",
    };

    const resultsByDate: Record<string, any> = {};

    // Fetch data for each series
    for (const [key, seriesId] of Object.entries(seriesIds)) {
      console.log(`Fetching ${key} (${seriesId})...`);
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=12`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.observations) {
        data.observations.forEach((obs: any) => {
          const date = obs.date;
          if (!resultsByDate[date]) {
            resultsByDate[date] = { date };
          }
          const val = parseFloat(obs.value);
          if (!isNaN(val)) {
            resultsByDate[date][key] = val;
          }
        });
      }
    }

    // Process and calculate Labor Distress Index
    // We need some historical context for Z-Score, but for now we'll use a simplified composite
    const upsertData = Object.values(resultsByDate).map((entry: any) => {
      // Simplified Labor Distress Index logic for the initial version
      // Higher claims, higher layoffs, lower quits = higher distress
      let distress = 0;
      let count = 0;

      if (entry.initial_claims) { distress += (entry.initial_claims / 200000) * 4; count += 4; }
      if (entry.jolts_layoffs) { distress += (entry.jolts_layoffs / 1500) * 3; count += 3; }
      if (entry.jolts_quits) { distress += (entry.jolts_quits / 3500) * -3; count += 3; }

      entry.labor_distress_index = count > 0 ? (distress / count) * 10 : 0;
      return entry;
    });

    // Upsert into Supabase
    const { error: upsertError } = await supabase
      .from("us_labor_market")
      .upsert(upsertData, { onConflict: "date" });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, count: upsertData.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
