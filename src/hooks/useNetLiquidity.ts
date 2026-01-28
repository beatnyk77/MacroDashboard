import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NetLiquidityData {
    as_of_date: string;
    current_value: number;
    previous_value: number;
    delta_pct: number;
    z_score: number;
    percentile: number;
}

export function useNetLiquidity() {
    return useQuery({
        queryKey: ['net-liquidity'],
        queryFn: async (): Promise<NetLiquidityData | null> => {
            const { data, error } = await supabase
                .from('vw_net_liquidity')
                .select('*')
                .single();

            if (error || !data) {
                console.warn('Could not fetch net liquidity');
                return null;
            }

            return {
                as_of_date: data.as_of_date,
                current_value: Number(data.current_value),
                previous_value: Number(data.previous_value),
                delta_pct: Number(data.delta_pct),
                z_score: Number(data.z_score),
                percentile: Number(data.percentile)
            };
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
