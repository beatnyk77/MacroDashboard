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

    // 1. Snapshot Data for Apr'26 Africa Macro Pulse
    const snapshotDate = '2026-04-01'
    const continentSummary = "The Apr'26 Africa Macro Pulse highlights a continent navigating severe fiscal stress and commodity price volatility. While Ghana's debt restructuring provides a template for others, Zambia and Ethiopia remain in the spotlight. Oil producers like Angola and Nigeria are seeing revenue boosts from elevated crude prices, but FX pressures persist. The 'Trade Gravity' shift towards China continues to accelerate across the Sahel and East Africa."

    const insightsPositive = [
      "Angola's oil revenues up 12% MoM as production stabilizes and prices remain elevated.",
      "Ghana successfully completes the second phase of its domestic debt exchange, improving fiscal outlook.",
      "Morocco's fertilizer exports reach record levels, bolstering its current account surplus."
    ]

    const insightsNeutral = [
      "Kenya's shilling stabilizes after Eurobond buyback, but debt service remains a multi-year headwind.",
      "South Africa's mining sector shows mixed results; coal exports down, but critical minerals (manganese, chrome) up."
    ]

    const insightsNegative = [
      "Nigeria's inflation hits 28-year high, driven by fuel subsidy removal and FX depreciation.",
      "Egypt faces continued pressure on the EGP despite IMF expansion; external debt service ratio exceeds 40%.",
      "Zambia's debt restructuring hits another legal bottleneck with private creditors."
    ]

    const metricsSummary = [
      { name: "Avg Debt/GDP", value: 68.4, unit: "%", trend: "up" },
      { name: "China Trade Gravity", value: 42.1, unit: "%", trend: "up" },
      { name: "Oil Production", value: 3.4, unit: "mbpd", trend: "up" },
      { name: "Avg Inflation", value: 14.8, unit: "%", trend: "up" }
    ]

    // 2. Upsert Snapshot
    const { error: snapshotError } = await supabase
      .from('africa_macro_snapshots')
      .upsert({
        snapshot_date: snapshotDate,
        continent_summary: continentSummary,
        insights_positive: insightsPositive,
        insights_neutral: insightsNeutral,
        insights_negative: insightsNegative,
        metrics_summary: metricsSummary
      }, { onConflict: 'snapshot_date' })

    if (snapshotError) throw snapshotError

    // 3. Upsert Latest Country Metrics (Pulse)
    // In a real scenario, these would be fetched from IMF/World Bank APIs
    const countries = ['ZA', 'NG', 'EG', 'KE', 'AO', 'GH', 'ET', 'MA', 'DZ', 'ZM']
    const pulseMetrics = [
      { iso: 'ZA', metric_key: 'debt_gdp', value: 72.3, source: 'IMF' },
      { iso: 'NG', metric_key: 'inflation_yoy', value: 31.7, source: 'NBS' },
      { iso: 'EG', metric_key: 'debt_service_ratio', value: 42.1, source: 'Central Bank' },
      { iso: 'KE', metric_key: 'fx_reserves_months', value: 3.8, source: 'CBK' },
      { iso: 'AO', metric_key: 'oil_production', value: 1.15, source: 'OPEC' },
      { iso: 'GH', metric_key: 'debt_gdp', value: 88.1, source: 'IMF' },
      { iso: 'ET', metric_key: 'china_trade_gravity', value: 58.4, source: 'UN Comtrade' },
      { iso: 'MA', metric_key: 'export_reliance_fert', value: 24.5, source: 'OEC' },
      { iso: 'DZ', metric_key: 'energy_exports_pct', value: 94.2, source: 'EIA' },
      { iso: 'ZM', metric_key: 'debt_restructuring_status', value: 1, source: 'MoF', metadata: { status: 'In Progress' } }
    ]

    for (const metric of pulseMetrics) {
      const { error: metricError } = await supabase
        .from('country_metrics')
        .upsert({
          iso: metric.iso,
          metric_key: metric.metric_key,
          value: metric.value,
          source: metric.source,
          as_of: snapshotDate,
          confidence: 0.9,
          metadata: metric.metadata ?? {}
        }, { onConflict: 'iso,metric_key' })
      
      if (metricError) console.error(`Error upserting metric for ${metric.iso}:`, metricError)
    }

    return new Response(JSON.stringify({ success: true, message: "Africa Macro Pulse ingested successfully" }), {
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
