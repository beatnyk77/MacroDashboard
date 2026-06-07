import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface MetricHistoryPoint {
    date: string;
    value: number;
}

export function useMetricHistory(metricId: string, limit: number = 12) {
    return useQuery({
        queryKey: ['metric-history', metricId, limit],
        queryFn: async (): Promise<MetricHistoryPoint[]> => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', metricId)
                .order('as_of_date', { ascending: false })
                .limit(limit);

            if (error) {
                console.warn(`Could not fetch history for ${metricId}:`, error);
                return [];
            }

            return (data || [])
                .map(d => ({
                    date: String(d.as_of_date),
                    value: Number(d.value)
                }))
                .reverse(); // Ascending chronological order for chart display
        },
        staleTime: 1000 * 60 * 30, // 30 min (since historical data is slow to change)
        gcTime: 1000 * 60 * 60 * 2, // 2 hours
    });
}
