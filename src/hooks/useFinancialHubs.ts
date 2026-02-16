import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FinancialHubMetric {
    id: string;
    hub: string;
    metric_date: string;
    primary_metric_value: number;
    primary_metric_label: string;
    secondary_metrics: Record<string, any>;
    sparkline_data: number[];
    percentile: number;
    z_score: number;
    source: string;
    last_updated: string;
}

export const useFinancialHubs = () => {
    return useQuery({
        queryKey: ['financial_hubs_metrics'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('financial_hubs_metrics')
                .select('*')
                .order('metric_date', { ascending: false });

            if (error) throw error;

            // Get the latest metric for each hub
            const latestByHub: Record<string, FinancialHubMetric> = {};
            (data as FinancialHubMetric[]).forEach(item => {
                if (!latestByHub[item.hub]) {
                    latestByHub[item.hub] = item;
                }
            });

            return Object.values(latestByHub);
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        refetchOnWindowFocus: false,
    });
};
