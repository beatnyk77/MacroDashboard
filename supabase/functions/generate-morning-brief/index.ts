import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { serveIngest } from '../_shared/handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// NOTE: client must be created inside the handler — env vars are only
// injected by the Supabase runtime at request time, not at module load.
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

const FOCUS_AREA_CONFIGS = {
  india: {
    label: 'India Macro',
    metric_ids: [
      'india_gsec_10y', 'india_rbi_rate', 'india_cpi_yoy',
      'india_gdp_yoy', 'india_fx_reserves_usd_bn',
      'india_cd_ratio', 'india_mfg_pmi',
      'india_gst_collections', 'india_inr_usd'
    ]
  },
  us_macro: {
    label: 'US Macro',
    metric_ids: [
      'us_cpi_yoy', 'us_10y_yield',
      'us_dxy', 'us_fed_funds_rate',
      'us_net_liquidity', 'us_debt_gdp'
    ]
  },
  gold_dedollarization: {
    label: 'Gold & De-Dollarization',
    metric_ids: [
      'gold_price_usd', 'debt_gold_ratio',
      'central_bank_gold_purchases',
      'dedollarization_composite_score'
    ]
  },
  china: {
    label: 'China Macro',
    metric_ids: [
      'china_gdp_yoy', 'china_cpi_yoy',
      'china_credit_impulse', 'china_fx_reserves'
    ]
  },
  energy: {
    label: 'Energy & Commodities',
    metric_ids: [
      'wti_price', 'wti_calendar_spread',
      'brent_price', 'natural_gas_price'
    ]
  },
  sovereign_debt: {
    label: 'Sovereign Debt',
    metric_ids: [
      'us_debt_gdp', 'g20_debt_gdp_avg',
      'us_10y_yield', 'treasury_auction_btc_10y',
      'fed_monetization_ratio'
    ]
  },
};

const DEFAULT_FOCUS_COMBOS: string[][] = [
  ['india', 'us_macro', 'gold_dedollarization'],
  ['india', 'us_macro', 'sovereign_debt'],
  ['india', 'energy', 'gold_dedollarization'],
];

interface ObservationPoint {
  metric_id: string;
  value: number | string;
  as_of_date: string;
}

interface DailySignalRow {
  regime: string;
  score: number;
}

interface MetricInfoRow {
  id: string;
  name: string;
  unit: string | null;
}

interface LatestMetricPoint {
  metric_id: string;
  value: number;
  prev_value: number;
  label: string;
  unit: string;
}

interface SignificantChangePoint {
  label: string;
  value: number;
  prev_value: number;
  unit: string;
  direction: string;
}

serveIngest('generate-morning-brief', async (req) => {

  if (req.method === 'OPTIONS') {
    return { ok: true, counts: {} };
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const insertErrors: string[] = [];

    // 1. Get current regime
    const { data: regimeData } = await supabase
      .from('metric_observations')
      .select('metric_id, value, as_of_date')
      .in('metric_id', [
        'regime_label', 'regime_score',
        'regime_confidence'
      ])
      .order('as_of_date', { ascending: false })
      .limit(3);

    const typedRegimeData = regimeData as unknown as ObservationPoint[] | null;
    let label = typedRegimeData?.find((r) => r.metric_id === 'regime_label')?.value;
    let score = typedRegimeData?.find((r) => r.metric_id === 'regime_score')?.value;

    if (!label || !score) {
      const { data: signalData } = await supabase
        .from('daily_signal')
        .select('regime, score')
        .order('signal_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const typedSignal = signalData as unknown as DailySignalRow | null;
      if (typedSignal) {
        label = label ?? typedSignal.regime;
        score = score ?? typedSignal.score;
      }
    }

    const regime = {
      label: String(label ?? 'Neutral'),
      score: Math.round(Number(score ?? 55)),
    };

    // 2. Resolve recent observations
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateLimit = sevenDaysAgo.toISOString().split('T')[0];

    const { data: observations } = await supabase
      .from('metric_observations')
      .select('metric_id, value, as_of_date')
      .gte('as_of_date', dateLimit)
      .order('as_of_date', { ascending: false })
      .limit(2000);

    const typedObservations = observations as unknown as ObservationPoint[] | null;

    const { data: metricsInfo } = await supabase
      .from('metrics')
      .select('id, name, unit');

    const typedMetricsInfo = metricsInfo as unknown as MetricInfoRow[] | null;

    const metricsMap = new Map<string, { name: string; unit: string }>();
    (typedMetricsInfo ?? []).forEach((m) => {
      metricsMap.set(m.id, { name: m.name ?? m.id, unit: m.unit ?? '' });
    });

    const metricGroups: Record<string, { value: number, as_of_date: string }[]> = {};
    (typedObservations ?? []).forEach((obs) => {
      if (!metricGroups[obs.metric_id]) {
        metricGroups[obs.metric_id] = [];
      }
      metricGroups[obs.metric_id].push({
        value: Number(obs.value),
        as_of_date: String(obs.as_of_date)
      });
    });

    const latestMetrics: LatestMetricPoint[] = Object.entries(metricGroups).map(([metric_id, history]): LatestMetricPoint => {
      history.sort((a, b) => b.as_of_date.localeCompare(a.as_of_date));
      const latest = history[0];
      const prev = history[1];
      const info = metricsMap.get(metric_id);
      return {
        metric_id,
        value: latest.value,
        prev_value: prev ? prev.value : latest.value,
        label: info?.name ?? metric_id,
        unit: info?.unit ?? '',
      };
    });

    const significantChanges = latestMetrics
      .filter((m: LatestMetricPoint) => {
        const change = Math.abs(
          (m.value - m.prev_value) / (m.prev_value || 1)
        );
        return change > 0.005;
      })
      .slice(0, 8)
      .map((m: LatestMetricPoint): SignificantChangePoint => ({
        label: m.label,
        value: m.value,
        prev_value: m.prev_value,
        unit: m.unit,
        direction: m.value > m.prev_value ? 'up' : 'down',
      }));

    // 3. Generate brief for each focus combo
    let briefsWritten = 0;

    for (const focusCombo of DEFAULT_FOCUS_COMBOS) {
      const sortedCombo = [...focusCombo].sort();
      const focusKey = sortedCombo.join(',');

      // Skip if already generated today
      const { data: existing, error: existingErr } = await supabase
        .from('daily_macro_briefs')
        .select('id')
        .eq('brief_date', today)
        .contains('focus_areas', focusCombo)
        .maybeSingle();

      if (existingErr) {
        insertErrors.push(`existing_check_error[${focusKey}]: ${JSON.stringify(existingErr)}`);
      }

      if (existing) {
        insertErrors.push(`skipped[${focusKey}]: already exists`);
        continue;
      }

      const focusMetricIds = focusCombo.flatMap(
        area => FOCUS_AREA_CONFIGS[
          area as keyof typeof FOCUS_AREA_CONFIGS
        ]?.metric_ids ?? []
      );

      const focusMetrics = latestMetrics
        .filter((m: LatestMetricPoint) => focusMetricIds.includes(m.metric_id))
        .map((m: LatestMetricPoint) => `${m.label}: ${m.value}${m.unit}`);

      const focusLabels = focusCombo.map(
        area => FOCUS_AREA_CONFIGS[
          area as keyof typeof FOCUS_AREA_CONFIGS
        ]?.label ?? area
      ).join(', ');

      // 4. Call OpenRouter API
      const prompt = `You are GraphiQuestor's macro intelligence engine generating a morning brief for institutional analysts.

Current macro regime: ${regime.label} (Score: ${regime.score}/100)
Analyst focus areas: ${focusLabels}

Metrics that changed significantly in the last 24 hours:
${significantChanges.map((m: SignificantChangePoint) => `- ${m.label}: ${m.value}${m.unit} (${m.direction === 'up' ? '↑' : '↓'} from ${m.prev_value}${m.unit})`).join('\n')}

Focus area metrics (current readings):
${focusMetrics.join('\n')}

Generate a morning macro brief. Return ONLY valid JSON, no markdown, no explanation:
{
  "what_changed": ["3-5 bullets about overnight changes. Format: 'METRIC moved DIRECTION — one-line institutional interpretation'"],
  "regime_status": "2 sentences on current regime and what it means for positioning",
  "focus_observations": ["3 observations specific to the analyst's focus areas"],
  "watch_today": ["2-3 specific things to monitor today — data releases, market levels, events"]
}

Style rules:
- Write like a senior macro strategist at a sovereign wealth fund
- No hedging language ('may', 'might', 'could possibly')
- No retail language ('investors should', 'bulls believe')
- Terse, precise, institutional
- Each bullet max 25 words
- No bullet point prefixes in the JSON strings`;

      let content = {
        what_changed: [
          `Regime at ${regime.score}/100 — ${regime.label} conditions persisting`,
          'Brief generation pending first data ingestion',
        ],
        regime_status: `Current regime: ${regime.label}. Score ${regime.score}/100.`,
        focus_observations: focusMetrics.slice(0, 3).length > 0
          ? focusMetrics.slice(0, 3)
          : ['No focus metrics available yet'],
        watch_today: ['Monitor key data releases', 'Watch central bank communications'],
      };

      let tokensUsed = 0;
      let modelUsed = 'fallback-template';

      if (OPENROUTER_API_KEY) {
        try {
          const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://graphiquestor.com',
                'X-Title': 'GraphiQuestor Morning Brief',
              },
              body: JSON.stringify({
                model: 'nvidia/llama-3.1-nemotron-70b-instruct:free',
                max_tokens: 800,
                messages: [
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            tokensUsed = result.usage?.total_tokens ?? 0;
            modelUsed = result.model ?? 'nvidia/llama-3.1-nemotron-70b-instruct:free';
            const rawText = result.choices?.[0]?.message?.content ?? '';

            try {
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (
                  parsed.what_changed &&
                  parsed.regime_status &&
                  parsed.focus_observations &&
                  parsed.watch_today
                ) {
                  content = parsed;
                }
              }
            } catch (jsonErr) {
              console.error('JSON parse failed:', rawText, jsonErr);
            }
          } else {
            console.error('OpenRouter HTTP error:', response.status, await response.text());
          }
        } catch (apiErr) {
          console.error('OpenRouter API error:', apiErr);
        }
      }

      // 5. Store in database — plain INSERT; existence check above skips duplicates.
      const insertPayload = {
        brief_date: today,
        focus_areas: sortedCombo,
        content,
        regime_score: regime.score,
        regime_label: regime.label,
        model_used: modelUsed,
        tokens_used: tokensUsed,
      };

      const { error: insertErr } = await supabase
        .from('daily_macro_briefs')
        .insert(insertPayload);

      if (insertErr) {
        const errStr = `insert_error[${focusKey}]: code=${insertErr.code} msg=${insertErr.message} details=${insertErr.details} hint=${insertErr.hint}`;
        console.error(errStr);
        insertErrors.push(errStr);
      } else {
        briefsWritten++;
        console.log(`Brief saved for ${today} [${focusKey}] model=${modelUsed}`);
      }
    }

    return { ok: true, counts: {} };

  } catch (err) {
    console.error('Brief generation error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
