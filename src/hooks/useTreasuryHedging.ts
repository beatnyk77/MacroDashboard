import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HedgingMetricPoint {
    date: string;
    value: number;
}

export interface TreasuryHedgingData {
    metric_id: string;
    history: HedgingMetricPoint[];
    current_value: number;
    prev_value?: number;
    delta?: number;
}

const HEDGING_METRICS = [
    'SOFR_RATE',
    'USD_INR_SPOT',
    'WTI_OIL_PRICE',
    'US_10Y_YIELD',
    'US_2Y_YIELD',
    'US_3M_T_BILL'
];

export function useTreasuryHedging() {
    return useSuspenseQuery({
        queryKey: ['treasury-hedging-data'],
        queryFn: async (): Promise<TreasuryHedgingData[]> => {
            const { data, error } = await supabase
                .from('treasury_hedging_metrics')
                .select('metric_id, date, value')
                .in('metric_id', HEDGING_METRICS)
                .order('date', { ascending: true });

            if (error) throw error;

            return HEDGING_METRICS.map(metricId => {
                const metricHistory = data
                    ?.filter((h: any) => h.metric_id === metricId)
                    .map((h: any) => ({
                        date: h.date,
                        value: Number(h.value)
                    })) || [];

                const points = metricHistory.length;
                const current = points > 0 ? metricHistory[points - 1].value : 0;
                const prev = points > 1 ? metricHistory[points - 2].value : current;
                const delta = prev !== 0 ? ((current - prev) / prev) * 100 : 0;

                return {
                    metric_id: metricId,
                    history: metricHistory,
                    current_value: current,
                    prev_value: prev,
                    delta: delta
                };
            });
        },
        staleTime: 1000 * 60 * 60 * 4, // 4 hours
    });
}
