import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

async function fetchLatestMetric(supabase: any, metricId: string) {
    const { data } = await supabase
        .from("metric_observations")
        .select("value, as_of_date")
        .eq("metric_id", metricId)
        .order("as_of_date", { ascending: false })
        .limit(2);
    return data || [];
}

async function fetchRegionalPulse(supabase: any, table: string) {
    const { data } = await supabase
        .from(table)
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1);
    return data?.[0] || null;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const now = new Date();
        // Determine the year_month format like "2026-04"
        const year_month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

        // 1. Fetch Core Data Pillars
        const [
            liq, vix, dxy, gold, brent, 
            debtGold, usCpi, inGdp, inCpi, cnGdp,
            africaPulse, indiaPulse, chinaPulse
        ] = await Promise.all([
            fetchLatestMetric(supabaseClient, "BIS_GLOBAL_LIQUIDITY_USD_BN"),
            fetchLatestMetric(supabaseClient, "VIX_INDEX"),
            fetchLatestMetric(supabaseClient, "DXY_INDEX"),
            fetchLatestMetric(supabaseClient, "GOLD_PRICE_USD"),
            fetchLatestMetric(supabaseClient, "BRENT_CRUDE_PRICE"),
            fetchLatestMetric(supabaseClient, "RATIO_DEBT_GOLD"),
            fetchLatestMetric(supabaseClient, "US_CPI_YOY"),
            fetchLatestMetric(supabaseClient, "IN_GDP_GROWTH_YOY"),
            fetchLatestMetric(supabaseClient, "IN_CPI_YOY"),
            fetchLatestMetric(supabaseClient, "CN_GDP_GROWTH_YOY"),
            fetchRegionalPulse(supabaseClient, "africa_macro_snapshots"),
            fetchRegionalPulse(supabaseClient, "india_macro_snapshots"),
            fetchRegionalPulse(supabaseClient, "china_macro_pulse")
        ]);

        const macroContext = {
            us: {
                cpi_yoy: usCpi[0]?.value,
                dxy: dxy[0]?.value,
                debt_gold_ratio: debtGold[0]?.value,
                vix: vix[0]?.value,
                global_liquidity: liq[0]?.value
            },
            india: {
                gdp_yoy: inGdp[0]?.value,
                cpi_yoy: inCpi[0]?.value,
                pulse_summary: indiaPulse?.holistic_summary
            },
            china: {
                gdp_yoy: cnGdp[0]?.value,
                pulse_summary: chinaPulse?.growth_momentum
            },
            africa: {
                pulse_summary: africaPulse?.continent_summary
            },
            commodities: {
                gold_usd: gold[0]?.value,
                brent_crude: brent[0]?.value
            }
        };

        const aimlapiKey = Deno.env.get("AIMLAPI_KEY");
        if (!aimlapiKey) {
            throw new Error("Missing AIMLAPI_KEY in environment variables");
        }

        const systemPrompt = `You are an elite macro strategist and institutional writer for GraphiQuestor.
Write the definitive Monthly Regime Digest. Give a holistic view of the entire platform's data.

Sections to cover (weave together, do not write in silos):
- US Macro Pulse
- China Macro Pulse
- India Macro Pulse
- Africa Macro Pulse
- Energy & Commodities
- Sovereign Stress, De-Dollarization & Gold

Requirements:
- Holistic narrative: Show interconnections (e.g., US fiscal dominance -> impact on de-dollarization -> capital flows to India/Africa -> commodity implications).
- Regime focus: Clearly state the prevailing macro regime and any shifts during the past month.
- Tone: Elite institutional (Luke Gromen / Bridgewater style). Calm, precise, authoritative.

Return the response as a JSON object with the following schema:
{
  "subject_line": "A compelling 5-8 word subject line summarizing the regime",
  "html_content": "The full report formatted in clean semantic HTML. Use <h2> for section headers, <p> for paragraphs, <ul>/<li> for lists. Do NOT wrap in markdown code blocks.",
  "plain_text": "The full report in plain text without markdown or html"
}

Ensure the JSON is strictly valid. No trailing commas, proper escaping.`;

        const userPrompt = `Here is the current macro telemetry data:
${JSON.stringify(macroContext, null, 2)}

Generate the Monthly Regime Digest.`;

        const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${aimlapiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`AIMLAPI error: ${response.status} ${response.statusText} - ${errBody}`);
        }

        const completion = await response.json();
        const resultText = completion.choices[0].message.content;
        let parsedResult;
        try {
            parsedResult = JSON.parse(resultText);
        } catch (e) {
            throw new Error(`Failed to parse LLM JSON output: ${resultText}`);
        }

        // 3. Save to Database
        const { error: dbError } = await supabaseClient
            .from("monthly_regime_digests")
            .upsert({
                year_month,
                subject_line: parsedResult.subject_line,
                html_content: parsedResult.html_content,
                plain_text: parsedResult.plain_text
            }, { onConflict: "year_month" });

        if (dbError) throw dbError;

        return new Response(JSON.stringify({ success: true, digest: parsedResult }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error generating digest:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
