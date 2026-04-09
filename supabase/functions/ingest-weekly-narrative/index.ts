import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// --- Helpers ---
const fmt = {
    usd: (val: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            notation: "compact",
        }).format(val),
    pct: (val: number) =>
        new Intl.NumberFormat("en-US", {
            style: "percent",
            minimumFractionDigits: 2,
        }).format(val / 100),
    num: (val: number) =>
        new Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: 2,
        }).format(val),
};

async function fetchMetricWow(supabase: any, metricId: string) {
    const { data } = await supabase
        .from("metric_observations")
        .select("value, as_of_date")
        .eq("metric_id", metricId)
        .order("as_of_date", { ascending: false })
        .limit(40);

    if (!data || data.length < 2) return null;

    const latest = data[0];
    const latestDate = new Date(latest.as_of_date);

    const sevenDaysAgo = new Date(latestDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let prev = data[1];
    for (let i = 1; i < data.length; i++) {
        const d = new Date(data[i].as_of_date);
        if (d <= sevenDaysAgo) {
            prev = data[i];
            break;
        }
    }

    const wow_change_pct = prev.value !== 0 ? ((latest.value - prev.value) / Math.abs(prev.value)) * 100 : 0;

    return {
        metric_id: metricId,
        latest_value: latest.value,
        prev_value: prev.value,
        wow_change_pct,
        as_of_date: latest.as_of_date,
    };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const weekEndingDate = new Date().toISOString().split("T")[0];
        const snapshots: any[] = [];

        // 1. Regime Shift Summary
        // Using FED_BALANCE_SHEET as proxy for liquidity resilience
        const liq = await fetchMetricWow(supabaseClient, "FED_BALANCE_SHEET");
        const vix = await fetchMetricWow(supabaseClient, "VIX_INDEX");
        const y10 = await fetchMetricWow(supabaseClient, "UST_10Y_YIELD");

        if (liq || vix || y10) {
            const liqDir = liq ? (liq.wow_change_pct >= 0 ? "expanding" : "contracting") : "stable";
            const vixLabel = vix ? (vix.latest_value > 20 ? "elevated volatility" : "stable structural risk appetite") : "neutral risk sentiment";
            const y10Status = y10 ? `as the US 10Y yield moved ${y10.wow_change_pct >= 0 ? "higher" : "lower"} to ${y10.latest_value.toFixed(2)}%` : "with yields maintaining current technical levels";

            const narrative = `Global liquidity proxies are ${liqDir} ${y10Status}. Market sentiment reflects ${vixLabel}${vix ? ` with VIX at ${vix.latest_value.toFixed(1)}` : ""}, suggesting a ${liq?.wow_change_pct >= 0 ? "supportive" : "measured"} environment for institutional risk assets.`;

            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "Regime Shift Summary",
                key_metric: "Sovereign Liquidity Vector",
                value: liq?.latest_value || null,
                wow_change_pct: liq?.wow_change_pct || null,
                narrative_snippet: narrative,
            });
        }

        // 2. Macro Heartbeat Section
        const gold = await fetchMetricWow(supabaseClient, "GOLD_PRICE_USD");
        if (gold) {
            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "Macro Heartbeat",
                key_metric: "Gold (USD)",
                value: gold.latest_value,
                wow_change_pct: gold.wow_change_pct,
                narrative_snippet: `Gold prices ${gold.wow_change_pct >= 0 ? "rose" : "declined"} ${Math.abs(gold.wow_change_pct).toFixed(2)}% this week to ${fmt.usd(gold.latest_value)}, driven by ${Math.abs(gold.wow_change_pct) > 1.5 ? "structural" : "marginal"} shifts in institutional reserve demand.`,
            });
        }

        const btc = await fetchMetricWow(supabaseClient, "BITCOIN_PRICE_USD");
        if (btc) {
            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "Macro Heartbeat",
                key_metric: "Bitcoin",
                value: btc.latest_value,
                wow_change_pct: btc.wow_change_pct,
                narrative_snippet: `Bitcoin trading at ${fmt.usd(btc.latest_value)} (${btc.wow_change_pct >= 0 ? "+" : ""}${btc.wow_change_pct.toFixed(2)}% WoW), continuing to function as the primary high-beta liquidity telemetry instrument.`,
            });
        }

        // 3. US Fiscal
        const { data: maturities } = await supabaseClient
            .from("us_debt_maturities")
            .select("*")
            .order("date", { ascending: true })
            .limit(1);
        if (maturities && maturities.length > 0) {
            const mat = maturities[0];
            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "US Fiscal",
                key_metric: "Upcoming Maturity",
                value: mat.amount,
                wow_change_pct: 0,
                narrative_snippet: `The US Treasury faces a $${fmt.num(mat.amount)} maturity wall in ${mat.bucket}, placing significant pressure on upcoming auction bid-to-cover ratios.`,
            });
        }

        // 4. 401(k) Distress Monitor
        const { data: distressData } = await supabaseClient
            .from("us_401k_distress")
            .select("*")
            .order("date", { ascending: false })
            .limit(1);
        
        if (distressData && distressData.length > 0) {
            const distress = distressData[0];
            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "Consumer Health",
                key_metric: "401(k) Distress Z-Score",
                value: distress.distress_zscore,
                wow_change_pct: 0,
                narrative_snippet: `The 401(k) Distress Monitor registered a Z-Score of ${distress.distress_zscore.toFixed(1)}, with hardship withdrawals at ${distress.vanguard_hardship_pct}% and Fidelity loan triggers at ${distress.fidelity_loan_pct}%. This leading indicator ${distress.distress_zscore > 5 ? "signals mounting consumer exhaustion" : "suggests resilient internal household liquidity"}.`,
            });
        }

        // 5. US Labor Market Monitor
        const { data: laborData } = await supabaseClient
            .from("us_labor_market")
            .select("*")
            .order("date", { ascending: false })
            .limit(1);

        if (laborData && laborData.length > 0) {
            const labor = laborData[0];
            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "Labor Market",
                key_metric: "Unemployment Rate",
                value: labor.unemployment_rate,
                wow_change_pct: 0,
                narrative_snippet: `US Labor markets showing ${labor.unemployment_rate}% unemployment-rate and ${labor.labor_participation_rate}% participation. The Labor Distress Index at ${labor.labor_distress_index.toFixed(1)} ${labor.labor_distress_index > 7 ? "indicates significant institutional labor market friction" : "remains below official recession trigger levels"}.`,
            });
        }

        // 4. India Macro
        const inCpi = await fetchMetricWow(supabaseClient, "IN_CPI_YOY");
        const inFx = await fetchMetricWow(supabaseClient, "IN_FX_RESERVES");

        if (inCpi) {
            snapshots.push({
                week_ending_date: weekEndingDate,
                section_name: "India Macro",
                key_metric: "CPI Inflation",
                value: inCpi.latest_value,
                wow_change_pct: inCpi.wow_change_pct,
                narrative_snippet: `India's headline inflation holds at ${inCpi.latest_value.toFixed(2)}% YoY. The RBI maintains its targeted FX defense strategy with reserves at ${inFx ? fmt.usd(inFx.latest_value) : "stable levels"}.`,
            });
        }

        // 5. Cross-Section Insight
        const insight = "Structural analysis reveals that nominal yield movements are secondary to the persistent bid for physical-claim assets. The acceleration of the G7 debt rollover cycle remains the primary driver of global regime divergence.";
        snapshots.push({
            week_ending_date: weekEndingDate,
            section_name: "Cross-Section Insight",
            key_metric: "Institutional Synthesis",
            value: null,
            wow_change_pct: null,
            narrative_snippet: insight,
        });

        // 6. Forward Look
        const { data: events } = await supabaseClient
            .from("upcoming_events")
            .select("*")
            .gt("event_date", new Date().toISOString())
            .limit(3)
            .order("event_date", { ascending: true });

        const eventSummary =
            events && events.length > 0
                ? `Focus for the upcoming week: ${events.map((e) => `${e.event_name} (${e.country})`).join(", ")}. These are high-impact events likely to validate or pivot current regime signals.`
                : "No high-impact sovereign events are scheduled for the immediate upcoming window; focus remains on secondary flow telemetry.";

        snapshots.push({
            week_ending_date: weekEndingDate,
            section_name: "Forward Look",
            key_metric: "Sovereign Calendar",
            value: null,
            wow_change_pct: null,
            narrative_snippet: eventSummary,
            metadata: { events },
        });

        // Insert into DB
        const { error: dbError } = await supabaseClient
            .from("weekly_macro_snapshot")
            .upsert(snapshots, { onConflict: "week_ending_date, section_name, key_metric" });

        if (dbError) throw dbError;

        return new Response(JSON.stringify({ success: true, snapshots }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
