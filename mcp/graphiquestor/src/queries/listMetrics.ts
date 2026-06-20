import type { ServerConfig } from '../config.js';
import { getSupabase } from '../lib/supabase.js';
import { countryFilter, toApiMetricId } from '../lib/metricAliases.js';
import { formatNumber, formatStaleness } from '../lib/format.js';
import type { MetricRow } from '../types.js';

export interface ListMetricsParams {
  country?: string;
  category?: string;
  limit?: number;
}

export async function listMetrics(config: ServerConfig, params: ListMetricsParams) {
  const limit = Math.min(params.limit ?? 50, 270);
  const supabase = getSupabase(config);

  let query = supabase.from('vw_latest_metrics').select('*').limit(limit * 2);

  if (params.category) {
    query = query.ilike('category', `%${params.category}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`list_metrics failed: ${error.message}`);

  let rows = (data ?? []) as MetricRow[];
  const countryFn = countryFilter(params.country);
  if (countryFn) {
    rows = rows.filter((r) => countryFn(r.metric_id));
  }

  rows = rows.slice(0, limit);

  const mapped = rows.map((row) => ({
    metric_id: toApiMetricId(row.metric_id),
    live_metric_id: row.metric_id,
    label: row.metric_name ?? row.metric_id,
    value: formatNumber(row.value),
    unit: row.unit_label ?? row.unit ?? '',
    as_of: row.as_of_date,
    staleness: formatStaleness(row.staleness_flag),
    source: row.source_name ?? 'Internal Analytics',
    z_score: formatNumber(row.z_score),
    methodology_url: methodologyForMetric(row.metric_id),
  }));

  return {
    data: mapped,
    total: mapped.length,
    country: params.country?.toUpperCase() ?? null,
  };
}

function methodologyForMetric(metricId: string): string | undefined {
  if (metricId.startsWith('CN_') && (metricId.includes('DEBT') || metricId.includes('ICEBERG') || metricId.includes('LGFV') || metricId.includes('MONETIZATION') || metricId.includes('LAND_FISCAL'))) {
    return '/methods/china-debt-iceberg';
  }
  if (metricId.startsWith('IN_')) return '/methods/india-credit-cycle-clock';
  if (metricId.includes('LIQUIDITY') || metricId.startsWith('RRP_') || metricId.startsWith('TGA_')) {
    return '/methods/global-net-liquidity';
  }
  if (metricId.includes('DEDOLLAR') || metricId.includes('GOLD')) return '/methods/de-dollarization-guide';
  return undefined;
}