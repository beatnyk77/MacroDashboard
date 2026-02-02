import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BoJMetricData {
    id: string;
    name: string;
    value: number;
    as_of_date: string;
    delta_wow: number | null;
    delta_mom: number | null;
    history?: { date: string; value: number }[];
}

export interface BoJBalanceSheetData {
    excessReserves: BoJMetricData | null;
    totalAssets: BoJMetricData | null;
    monetaryBase: BoJMetricData | null;
    jgbHoldings: BoJMetricData | null;
    currentAccountDeposits: BoJMetricData | null;
}

export function useBoJBalanceSheet() {
    return useQuery({
        queryKey: ['boj-balance-sheet'],
        queryFn: async (): Promise<BoJBalanceSheetData> => {
            const metricIds = [
                'BOJ_EXCESS_RESERVES_TRJPY',
                'BOJ_TOTAL_ASSETS_TRJPY',
                'BOJ_MONETARY_BASE_TRJPY',
                'BOJ_JGB_HOLDINGS_TRJPY',
                'BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY'
            ];

            const [latestRes, historyRes] = await Promise.all([
                supabase
                    .from('vw_latest_metrics')
                    .select('*')
                    .in('metric_id', metricIds),
                supabase
                    .from('metric_observations')
                    .select('metric_id, as_of_date, value')
                    .in('metric_id', metricIds)
                    .order('as_of_date', { ascending: false })
                    .limit(500)
            ]);

            if (latestRes.error) throw latestRes.error;

            const mapMetric = (id: string): BoJMetricData | null => {
                const latest = latestRes.data?.find(m => m.metric_id === id);
                if (!latest) return null;

                const history = (historyRes.data || [])
                    .filter(h => h.metric_id === id)
                    .map(h => ({ date: h.as_of_date, value: Number(h.value) }))
                    .reverse();

                return {
                    id: latest.metric_id,
                    name: latest.metric_name,
                    value: Number(latest.value),
                    as_of_date: latest.as_of_date,
                    delta_wow: latest.delta_wow,
                    delta_mom: latest.delta_mom,
                    history
                };
            };

            return {
                excessReserves: mapMetric('BOJ_EXCESS_RESERVES_TRJPY'),
                totalAssets: mapMetric('BOJ_TOTAL_ASSETS_TRJPY'),
                monetaryBase: mapMetric('BOJ_MONETARY_BASE_TRJPY'),
                jgbHoldings: mapMetric('BOJ_JGB_HOLDINGS_TRJPY'),
                currentAccountDeposits: mapMetric('BOJ_CURRENT_ACCOUNT_DEPOSITS_TRJPY')
            };
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
