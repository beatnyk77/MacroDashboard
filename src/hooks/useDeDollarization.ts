import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DeDollarizationMetric {
    metric_id: string;
    metric_name: string;
    category: string;
    tier: string;
    unit: string;
    unit_label: string;
    native_frequency: string;
    display_frequency: string;
    expected_interval_days: number;
    methodology_note: string;
    as_of_date: string;
    value: number;
    delta_qoq: number | null;
    delta_yoy: number | null;
    delta_yoy_pct: number | null;
    z_score: number | null;
    percentile: number | null;
    staleness_flag: 'fresh' | 'lagged' | 'very_lagged';
    last_updated_at: string;
    days_since_update: number;
}

export interface DeDollarizationData {
    usdShare: DeDollarizationMetric | null;
    goldShare: DeDollarizationMetric | null;
    rmbShare: DeDollarizationMetric | null;
    eurShare: DeDollarizationMetric | null;
    goldHoldings: DeDollarizationMetric | null;
    otherShare: DeDollarizationMetric | null;
}

/**
 * Hook to fetch de-dollarization metrics from vw_dedollarization view
 * Includes USD share, gold reserves, and other currency composition
 */
export function useDeDollarization() {
    return useQuery({
        queryKey: ['dedollarization'],
        queryFn: async (): Promise<DeDollarizationData> => {
            const { data, error } = await supabase
                .from('vw_dedollarization')
                .select('*');

            if (error) {
                console.error('Error fetching de-dollarization data:', error);
                throw error;
            }

            // Map metrics to structured object
            const metrics = data as DeDollarizationMetric[];

            return {
                usdShare: metrics.find(m => m.metric_id === 'GLOBAL_USD_SHARE_PCT') || null,
                goldShare: metrics.find(m => m.metric_id === 'GLOBAL_GOLD_SHARE_PCT') || null,
                rmbShare: metrics.find(m => m.metric_id === 'GLOBAL_RMB_SHARE_PCT') || null,
                eurShare: metrics.find(m => m.metric_id === 'GLOBAL_EUR_SHARE_PCT') || null,
                goldHoldings: metrics.find(m => m.metric_id === 'GLOBAL_GOLD_HOLDINGS_USD') || null,
                otherShare: metrics.find(m => m.metric_id === 'GLOBAL_OTHER_SHARE_PCT') || null,
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour (quarterly data, low update frequency)
        retry: 2,
    });
}

/**
 * Hook to fetch historical data for sparklines
 */
export function useDeDollarizationHistory(metricId: string) {
    return useQuery({
        queryKey: ['dedollarization-history', metricId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('metric_observations')
                .select('as_of_date, value')
                .eq('metric_id', metricId)
                .order('as_of_date', { ascending: false })
                .limit(100); // 25 years of quarterly data (100 quarters)

            if (error) throw error;

            return (data || []).map(d => ({
                date: String(d.as_of_date),
                value: Number(d.value)
            })).reverse();
        },
        staleTime: 1000 * 60 * 60,
        enabled: !!metricId,
    });
}
