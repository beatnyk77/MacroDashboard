import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BricsMetric {
    metric_id: string;
    metric_name: string;
    unit: string;
    unit_label: string;
    as_of_date: string;
    value: number;
    delta_qoq: number;
    delta_yoy_pct: number;
    z_score: number;
    percentile: number;
    staleness_flag: 'fresh' | 'lagged' | 'very_lagged' | 'no_data';
    last_updated_at: string;
}

export interface BricsCountryReserves {
    country_code: string;
    country_name: string;
    gold_tonnes: number;
    gold_yoy_pct_change: number;
    is_accumulating_gold: boolean;
}

export function useBricsTracker() {
    return useQuery({
        queryKey: ['brics_tracker'],
        queryFn: async () => {
            // 1. Fetch aggregate metrics from view
            const { data: metrics, error: metricsError } = await supabase
                .from('vw_brics_tracker')
                .select('*');

            if (metricsError) throw metricsError;

            // 2. Fetch country-wise gold for BRICS members
            const bricsCodes = ['CN', 'RU', 'IN', 'BR', 'ZA'];
            const { data: countryReserves, error: countryError } = await supabase
                .from('vw_g20_reserves_gold')
                .select('country_code, country_name, gold_tonnes, gold_yoy_pct_change, is_accumulating_gold')
                .in('country_code', bricsCodes)
                .order('gold_tonnes', { ascending: false });

            if (countryError) throw countryError;

            // 3. Fetch history for sparklines
            const { data: history, error: historyError } = await supabase
                .from('metric_observations')
                .select('metric_id, as_of_date, value')
                .ilike('metric_id', 'BRICS_%')
                .order('as_of_date', { ascending: true });

            if (historyError) throw historyError;

            // Group history by metric_id
            const historyGrouped = (history || []).reduce((acc: any, curr) => {
                if (!acc[curr.metric_id]) acc[curr.metric_id] = [];
                acc[curr.metric_id].push({ date: curr.as_of_date, value: Number(curr.value) });
                return acc;
            }, {});

            return {
                metrics: (metrics as BricsMetric[]) || [],
                countryReserves: (countryReserves as BricsCountryReserves[]) || [],
                history: historyGrouped
            };
        },
        staleTime: 1000 * 60 * 15, // 15 min
    });
}
