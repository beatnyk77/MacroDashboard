import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CorporateProfitShare {
    id: string;
    country: string;
    year: number;
    quarter: string | null;
    profit_share_pct: number;
    wage_share_pct: number;
    squeeze_ratio: number;
    source: string;
    created_at: string;
}

export const useCorporateProfitShare = () => {
    return useQuery({
        queryKey: ['corporate-profit-share'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('corporate_profit_share')
                .select('*')
                .order('year', { ascending: true });

            if (error) throw error;
            return data as CorporateProfitShare[];
        }
    });
};
