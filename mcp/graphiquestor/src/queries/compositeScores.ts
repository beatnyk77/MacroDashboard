import type { ServerConfig } from '../config.js';
import { getSupabase } from '../lib/supabase.js';
import { formatNumber, formatStaleness } from '../lib/format.js';

const COMPOSITE_IDS = [
  'gq_net_liquidity_zscore',
  'india_macro_composite',
  'gq_dedollarization_index',
  'g20_sovereign_stress_avg',
] as const;

const LABELS: Record<string, string> = {
  gq_net_liquidity_zscore: 'Net Liquidity Z-Score',
  india_macro_composite: 'India Macro Score',
  gq_dedollarization_index: 'De-Dollarization Index',
  g20_sovereign_stress_avg: 'G20 Sovereign Stress',
};

function regimeLabelFor(id: string, value: number): string | undefined {
  if (id === 'gq_net_liquidity_zscore') {
    if (value > 0.5) return 'Expanding';
    if (value < -0.5) return 'Contracting';
    return 'Neutral';
  }
  if (id === 'india_macro_composite') {
    if (value >= 60) return 'Expansion';
    if (value <= 40) return 'Contraction';
    return 'Neutral';
  }
  if (id === 'g20_sovereign_stress_avg') {
    if (value >= 60) return 'Elevated';
    if (value <= 40) return 'Contained';
    return 'Moderate';
  }
  if (id === 'gq_dedollarization_index') {
    if (value >= 55) return 'accelerating';
    if (value <= 45) return 'stable';
    return 'gradual';
  }
  return undefined;
}

export async function getCompositeScores(config: ServerConfig) {
  const supabase = getSupabase(config);

  const [metricsRes, liquidityRes] = await Promise.all([
    supabase.from('vw_latest_metrics').select('*').in('metric_id', [...COMPOSITE_IDS]),
    supabase.from('vw_net_liquidity').select('z_score, as_of_date, alarm_status').order('as_of_date', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (metricsRes.error) throw new Error(`get_composite_scores failed: ${metricsRes.error.message}`);

  const scores: Record<string, unknown> = {};
  let staleCount = 0;

  for (const id of COMPOSITE_IDS) {
    const row = (metricsRes.data ?? []).find((r) => r.metric_id === id);
    if (row) {
      const value = formatNumber(Number(row.value)) ?? 0;
      if (row.staleness_flag && row.staleness_flag !== 'fresh') staleCount += 1;
      scores[id] = {
        value,
        label: LABELS[id],
        regime: regimeLabelFor(id, value),
        direction: id === 'gq_dedollarization_index' ? regimeLabelFor(id, value) : undefined,
        staleness: formatStaleness(row.staleness_flag),
        as_of: row.as_of_date,
        source: row.source_name ?? 'GQ Proprietary',
      };
    }
  }

  // Fallback: net liquidity z-score from dedicated view if composite row missing
  if (!scores.gq_net_liquidity_zscore && liquidityRes.data?.z_score != null) {
    const z = formatNumber(Number(liquidityRes.data.z_score)) ?? 0;
    scores.gq_net_liquidity_zscore = {
      value: z,
      label: LABELS.gq_net_liquidity_zscore,
      regime: regimeLabelFor('gq_net_liquidity_zscore', z),
      staleness: 'unknown',
      as_of: liquidityRes.data.as_of_date,
      source: 'GQ Composite (vw_net_liquidity)',
      alarm_status: liquidityRes.data.alarm_status,
    };
  }

  return {
    scores,
    stale_count: staleCount,
    score_count: Object.keys(scores).length,
  };
}