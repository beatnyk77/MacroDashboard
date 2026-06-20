/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-inner-declarations */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { serveIngest } from '../_shared/handler.ts';

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

async function fetchLatestDebtLayer(supabase: SupabaseClient, layerCode: string) {
    const { data } = await supabase
        .from("china_debt_layers")
        .select("value_pct_gdp, value_high_pct_gdp, as_of_date")
        .eq("layer_code", layerCode)
        .order("as_of_date", { ascending: false })
        .limit(1)
        .maybeSingle();
    return data;
}

async function fetchLatestComposites(supabase: SupabaseClient) {
    const ids = [
        "CN_ICEBERG_RATIO",
        "CN_LGFV_STRESS_INDEX",
        "CN_MONETIZATION_PRESSURE",
        "CN_DEBT_WALL_PROXIMITY",
        "CN_LAND_FISCAL_DEPENDENCE",
    ];
    const results: Record<string, { value: number; as_of_date: string }> = {};
    for (const id of ids) {
        const { data } = await supabase
            .from("china_debt_composites")
            .select("value, as_of_date")
            .eq("composite_id", id)
            .order("as_of_date", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data) results[id] = data;
    }
    return results;
}

function compositeStatus(id: string, value: number): "elevated" | "watch" | "stable" {
    switch (id) {
        case "CN_ICEBERG_RATIO":
            return value > 2.5 ? "elevated" : value > 2.0 ? "watch" : "stable";
        case "CN_LGFV_STRESS_INDEX":
            return value > 65 ? "elevated" : value > 45 ? "watch" : "stable";
        case "CN_MONETIZATION_PRESSURE":
            return value > 60 ? "elevated" : value > 40 ? "watch" : "stable";
        case "CN_DEBT_WALL_PROXIMITY":
            return value > 80 ? "elevated" : value > 60 ? "watch" : "stable";
        case "CN_LAND_FISCAL_DEPENDENCE":
            return value < 18 ? "elevated" : value < 25 ? "watch" : "stable";
        default:
            return "watch";
    }
}

const COMPOSITE_LABELS: Record<string, { label: string; unit: string; interpretation: (v: number) => string }> = {
    CN_ICEBERG_RATIO: {
        label: "Iceberg Ratio",
        unit: "×",
        interpretation: (v) => `Consolidated debt is ${v.toFixed(1)}× official central government debt — shadow leverage ${v > 2.5 ? "elevated" : "contained"}.`,
    },
    CN_LGFV_STRESS_INDEX: {
        label: "LGFV Stress",
        unit: "",
        interpretation: (v) => `LGFV distress proxy at ${v.toFixed(0)}/100 — ${v > 65 ? "rollover risk building" : "within historical band"}.`,
    },
    CN_MONETIZATION_PRESSURE: {
        label: "Monetization",
        unit: "",
        interpretation: (v) => `Quasi-fiscal monetary financing score ${v.toFixed(0)}/100 — ${v > 60 ? "fiscal dominance zone" : "PBOC retains policy space"}.`,
    },
    CN_DEBT_WALL_PROXIMITY: {
        label: "Debt Wall",
        unit: "",
        interpretation: (v) => `LGFV maturity wall proximity ${v.toFixed(0)}% — ${v > 80 ? "refinancing stress imminent" : "manageable rollover window"}.`,
    },
    CN_LAND_FISCAL_DEPENDENCE: {
        label: "Land Fiscal",
        unit: "%",
        interpretation: (v) => `Land sales at ${v.toFixed(0)}% of LG revenue — ${v < 20 ? "structural fiscal cliff from property unwind" : "partial revenue recovery"}.`,
    },
};

async function buildChinaDebtSection(supabase: SupabaseClient) {
    const [central, consolidated, composites, cnGdp] = await Promise.all([
        fetchLatestDebtLayer(supabase, "central_official"),
        fetchLatestDebtLayer(supabase, "consolidated"),
        fetchLatestComposites(supabase),
        fetchLatestMetric(supabase, "CN_GDP_GROWTH_YOY"),
    ]);

    const centralPct = central?.value_pct_gdp ?? null;
    const consHigh = consolidated?.value_high_pct_gdp ?? consolidated?.value_pct_gdp ?? null;
    const icebergVal = composites.CN_ICEBERG_RATIO?.value
        ?? (consHigh && centralPct && centralPct > 0 ? consHigh / centralPct : null);

    const compositeEntries = Object.entries(composites).map(([id, row]) => {
        const meta = COMPOSITE_LABELS[id];
        if (!meta) return null;
        return {
            id,
            label: meta.label,
            value: row.value,
            unit: meta.unit,
            status: compositeStatus(id, row.value),
            interpretation: meta.interpretation(row.value),
        };
    }).filter(Boolean);

    const elevatedCount = compositeEntries.filter((c) => c!.status === "elevated").length;
    const headline = elevatedCount >= 2
        ? "Shadow Debt Stress — Multiple Composite Signals Elevated"
        : icebergVal && icebergVal > 2.0
            ? "Iceberg Ratio Above 2× — Hidden Leverage Accumulating"
            : "China Debt Stack — Range-Bound Surveillance";

    const summary = icebergVal && centralPct && consHigh
        ? `Official central government debt at ${centralPct.toFixed(0)}% GDP masks a consolidated public sector balance sheet of ${consHigh.toFixed(0)}% GDP (IMF Article IV range). Iceberg ratio ${icebergVal.toFixed(2)}× with nominal GDP growth at ${fmt.pct(cnGdp[0]?.value ?? 0)}. LGFV rollover and land fiscal dependence remain the primary domestic transmission channels.`
        : "China public sector debt telemetry is updating from IMF Article IV, BIS credit, and PBOC liquidity inputs. Composite indices refresh weekly via compute-china-debt-signals.";

    const watch_items = [
        compositeEntries.find((c) => c!.id === "CN_LGFV_STRESS_INDEX")?.interpretation,
        compositeEntries.find((c) => c!.id === "CN_MONETIZATION_PRESSURE")?.interpretation,
        "PBOC MLF and LPR settings — any rate cut without fiscal consolidation signals quasi-monetization acceleration.",
        "Special refinancing bond issuance by high-stress provinces (see provincial stress table on Intel China).",
    ].filter(Boolean) as string[];

    return {
        headline,
        summary,
        composites: compositeEntries,
        layer_snapshot: {
            central_official_pct: centralPct,
            consolidated_high_pct: consHigh,
            iceberg_ratio: icebergVal,
        },
        watch_items,
    };
}

serveIngest('generate-weekly-regime-digest', async (req) => {


    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        let weekEndingDate = new Date().toISOString().split("T")[0];

        // Allow optional week_ending_date parameter for backfill
        try {
            const body = await req.json();
            if (body.week_ending_date) {
                weekEndingDate = body.week_ending_date;
            }
        } catch {
            // No JSON body or parsing failed, use default
        }

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

        const china_debt_section = await buildChinaDebtSection(supabaseClient);

        if (china_debt_section.composites.length > 0) {
            const topSignal = china_debt_section.composites.find((c) => c.status === "elevated")
                ?? china_debt_section.composites[0];
            whatChanged.push({
                pillar: "China Public Sector Debt",
                change: topSignal
                    ? `${topSignal.label} at ${topSignal.value.toFixed(topSignal.unit === "×" ? 2 : 1)}${topSignal.unit} — ${topSignal.interpretation}`
                    : china_debt_section.summary,
            });
            whatToWatch.unshift(
                `China Debt: Monitor LGFV special refinancing bond calendar and PBOC liquidity operations — iceberg ratio ${china_debt_section.layer_snapshot.iceberg_ratio?.toFixed(2) ?? "—"}× vs official central debt.`
            );
        }

        // 3. Save to Database
        const { error: dbError } = await supabaseClient
            .from("weekly_regime_digests")
            .upsert({
                week_ending_date: weekEndingDate,
                executive_summary,
                regime_shifts: regimeShifts,
                what_changed: whatChanged,
                what_to_watch: whatToWatch,
                holistic_narrative,
                china_debt_section,
            }, { onConflict: "week_ending_date" });

        if (dbError) throw dbError;

        return { ok: true, counts: {} };

    } catch (error: unknown) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
