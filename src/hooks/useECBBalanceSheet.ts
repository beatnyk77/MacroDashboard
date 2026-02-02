import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ECBMetricData {
    id: string;
    value: number;
    delta: number | null;
    as_of_date: string;
    history: { date: string; value: number }[];
}

export interface ECBBalanceSheetData {
    totalAssets: ECBMetricData | null;
    mro: ECBMetricData | null;
    df: ECBMetricData | null;
    excessLiquidity: ECBMetricData | null;
    isLoading: boolean;
}

export function useECBBalanceSheet() {
    return useQuery({
        queryKey: ['ecb-balance-sheet'],
        queryFn: async (): Promise<ECBBalanceSheetData> => {
            const metricIds = [
                'ECB_TOTAL_ASSETS_MEUR',
                'ECB_MRO_OUTSTANDING_MEUR',
                'ECB_DF_OUTSTANDING_MEUR',
                'ECB_EXCESS_LIQUIDITY_MEUR'
            ];

            const [latestRes, historyRes] = await Promise.all([
                supabase.from('vw_latest_metrics').select('*').in('metric_id', metricIds),
                supabase.from('metric_observations')
                    .select('metric_id, as_of_date, value')
                    .in('metric_id', metricIds)
                    .order('as_of_date', { ascending: false })
                    .limit(400) // ~100 per metric
            ]);

            const mapMetric = (id: string): ECBMetricData | null => {
                const latest = latestRes.data?.find(m => m.metric_id === id);
                if (!latest) return null;

                const history = (historyRes.data || [])
                    .filter(h => h.metric_id === id)
                    .map(h => ({ date: String(h.as_of_date), value: Number(h.value) }))
                    .reverse();

                return {
                    id,
                    value: Number(latest.value),
                    delta: latest.delta_wow || latest.delta_mom || null,
                    as_of_date: latest.as_of_date,
                    history
                };
            };

            return {
                totalAssets: mapMetric('ECB_TOTAL_ASSETS_MEUR'),
                mro: mapMetric('ECB_MRO_OUTSTANDING_MEUR'),
                df: mapMetric('ECB_DF_OUTSTANDING_MEUR'),
                excessLiquidity: mapMetric('ECB_EXCESS_LIQUIDITY_MEUR'),
                isLoading: false
            };
        },
        staleTime: 1000 * 60 * 30, // 30 min
    });
}
