import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MetricData {
    value: number;
    delta: number | null;
    deltaPeriod: string;
    trend: 'up' | 'down' | 'neutral';
    history: { date: string; value: number }[];
    status: 'safe' | 'warning' | 'danger' | 'neutral';
    lastUpdated: string;
    zScore?: number;
    percentile?: number;
    source?: string;
    frequency?: string;
    methodology?: string;
}

export function useLatestMetric(metricId: string) {
    return useQuery({
        queryKey: ['metric', metricId],
        queryFn: async (): Promise<MetricData | null> => {
            // 1. Fetch latest state from view
            const { data: latest, error: latestError } = await supabase
                .from('vw_latest_metrics')
                .select(`
                    *,
                    data_sources(name)
                `)
                .eq('metric_id', metricId)
                .single();

            if (latestError || !latest) {
                console.warn(`Metric ${metricId} not found in vw_latest_metrics`);
                return null;
            }

            // 2. Fetch history for the sparkline
            const { data: history } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', metricId)
                .order('as_of_date', { ascending: false })
                .limit(20);

            // Map staleness_flag to status
            const statusMap: Record<string, 'safe' | 'warning' | 'danger' | 'neutral'> = {
                'fresh': 'safe',
                'lagged': 'warning',
                'very_lagged': 'danger'
            };

            return {
                value: Number(latest.value),
                delta: latest.delta_mom || latest.delta_wow || 0,
                deltaPeriod: latest.display_frequency === 'daily' ? 'WoW' : 'MoM',
                trend: (latest.delta_mom || latest.delta_wow || 0) > 0 ? 'up' : 'down',
                history: (history || []).map(h => ({ date: String(h.as_of_date), value: Number(h.value) })).reverse(),
                status: statusMap[latest.staleness_flag] || 'neutral',
                lastUpdated: latest.as_of_date,
                zScore: latest.z_score,
                percentile: latest.percentile,
                source: (latest.data_sources as any)?.name || 'Internal Analytics',
                frequency: latest.native_frequency,
                methodology: 'Rolling 252-day Z-Score'
            };
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });
}
