import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapLatestMetric, type MetricData } from '@/lib/metricData';
export type { MetricData } from '@/lib/metricData';

export function useLatestMetric(metricId: string) {
    return useQuery({
        queryKey: ['metric', metricId],
        enabled: !!metricId,
        queryFn: async (): Promise<MetricData | null> => {
            // 1. Fetch latest state from view
            const { data: latest, error: latestError } = await supabase
                .from('vw_latest_metrics')
                .select('*')
                .eq('metric_id', metricId)
                .maybeSingle();

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
                .limit(300);

            return mapLatestMetric(latest as Record<string, unknown>, history || []);
        },
        staleTime: 1000 * 60 * 5, // 5 min
        refetchOnWindowFocus: true, // Refetch when user returns to tab
        refetchOnMount: true, // Refetch on component mount
    });
}
