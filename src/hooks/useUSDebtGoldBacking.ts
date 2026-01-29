import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface USDebtGoldBacking {
    as_of_date: string;
    total_debt: number;
    gold_tonnes: number;
    gold_price_usd: number;
    gold_ounces: number;
    gold_value_usd: number;
    debt_gold_ratio: number;
}

export function useUSDebtGoldBacking() {
    return useQuery({
        queryKey: ['us_debt_gold_backing'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('vw_us_debt_gold_backing')
                .select('*')
                .limit(1)
                .single();

            if (error) throw error;
            return data as USDebtGoldBacking;
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });
}
