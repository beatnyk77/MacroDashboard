import { useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface LiquidityHistoryItem {
    date: string;
    cb: number;
    m2: number;
    risk: number;
    flow: number;
}

export interface GlobalLiquidityData {
    id: string;
    as_of_date: string;
    cb_aggregate: number;
    cb_aggregate_wow_pct: number;
    global_m2_growth: number;
    global_m2_wow_pct: number;
    cross_border_flow: number;
    cross_border_wow_pct: number;
    risk_on_off_proxy: number;
    risk_on_off_wow_pct: number;
    composite_score: number;
    composite_wow_pct: number;
    regime_label: 'EXPANDING' | 'CONTRACTING' | 'NEUTRAL';
    velocity_label: 'ACCELERATING' | 'DECELERATING' | 'STEADY';
    interpretation: string;
    trailing_history: LiquidityHistoryItem[];
}

export function useGlobalLiquidity() {
    return useSuspenseQuery({
        queryKey: ['global-liquidity-direction'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('global_liquidity_direction')
                .select('*')
                .order('as_of_date', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data as GlobalLiquidityData;
        },
        // Refetch every 1 hour (as data is daily/weekly anyway)
        staleTime: 1000 * 60 * 60,
    });
}
