import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CentralBankGoldNetData {
    period_start_year: number;
    period_label: string;
    buyers_tonnes: number;
    sellers_tonnes: number;
    net_tonnes: number;
    net_pct_global_stock: number;
    top_buyers_json: TopCountry[];
    top_sellers_json: TopCountry[];
    updated_at: string;
}

export interface TopCountry {
    country: string;
    code: string;
    tonnes: number;
}

export const useCentralBankGoldNet = () => {
    return useQuery({
        queryKey: ['cb_gold_net'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('cb_gold_net')
                .select('*')
                .order('period_start_year', { ascending: true });

            if (error) throw error;
            return data as CentralBankGoldNetData[];
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        refetchOnWindowFocus: false,
    });
};
