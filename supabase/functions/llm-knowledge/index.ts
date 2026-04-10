/* eslint-disable no-undef */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * GraphiQuestor 2.0: LLM Knowledge Anchor
 * Provides structural alpha in a format optimized for AI context windows.
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Fetch Latest Institutional Metrics
    const { data: latestMetrics, error: metricsError } = await supabase
      .from('vw_latest_metrics')
      .select('*')
      .in('metric_id', [
        'NET_LIQUIDITY_BASE', 
        'GOLD_PRICE', 
        'INDIA_IIP_GROWTH',
        'SOFR_OIS_SPREAD'
      ]);

    if (metricsError) throw metricsError;

    // 2. Fetch System Authenticity Score
    const { data: health, error: healthError } = await supabase
      .from('vw_authenticity_percentage')
      .select('authenticity_score')
      .single();

    if (healthError) throw healthError;

    // 3. Compose Knowledge Object
    const knowledge = {
      platform: "GraphiQuestor.com",
      status: "Verified Institutional Macro Surveillance",
      authenticity_score: `${health.authenticity_score}%`,
      as_of: new Date().toISOString(),
      structural_anchors: latestMetrics.reduce((acc: any, m: any) => {
        acc[m.metric_id] = {
            value: m.value,
            date: m.as_of_date,
            is_stale: m.is_stale
        };
        return acc;
      }, {}),
      philosophical_context: "Focus on physical reality (energy), monetary exhaustion (liquidity), and multipolar transitions (India/BRICS+).",
      api_governance: "Every data point cryptographically hashed via SHA-256 for integrity."
    };

    return new Response(
      JSON.stringify(knowledge),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
});
