import type { ServerConfig } from '../config.js';
import { getSupabase } from '../lib/supabase.js';
import { resolveMetricId, toApiMetricId } from '../lib/metricAliases.js';
import { formatNumber, isoDateDaysAgo, todayIso } from '../lib/format.js';

export interface ObservationsParams {
  metric_id: string;
  from?: string;
  to?: string;
  limit?: number;
}

export async function getObservations(config: ServerConfig, params: ObservationsParams) {
  const liveId = resolveMetricId(params.metric_id);
  const from = params.from ?? isoDateDaysAgo(90);
  const to = params.to ?? todayIso();
  const limit = Math.min(params.limit ?? 90, 730);
  const supabase = getSupabase(config);

  const [metaRes, obsRes] = await Promise.all([
    supabase.from('vw_latest_metrics').select('metric_name, unit, unit_label, staleness_flag').eq('metric_id', liveId).maybeSingle(),
    supabase
      .from('metric_observations')
      .select('as_of_date, value')
      .eq('metric_id', liveId)
      .gte('as_of_date', from)
      .lte('as_of_date', to)
      .order('as_of_date', { ascending: false })
      .limit(limit),
  ]);

  if (obsRes.error) throw new Error(`get_observations failed: ${obsRes.error.message}`);

  const observations = (obsRes.data ?? []).map((o) => ({
    date: o.as_of_date,
    value: formatNumber(Number(o.value)),
  }));

  return {
    metric_id: toApiMetricId(liveId),
    live_metric_id: liveId,
    label: metaRes.data?.metric_name ?? liveId,
    unit: metaRes.data?.unit_label ?? metaRes.data?.unit ?? '',
    staleness: metaRes.data?.staleness_flag ?? 'unknown',
    observations: observations.reverse(),
    from,
    to,
  };
}