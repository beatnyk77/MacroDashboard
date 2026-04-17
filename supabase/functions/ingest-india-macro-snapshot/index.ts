import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Data for Apr'26 Dashboard as per the provided image
    const snapshotDate = '2026-04-01'
    const geopoliticalSummary = "The Apr'26 Macro Dashboard reflects the impact of geopolitical turmoil. Manufacturing PMI is at 4-year low- a fallout of the West Asia War. The Indian Railways saw record freight performance in FY26, with a 3.25% increase YoY reaffirming the railways' role as a core force behind India's industrial and infrastructure growth. In terms of employment, FY'26 closed at +8%, the strongest in 3 years reflecting sustained resilience of non-IT sectors. CPI yet to reflect higher oil prices fully as government has not passed on the complete burden."

    const insightsPositive = [
      "India's white-collar hiring saw 9% YoY rise, as FY'26 closes at +8%, the strongest job growth in 3 years.",
      "Monthly gross GST collections reached record high, driven by strong domestic activity",
      "System Liquidity continues to remain comfortable"
    ]

    const insightsNeutral = [
      "Vehicle retail sales and registration - kicked off FY27 with measured momentum, continuing a period of steady growth rather than peak sales, following a record-high FY26"
    ]

    const insightsNegative = [
      "CPI rose marginally driven primarily by rising food prices, increased fuel costs despite continued efforts by the government to manage the impact of global geopolitical tensions on logistics",
      "WPI inched higher due to rise in prices of crude petroleum & natural gas, other manufacturing, non-food articles, etc",
      "Manufacturing PMI fell sharply dragged down by the impact of the war in West Asia on costs, demand and new order levels, and uncertainty in exports markets. Services PMI activity slowed to a 14-month low of 57.5."
    ]

    const metricsData = [
      {
        name: "Naukri Job Index",
        unit: "",
        values: { "Nov-25": 3001, "Dec-25": 3001, "Jan-26": 2637, "Feb-26": 3233, "Mar-26": 2858, "Apr-26": null },
        status: "neutral"
      },
      {
        name: "Vehicle Registrations",
        unit: "mn units",
        values: { "Nov-25": 3.33, "Dec-25": 2.04, "Jan-26": 2.75, "Feb-26": 2.42, "Mar-26": 2.70, "Apr-26": 0.89 },
        status: "negative"
      },
      {
        name: "Vehicles Sales",
        unit: "mn units",
        values: { "Nov-25": 3.30, "Dec-25": 2.03, "Jan-26": 2.72, "Feb-26": 2.41, "Mar-26": 2.69, "Apr-26": null },
        status: "negative"
      },
      {
        name: "PV Sales",
        unit: "mn units",
        values: { "Nov-25": 0.39, "Dec-25": 0.38, "Jan-26": 0.51, "Feb-26": 0.39, "Mar-26": 0.44, "Apr-26": null },
        status: "negative"
      },
      {
        name: "EV Registration",
        unit: "mn units",
        values: { "Nov-25": 0.22, "Dec-25": 0.20, "Jan-26": 0.22, "Feb-26": 0.20, "Mar-26": 0.28, "Apr-26": 0.09 },
        status: "negative"
      },
      {
        name: "2-wheelers Sales",
        unit: "mn units",
        values: { "Nov-25": 2.55, "Dec-25": 1.32, "Jan-26": 1.85, "Feb-26": 1.70, "Mar-26": 1.95, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Domestic air traffic",
        unit: "person mn",
        values: { "Nov-25": 15.5, "Dec-25": 16.7, "Jan-26": 15.2, "Feb-26": 14.1, "Mar-26": null, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Rail freight traffic",
        unit: "MT",
        values: { "Nov-25": 135.7, "Dec-25": 136.4, "Jan-26": 146.7, "Feb-26": 137.7, "Mar-26": 166.2, "Apr-26": null },
        status: "positive"
      },
      {
        name: "Electricity consumption",
        unit: "BU",
        values: { "Nov-25": 123.40, "Dec-25": 138.4, "Jan-26": 142.7, "Feb-26": 132.99, "Mar-26": 149.6, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Cement Production Growth",
        unit: "% yoy",
        values: { "Nov-25": 14.6, "Dec-25": 13.7, "Jan-26": 11.3, "Feb-26": 9.3, "Mar-26": null, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Steel Production Growth",
        unit: "% yoy",
        values: { "Nov-25": 6.7, "Dec-25": 10.1, "Jan-26": 11.5, "Feb-26": 7.2, "Mar-26": null, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Monthly GST collection growth",
        unit: "% YoY",
        values: { "Nov-25": 0.7, "Dec-25": 6.1, "Jan-26": 6.2, "Feb-26": 8.3, "Mar-26": 8.8, "Apr-26": null },
        status: "positive"
      },
      {
        name: "Bank credit growth",
        unit: "%YoY",
        values: { "Nov-25": 11.5, "Dec-25": 14.5, "Jan-26": 14.6, "Feb-26": 14.5, "Mar-26": null, "Apr-26": null },
        status: "positive"
      },
      {
        name: "Unsecured Loan Growth",
        unit: "% YoY",
        values: { "Nov-25": 9.2, "Dec-25": 10.0, "Jan-26": 11.2, "Feb-26": 11.8, "Mar-26": null, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Demand Deposit Growth",
        unit: "% YoY",
        values: { "Nov-25": 16.2, "Dec-25": 26.3, "Jan-26": 24.0, "Feb-26": 26.5, "Mar-26": 13.8, "Apr-26": null },
        status: "negative"
      },
      {
        name: "DII Net Inflow",
        unit: "₹ Cr",
        values: { "Nov-25": 77084, "Dec-25": 79620, "Jan-26": 69221, "Feb-26": 38423, "Mar-26": 142960, "Apr-26": 35983 },
        status: "positive"
      },
      {
        name: "FII Net Inflow",
        unit: "₹ Cr",
        values: { "Nov-25": -17500, "Dec-25": -34350, "Jan-26": -41435, "Feb-26": -6641, "Mar-26": -122540, "Apr-26": -38973 },
        status: "negative"
      },
      {
        name: "Net FDI Inflow",
        unit: "US$ mn",
        values: { "Nov-25": -704, "Dec-25": -492, "Jan-26": -1386, "Feb-26": null, "Mar-26": null, "Apr-26": null },
        status: "negative"
      },
      {
        name: "PMI-Manufacturing",
        unit: "",
        values: { "Nov-25": 56.6, "Dec-25": 55.0, "Jan-26": 55.4, "Feb-26": 56.9, "Mar-26": 53.9, "Apr-26": null },
        status: "negative"
      },
      {
        name: "PMI-Services",
        unit: "",
        values: { "Nov-25": 59.8, "Dec-25": 58.0, "Jan-26": 58.5, "Feb-26": 58.1, "Mar-26": 57.5, "Apr-26": null },
        status: "positive"
      },
      {
        name: "CPI (retail inflation)",
        unit: "%",
        values: { "Nov-25": 0.49, "Dec-25": 1.17, "Jan-26": 2.75, "Feb-26": 3.20, "Mar-26": 3.40, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Core Inflation",
        unit: "%",
        values: { "Nov-25": 4.25, "Dec-25": 4.61, "Jan-26": 3.37, "Feb-26": 3.40, "Mar-26": 3.37, "Apr-26": null },
        status: "negative"
      },
      {
        name: "WPI",
        unit: "%",
        values: { "Nov-25": -0.32, "Dec-25": 0.83, "Jan-26": 1.81, "Feb-26": 2.13, "Mar-26": 3.88, "Apr-26": null },
        status: "negative"
      },
      {
        name: "Net system liquidity",
        unit: "₹ Cr",
        values: { "Nov-25": 145429, "Dec-25": 17335, "Jan-26": 146351, "Feb-26": 283793, "Mar-26": 309220, "Apr-26": 554796 },
        status: "positive"
      }
    ]

    const { error } = await supabase
      .from('india_macro_snapshots')
      .upsert({
        snapshot_date: snapshotDate,
        geopolitical_summary: geopoliticalSummary,
        insights_positive: insightsPositive,
        insights_neutral: insightsNeutral,
        insights_negative: insightsNegative,
        metrics_data: metricsData
      }, { onConflict: 'snapshot_date' })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, message: "Snapshot ingested successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
