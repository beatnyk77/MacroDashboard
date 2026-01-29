import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface IndiaMetric {
    metric_id: string;
    metric_name: string;
    unit: string;
    unit_label: string;
    as_of_date: string;
    value: number;
    delta_wow: number;
    delta_mom: number;
    z_score: number;
    percentile: number;
    staleness_flag: 'fresh' | 'lagged' | 'very_lagged' | 'no_data';
    last_updated_at: string;
    source_name: string;
    display_frequency: string;
}

export function useIndiaMacro() {
    return useQuery({
        queryKey: ['india_macro'],
        queryFn: async () => {
            // 1. Fetch aggregate metrics from view
            const { data: metrics, error: metricsError } = await supabase
                .from('vw_india_macro')
                .select('*');

            if (metricsError) throw metricsError;

            // 2. Fetch history for sparklines
            const { data: history, error: historyError } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .ilike('metric_id', 'IN_%')
                .order('as_of_date', { ascending: true });

            if (historyError) throw historyError;

            // Group history by metric_id
            const historyGrouped = (history || []).reduce((acc: any, curr) => {
                const mid = curr.metric_id;
                if (!acc[mid]) acc[mid] = [];
                acc[mid].push({ date: curr.as_of_date, value: Number(curr.value) });
                return acc;
            }, {});

            return {
                metrics: (metrics as IndiaMetric[]) || [],
                history: historyGrouped
            };
        },
        staleTime: 1000 * 60 * 15, // 15 min
    });
}
