import { createClient, SupabaseClient } from "@supabase/supabase-js";

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

async function fetchLatestMetric(supabase: SupabaseClient, metricId: string) {
    const { data } = await supabase
        .from("metric_observations")
        .select("value, as_of_date")
        .eq("metric_id", metricId)
        .order("as_of_date", { ascending: false })
        .limit(2);
    return data || [];
}

async function fetchRegionalPulse(supabase: SupabaseClient, table: string) {
    const { data } = await supabase
        .from(table)
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(1);
    return data?.[0] || null;
}

Deno.serve(async (_req) => {
    if (_req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const weekEndingDate = new Date().toISOString().split("T")[0];

        // 1. Fetch Core Data Pillars
        const [
            liq, vix, dxy, gold, brent, 
            debtGold, usCpi, inGdp, _inCpi, 
            africaPulse, _indiaPulse, _chinaPulse
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
            fetchRegionalPulse(supabaseClient, "africa_macro_snapshots"),
            fetchRegionalPulse(supabaseClient, "india_macro_snapshots"),
            fetchLatestMetric(supabaseClient, "CN_GDP_GROWTH_YOY") // China proxy
        ]);

        // 2. Synthesize Narrative Heuristics
        const dxyTrend = dxy[0] && dxy[1] ? (dxy[0].value > dxy[1].value ? "strengthening" : "softening") : "stable";
        const goldTrend = gold[0] && gold[1] ? (gold[0].value > gold[1].value ? "ascending" : "correcting") : "stable";
        const liqStatus = liq[0] && liq[1] ? (liq[0].value > liq[1].value ? "expanding" : "contracting") : "stable";
        const fiscalDominance = debtGold[0]?.value > 10 ? "deepening" : "nascent";

        // Executive Summary
        const executive_summary = `This week, global macro conditions are defined by ${fiscalDominance} US fiscal dominance and ${liqStatus} liquidity. The ${dxyTrend} Dollar is clashing with ${goldTrend} gold prices, signaling a structural bid for physical-claim assets as a hedge against G7 sovereign debt rollover risks. This shift is recalibrating capital flows across the Global South, particularly impacting India's FX defense and Africa's commodity-led fiscal recovery.`;

        // Key Regime Shifts
        const regimeShifts = [
            {
                title: "Fiscal Dominance Acceleration",
                description: `The Debt/Gold ratio at ${debtGold[0]?.value.toFixed(1)} suggests the anchor is shifting toward hard assets as debt monetization becomes the primary tool for US Treasury stability.`
            },
            {
                title: "De-Dollarization Momentum",
                description: `With the DXY ${dxyTrend} while gold is ${goldTrend}, central bank reserve diversification is no longer a tail risk but a core driver of price discovery.`
            },
            {
                title: "Commodity Supercycle 2.0",
                description: `Brent crude at ${fmt.usd(brent[0]?.value || 0)} is reinforcing the fiscal buffers of African oil producers like Angola and Nigeria, while placing energy-import stress on India.`
            }
        ];

        // What Changed
        const whatChanged = [
            {
                pillar: "US Macro",
                change: `US CPI prints at ${fmt.pct(usCpi[0]?.value || 0)} YoY, keeping the real-rate environment restrictive for emerging market capital flows.`
            },
            {
                pillar: "Regional Pulses",
                change: `India's GDP growth leads at ${fmt.pct(inGdp[0]?.value || 0)}, yet rising Brent prices threaten current account stability. In Africa, ${africaPulse?.continent_summary?.substring(0, 100) || "commodity exports remain robust"}.`
            },
            {
                pillar: "Regime Telemetry",
                change: `VIX at ${vix[0]?.value.toFixed(1)} indicates ${vix[0]?.value > 20 ? "heightened" : "muted"} institutional fear, allowing for ${liqStatus} liquidity to find beta in selective BRICS+ markets.`
            }
        ];

        // What to Watch
        const whatToWatch = [
            "Next 14 Days: US Treasury auction bid-to-cover ratios; any slippage here will force the Fed into secondary market support.",
            "India: RBI's FX reserve deployment as Brent crude tests technical resistance levels.",
            "China: Credit impulse data for signs of a more aggressive stimulus to counter the housing-led deflationary drag."
        ];

        const holistic_narrative = `The macro regime is shifting from 'Liquidity Abundance' to 'Fiscal Gravity'. The US fiscal dominance is acting as the primary solar mass, drawing in capital but forcing de-dollarization as a survival mechanism for the Global South. India and Africa are the key beneficiaries of this multi-polar flow, provided they can manage the energy inflation feedback loop.`;

        // 3. Save to Database
        const { error: dbError } = await supabaseClient
            .from("weekly_regime_digests")
            .upsert({
                week_ending_date: weekEndingDate,
                executive_summary,
                regime_shifts: regimeShifts,
                what_changed: whatChanged,
                what_to_watch: whatToWatch,
                holistic_narrative
            }, { onConflict: "week_ending_date" });

        if (dbError) throw dbError;

        return new Response(JSON.stringify({ success: true, digest: { weekEndingDate, executive_summary, regimeShifts, whatChanged, whatToWatch, holistic_narrative } }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
