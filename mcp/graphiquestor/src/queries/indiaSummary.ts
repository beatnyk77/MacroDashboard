import type { ServerConfig } from '../config.js';
import { getSupabase } from '../lib/supabase.js';
import { toApiMetricId } from '../lib/metricAliases.js';
import { formatNumber, formatStaleness } from '../lib/format.js';

const INDIA_SUMMARY_IDS = [
  'IN_REPO_RATE',
  'IN_CPI_YOY',
  'IN_GDP_GROWTH_YOY',
  'IN_FX_RESERVES',
  'IN_CD_RATIO',
  'IN_MFG_PMI',
  'IN_GST_COLLECTIONS',
  'USD_INR_RATE',
] as const;

export async function getIndiaSummary(config: ServerConfig) {
  const supabase = getSupabase(config);

  const { data, error } = await supabase.from('vw_india_macro').select('*');
  if (error) throw new Error(`get_india_summary failed: ${error.message}`);

  const rows = data ?? [];
  let staleCount = 0;
  const metrics: Record<string, { value: number | null; unit: string; staleness: string }> = {};

  for (const id of INDIA_SUMMARY_IDS) {
    const row = rows.find((r) => r.metric_id === id);
    if (row) {
      if (row.staleness_flag && row.staleness_flag !== 'fresh') staleCount += 1;
      metrics[toApiMetricId(id)] = {
        value: formatNumber(Number(row.value)),
        unit: row.unit_label ?? row.unit ?? '',
        staleness: formatStaleness(row.staleness_flag),
      };
    }
  }

  // Include any additional IN_ metrics from the view
  for (const row of rows) {
    const apiId = toApiMetricId(row.metric_id);
    if (!metrics[apiId]) {
      if (row.staleness_flag && row.staleness_flag !== 'fresh') staleCount += 1;
      metrics[apiId] = {
        value: formatNumber(Number(row.value)),
        unit: row.unit_label ?? row.unit ?? '',
        staleness: formatStaleness(row.staleness_flag),
      };
    }
  }

  const compositeRow = rows.find((r) => r.metric_id === 'india_macro_composite');
  const macroScore = compositeRow ? formatNumber(Number(compositeRow.value)) : null;

  const latestDate = rows.reduce<string | null>((max, r) => {
    if (!r.as_of_date) return max;
    if (!max || r.as_of_date > max) return r.as_of_date;
    return max;
  }, null);

  return {
    as_of: latestDate,
    macro_score: macroScore,
    regime: macroScore !== null ? (macroScore >= 60 ? 'Expansion' : macroScore <= 40 ? 'Contraction' : 'Neutral') : null,
    metrics,
    metric_count: Object.keys(metrics).length,
    stale_count: staleCount,
    credit_cycle_regime: null,
    rbi_intervention_posture: null,
    dashboard_url: '/intel/india',
  };
}