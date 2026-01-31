import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PreciousDivergenceData {
    metric_id: string;
    metric_name: string;
    value: number;
    delta_wow: number;
    last_updated: string;
    history?: { date: string; value: number }[];
}

export function usePreciousDivergence() {
    return useQuery({
        queryKey: ['precious-divergence'],
        queryFn: async (): Promise<PreciousDivergenceData[]> => {
            const metricIds = [
                'GOLD_COMEX_SHANGHAI_SPREAD_PCT',
                'SILVER_COMEX_SHANGHAI_SPREAD_PCT',
                'GOLD_COMEX_USD',
                'GOLD_SHANGHAI_USD',
                'SILVER_COMEX_USD',
                'SILVER_SHANGHAI_USD'
            ];

            const { data: latestMetrics, error: metricsError } = await supabase
                .from('vw_latest_metrics')
                .select('metric_id, metric_name, value, delta_wow, last_updated_at')
                .in('metric_id', metricIds);

            if (metricsError) throw metricsError;

            // Fetch 1y history for the spread metrics
            const { data: historyData, error: historyError } = await supabase
                .from('metric_observations')
                .select('metric_id, value, as_of_date')
                .in('metric_id', ['GOLD_COMEX_SHANGHAI_SPREAD_PCT', 'SILVER_COMEX_SHANGHAI_SPREAD_PCT'])
                .order('as_of_date', { ascending: false })
                .limit(730); // ~1 year for 2 metrics

            if (historyError) throw historyError;

            return (latestMetrics || []).map(m => ({
                metric_id: m.metric_id,
                metric_name: m.metric_name,
                value: Number(m.value),
                delta_wow: Number(m.delta_wow || 0),
                last_updated: m.last_updated_at,
                history: (historyData || [])
                    .filter((h: any) => h.metric_id === m.metric_id)
                    .map((h: any) => ({ date: h.as_of_date, value: Number(h.value) }))
                    .reverse()
            }));
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
