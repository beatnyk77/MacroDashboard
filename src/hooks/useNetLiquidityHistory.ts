import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NetLiquidityHistoryPoint {
    date: string;
    value: number;
    z_score: number;
    percentile: number;
}

export function useNetLiquidityHistory() {
    const { data } = useSuspenseQuery({
        queryKey: ['net-liquidity-history'],
        queryFn: async (): Promise<NetLiquidityHistoryPoint[]> => {
            const { data: res, error } = await supabase
                .from('vw_net_liquidity')
                .select('as_of_date, value, z_score, percentile')
                .order('as_of_date', { ascending: true }); // Ascending for chart

            if (error || !res) {
                console.warn('Could not fetch net liquidity history', error);
                return [];
            }

            return res.map(d => ({
                date: d.as_of_date,
                value: Number(d.value),
                z_score: Number(d.z_score),
                percentile: Number(d.percentile)
            }));
        },
        staleTime: 1000 * 60 * 60 * 24, // 24h, this historical data doesn't change frequently
    });

    return { data };
}
