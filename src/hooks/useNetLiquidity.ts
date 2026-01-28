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
    history?: { date: string; value: number }[];
}

export function useNetLiquidity() {
    return useQuery({
        queryKey: ['net-liquidity'],
        queryFn: async (): Promise<NetLiquidityData | null> => {
            const { data, error } = await supabase
                .from('vw_net_liquidity')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(90);

            if (error || !data || data.length === 0) {
                console.warn('Could not fetch net liquidity');
                return null;
            }

            const latest = data[0];
            const history = data.map(d => ({
                date: d.as_of_date,
                value: Number(d.value)
            })).reverse();

            return {
                as_of_date: latest.as_of_date,
                current_value: Number(latest.value),
                z_score: Number(latest.z_score),
                percentile: Number(latest.percentile),
                delta: Number(latest.delta),
                delta_pct: Number(latest.delta_pct),
                alarm_status: latest.alarm_status,
                history: history
            };
        },
        staleTime: 1000 * 60 * 60, // 1h
    });
}
