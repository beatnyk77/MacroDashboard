import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface NetLiquidityData {
    as_of_date: string;
    current_value: number;
    z_score: number;
    percentile: number;
    delta: number;
    delta_pct: number;
    alarm_status: string;
}

export function useNetLiquidity() {
    return useQuery({
        queryKey: ['net-liquidity'],
        queryFn: async (): Promise<NetLiquidityData | null> => {
            const { data, error } = await supabase
                .from('vw_net_liquidity')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                console.warn('Could not fetch net liquidity');
                return null;
            }

            return {
                as_of_date: data.as_of_date,
                current_value: Number(data.value),
                z_score: Number(data.z_score),
                percentile: Number(data.percentile),
                delta: Number(data.delta),
                delta_pct: Number(data.delta_pct),
                alarm_status: data.alarm_status
            };
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
